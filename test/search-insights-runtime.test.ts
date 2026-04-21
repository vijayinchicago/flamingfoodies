import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildSearchRecommendations,
  parseSearchPerformanceExport
} from "@/lib/search-performance";
import { buildSearchRuntimeOptimizations } from "@/lib/services/search-insights";

const exportDir = join(
  process.cwd(),
  "docs/flamingfoodies.com-Performance-on-Search-2026-04-18"
);

function readExportFile(name: string) {
  return readFileSync(join(exportDir, name), "utf8");
}

describe("search runtime optimizations", () => {
  it("turns the main recommendation clusters into live runtime overrides", () => {
    const snapshot = parseSearchPerformanceExport({
      filtersCsv: readExportFile("Filters.csv"),
      queriesCsv: readExportFile("Queries.csv"),
      pagesCsv: readExportFile("Pages.csv"),
      devicesCsv: readExportFile("Devices.csv"),
      countriesCsv: readExportFile("Countries.csv"),
      searchAppearanceCsv: readExportFile("Search appearance.csv")
    });
    const recommendations = buildSearchRecommendations(snapshot);

    const runtime = buildSearchRuntimeOptimizations(recommendations, {
      startDate: "2026-01-19",
      endDate: "2026-04-18",
      latestAvailableDate: "2026-04-18"
    });

    expect(runtime.detectedRecommendationIds).toEqual(
      expect.arrayContaining([
        "seafood-fish-cluster",
        "nashville-hot-chicken-cluster",
        "wings-fried-chicken-cluster",
        "fried-chicken-supporting-page"
      ])
    );
    expect(runtime.appliedRecommendationIds).toEqual(
      expect.arrayContaining([
        "seafood-fish-cluster",
        "nashville-hot-chicken-cluster",
        "wings-fried-chicken-cluster",
        "fried-chicken-supporting-page"
      ])
    );
    expect(runtime.blog["how-to-choose-a-hot-sauce-for-seafood"]?.seoTitle).toBe(
      "How to Choose the Best Hot Sauce for Seafood, Fish, and Ceviche | FlamingFoodies"
    );
    expect(runtime.recipes["nashville-hot-chicken-sandwiches"]?.seoTitle).toBe(
      "Nashville Hot Chicken Sandwich Recipe | How to Make the Sauce"
    );
    expect(runtime.pages["/hot-sauces/best-for-wings"]?.metadataTitle).toBe(
      "Best Hot Sauces for Wings and Fried Chicken | FlamingFoodies"
    );
    expect(runtime.pages["/hot-sauces/best-for-fried-chicken"]?.metadataTitle).toBe(
      "Best Hot Sauces for Fried Chicken and Hot Sandwiches | FlamingFoodies"
    );
    expect(runtime.pages["/hot-sauces/best-for-seafood"]?.faqs?.length).toBeGreaterThan(2);
  });
});

describe("search console oauth state", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("GOOGLE_SEARCH_CONSOLE_PROPERTY", "sc-domain:flamingfoodies.com");
    vi.stubEnv(
      "GOOGLE_SEARCH_CONSOLE_CLIENT_ID",
      "test-client-id.apps.googleusercontent.com"
    );
    vi.stubEnv("GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET", "test-client-secret");
    vi.stubEnv(
      "GOOGLE_SEARCH_CONSOLE_REDIRECT_URI",
      "https://flamingfoodies.com/api/admin/google-search-console/callback"
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts valid signed state values and rejects tampered or expired ones", async () => {
    const {
      createSignedSearchConsoleOAuthState,
      isValidSearchConsoleOAuthState
    } = await import("@/lib/services/search-insights");
    const now = Date.parse("2026-04-21T05:30:00.000Z");
    const validState = createSignedSearchConsoleOAuthState(now);
    const tamperedPayload = JSON.parse(
      Buffer.from(validState, "base64url").toString("utf8")
    ) as {
      nonce: string;
      issuedAt: number;
      signature: string;
    };

    tamperedPayload.nonce = `${tamperedPayload.nonce}-tampered`;
    const tamperedState = Buffer.from(
      JSON.stringify(tamperedPayload),
      "utf8"
    ).toString("base64url");

    expect(isValidSearchConsoleOAuthState(validState, now + 1_000)).toBe(true);
    expect(isValidSearchConsoleOAuthState(tamperedState, now + 1_000)).toBe(false);
    expect(isValidSearchConsoleOAuthState(validState, now + 10 * 60 * 1000 + 1)).toBe(false);
  });
});
