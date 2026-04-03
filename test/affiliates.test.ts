import { describe, expect, it } from "vitest";

import {
  AFFILIATE_LINKS,
  getRecipeAffiliateRecommendations
} from "@/lib/affiliates";
import { sampleMerchProducts } from "@/lib/sample-data";

describe("affiliate registry", () => {
  it("contains the fuego box subscription key", () => {
    expect(AFFILIATE_LINKS["fuego-box-monthly-subscription"]).toBeDefined();
  });

  it("builds amazon urls with a tag", () => {
    expect(AFFILIATE_LINKS["amazon-cast-iron-skillet"].url).toContain("tag=");
  });

  it("has a deeper catalog for commerce pages", () => {
    expect(Object.keys(AFFILIATE_LINKS).length).toBeGreaterThanOrEqual(15);
    expect(sampleMerchProducts.length).toBeGreaterThanOrEqual(6);
  });

  it("prioritizes contextual recipe recommendations", () => {
    const recommendations = getRecipeAffiliateRecommendations({
      cuisineType: "korean",
      heatLevel: "hot",
      limit: 3
    });

    expect(recommendations).toHaveLength(3);
    expect(recommendations.some((link) => link.product.includes("Gochujang"))).toBe(true);
  });
});
