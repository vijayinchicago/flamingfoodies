import { describe, expect, it } from "vitest";

import { getShopAffiliateCollections, getShopMerchCollections } from "@/lib/shop";
import type { MerchProduct } from "@/lib/types";

const merchProducts: MerchProduct[] = [
  {
    id: 1,
    slug: "sauce-lab-tee",
    name: "Sauce Lab Tee",
    category: "Apparel",
    badge: "Drop 01",
    description: "Heavyweight tee.",
    priceLabel: "$32",
    availability: "preview",
    themeKey: "flame",
    href: "/shop#merch-waitlist",
    ctaLabel: "Join merch waitlist",
    featured: true,
    status: "published",
    sortOrder: 10
  },
  {
    id: 2,
    slug: "heat-scale-hat",
    name: "Heat Scale Dad Hat",
    category: "Headwear",
    badge: "Low-key logo",
    description: "Clean cap.",
    priceLabel: "$28",
    availability: "preview",
    themeKey: "cream",
    href: "/shop#merch-waitlist",
    ctaLabel: "Get launch access",
    featured: false,
    status: "published",
    sortOrder: 20
  },
  {
    id: 3,
    slug: "kitchen-apron",
    name: "Kitchen Apron",
    category: "Kitchen gear",
    badge: "Cook-ready",
    description: "Apron concept.",
    priceLabel: "$44",
    availability: "preview",
    themeKey: "gold",
    href: "/shop#merch-waitlist",
    ctaLabel: "Get launch access",
    featured: true,
    status: "published",
    sortOrder: 30
  },
  {
    id: 4,
    slug: "tasting-flight-enamel-mugs",
    name: "Tasting Flight Enamel Mug Set",
    category: "Drinkware",
    badge: "Gift set",
    description: "Four mugs.",
    priceLabel: "$36",
    availability: "waitlist",
    themeKey: "smoke",
    href: "/shop#merch-waitlist",
    ctaLabel: "Join merch waitlist",
    featured: false,
    status: "published",
    sortOrder: 40
  }
];

describe("shop helpers", () => {
  it("groups merch into storefront collections", () => {
    const collections = getShopMerchCollections(merchProducts);

    expect(collections.find((collection) => collection.key === "apparel")?.items).toHaveLength(2);
    expect(collections.find((collection) => collection.key === "cookware")?.items).toHaveLength(2);
    expect(collections.find((collection) => collection.key === "gifts")?.items.length).toBeGreaterThan(0);
  });

  it("returns curated affiliate kits for the shop", () => {
    const collections = getShopAffiliateCollections();

    expect(collections).toHaveLength(4);
    expect(collections[0]?.items).toHaveLength(3);
    expect(collections.find((collection) => collection.key === "under-15")?.items).toHaveLength(3);
    expect(collections.find((collection) => collection.key === "gift-guide")?.title).toMatch(/gift/i);
  });
});
