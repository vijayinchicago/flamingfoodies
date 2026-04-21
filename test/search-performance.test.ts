import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildSearchRecommendations,
  parseSearchPerformanceExport
} from "@/lib/search-performance";

const exportDir = join(
  process.cwd(),
  "docs/flamingfoodies.com-Performance-on-Search-2026-04-18"
);

function readExportFile(name: string) {
  return readFileSync(join(exportDir, name), "utf8");
}

describe("search performance recommendations", () => {
  it("parses the Search Console export and surfaces the main opportunities", () => {
    const snapshot = parseSearchPerformanceExport({
      filtersCsv: readExportFile("Filters.csv"),
      queriesCsv: readExportFile("Queries.csv"),
      pagesCsv: readExportFile("Pages.csv"),
      devicesCsv: readExportFile("Devices.csv"),
      countriesCsv: readExportFile("Countries.csv"),
      searchAppearanceCsv: readExportFile("Search appearance.csv")
    });

    expect(snapshot.filters.Date).toBe("Last 3 months");
    expect(snapshot.queries[0]).toMatchObject({
      query: "best hot sauce for fried chicken",
      impressions: 8
    });
    expect(snapshot.pages.some((row) => row.page.includes("www.flamingfoodies.com"))).toBe(true);

    const recommendations = buildSearchRecommendations(snapshot);
    const recommendationIds = recommendations.map((recommendation) => recommendation.id);

    expect(recommendationIds).toEqual(
      expect.arrayContaining([
        "seafood-fish-cluster",
        "nashville-hot-chicken-cluster",
        "wings-fried-chicken-cluster",
        "fried-chicken-supporting-page",
        "canonical-host-split"
      ])
    );

    expect(recommendations.find((item) => item.id === "seafood-fish-cluster")).toMatchObject({
      targetPath: "/hot-sauces/best-for-seafood",
      suggestedTitle: "Best Hot Sauces for Seafood and Fish | FlamingFoodies"
    });

    expect(recommendations.find((item) => item.id === "canonical-host-split")).toMatchObject({
      targetPath: "/hot-sauces/best-for-wings"
    });
  });
});
