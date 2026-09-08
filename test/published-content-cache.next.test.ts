// @vitest-environment node
import { AsyncLocalStorage } from "node:async_hooks";
import * as fs from "node:fs/promises";
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ reads: 0, title: "Original", views: 1, status: "published", fail: false }));
vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_SUPABASE_URL: "https://next-cache-test.invalid" } }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: () => ({ from() {
  let metrics = false;
  let single = false;
  const query: any = {
    select(columns: string) { metrics = !columns.includes("title"); return query; },
    eq() { return query; }, order() { return query; }, range() { return query; },
    maybeSingle() { single = true; return query; },
    then(resolve: (value: any) => void) {
      state.reads++;
      const row = metrics ? { id: 1, view_count: state.views } : { id: 1, slug: "one", title: state.title, status: state.status };
      resolve(state.fail ? { data: null, error: { message: "temporary outage" } } : {
        data: state.status === "published" ? single ? row : [row] : single ? null : [], error: null
      });
    }
  };
  return query;
} }) }));

let content: typeof import("@/lib/services/published-content-cache");
let IncrementalCache: any;
let storage: any;
let incrementalCache: any;
let sequence = 0;

beforeAll(async () => {
  // Next's Node bootstrap normally installs this before loading its async store.
  (globalThis as any).AsyncLocalStorage = AsyncLocalStorage;
  ({ IncrementalCache } = await import("next/dist/server/lib/incremental-cache"));
  ({ staticGenerationAsyncStorage: storage } = await import("next/dist/client/components/static-generation-async-storage.external"));
  content = await import("@/lib/services/published-content-cache");
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-07T00:00:00Z").getTime() + ++sequence * 100_000);
  state.reads = 0; state.title = "Original"; state.views = 1; state.status = "published"; state.fail = false;
  incrementalCache = new IncrementalCache({
    // Keep the real handler's memory/tag behavior without writing a tag manifest.
    fs: { ...fs, mkdir: async () => {}, writeFile: async () => {} },
    dev: false, appDir: true, flushToDisk: false, requestHeaders: {},
    serverDistDir: "/tmp/flamingfoodies-read-only-cache-test/server",
    maxMemoryCacheSize: 10 * 1024 * 1024, fetchCacheKeyPrefix: `case-${sequence}`,
    experimental: { ppr: false },
    getPrerenderManifest: () => ({ version: 4, routes: {}, dynamicRoutes: {}, notFoundRoutes: [],
      preview: { previewModeId: "test", previewModeSigningKey: "test", previewModeEncryptionKey: "test" } })
  });
});

afterEach(() => vi.useRealTimers());

async function request<T>(work: () => Promise<T> | T): Promise<T> {
  const store: any = { isStaticGeneration: false, page: "/cache-test/page", urlPathname: "/cache-test", incrementalCache };
  const result = await storage.run(store, work);
  // The Next response lifecycle commits tag invalidation and pending SWR work.
  if (store.revalidatedTags?.length) await incrementalCache.revalidateTag(store.revalidatedTags);
  await Promise.all(Object.values(store.pendingRevalidates ?? {}));
  vi.setSystemTime(Date.now() + 2);
  return result;
}

it("uses the installed Next 14 data cache across requests and invalidates archived detail/catalog entries", async () => {
  expect((await request(() => content.getPublishedRows("recipes")))[0].title).toBe("Original");
  expect(state.reads).toBe(2);
  await request(() => content.getPublishedRows("recipes"));
  expect(state.reads).toBe(2);
  await request(() => content.getPublishedRow("recipes", "one"));
  expect(state.reads).toBe(3);
  state.status = "archived";
  await request(() => content.invalidatePublishedContent("recipes"));
  expect(await request(() => content.getPublishedRow("recipes", "one"))).toBeNull();
  expect(await request(() => content.getPublishedRows("recipes"))).toEqual([]);
});

it("uses real stale-while-revalidate for counters without re-reading the 30-day prose", async () => {
  await request(() => content.getPublishedRow("recipes", "one"));
  state.views = 42; state.title = "Not yet invalidated";
  vi.setSystemTime(Date.now() + 301_000);
  expect((await request(() => content.getPublishedRow("recipes", "one")))?.view_count).toBe(1);
  const fresh = await request(() => content.getPublishedRow("recipes", "one"));
  expect(fresh?.view_count).toBe(42);
  expect(fresh?.title).toBe("Original");
  expect(state.reads).toBe(3);
});

it("retains previously cached content when a TTL refresh fails", async () => {
  await request(() => content.getPublishedRow("recipes", "one"));
  state.fail = true;
  vi.setSystemTime(Date.now() + (content.PUBLISHED_CONTENT_TTL + 1) * 1000);
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    expect((await request(() => content.getPublishedRow("recipes", "one")))?.title).toBe("Original");
    expect(errors).toHaveBeenCalled();
    state.fail = false; state.title = "Recovered";
    await request(() => content.getPublishedRow("recipes", "one"));
    expect((await request(() => content.getPublishedRow("recipes", "one")))?.title).toBe("Recovered");
  } finally {
    errors.mockRestore();
  }
});
