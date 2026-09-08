// @vitest-environment node
import { AsyncLocalStorage } from "node:async_hooks";
import * as fs from "node:fs/promises";
import { createRequire } from "node:module";
import { afterAll, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_SUPABASE_URL: "https://prerender-cache-test.invalid" },
  flags: { hasSupabaseAdmin: true },
  supabaseConfig: { adminKey: "test-service-key-not-a-secret" }
}));

const react = createRequire(import.meta.url)("react");
const originalCache = react.cache;
afterAll(() => {
  react.cache = originalCache;
  vi.unstubAllGlobals();
});

it("prerenders through real Supabase and Next patched fetch without a dynamic bailout or nested fetch cache", async () => {
  vi.stubGlobal("AsyncLocalStorage", AsyncLocalStorage);
  // Next's CommonJS internals bypass Vitest's React mock. Supply the server
  // export's no-dispatcher behavior to that require() consumer as well.
  react.cache = (fn: (...args: any[]) => any) => fn;
  let title = "Original";
  const origin = vi.fn(async () => new Response(JSON.stringify([
    { id: 1, slug: "one", title, status: "published", view_count: 7 }
  ]), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", origin);

  const { IncrementalCache } = await import("next/dist/server/lib/incremental-cache");
  const { staticGenerationAsyncStorage: storage } = await import("next/dist/client/components/static-generation-async-storage.external");
  const { patchFetch } = await import("next/dist/server/lib/patch-fetch");
  const serverHooks = await import("next/dist/client/components/hooks-server-context");
  patchFetch({ staticGenerationAsyncStorage: storage, serverHooks });
  const content = await import("@/lib/services/published-content-cache");
  const incrementalCache = new IncrementalCache({
    fs: { ...fs, mkdir: async () => {}, writeFile: async () => {} } as any,
    dev: false, appDir: true, flushToDisk: false, requestHeaders: {},
    serverDistDir: "/tmp/flamingfoodies-prerender-cache-test/server",
    maxMemoryCacheSize: 10 * 1024 * 1024, fetchCacheKeyPrefix: "prerender-test",
    experimental: { ppr: false },
    getPrerenderManifest: () => ({ version: 4, routes: {}, dynamicRoutes: {}, notFoundRoutes: [],
      preview: { previewModeId: "test", previewModeSigningKey: "test", previewModeEncryptionKey: "test" } })
  });
  const writes = vi.spyOn(incrementalCache, "set");
  async function prerender() {
    const store: any = { isStaticGeneration: true, page: "/blog/[slug]/page", urlPathname: "/blog/one", incrementalCache };
    const result = await storage.run(store, () => content.getPublishedRows("blog_posts"));
    expect(store.revalidate).toBe(content.CONTENT_METRICS_TTL);
    return result;
  }
  expect((await prerender())[0].title).toBe("Original");
  expect(origin).toHaveBeenCalledTimes(2);
  expect(writes).toHaveBeenCalledTimes(2); // Body and metrics, no nested fetch entry.
  expect((await prerender())[0].title).toBe("Original");
  expect(origin).toHaveBeenCalledTimes(2);

  title = "Updated";
  // Match tag invalidation's commit at the end of a Next response. Ensure the
  // new write timestamp is later than the millisecond-resolution tag timestamp.
  await incrementalCache.revalidateTag(content.publishedContentTag("blog_posts"));
  await new Promise((resolve) => setTimeout(resolve, 5));
  expect((await prerender())[0].title).toBe("Updated");
  expect(origin).toHaveBeenCalledTimes(4);
});
