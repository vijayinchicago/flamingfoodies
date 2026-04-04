import { describe, expect, it } from "vitest";

import {
  buildAdsTxtContent,
  coerceSiteSettingBoolean,
  normalizeAdsensePublisherId
} from "@/lib/ads";

describe("ads utilities", () => {
  it("normalizes AdSense publisher ids for ads.txt", () => {
    expect(normalizeAdsensePublisherId("ca-pub-1234567890")).toBe("pub-1234567890");
    expect(normalizeAdsensePublisherId("pub-1234567890")).toBe("pub-1234567890");
  });

  it("builds ads.txt content with extra lines", () => {
    expect(
      buildAdsTxtContent("ca-pub-1234567890", "example.com, pub-999, DIRECT, test")
    ).toContain("google.com, pub-1234567890, DIRECT, f08c47fec0942fa0");
  });

  it("coerces site setting values into booleans", () => {
    expect(coerceSiteSettingBoolean(true)).toBe(true);
    expect(coerceSiteSettingBoolean("true")).toBe(true);
    expect(coerceSiteSettingBoolean("0", true)).toBe(false);
    expect(coerceSiteSettingBoolean(undefined, false)).toBe(false);
  });
});
