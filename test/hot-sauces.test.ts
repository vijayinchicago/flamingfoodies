import { describe, expect, it } from "vitest";

import {
  getBestForTacosReviews,
  getFilteredHotSauceReviews,
  getHotSauceIntentLabel,
  getTacoFriendlyRecipes,
  getTopHotSaucePicks
} from "@/lib/hot-sauces";
import type { Recipe, Review } from "@/lib/types";

const baseReview: Review = {
  id: 1,
  type: "review",
  slug: "yellowbird-habanero-hot-sauce-review",
  title: "Yellowbird Habanero Hot Sauce Review",
  description: "Bright, citrusy, taco-friendly heat.",
  productName: "Yellowbird Habanero",
  brand: "Yellowbird",
  rating: 4.5,
  priceUsd: 8.99,
  affiliateUrl: "https://example.com/yellowbird",
  content: "Great on tacos, eggs, and rice bowls.",
  heatLevel: "hot",
  scovilleMin: 1500,
  scovilleMax: 4500,
  flavorNotes: ["citrus", "carrot", "bright"],
  cuisineOrigin: "mexican",
  category: "hot-sauce",
  pros: ["Useful every day", "Good on tacos"],
  cons: ["Less smoky than some red sauces"],
  imageUrl: "https://example.com/yellowbird.jpg",
  imageAlt: "Yellowbird bottle",
  imageReviewed: true,
  factQaReviewed: true,
  qaNotes: undefined,
  qaReport: undefined,
  recommended: true,
  featured: true,
  source: "editorial",
  status: "published",
  tags: ["hot sauce", "everyday", "tacos"],
  viewCount: 120,
  likeCount: 10,
  publishedAt: "2026-04-04T00:00:00.000Z"
};

const bigHeatReview: Review = {
  ...baseReview,
  id: 2,
  slug: "torchbearer-garlic-reaper-review",
  title: "Torchbearer Garlic Reaper Review",
  description: "Aggressive garlic heat built more for wings and pizza than tacos.",
  productName: "Torchbearer Garlic Reaper",
  brand: "Torchbearer",
  heatLevel: "reaper",
  scovilleMax: 100000,
  rating: 4.6,
  priceUsd: 15.99,
  cuisineOrigin: "american",
  content: "Better for wings and pizza than for tacos.",
  tags: ["hot sauce", "reaper", "wings"],
  featured: true
};

const giftableReview: Review = {
  ...baseReview,
  id: 3,
  slug: "gift-set-review",
  title: "Heatonist Gift Set Review",
  productName: "Heatonist Gift Set",
  brand: "Heatonist",
  category: "gift-set",
  priceUsd: 34,
  content: "A clean gift move for tasting nights.",
  tags: ["gift", "bundle", "collection"],
  featured: false
};

const pantryReview: Review = {
  ...baseReview,
  id: 4,
  slug: "mikes-hot-honey-review",
  title: "Mike's Hot Honey Review",
  productName: "Mike's Hot Honey",
  brand: "Mike's Hot Honey",
  category: "pantry-condiment",
  cuisineOrigin: "american",
  priceUsd: 11.99,
  content: "Excellent on pizza and fried chicken.",
  tags: ["hot honey", "condiment"],
  featured: false
};

const baseRecipe: Recipe = {
  id: 1,
  type: "recipe",
  slug: "birria-quesatacos-with-arbol-salsa",
  title: "Birria Quesatacos with Arbol Salsa",
  description: "Rich tacos with broth and salsa.",
  authorName: "FlamingFoodies",
  heatLevel: "hot",
  cuisineType: "mexican",
  prepTimeMinutes: 20,
  cookTimeMinutes: 60,
  totalTimeMinutes: 80,
  servings: 4,
  difficulty: "intermediate",
  ingredients: [],
  instructions: [],
  tips: [],
  variations: [],
  equipment: [],
  tags: ["tacos", "birria"],
  source: "editorial",
  status: "published",
  viewCount: 0,
  likeCount: 0,
  saveCount: 0,
  ratingCount: 0
};

describe("hot sauce helpers", () => {
  it("filters reviews into shopping lanes", () => {
    const reviews = [baseReview, bigHeatReview, giftableReview, pantryReview];

    expect(getFilteredHotSauceReviews(reviews, "everyday").map((item) => item.slug)).toEqual(
      expect.arrayContaining(["yellowbird-habanero-hot-sauce-review", "mikes-hot-honey-review"])
    );
    expect(getFilteredHotSauceReviews(reviews, "big-heat").map((item) => item.slug)).toContain(
      "torchbearer-garlic-reaper-review"
    );
    expect(getFilteredHotSauceReviews(reviews, "giftable").map((item) => item.slug)).toContain(
      "gift-set-review"
    );
    expect(getFilteredHotSauceReviews(reviews, "under-15").every((item) => (item.priceUsd ?? 0) <= 15)).toBe(true);
  });

  it("returns useful intent labels and taco ranking", () => {
    const reviews = [bigHeatReview, giftableReview, baseReview, pantryReview];

    expect(getHotSauceIntentLabel(baseReview)).toBe("Best for tacos");
    expect(getHotSauceIntentLabel(bigHeatReview)).toBe("Best for wings");
    expect(getBestForTacosReviews(reviews, 2)[0]?.slug).toBe(
      "yellowbird-habanero-hot-sauce-review"
    );
  });

  it("surfaces strong top picks and taco recipes", () => {
    const reviews = [giftableReview, pantryReview, baseReview];
    const recipes: Recipe[] = [
      baseRecipe,
      {
        ...baseRecipe,
        id: 2,
        slug: "gochujang-noodles",
        title: "Spicy Korean Gochujang Noodles",
        description: "Hot noodles",
        cuisineType: "korean",
        tags: ["noodles"]
      }
    ];

    expect(getTopHotSaucePicks(reviews, 2)).toHaveLength(2);
    expect(getTacoFriendlyRecipes(recipes, 2).map((item) => item.slug)).toContain(
      "birria-quesatacos-with-arbol-salsa"
    );
  });
});
