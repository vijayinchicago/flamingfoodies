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
  entry: AffiliateLinkEntry
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
    name: entry.product,
    category: formatShopCategory(entry.category),
    badge: entry.badge,
    description: buildShopPickDescription(entry),
    price_label: entry.priceLabel || "Check Amazon",
    availability: getShopAvailability(entry.category),
    theme_key: getShopThemeKey(entry.category),
    href,
    cta_label: "View on Amazon",
    image_url: null,
    image_alt: `${entry.product} product pick`,
    featured: true,
    status: "published",
    sort_order: 0
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

    return data;
  }

  const { data, error } = await supabase
    .from("merch_products")
    .insert(payload)
    .select("id, slug, name")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
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
