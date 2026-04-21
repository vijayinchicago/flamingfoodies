import { flags } from "@/lib/env";
import {
  getActiveShopSeasonalMoments,
  getAutomatedShopPickEntries,
  type AffiliateCategory,
  type AffiliateLinkEntry,
  type ShopSeasonalMoment
} from "@/lib/affiliates";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { expireTimedOutGenerationJobs } from "@/lib/services/generation-jobs";
import type {
  CuisineType,
  HeatLevel,
  MerchAvailability,
  MerchProduct,
  MerchThemeKey
} from "@/lib/types";

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;
type ShopAutomationSource = "manual" | "cron";
type ShopPickUpsertOptions = {
  featured?: boolean;
  sortOrder?: number;
};

type ShopPickHistoryEntry = {
  affiliateKey: string;
  category: AffiliateCategory;
  createdAt: string;
};

type ShopPickSelectionSignals = {
  activeMoments?: ShopSeasonalMoment[];
  cuisineWeights?: Partial<Record<CuisineType, number>>;
  heatWeights?: Partial<Record<HeatLevel, number>>;
  categoryWeights?: Partial<Record<AffiliateCategory, number>>;
};

export type ShopShelfSnapshot = {
  capturedAt: string;
  publishedCount: number;
  featuredCount: number;
  featuredSlugs: string[];
  featuredEntries: Array<{
    id: number;
    slug: string;
    name: string;
    category: string;
    href: string;
    featured: boolean;
    sortOrder: number;
    updatedAt: string | null;
  }>;
};

function getDailyRotationSeed(date = new Date()) {
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000
  );
}

function rotateArray<T>(items: T[], startIndex: number) {
  if (!items.length) {
    return [];
  }

  const index = ((startIndex % items.length) + items.length) % items.length;
  return [...items.slice(index), ...items.slice(0, index)];
}

function deterministicSelectionJitter(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 9973;
  }

  return hash % 19;
}

function addWeightedValue<T extends string>(
  scores: Partial<Record<T, number>>,
  key: T | null | undefined,
  amount: number
) {
  if (!key) {
    return;
  }

  scores[key] = (scores[key] ?? 0) + amount;
}

function sumWeightedMatches<T extends string>(
  matches: readonly T[] | undefined,
  scores: Partial<Record<T, number>> | undefined,
  scale: number,
  cap: number
) {
  if (!matches?.length || !scores) {
    return 0;
  }

  return Math.min(
    cap,
    matches.reduce((total, item) => total + (scores[item] ?? 0), 0) * scale
  );
}

function buildSeasonalCategoryWeights(activeMoments: ShopSeasonalMoment[]) {
  const weights: Record<AffiliateCategory, number> = {
    hot_sauce: 14,
    ingredient: 12,
    gear: 11,
    subscription: 7
  };

  for (const moment of activeMoments) {
    switch (moment) {
      case "weeknight":
        weights.ingredient += 5;
        weights.gear += 4;
        break;
      case "game_day":
        weights.hot_sauce += 8;
        weights.ingredient += 5;
        weights.subscription += 2;
        break;
      case "grill_season":
        weights.gear += 8;
        weights.hot_sauce += 7;
        weights.ingredient += 6;
        break;
      case "summer_fresh":
        weights.hot_sauce += 5;
        weights.ingredient += 6;
        break;
      case "tailgate":
        weights.hot_sauce += 8;
        weights.ingredient += 4;
        weights.gear += 3;
        break;
      case "holiday_gifting":
        weights.subscription += 12;
        weights.hot_sauce += 4;
        weights.gear += 3;
        break;
      case "cold_weather":
        weights.ingredient += 6;
        weights.gear += 5;
        weights.subscription += 3;
        break;
      case "brunch":
        weights.hot_sauce += 4;
        weights.ingredient += 3;
        break;
      case "seafood_night":
        weights.hot_sauce += 3;
        weights.ingredient += 5;
        break;
      case "sauce_making":
        weights.gear += 8;
        weights.ingredient += 3;
        break;
      default:
        break;
    }
  }

  return weights;
}

function buildCategoryTargets(
  qty: number,
  baseWeights: Record<AffiliateCategory, number>
) {
  const targets: Record<AffiliateCategory, number> = {
    hot_sauce: 0,
    ingredient: 0,
    gear: 0,
    subscription: 0
  };

  const categories = Object.keys(targets) as AffiliateCategory[];

  for (let index = 0; index < qty; index += 1) {
    const nextCategory = [...categories].sort((left, right) => {
      const leftScore = baseWeights[left] - targets[left] * 18;
      const rightScore = baseWeights[right] - targets[right] * 18;

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      return left.localeCompare(right);
    })[0];

    if (!nextCategory) {
      break;
    }

    targets[nextCategory] += 1;
  }

  return targets;
}

function computePublishedContentWeight(
  publishedAt: string | null | undefined,
  date: Date,
  boosts: {
    featured?: boolean | null;
    views?: number | null;
    saves?: number | null;
    rating?: number | null;
  }
) {
  const publishedTime = publishedAt ? new Date(publishedAt).getTime() : null;
  const ageDays =
    publishedTime && Number.isFinite(publishedTime)
      ? Math.max(0, Math.round((date.getTime() - publishedTime) / 86400000))
      : 30;
  const recencyWeight = Math.max(3, 20 - ageDays / 3);
  const viewWeight = Math.min((boosts.views ?? 0) / 35, 12);
  const saveWeight = Math.min((boosts.saves ?? 0) * 1.4, 10);
  const ratingWeight = Math.min((boosts.rating ?? 0) * 1.8, 9);
  const featuredWeight = boosts.featured ? 5 : 0;

  return 1 + recencyWeight + viewWeight + saveWeight + ratingWeight + featuredWeight;
}

function mapReviewCategoryToAffiliateCategory(category?: string | null) {
  const normalized = (category ?? "").toLowerCase();

  if (normalized.includes("subscription")) {
    return "subscription" as const;
  }

  if (normalized.includes("hot-sauce")) {
    return "hot_sauce" as const;
  }

  if (normalized.includes("spice") || normalized.includes("condiment")) {
    return "ingredient" as const;
  }

  if (normalized.includes("gear") || normalized.includes("book")) {
    return "gear" as const;
  }

  return null;
}

export function formatShopCategory(category: AffiliateCategory) {
  switch (category) {
    case "hot_sauce":
      return "Hot sauces";
    case "gear":
      return "Kitchen gear";
    case "ingredient":
      return "Pantry heat";
    case "subscription":
      return "Subscriptions";
    default:
      return "Shop picks";
  }
}

export async function getShopShelfSnapshot(): Promise<ShopShelfSnapshot | null> {
  if (!flags.hasSupabaseAdmin) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("merch_products")
    .select("id, slug, name, category, href, featured, sort_order, updated_at")
    .like("slug", "shop-pick-%")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(24);

  if (error) {
    throw new Error(`Failed to read shop shelf snapshot: ${error.message}`);
  }

  const entries = (data ?? []).map((row) => ({
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    category: String(row.category),
    href: String(row.href),
    featured: Boolean(row.featured),
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null
  }));
  const featuredEntries = entries.filter((entry) => entry.featured);

  return {
    capturedAt: new Date().toISOString(),
    publishedCount: entries.length,
    featuredCount: featuredEntries.length,
    featuredSlugs: featuredEntries.map((entry) => entry.slug),
    featuredEntries
  };
}

export function getShopThemeKey(category: AffiliateCategory): MerchThemeKey {
  switch (category) {
    case "hot_sauce":
      return "flame";
    case "gear":
      return "charcoal";
    case "ingredient":
      return "ember";
    case "subscription":
      return "gold";
    default:
      return "smoke";
  }
}

function getShopAvailability(category: AffiliateCategory): MerchAvailability {
  return category === "subscription" ? "live" : "live";
}

export function buildShopPickSlug(entry: AffiliateLinkEntry) {
  return `shop-pick-${entry.key}`;
}

function buildShopPickHref(entry: AffiliateLinkEntry) {
  return `/go/${entry.key}`;
}

function buildShopPickDescription(entry: AffiliateLinkEntry) {
  return `${entry.description} Best for ${entry.bestFor.toLowerCase()}.`;
}

function buildShopMetricKey(entry: Pick<AffiliateLinkEntry, "partner" | "product">) {
  return `${entry.partner}::${entry.product}`;
}

function hasExactAmazonProductLink(entry: AffiliateLinkEntry) {
  const candidate = entry.partner === "amazon" ? entry.url : entry.amazonOnlyUrl;
  return Boolean(candidate?.includes("/dp/"));
}

function buildShopPickPayload(
  entry: AffiliateLinkEntry,
  options?: ShopPickUpsertOptions
) {
  return {
    name: entry.product,
    category: formatShopCategory(entry.category),
    badge: entry.badge,
    description: buildShopPickDescription(entry),
    price_label: entry.priceLabel || "Check Amazon",
    availability: getShopAvailability(entry.category),
    theme_key: getShopThemeKey(entry.category),
    href: buildShopPickHref(entry),
    cta_label: "View on Amazon",
    image_url: null,
    image_alt: `${entry.product} product pick`,
    featured: options?.featured ?? true,
    status: "published",
    sort_order: options?.sortOrder ?? 0
  };
}

export function chooseShopPickEntries(
  existingHrefs: string[],
  qty: number,
  date = new Date(),
  recentHistory: ShopPickHistoryEntry[] = [],
  selectionSignals: ShopPickSelectionSignals = {}
) {
  const catalog = getAutomatedShopPickEntries();
  const rotatedCatalog = rotateArray(catalog, getDailyRotationSeed(date));
  const activeMoments =
    selectionSignals.activeMoments?.length
      ? selectionSignals.activeMoments
      : getActiveShopSeasonalMoments(date);
  const seasonalCategoryWeights = buildSeasonalCategoryWeights(activeMoments);
  const combinedCategoryWeights: Record<AffiliateCategory, number> = {
    hot_sauce:
      seasonalCategoryWeights.hot_sauce + (selectionSignals.categoryWeights?.hot_sauce ?? 0),
    gear: seasonalCategoryWeights.gear + (selectionSignals.categoryWeights?.gear ?? 0),
    ingredient:
      seasonalCategoryWeights.ingredient + (selectionSignals.categoryWeights?.ingredient ?? 0),
    subscription:
      seasonalCategoryWeights.subscription + (selectionSignals.categoryWeights?.subscription ?? 0)
  };
  const categoryTargets = buildCategoryTargets(qty, combinedCategoryWeights);
  const existingKeySet = new Set(
    existingHrefs
      .map((href) => href.trim())
      .filter(Boolean)
      .flatMap((href) => (href.startsWith("/go/") ? [href.slice(4)] : []))
  );
  const planningHistory = [...recentHistory];
  const usedKeys = new Set<string>();
  const usedCategoryCounts = new Map<AffiliateCategory, number>();
  const selected: AffiliateLinkEntry[] = [];

  for (let index = 0; index < qty; index += 1) {
    const rotationIndex =
      rotatedCatalog.length > 0
        ? (getDailyRotationSeed(date) + index) % rotatedCatalog.length
        : 0;
    const rankedCandidates = rotatedCatalog
      .filter((entry) => !usedKeys.has(entry.key))
      .map((entry, candidateIndex) => {
        const historyLastIndex = planningHistory.findIndex(
          (historyEntry) => historyEntry.affiliateKey === entry.key
        );
        const categoryLastIndex = planningHistory.findIndex(
          (historyEntry) => historyEntry.category === entry.category
        );
        const recentCount = planningHistory
          .slice(0, 12)
          .filter((historyEntry) => historyEntry.affiliateKey === entry.key).length;
        const categoryRecentCount = planningHistory
          .slice(0, 8)
          .filter((historyEntry) => historyEntry.category === entry.category).length;
        const seasonalMatchCount =
          entry.seasonalMoments?.filter((moment) => activeMoments.includes(moment)).length ?? 0;
        const categoryCount = usedCategoryCounts.get(entry.category) ?? 0;
        const categoryTarget = categoryTargets[entry.category] ?? 0;
        const inCatalogBoost = existingKeySet.has(entry.key) ? 0 : 180;
        const exactAmazonBoost = hasExactAmazonProductLink(entry) ? 12 : 0;
        const recencyReward =
          historyLastIndex === -1 ? 150 : Math.min(historyLastIndex, 12) * 18;
        const categoryReward =
          categoryLastIndex === -1 ? 45 : Math.min(categoryLastIndex, 8) * 7;
        const immediateRepeatPenalty =
          historyLastIndex === 0 ? 420 : historyLastIndex === 1 ? 260 : historyLastIndex === 2 ? 140 : 0;
        const frequencyPenalty = recentCount * 95 + categoryRecentCount * 35;
        const batchPenalty = categoryCount * 24;
        const seasonalBoost = seasonalMatchCount * 32;
        const cuisineBoost = sumWeightedMatches(
          entry.cuisines,
          selectionSignals.cuisineWeights,
          1.1,
          90
        );
        const heatBoost = sumWeightedMatches(
          entry.heatLevels,
          selectionSignals.heatWeights,
          0.9,
          52
        );
        const categorySignalBoost = Math.min(
          (combinedCategoryWeights[entry.category] ?? 0) * 3,
          90
        );
        const quotaReward = categoryCount < categoryTarget ? 48 : 0;
        const quotaPenalty =
          categoryCount >= Math.max(categoryTarget, 1) + 1
            ? (categoryCount - Math.max(categoryTarget, 1) + 1) * 34
            : 0;
        const calendarRotationBoost = candidateIndex === rotationIndex ? 24 : 0;
        const jitter = deterministicSelectionJitter(
          `${date.toISOString().slice(0, 10)}:${index}:${entry.key}`
        );

        return {
          entry,
          score:
            40 +
            inCatalogBoost +
            exactAmazonBoost +
            recencyReward +
            categoryReward +
            seasonalBoost +
            cuisineBoost +
            heatBoost +
            categorySignalBoost +
            quotaReward +
            calendarRotationBoost +
            jitter -
            immediateRepeatPenalty -
            frequencyPenalty -
            batchPenalty -
            quotaPenalty
        };
      })
      .sort((left, right) => right.score - left.score || left.entry.key.localeCompare(right.entry.key));

    const nextEntry = rankedCandidates[0]?.entry;
    if (!nextEntry) {
      break;
    }

    selected.push(nextEntry);
    usedKeys.add(nextEntry.key);
    usedCategoryCounts.set(nextEntry.category, (usedCategoryCounts.get(nextEntry.category) ?? 0) + 1);
    planningHistory.unshift({
      affiliateKey: nextEntry.key,
      category: nextEntry.category,
      createdAt: new Date(date.getTime() + index).toISOString()
    });
  }

  return selected;
}

export function getSeasonalShopSeedProducts(date = new Date()): MerchProduct[] {
  const activeMoments = getActiveShopSeasonalMoments(date);
  const categoryWeights = buildSeasonalCategoryWeights(activeMoments);
  const seededEntries = getAutomatedShopPickEntries()
    .map((entry, index) => {
      const seasonalBoost =
        (entry.seasonalMoments?.filter((moment) => activeMoments.includes(moment)).length ?? 0) *
        36;
      const categoryBoost = (categoryWeights[entry.category] ?? 0) * 4;
      const exactAmazonBoost = hasExactAmazonProductLink(entry) ? 10 : 0;
      const jitter = deterministicSelectionJitter(`${date.toISOString().slice(0, 10)}:${entry.key}`);

      return {
        entry,
        score: seasonalBoost + categoryBoost + exactAmazonBoost + jitter,
        index
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.index - right.index;
    });

  return seededEntries.map(({ entry }, index) => {
    const timestamp = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12, Math.min(index, 59))
    ).toISOString();

    return {
      id: 5000 + index,
      slug: buildShopPickSlug(entry),
      name: entry.product,
      category: formatShopCategory(entry.category),
      badge: entry.badge,
      description: buildShopPickDescription(entry),
      priceLabel: entry.priceLabel || "Check Amazon",
      availability: getShopAvailability(entry.category),
      themeKey: getShopThemeKey(entry.category),
      href: buildShopPickHref(entry),
      ctaLabel: "View on Amazon",
      imageAlt: `${entry.product} product pick`,
      featured: index < 6,
      status: "published",
      sortOrder: index,
      createdAt: timestamp,
      updatedAt: timestamp
    };
  });
}

async function listRecentShopPickHistory(supabase: AdminClient) {
  const [{ data: jobRows }, { data: featuredRows }] = await Promise.all([
    supabase
      .from("content_generation_jobs")
      .select("parameters, status, created_at")
      .eq("job_type", "merch_product")
      .order("created_at", { ascending: false })
      .limit(36),
    supabase
      .from("merch_products")
      .select("href, category, updated_at, created_at")
      .like("slug", "shop-pick-%")
      .eq("featured", true)
      .order("updated_at", { ascending: false })
      .limit(6)
  ]);

  const historyFromJobs = (jobRows ?? [])
    .flatMap((row) => {
      if (row.status === "failed") {
        return [];
      }

      const parameters =
        row.parameters && typeof row.parameters === "object"
          ? (row.parameters as Record<string, unknown>)
          : {};
      const affiliateKey =
        typeof parameters.affiliate_key === "string" ? String(parameters.affiliate_key) : null;
      const category =
        typeof parameters.category === "string" ? (parameters.category as AffiliateCategory) : null;

      if (!affiliateKey || !category) {
        return [];
      }

      return [
        {
          affiliateKey,
          category,
          createdAt: row.created_at || new Date(0).toISOString()
        } satisfies ShopPickHistoryEntry
      ];
    });

  const historyFromFeatured = (featuredRows ?? [])
    .flatMap((row) => {
      const href = typeof row.href === "string" ? row.href.trim() : "";
      const affiliateKey = href.startsWith("/go/") ? href.slice(4) : null;
      const categoryLabel = typeof row.category === "string" ? row.category : "";
      const category = getAutomatedShopPickEntries().find((entry) => entry.key === affiliateKey)?.category;

      if (!affiliateKey || !category || !categoryLabel) {
        return [];
      }

      return [
        {
          affiliateKey,
          category,
          createdAt: row.updated_at || row.created_at || new Date(0).toISOString()
        } satisfies ShopPickHistoryEntry
      ];
    });

  return [...historyFromJobs, ...historyFromFeatured].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

async function buildShopPickSelectionSignals(
  supabase: AdminClient,
  date = new Date()
): Promise<ShopPickSelectionSignals> {
  const activeMoments = getActiveShopSeasonalMoments(date);
  const [{ data: recipeRows }, { data: reviewRows }] = await Promise.all([
    supabase
      .from("recipes")
      .select("cuisine_type, heat_level, featured, published_at, view_count, save_count, rating_avg")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(24),
    supabase
      .from("reviews")
      .select("cuisine_origin, heat_level, featured, published_at, view_count, rating, category")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(18)
  ]);

  const cuisineWeights: Partial<Record<CuisineType, number>> = {};
  const heatWeights: Partial<Record<HeatLevel, number>> = {};
  const categoryWeights: Partial<Record<AffiliateCategory, number>> = {};

  for (const row of recipeRows ?? []) {
    const weight = computePublishedContentWeight(row.published_at, date, {
      featured: Boolean(row.featured),
      views: row.view_count ?? 0,
      saves: row.save_count ?? 0,
      rating: Number(row.rating_avg ?? 0) || 0
    });

    addWeightedValue(cuisineWeights, row.cuisine_type as CuisineType | null, weight);
    addWeightedValue(heatWeights, row.heat_level as HeatLevel | null, weight * 0.75);
  }

  for (const row of reviewRows ?? []) {
    const weight = computePublishedContentWeight(row.published_at, date, {
      featured: Boolean(row.featured),
      views: row.view_count ?? 0,
      rating: Number(row.rating ?? 0) || 0
    });
    const affiliateCategory = mapReviewCategoryToAffiliateCategory(row.category);

    addWeightedValue(cuisineWeights, row.cuisine_origin as CuisineType | null, weight * 0.6);
    addWeightedValue(heatWeights, row.heat_level as HeatLevel | null, weight * 0.55);
    addWeightedValue(categoryWeights, affiliateCategory, weight * 0.35);
  }

  return {
    activeMoments,
    cuisineWeights,
    heatWeights,
    categoryWeights
  };
}

async function createGenerationJob(supabase: AdminClient, entry: AffiliateLinkEntry) {
  const { data, error } = await supabase
    .from("content_generation_jobs")
    .insert({
      job_type: "merch_product",
      prompt_template: "AFFILIATE_CATALOG_ROTATION",
      parameters: {
        affiliate_key: entry.key,
        category: entry.category,
        product: entry.product
      },
      status: "queued"
    })
    .select("id, attempts")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function updateGenerationJob(
  supabase: AdminClient,
  id: number,
  payload: Record<string, unknown>
) {
  const { error } = await supabase
    .from("content_generation_jobs")
    .update(payload)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

async function upsertShopPick(
  supabase: AdminClient,
  entry: AffiliateLinkEntry,
  options?: ShopPickUpsertOptions
) {
  const slug = buildShopPickSlug(entry);
  const href = buildShopPickHref(entry);
  const { data: existing } = await supabase
    .from("merch_products")
    .select("id, slug, href")
    .or(`slug.eq.${slug},href.eq.${href}`)
    .maybeSingle();

  const payload = {
    slug: existing?.slug || slug,
    ...buildShopPickPayload(entry, options)
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from("merch_products")
      .update(payload)
      .eq("id", existing.id)
      .select("id, slug, name")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      ...data,
      operation: "updated" as const
    };
  }

  const { data, error } = await supabase
    .from("merch_products")
    .insert(payload)
    .select("id, slug, name")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...data,
    operation: "created" as const
  };
}

export function rankShopPickEntries(
  entries: AffiliateLinkEntry[],
  clickCounts: Map<string, number>
) {
  return entries
    .map((entry, index) => ({
      entry,
      index,
      clicks: clickCounts.get(buildShopMetricKey(entry)) ?? 0,
      exactAmazonLink: hasExactAmazonProductLink(entry)
    }))
    .sort((left, right) => {
      if (right.clicks !== left.clicks) {
        return right.clicks - left.clicks;
      }

      if (Number(right.exactAmazonLink) !== Number(left.exactAmazonLink)) {
        return Number(right.exactAmazonLink) - Number(left.exactAmazonLink);
      }

      return left.index - right.index;
    });
}

export async function runShopPickAutomation(
  qty = 1,
  options?: {
    source?: ShopAutomationSource;
  }
) {
  const effectiveQty = Math.min(Math.max(qty, 1), 6);

  if (!flags.hasSupabaseAdmin) {
    return {
      mode: "mock",
      createdJobs: chooseShopPickEntries([], effectiveQty).map((entry, index) => ({
        id: index + 1,
        type: "merch_product" as const,
        slug: buildShopPickSlug(entry),
        title: entry.product,
        affiliateKey: entry.key,
        category: formatShopCategory(entry.category),
        publishAt: null
      }))
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      mode: "mock",
      createdJobs: chooseShopPickEntries([], effectiveQty).map((entry, index) => ({
        id: index + 1,
        type: "merch_product" as const,
        slug: buildShopPickSlug(entry),
        title: entry.product,
        affiliateKey: entry.key,
        category: formatShopCategory(entry.category),
        publishAt: null
      }))
    };
  }

  await expireTimedOutGenerationJobs(supabase, {
    jobTypes: ["merch_product"]
  });

  const [existingRowsResult, recentHistory, selectionSignals] = await Promise.all([
    supabase.from("merch_products").select("href"),
    listRecentShopPickHistory(supabase),
    buildShopPickSelectionSignals(supabase)
  ]);
  const selectedEntries = chooseShopPickEntries(
    (existingRowsResult.data ?? []).map((row) => row.href).filter(Boolean),
    effectiveQty,
    new Date(),
    recentHistory,
    selectionSignals
  );
  const selectedSlugs = selectedEntries.map((entry) => buildShopPickSlug(entry));
  const createdJobs: Array<Record<string, unknown>> = [];

  if (selectedSlugs.length) {
    const { data: automatedRows } = await supabase
      .from("merch_products")
      .select("id, slug")
      .like("slug", "shop-pick-%")
      .neq("featured", false);
    const idsToUnfeature = (automatedRows ?? [])
      .filter((row) => !selectedSlugs.includes(row.slug))
      .map((row) => row.id);

    if (idsToUnfeature.length) {
      await supabase
        .from("merch_products")
        .update({ featured: false })
        .in("id", idsToUnfeature);
    }
  }

  for (const entry of selectedEntries) {
    const job = await createGenerationJob(supabase, entry);

    try {
      await updateGenerationJob(supabase, job.id, {
        status: "generating",
        started_at: new Date().toISOString(),
        attempts: (job.attempts ?? 0) + 1
      });

      const inserted = await upsertShopPick(supabase, entry);

      await updateGenerationJob(supabase, job.id, {
        status: "completed",
        result_id: inserted.id,
        result_type: "merch_product",
        completed_at: new Date().toISOString()
      });

      createdJobs.push({
        id: job.id,
        type: "merch_product",
        slug: inserted.slug,
        title: inserted.name,
        affiliateKey: entry.key,
        category: formatShopCategory(entry.category),
        publishAt: null
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Shop pick automation failed";

      await updateGenerationJob(supabase, job.id, {
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString()
      });

      createdJobs.push({
        id: job.id,
        type: "merch_product",
        affiliateKey: entry.key,
        category: formatShopCategory(entry.category),
        error: message
      });
    }
  }

  return {
    mode: options?.source === "cron" ? "scheduled_catalog" : "catalog",
    createdJobs
  };
}

export async function runShopCatalogRefresh(options?: {
  source?: ShopAutomationSource;
  windowDays?: number;
}) {
  const windowDays = Math.min(Math.max(options?.windowDays ?? 30, 7), 180);
  const catalog = getAutomatedShopPickEntries();

  if (!flags.hasSupabaseAdmin) {
    const ranked = rankShopPickEntries(catalog, new Map());

    return {
      mode: options?.source === "cron" ? "scheduled_refresh" : "refresh",
      windowDays,
      reviewed: ranked.length,
      created: ranked.length,
      updated: 0,
      featured: Math.min(4, ranked.length),
      exactAmazonReady: ranked.filter((item) => item.exactAmazonLink).length,
      needsExactAmazonLink: ranked.filter((item) => !item.exactAmazonLink).length,
      topEntries: ranked.slice(0, 8).map((item) => ({
        affiliateKey: item.entry.key,
        product: item.entry.product,
        clicks: item.clicks,
        exactAmazonLink: item.exactAmazonLink
      }))
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      mode: options?.source === "cron" ? "scheduled_refresh" : "refresh",
      windowDays,
      reviewed: 0,
      created: 0,
      updated: 0,
      featured: 0,
      exactAmazonReady: 0,
      needsExactAmazonLink: 0,
      topEntries: []
    };
  }

  const since = new Date(Date.now() - windowDays * 86400000).toISOString();
  const [{ data: clickRows }, { data: existingRows }] = await Promise.all([
    supabase
      .from("affiliate_clicks")
      .select("partner, product")
      .gte("clicked_at", since),
    supabase
      .from("merch_products")
      .select("id, slug")
      .like("slug", "shop-pick-%")
  ]);

  const clickCounts = new Map<string, number>();
  for (const row of clickRows ?? []) {
    const key = `${row.partner}::${row.product}`;
    clickCounts.set(key, (clickCounts.get(key) ?? 0) + 1);
  }

  const ranked = rankShopPickEntries(catalog, clickCounts);
  const existingSlugSet = new Set((existingRows ?? []).map((row) => row.slug));
  let created = 0;
  let updated = 0;

  for (const [index, item] of ranked.entries()) {
    const result = await upsertShopPick(supabase, item.entry, {
      featured: index < 4,
      sortOrder: index
    });

    if (result.operation === "created") {
      created += 1;
    } else {
      updated += 1;
    }
  }

  const catalogSlugSet = new Set(ranked.map((item) => buildShopPickSlug(item.entry)));
  const obsoleteIds = (existingRows ?? [])
    .filter((row) => !catalogSlugSet.has(row.slug))
    .map((row) => row.id);

  if (obsoleteIds.length) {
    await supabase
      .from("merch_products")
      .update({ featured: false })
      .in("id", obsoleteIds);
  }

  return {
    mode: options?.source === "cron" ? "scheduled_refresh" : "refresh",
    windowDays,
    reviewed: ranked.length,
    created,
    updated,
    featured: Math.min(4, ranked.length),
    exactAmazonReady: ranked.filter((item) => item.exactAmazonLink).length,
    needsExactAmazonLink: ranked.filter((item) => !item.exactAmazonLink).length,
    topEntries: ranked.slice(0, 8).map((item) => ({
      affiliateKey: item.entry.key,
      product: item.entry.product,
      clicks: item.clicks,
      exactAmazonLink: item.exactAmazonLink,
      alreadyInCatalog: existingSlugSet.has(buildShopPickSlug(item.entry))
    }))
  };
}
