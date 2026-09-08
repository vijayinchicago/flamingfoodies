import { cache } from "react";
import { revalidateTag, unstable_cache } from "next/cache";

import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const PUBLISHED_CONTENT_TTL = 30 * 24 * 60 * 60;
export const CONTENT_METRICS_TTL = 5 * 60;
export const CONTENT_PAGE_SIZE = 10;
export const SEARCH_RUNTIME_KEY = "search_runtime_optimizations";
export const SEARCH_RUNTIME_TAG = "public:search-runtime";
export const EDITORIAL_TABLES = ["recipes", "blog_posts", "reviews"] as const;
export type EditorialTable = (typeof EDITORIAL_TABLES)[number];
type ContentRow = Record<string, any>;

// Keep public prose used by search/recommendations, but never fetch internal QA
// reports or generation metadata for public pages. Admin readers remain separate.
const commonColumns = "id,slug,title,description,image_url,image_alt,tags,featured,source,status,created_at,published_at";
export const PUBLIC_CONTENT_COLUMNS: Record<EditorialTable, string> = {
  recipes: `${commonColumns},author_name,intro,hero_summary,heat_level,cuisine_type,prep_time_minutes,cook_time_minutes,total_time_minutes,active_time_minutes,servings,difficulty,ingredients,ingredient_sections,instructions,method_steps,tips,variations,make_ahead_notes,storage_notes,reheat_notes,serving_suggestions,substitutions,faqs,equipment,hero_image_reviewed,cuisine_qa_reviewed,seo_title,seo_description`,
  blog_posts: `${commonColumns},author_name,content,category,seo_title,seo_description,cuisine_type,heat_level,scoville_rating,read_time_minutes`,
  reviews: `${commonColumns},product_name,brand,rating,price_usd,affiliate_url,content,heat_level,scoville_min,scoville_max,flavor_notes,cuisine_origin,category,pros,cons,image_reviewed,fact_qa_reviewed,recommended`
};
export const PUBLIC_METRIC_COLUMNS: Record<EditorialTable, string> = {
  recipes: "id,view_count,like_count,save_count,rating_avg,rating_count",
  blog_posts: "id,view_count,like_count",
  reviews: "id,view_count"
};

export function publishedContentTag(table: EditorialTable) {
  return `public:content:${table}`;
}

export function invalidatePublishedContent(table: EditorialTable) {
  // Includes positive/negative detail entries, all catalog pages, and statistics.
  // Type-level invalidation also handles renamed slugs and changed pagination.
  revalidateTag(publishedContentTag(table));
}

export function invalidatePublicSearchRuntime() {
  revalidateTag(SEARCH_RUNTIME_TAG);
}

function database() {
  // Next 14's unstable_cache already sets fetchCache: force-no-store inside its
  // callback. Explicit fetch({cache: "no-store"}) instead triggers a static-build
  // bailout in this Next version, even inside the cached callback.
  const client = createSupabaseAdminClient();
  if (!client) throw new Error("Published-content database is not configured");
  return client;
}

// Next 14's data cache limits an entry to 2 MB, including its JSON envelope.
// Leave headroom for the second serialization instead of caching the full catalog.
export function assertCacheEntrySize(value: unknown) {
  if (Buffer.byteLength(JSON.stringify(value), "utf8") > 750_000) {
    throw new Error("Published-content cache entry exceeds 750 KB; reduce its page size or content payload");
  }
}

const namespace = ["published-content-v1", env.NEXT_PUBLIC_SUPABASE_URL ?? "unconfigured"];

const readers = Object.fromEntries(EDITORIAL_TABLES.map((table) => {
  const tags = [publishedContentTag(table)];
  return [table, {
    page: unstable_cache(async (page: number): Promise<ContentRow[]> => {
      const { data, error } = await database().from(table)
        .select(PUBLIC_CONTENT_COLUMNS[table])
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .order("id", { ascending: false })
        .range(page * CONTENT_PAGE_SIZE, (page + 1) * CONTENT_PAGE_SIZE - 1);
      if (error) throw new Error(`Cannot load published ${table}: ${error.message}`);
      const rows = data ?? [];
      assertCacheEntrySize(rows);
      return rows;
    }, [...namespace, table, "page", PUBLIC_CONTENT_COLUMNS[table]], { revalidate: PUBLISHED_CONTENT_TTL, tags }),
    detail: unstable_cache(async (slug: string): Promise<ContentRow | null> => {
      const { data, error } = await database().from(table)
        .select(PUBLIC_CONTENT_COLUMNS[table])
        .eq("status", "published").eq("slug", slug).maybeSingle();
      if (error) throw new Error(`Cannot load published ${table} detail: ${error.message}`);
      assertCacheEntrySize(data);
      return data;
    }, [...namespace, table, "detail", PUBLIC_CONTENT_COLUMNS[table]], { revalidate: PUBLISHED_CONTENT_TTL, tags }),
    metrics: unstable_cache(async (page: number): Promise<ContentRow[]> => {
      const { data, error } = await database().from(table).select(PUBLIC_METRIC_COLUMNS[table])
        .eq("status", "published").order("id", { ascending: false })
        .range(page * 250, (page + 1) * 250 - 1);
      if (error) throw new Error(`Cannot load ${table} statistics: ${error.message}`);
      return data ?? [];
    }, [...namespace, table, "metrics", PUBLIC_METRIC_COLUMNS[table]], { revalidate: CONTENT_METRICS_TTL, tags })
  }];
})) as Record<EditorialTable, {
  page: (page: number) => Promise<ContentRow[]>;
  detail: (slug: string) => Promise<ContentRow | null>;
  metrics: (page: number) => Promise<ContentRow[]>;
}>;

async function collectPages(read: (page: number) => Promise<ContentRow[]>, pageSize: number) {
  const rows: ContentRow[] = [];
  for (let page = 0; ; page++) {
    const batch = await read(page);
    rows.push(...batch);
    if (batch.length < pageSize) return rows;
  }
}

const getMetrics = cache(async (table: EditorialTable) => {
  const rows = await collectPages(readers[table].metrics, 250);
  return new Map(rows.map((row) => [row.id, row]));
});

// React cache deduplicates within a render; unstable_cache above shares database
// results across requests/build workers. Never persist the combined catalog.
export const getPublishedRows = cache(async (table: EditorialTable) => {
  const [rows, metrics] = await Promise.all([
    collectPages(readers[table].page, CONTENT_PAGE_SIZE), getMetrics(table)
  ]);
  return rows.map((row) => ({ ...row, ...metrics.get(row.id) }));
});

export const getPublishedRow = cache(async (table: EditorialTable, slug: string) => {
  const row = await readers[table].detail(slug);
  if (!row) return null;
  const metrics = await getMetrics(table);
  return { ...row, ...metrics.get(row.id) };
});

export const getPublicSearchRuntimeValue = cache(unstable_cache(async () => {
  const { data, error } = await database().from("site_settings").select("value")
    .eq("key", SEARCH_RUNTIME_KEY).maybeSingle();
  if (error) throw new Error(`Cannot load public search settings: ${error.message}`);
  assertCacheEntrySize(data?.value ?? null);
  return data?.value ?? null;
}, [...namespace, "search-runtime"], {
  revalidate: PUBLISHED_CONTENT_TTL, tags: [SEARCH_RUNTIME_TAG]
}));
