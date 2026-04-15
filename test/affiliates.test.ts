import { describe, expect, it } from "vitest";

import {
  AFFILIATE_LINKS,
  buildAffiliateDestinationUrl,
  getRecipeAffiliateRecommendations,
  resolveAffiliateLink
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
    expect(Object.keys(AFFILIATE_LINKS).length).toBeGreaterThanOrEqual(35);
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

  it("keeps Amazon links on the tracked redirect path", () => {
    const resolved = resolveAffiliateLink("amazon-cast-iron-skillet", {
      sourcePage: "/shop",
      position: "gear-column",
      hasSkimlinksJavascript: true
    });

    expect(resolved?.href).toContain("/go/amazon-cast-iron-skillet");
    expect(resolved?.trackingMode).toBe("server_redirect");
    expect(resolved?.monetizationStrategy).toBe("amazon_tag_redirect");
  });

  it("sends non-Amazon entries to Amazon search while Amazon-only mode is active", () => {
    const resolved = resolveAffiliateLink("heatonist-los-calientes-rojo", {
      sourcePage: "/shop",
      position: "hot-sauce-column",
      hasSkimlinksJavascript: true
    });

    expect(resolved?.href).toContain("/go/heatonist-los-calientes-rojo");
    expect(resolved?.isExternal).toBe(false);
    expect(resolved?.trackingMode).toBe("server_redirect");
    expect(resolved?.monetizationStrategy).toBe("amazon_tag_redirect");
  });

  it("builds Amazon destinations for non-Amazon products", () => {
    expect(buildAffiliateDestinationUrl(AFFILIATE_LINKS["heatonist-los-calientes-rojo"])).toContain(
      "amazon.com"
    );
    expect(buildAffiliateDestinationUrl(AFFILIATE_LINKS["heatonist-los-calientes-rojo"])).toContain(
      "tag="
    );
  });
});
