import { describe, expect, it } from "vitest";

import {
  buildShopPickSlug,
  chooseShopPickEntries,
  formatShopCategory,
  getSeasonalShopSeedProducts,
  getShopThemeKey,
  rankShopPickEntries
} from "@/lib/services/shop-automation";
import { getAutomatedShopPickEntries } from "@/lib/affiliates";

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

  it("still rotates picks after the full automated catalog already exists", () => {
    const existingHrefs = getAutomatedShopPickEntries().map((entry) => `/go/${entry.key}`);
    const dayOne = chooseShopPickEntries(existingHrefs, 4, new Date("2026-04-10T12:00:00Z"));
    const dayTwo = chooseShopPickEntries(existingHrefs, 4, new Date("2026-04-11T12:00:00Z"));

    expect(dayOne).toHaveLength(4);
    expect(dayTwo).toHaveLength(4);
    expect(dayOne.map((pick) => pick.key)).not.toEqual(dayTwo.map((pick) => pick.key));
  });

  it("avoids repeating the same shop pick on same-day reruns when recent history exists", () => {
    const existingHrefs = getAutomatedShopPickEntries().map((entry) => `/go/${entry.key}`);
    const picks = chooseShopPickEntries(existingHrefs, 1, new Date("2026-04-14T12:00:00Z"), [
      {
        affiliateKey: "amazon-yellowbird-habanero",
        category: "hot_sauce",
        createdAt: "2026-04-14T11:00:00Z"
      }
    ]);

    expect(picks).toHaveLength(1);
    expect(picks[0]?.key).not.toBe("amazon-yellowbird-habanero");
  });

  it("leans into seasonal cuisine signals instead of defaulting to the same bottle", () => {
    const existingHrefs = getAutomatedShopPickEntries().map((entry) => `/go/${entry.key}`);
    const [pick] = chooseShopPickEntries(
      existingHrefs,
      1,
      new Date("2026-07-12T12:00:00Z"),
      [],
      {
        activeMoments: ["grill_season", "summer_fresh"],
        cuisineWeights: {
          jamaican: 40,
          caribbean: 36
        },
        heatWeights: {
          hot: 20,
          inferno: 12
        },
        categoryWeights: {
          hot_sauce: 24
        }
      }
    );

    expect(pick?.category).toBe("hot_sauce");
    expect(
      pick?.cuisines?.some((cuisine) => cuisine === "jamaican" || cuisine === "caribbean")
    ).toBe(true);
  });

  it("builds a one-time seasonal seed from the full automated catalog", () => {
    const seededProducts = getSeasonalShopSeedProducts(new Date("2026-12-05T12:00:00Z"));

    expect(seededProducts).toHaveLength(getAutomatedShopPickEntries().length);
    expect(seededProducts.some((product) => product.slug === "shop-pick-amazon-hot-sauce-gift-box")).toBe(
      true
    );
    expect(seededProducts.slice(0, 6).some((product) => product.category === "Subscriptions")).toBe(
      true
    );
  });

  it("builds stable shop-pick slugs from affiliate keys", () => {
    const [pick] = chooseShopPickEntries([], 1, new Date("2026-04-10T12:00:00Z"));
    expect(buildShopPickSlug(pick)).toBe(`shop-pick-${pick.key}`);
  });

  it("ranks shop picks by real click volume before falling back to catalog order", () => {
    const catalog = getAutomatedShopPickEntries();
    const ranked = rankShopPickEntries(
      catalog,
      new Map([
        ["amazon::Yellowbird Habanero Hot Sauce", 12],
        ["amazon::12-Inch Cast Iron Skillet", 8]
      ])
    );

    expect(ranked[0]?.entry.key).toBe("amazon-yellowbird-habanero");
    expect(ranked[1]?.entry.key).toBe("amazon-cast-iron-skillet");
    expect(ranked[0]?.clicks).toBe(12);
  });
});
