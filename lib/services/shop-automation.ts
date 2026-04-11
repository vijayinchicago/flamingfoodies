import { flags } from "@/lib/env";
import {
  getAutomatedShopPickEntries,
  type AffiliateCategory,
  type AffiliateLinkEntry
} from "@/lib/affiliates";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { MerchAvailability, MerchThemeKey } from "@/lib/types";

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;
type ShopAutomationSource = "manual" | "cron";
type ShopPickUpsertOptions = {
  featured?: boolean;
  sortOrder?: number;
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
  date = new Date()
) {
  const catalog = getAutomatedShopPickEntries();
  const rotatedCatalog = rotateArray(catalog, getDailyRotationSeed(date));
  const existingKeySet = new Set(
    existingHrefs
      .map((href) => href.trim())
      .filter(Boolean)
      .flatMap((href) => (href.startsWith("/go/") ? [href.slice(4)] : []))
  );

  const unusedEntries = rotatedCatalog.filter((entry) => !existingKeySet.has(entry.key));
  const selected = unusedEntries.slice(0, qty);

  if (selected.length < qty) {
    const recycledEntries = rotatedCatalog.filter(
      (entry) => !selected.some((selectedEntry) => selectedEntry.key === entry.key)
    );
    selected.push(...recycledEntries.slice(0, qty - selected.length));
  }

  return selected;
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

  const { data: existingRows } = await supabase
    .from("merch_products")
    .select("href");
  const selectedEntries = chooseShopPickEntries(
    (existingRows ?? []).map((row) => row.href).filter(Boolean),
    effectiveQty
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
