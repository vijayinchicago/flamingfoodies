import { describe, expect, it } from "vitest";

import { getMerchThemeClasses } from "@/lib/merch";
import { sampleMerchProducts } from "@/lib/sample-data";

describe("merch catalog", () => {
  it("includes a storefront fallback catalog", () => {
    expect(sampleMerchProducts.length).toBeGreaterThanOrEqual(6);
    expect(sampleMerchProducts.some((item) => item.featured)).toBe(true);
  });

  it("maps theme keys to gradient classes", () => {
    expect(getMerchThemeClasses("flame")).toContain("from-flame");
    expect(getMerchThemeClasses("gold")).toContain("from-gold");
  });
});
