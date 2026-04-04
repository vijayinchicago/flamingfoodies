import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/content", () => ({
  getRecipes: async () => [
    {
      title: "Birria Quesatacos with Arbol Salsa",
      description: "Rich tacos with chile broth.",
      slug: "birria-quesatacos-with-arbol-salsa",
      imageUrl: "https://example.com/birria.jpg",
      cuisineType: "mexican",
      tags: ["tacos", "birria"]
    }
  ],
  getBlogPosts: async () => [
    {
      title: "Best Hot Sauces for Taco Night",
      description: "A buying guide for taco-friendly sauces.",
      slug: "best-hot-sauces-for-taco-night",
      imageUrl: "https://example.com/taco-night.jpg",
      category: "buying-guides",
      tags: ["taco", "hot sauce"]
    }
  ],
  getReviews: async () => [
    {
      title: "Yellowbird Habanero Hot Sauce Review",
      description: "Bright heat and everyday usability.",
      slug: "yellowbird-habanero-hot-sauce-review",
      imageUrl: "https://example.com/yellowbird.jpg",
      brand: "Yellowbird",
      productName: "Habanero Hot Sauce",
      category: "hot-sauce"
    }
  ]
}));

vi.mock("@/lib/content/guides", () => ({
  getGuides: async () => [
    {
      slug: "how-to-ferment-hot-sauce",
      title: "How to Ferment Hot Sauce",
      description: "A guide to building fermented heat."
    }
  ]
}));

import { searchSite } from "@/lib/search";

describe("searchSite", () => {
  it("returns ranked results across recipes, blog, reviews, and guides", async () => {
    const results = await searchSite("taco");

    expect(results.length).toBeGreaterThan(0);
    expect(
      results.some((result) => result.href === "/blog/best-hot-sauces-for-taco-night")
    ).toBe(true);
    expect(results.some((result) => result.href === "/recipes/birria-quesatacos-with-arbol-salsa")).toBe(true);
  });
});
