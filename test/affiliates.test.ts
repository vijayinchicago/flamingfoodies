import { describe, expect, it } from "vitest";

import {
  AFFILIATE_LINKS,
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

  it("can expose non-Amazon merchant links directly when Skimlinks is enabled", () => {
    const resolved = resolveAffiliateLink("heatonist-los-calientes-rojo", {
      sourcePage: "/shop",
      position: "hot-sauce-column",
      hasSkimlinksJavascript: true
    });

    expect(resolved?.href).toBe(AFFILIATE_LINKS["heatonist-los-calientes-rojo"].url);
    expect(resolved?.isExternal).toBe(true);
    expect(resolved?.trackingMode).toBe("client_beacon");
    expect(resolved?.monetizationStrategy).toBe("skimlinks_javascript");
  });

  it("falls back to the redirect path for non-Amazon links without Skimlinks", () => {
    const resolved = resolveAffiliateLink("heatonist-los-calientes-rojo", {
      sourcePage: "/shop",
      position: "hot-sauce-column",
      hasSkimlinksJavascript: false
    });

    expect(resolved?.href).toContain("/go/heatonist-los-calientes-rojo");
    expect(resolved?.trackingMode).toBe("server_redirect");
    expect(resolved?.monetizationStrategy).toBe("merchant_redirect");
  });
});
