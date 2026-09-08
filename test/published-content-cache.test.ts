// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rows: {} as Record<string, any[]>, reads: [] as any[], error: false, now: 0,
  entries: new Map<string, { value: any; tags: string[]; expires: number }>(),
  writes: [] as { bytes: number; ttl: number }[], options: [] as any[]
}));

vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_SUPABASE_URL: "https://cache-test.invalid", CRON_SECRET: "test-secret" }, flags: { hasSupabaseAdmin: true } }));
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: any[]) => any, key: string[], options: { tags: string[]; revalidate: number }) => async (...args: any[]) => {
    const id = JSON.stringify([key, args]);
    const hit = state.entries.get(id);
    if (hit && hit.expires > state.now) return structuredClone(hit.value);
    const value = await fn(...args);
    state.entries.set(id, { value: structuredClone(value), tags: options.tags, expires: state.now + options.revalidate });
    state.writes.push({ bytes: Buffer.byteLength(JSON.stringify(value)), ttl: options.revalidate });
    return value;
  },
  revalidateTag: (tag: string) => {
    for (const [id, entry] of state.entries) if (entry.tags.includes(tag)) state.entries.delete(id);
  }
}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: (options: any) => {
  state.options.push(options);
  return { from(table: string) {
    const filters: Record<string, any> = {};
    let columns = "*", range = [0, 999], single = false;
    const orders: { field: string; ascending: boolean }[] = [];
    const query: any = {
      select(value: string) { columns = value; return query; },
      eq(key: string, value: any) { filters[key] = value; return query; },
      order(field: string, options: any) { orders.push({ field, ...options }); return query; },
      range(from: number, to: number) { range = [from, to]; return query; },
      maybeSingle() { single = true; return query; },
      then(resolve: (value: any) => void) {
        state.reads.push({ table, columns, filters, range, single });
        if (state.error) return resolve({ data: null, error: { message: "database unavailable" } });
        const rows = (state.rows[table] ?? []).filter((row) => Object.entries(filters).every(([key, value]) => row[key] === value));
        rows.sort((a, b) => {
          for (const { field, ascending } of orders) {
            const comparison = a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
            if (comparison) return ascending ? comparison : -comparison;
          }
          return 0;
        });
        const projected = rows.slice(range[0], range[1] + 1).map((row) => columns === "*" ? row :
          Object.fromEntries(columns.split(",").map((key) => [key, row[key]])));
        return resolve({ data: single ? projected[0] ?? null : projected, error: null });
      }
    };
    return query;
  } };
} }));

import {
  CONTENT_PAGE_SIZE, CONTENT_METRICS_TTL, PUBLISHED_CONTENT_TTL,
  EDITORIAL_TABLES, PUBLIC_CONTENT_COLUMNS, PUBLIC_METRIC_COLUMNS, SEARCH_RUNTIME_KEY,
  assertCacheEntrySize, getPublishedRow, getPublishedRows, getPublicSearchRuntimeValue,
  invalidatePublishedContent, invalidatePublicSearchRuntime
} from "@/lib/services/published-content-cache";
import { POST } from "@/app/api/admin/content-cache/route";

const makeRow = (id: number, status = "published") => ({
  id, slug: `item-${id}`, title: `Item ${id}`, status, published_at: "2026-09-07T00:00:00Z",
  content: "Public article", ingredients: [{ item: "pepper" }], instructions: [{ text: "Cook" }],
  view_count: 10, like_count: 1, rating_avg: 4, rating_count: 2, save_count: 3,
  qa_report: { private: true }
});

beforeEach(() => {
  state.rows = Object.fromEntries(EDITORIAL_TABLES.map((table) => [table, Array.from({ length: 23 }, (_, index) => makeRow(index + 1))]));
  state.rows.site_settings = [{ key: SEARCH_RUNTIME_KEY, value: { version: 1 } }];
  state.entries.clear(); state.reads = []; state.writes = []; state.options = [];
  state.error = false; state.now = 0;
});

describe("published content cache", () => {
  it("selects only columns verified against the live schema on 2026-09-08", () => {
    const schema = {
      blog_posts: "id,slug,title,description,content,author_name,author_id,category,tags,image_url,image_alt,heat_level,cuisine_type,scoville_rating,featured,affiliate_disclosure,status,source,seo_title,seo_description,canonical_url,read_time_minutes,view_count,like_count,published_at,created_at,updated_at,qa_notes,qa_report,qa_checked_at,qa_issues",
      recipes: "id,slug,title,description,intro,author_name,author_id,heat_level,cuisine_type,prep_time_minutes,cook_time_minutes,total_time_minutes,servings,difficulty,ingredients,instructions,nutrition,equipment,tips,variations,tags,image_url,image_alt,video_url,featured,status,source,affiliate_disclosure,seo_title,seo_description,view_count,like_count,save_count,rating_avg,rating_count,published_at,created_at,updated_at,ingredient_sections,method_steps,active_time_minutes,make_ahead_notes,storage_notes,reheat_notes,serving_suggestions,substitutions,faqs,hero_summary,hero_image_reviewed,cuisine_qa_reviewed,qa_notes,qa_report,qa_checked_at,qa_issues",
      reviews: "id,slug,title,description,content,product_name,brand,rating,price_usd,affiliate_url,image_url,image_alt,heat_level,scoville_min,scoville_max,flavor_notes,cuisine_origin,category,pros,cons,tags,recommended,featured,status,source,seo_title,seo_description,view_count,published_at,created_at,updated_at,image_reviewed,fact_qa_reviewed,qa_notes,qa_report,qa_checked_at,qa_issues"
    };
    for (const table of EDITORIAL_TABLES) {
      const available = new Set(schema[table].split(","));
      for (const column of `${PUBLIC_CONTENT_COLUMNS[table]},${PUBLIC_METRIC_COLUMNS[table]}`.split(",")) {
        expect(available.has(column), `${table}.${column} must exist`).toBe(true);
      }
    }
  });

  it.each(EDITORIAL_TABLES)("reuses small %s entries across repeated catalog reads", async (table) => {
    const first = await getPublishedRows(table);
    expect(first).toHaveLength(23);
    expect(first[0].id).toBe(23);
    expect(state.reads).toHaveLength(Math.ceil(23 / CONTENT_PAGE_SIZE) + 1);
    const count = state.reads.length;
    expect(await getPublishedRows(table)).toEqual(first);
    expect(state.reads).toHaveLength(count);
    expect(state.options.every((options) => options.noStore)).toBe(true);
  });

  it.each(EDITORIAL_TABLES)("fetches %s details by slug without a catalog query", async (table) => {
    expect((await getPublishedRow(table, "item-4"))?.id).toBe(4);
    expect(state.reads.filter((read) => read.single)).toEqual([
      expect.objectContaining({ filters: { status: "published", slug: "item-4" } })
    ]);
    expect(state.reads.filter((read) => !read.single).every((read) => !read.columns.includes("title"))).toBe(true);
    const count = state.reads.length;
    await getPublishedRow(table, "item-4");
    expect(state.reads).toHaveLength(count);
  });

  it("does not expose drafts or internal QA reports", async () => {
    state.rows.recipes.push(makeRow(99, "draft"), makeRow(100, "needs_review"));
    expect(await getPublishedRow("recipes", "item-99")).toBeNull();
    expect(await getPublishedRows("recipes")).toHaveLength(23);
    for (const columns of Object.values(PUBLIC_CONTENT_COLUMNS)) {
      expect(columns).not.toContain("qa_report");
      expect(columns).not.toContain("qa_notes");
    }
    expect(PUBLIC_CONTENT_COLUMNS.recipes).toContain("ingredients");
    expect(PUBLIC_CONTENT_COLUMNS.recipes).toContain("instructions");
  });

  it("invalidates cached misses, old slugs, unpublishing, deletion, and shifted catalog pages", async () => {
    await getPublishedRows("recipes");
    await getPublishedRow("recipes", "item-23");
    await getPublishedRow("recipes", "renamed");
    const old = state.rows.recipes.find((row) => row.id === 23)!;
    old.slug = "renamed";
    old.title = "Corrected title";
    invalidatePublishedContent("recipes");
    expect(await getPublishedRow("recipes", "item-23")).toBeNull();
    expect((await getPublishedRow("recipes", "renamed"))?.title).toBe("Corrected title");
    old.status = "archived";
    state.rows.recipes = state.rows.recipes.filter((row) => row.id !== 22);
    invalidatePublishedContent("recipes");
    expect(await getPublishedRow("recipes", "renamed")).toBeNull();
    expect((await getPublishedRows("recipes")).map((row) => row.id)).toEqual(Array.from({ length: 21 }, (_, i) => 21 - i));
  });

  it("makes a newly published item discoverable without waiting for the TTL", async () => {
    state.rows.recipes.push(makeRow(24, "draft"));
    await getPublishedRow("recipes", "item-24");
    await getPublishedRows("recipes");
    state.rows.recipes.at(-1)!.status = "published";
    invalidatePublishedContent("recipes");
    expect((await getPublishedRow("recipes", "item-24"))?.id).toBe(24);
    expect((await getPublishedRows("recipes"))[0].id).toBe(24);
  });

  it("does not flush other content types when one changes", async () => {
    await getPublishedRows("blog_posts");
    await getPublishedRows("reviews");
    const count = state.reads.length;
    invalidatePublishedContent("recipes");
    await getPublishedRows("blog_posts");
    await getPublishedRows("reviews");
    expect(state.reads).toHaveLength(count);
  });

  it("refreshes only statistics after five minutes and retains prose for 30 days", async () => {
    await getPublishedRow("recipes", "item-1");
    state.rows.recipes[0].title = "Uninvalidated edit";
    state.rows.recipes[0].view_count = 42;
    state.now = CONTENT_METRICS_TTL + 1;
    state.reads = [];
    const row = await getPublishedRow("recipes", "item-1");
    expect(row?.title).toBe("Item 1");
    expect(row?.view_count).toBe(42);
    expect(state.reads).toHaveLength(1);
    expect(state.reads[0].columns).not.toContain("title");
    expect(state.writes.map((write) => write.ttl)).toContain(PUBLISHED_CONTENT_TTL);
  });

  it("shares public search settings and supports explicit invalidation", async () => {
    for (let i = 0; i < 100; i++) await getPublicSearchRuntimeValue();
    expect(state.reads).toHaveLength(1);
    state.rows.site_settings[0].value.version = 2;
    expect(await getPublicSearchRuntimeValue()).toEqual({ version: 1 });
    invalidatePublicSearchRuntime();
    expect(await getPublicSearchRuntimeValue()).toEqual({ version: 2 });
    expect(state.reads).toHaveLength(2);
  });

  it("does not cache database errors as an empty catalog, missing slug, or missing setting", async () => {
    state.error = true;
    await expect(getPublishedRows("recipes")).rejects.toThrow("database unavailable");
    await expect(getPublishedRow("reviews", "item-1")).rejects.toThrow("database unavailable");
    await expect(getPublicSearchRuntimeValue()).rejects.toThrow("database unavailable");
    expect(state.entries.size).toBe(0);
    state.error = false;
    expect((await getPublishedRow("reviews", "item-1"))?.id).toBe(1);
  });

  it("paginates beyond Supabase's 1,000-row cap without a monolithic cache entry", async () => {
    state.rows.recipes = Array.from({ length: 1011 }, (_, i) => ({ ...makeRow(i), intro: "x".repeat(3500) }));
    const rows = await getPublishedRows("recipes");
    expect(rows).toHaveLength(1011);
    expect(Buffer.byteLength(JSON.stringify(rows))).toBeGreaterThan(2 * 1024 * 1024);
    expect(Math.max(...state.writes.map((write) => write.bytes))).toBeLessThan(750_000);
    expect(new Set(rows.map((row) => row.id)).size).toBe(1011);
  });

  it("rejects oversized individual entries before Next silently skips caching them", () => {
    expect(() => assertCacheEntrySize({ text: "x".repeat(750_000) })).toThrow("750 KB");
  });

  it("protects the maintenance purge endpoint with the existing cron credential", async () => {
    await getPublishedRow("recipes", "item-1");
    const count = state.entries.size;
    expect((await POST(new Request("https://example.com/api/admin/content-cache", { method: "POST" }))).status).toBe(401);
    expect(state.entries.size).toBe(count);
    expect((await POST(new Request("https://example.com/api/admin/content-cache", {
      method: "POST", headers: { authorization: "Bearer test-secret" }
    }))).status).toBe(200);
    expect(state.entries.size).toBe(0);
  });
});
