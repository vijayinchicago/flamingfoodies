import { describe, expect, it } from "vitest";

import {
  getRecipeGearRecommendations,
  getRecipePantryRecommendations,
  getRecipeSaucePairings,
  getRelatedRecipesForRecipe
} from "@/lib/recipe-commerce";
import type { Recipe, Review } from "@/lib/types";

const baseRecipe: Recipe = {
  id: 1,
  type: "recipe",
  slug: "birria-quesatacos-with-arbol-salsa",
  title: "Birria Quesatacos with Arbol Salsa",
  description: "Rich birria tacos with melty cheese and a sharp arbol salsa.",
  intro: "A taco-night project with broth, tortillas, salsa, and crisp edges.",
  authorName: "FlamingFoodies",
  heatLevel: "hot",
  cuisineType: "mexican",
  prepTimeMinutes: 30,
  cookTimeMinutes: 120,
  totalTimeMinutes: 150,
  servings: 6,
  difficulty: "intermediate",
  ingredients: [
    { amount: "3", unit: "lb", item: "beef chuck roast" },
    { amount: "10", unit: "", item: "guajillo chiles" },
    { amount: "8", unit: "", item: "corn tortillas" },
    { amount: "1", unit: "cup", item: "arbol salsa" }
  ],
  instructions: [],
  tips: [],
  variations: [],
  equipment: ["Dutch oven", "blender", "griddle"],
  tags: ["tacos", "birria", "salsa"],
  source: "editorial",
  status: "published",
  viewCount: 0,
  likeCount: 0,
  saveCount: 0,
  ratingCount: 0
};

const koreanRecipe: Recipe = {
  ...baseRecipe,
  id: 2,
  slug: "spicy-korean-gochujang-noodles",
  title: "Spicy Korean Gochujang Noodles",
  description: "Glossy gochujang noodles with sharp fermented heat.",
  intro: "A fast noodle bowl with chewy strands and real chile depth.",
  cuisineType: "korean",
  heatLevel: "hot",
  totalTimeMinutes: 35,
  prepTimeMinutes: 20,
  cookTimeMinutes: 15,
  ingredients: [
    { amount: "12", unit: "oz", item: "ramyun-style noodles" },
    { amount: "3", unit: "tbsp", item: "gochujang" }
  ],
  tags: ["noodles", "gochujang", "weeknight"]
};

const thirdRecipe: Recipe = {
  ...baseRecipe,
  id: 3,
  slug: "jamaican-jerk-shrimp-skewers",
  title: "Jamaican Jerk Shrimp Skewers",
  description: "Charred shrimp skewers with jerk heat.",
  intro: "A grill-night platter with jerk paste and citrus.",
  cuisineType: "jamaican",
  heatLevel: "inferno",
  tags: ["shrimp", "jerk", "grill"]
};

const yellowbirdReview: Review = {
  id: 10,
  type: "review",
  slug: "yellowbird-habanero-review",
  title: "Yellowbird Habanero Review",
  description: "Bright habanero heat that lands especially well on tacos and eggs.",
  productName: "Yellowbird Habanero",
  brand: "Yellowbird",
  rating: 4.7,
  priceUsd: 8.99,
  affiliateUrl: "https://example.com/yellowbird",
  content: "A bottle that keeps birria tacos and breakfast plates moving.",
  heatLevel: "hot",
  flavorNotes: ["bright", "carrot", "citrus"],
  cuisineOrigin: "mexican",
  category: "hot-sauce",
  pros: ["Great on tacos", "Everyday bottle"],
  cons: ["Not especially smoky"],
  recommended: true,
  imageReviewed: true,
  factQaReviewed: true,
  source: "editorial",
  status: "published",
  tags: ["tacos", "everyday"],
  viewCount: 0,
  likeCount: 0,
  publishedAt: "2026-04-01T00:00:00.000Z"
};

const flyByJingReview: Review = {
  ...yellowbirdReview,
  id: 11,
  slug: "fly-by-jing-sichuan-gold-review",
  title: "Fly By Jing Sichuan Gold Review",
  description: "A peppercorn-leaning sauce built for dumplings, noodles, and eggs.",
  productName: "Fly By Jing Sichuan Gold",
  brand: "Fly By Jing",
  cuisineOrigin: "szechuan",
  category: "hot-sauce",
  content: "Excellent over noodles and dumpling bowls.",
  tags: ["dumplings", "noodles"],
  flavorNotes: ["peppercorn", "citrus"],
  heatLevel: "medium"
};

const queenMajestyReview: Review = {
  ...yellowbirdReview,
  id: 12,
  slug: "queen-majesty-scotch-bonnet-review",
  title: "Queen Majesty Scotch Bonnet Review",
  description: "Fruity ginger heat that works especially well with seafood and jerk flavors.",
  productName: "Queen Majesty Scotch Bonnet & Ginger",
  brand: "Queen Majesty",
  cuisineOrigin: "jamaican",
  category: "hot-sauce",
  content: "A natural move for jerk shrimp, grilled seafood, and tropical sides.",
  tags: ["jerk", "seafood"],
  flavorNotes: ["ginger", "fruit"],
  heatLevel: "inferno"
};

describe("recipe commerce helpers", () => {
  it("matches the right bottle to the recipe style", () => {
    expect(
      getRecipeSaucePairings(baseRecipe, [
        flyByJingReview,
        queenMajestyReview,
        yellowbirdReview
      ])[0]?.review.slug
    ).toBe("yellowbird-habanero-review");

    expect(
      getRecipeSaucePairings(thirdRecipe, [
        flyByJingReview,
        queenMajestyReview,
        yellowbirdReview
      ])[0]?.review.slug
    ).toBe("queen-majesty-scotch-bonnet-review");
  });

  it("surfaces pantry and gear that fit the recipe lane", () => {
    expect(getRecipePantryRecommendations(koreanRecipe, 1)[0]?.key).toBe(
      "amazon-gochujang-paste"
    );
    expect(getRecipeGearRecommendations(koreanRecipe, 1)[0]?.key).toBe(
      "amazon-carbon-steel-wok"
    );
    expect(getRecipeGearRecommendations(baseRecipe, 1)[0]?.key).toBe("amazon-molcajete");
  });

  it("finds the best next recipe to keep readers moving", () => {
    expect(
      getRelatedRecipesForRecipe(koreanRecipe, [baseRecipe, koreanRecipe, thirdRecipe], 1)[0]?.slug
    ).toBe("birria-quesatacos-with-arbol-salsa");
    expect(
      getRelatedRecipesForRecipe(baseRecipe, [baseRecipe, koreanRecipe, thirdRecipe], 2)
    ).toHaveLength(2);
  });
});
