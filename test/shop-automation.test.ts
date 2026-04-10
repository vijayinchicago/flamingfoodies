import { describe, expect, it } from "vitest";

import {
  buildShopPickSlug,
  chooseShopPickEntries,
  formatShopCategory,
  getShopThemeKey
} from "@/lib/services/shop-automation";

describe("shop automation", () => {
  it("maps affiliate categories into public-facing shop labels and themes", () => {
    expect(formatShopCategory("hot_sauce")).toBe("Hot sauces");
    expect(formatShopCategory("gear")).toBe("Kitchen gear");
    expect(getShopThemeKey("subscription")).toBe("gold");
    expect(getShopThemeKey("ingredient")).toBe("ember");
  });

  it("prefers catalog entries that are not already in merch products", () => {
    const picks = chooseShopPickEntries(
      ["/go/heatonist-los-calientes-rojo", "/go/amazon-yellowbird-habanero"],
      3,
      new Date("2026-04-10T12:00:00Z")
    );

    expect(picks).toHaveLength(3);
    expect(picks.some((pick) => pick.key === "heatonist-los-calientes-rojo")).toBe(false);
    expect(picks.some((pick) => pick.key === "amazon-yellowbird-habanero")).toBe(false);
  });

  it("builds stable shop-pick slugs from affiliate keys", () => {
    const [pick] = chooseShopPickEntries([], 1, new Date("2026-04-10T12:00:00Z"));
    expect(buildShopPickSlug(pick)).toBe(`shop-pick-${pick.key}`);
  });
});
