import { describe, expect, it } from "vitest";

import { getRecipeEditorialSections } from "@/lib/recipe-editorial-sections";
import {
  filterRecipes,
  getRecipeBrowseOptions,
  paginateRecipes,
  sortRecipes
} from "@/lib/recipe-browse";
import type { Recipe } from "@/lib/types";

const recipes: Recipe[] = [
  {
    id: 1,
    type: "recipe",
    slug: "thai-red-curry",
    title: "Thai Red Curry with Chicken",
    description: "A creamy weeknight curry with basil and gentle heat.",
    intro: "Easy curry night.",
    heroSummary: "Coconut curry for a quick dinner.",
    authorName: "FlamingFoodies",
    heatLevel: "medium",
    cuisineType: "thai",
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    totalTimeMinutes: 35,
    servings: 4,
    difficulty: "beginner",
    ingredients: [{ amount: "1", unit: "lb", item: "chicken" }],
    instructions: [{ step: 1, text: "Cook the curry." }],
    tips: ["Taste for salt."],
    variations: ["Use tofu."],
    equipment: ["pot"],
    tags: ["curry", "dinner"],
    featured: true,
    source: "editorial",
    status: "published",
    viewCount: 0,
    likeCount: 0,
    ratingCount: 0,
    saveCount: 0,
    publishedAt: "2026-04-09T12:00:00.000Z"
  },
  {
    id: 2,
    type: "recipe",
    slug: "naga-chicken-curry",
    title: "Naga Chicken Curry",
    description: "A hotter chicken curry with a fuller spice base.",
    intro: "For serious heat.",
    heroSummary: "A rich curry with a long pepper finish.",
    authorName: "FlamingFoodies",
    heatLevel: "inferno",
    cuisineType: "indian",
    prepTimeMinutes: 25,
    cookTimeMinutes: 50,
    totalTimeMinutes: 75,
    servings: 4,
    difficulty: "advanced",
    ingredients: [{ amount: "1", unit: "lb", item: "chicken thighs" }],
    instructions: [{ step: 1, text: "Cook the curry." }],
    tips: ["Use restraint with the naga pickle."],
    variations: ["Try lamb."],
    equipment: ["pot"],
    tags: ["curry", "chicken"],
    featured: false,
    source: "editorial",
    status: "published",
    viewCount: 0,
    likeCount: 0,
    ratingCount: 0,
    saveCount: 0,
    publishedAt: "2026-04-08T12:00:00.000Z"
  },
  {
    id: 3,
    type: "recipe",
    slug: "gochujang-noodles",
    title: "Spicy Korean Gochujang Noodles",
    description: "Fast noodles with heat and sweetness.",
    intro: "Fast noodles.",
    heroSummary: "Weeknight noodles with real bite.",
    authorName: "FlamingFoodies",
    heatLevel: "hot",
    cuisineType: "korean",
    prepTimeMinutes: 10,
    cookTimeMinutes: 12,
    totalTimeMinutes: 22,
    servings: 2,
    difficulty: "beginner",
    ingredients: [{ amount: "8", unit: "oz", item: "noodles" }],
    instructions: [{ step: 1, text: "Cook the noodles." }],
    tips: ["Reserve noodle water."],
    variations: ["Add mushrooms."],
    equipment: ["wok"],
    tags: ["noodles", "quick"],
    featured: false,
    source: "editorial",
    status: "published",
    viewCount: 0,
    likeCount: 0,
    ratingCount: 0,
    saveCount: 0,
    publishedAt: "2026-04-07T12:00:00.000Z"
  }
];

describe("recipe browse helpers", () => {
  it("builds filter options from the recipe archive", () => {
    const options = getRecipeBrowseOptions(recipes);

    expect(options.cuisines).toEqual(["indian", "korean", "thai"]);
    expect(options.heatLevels).toEqual(["medium", "hot", "inferno"]);
    expect(options.difficulties).toEqual(["beginner", "advanced"]);
  });

  it("filters recipes across query and dimensions", () => {
    const filtered = filterRecipes(recipes, {
      query: "curry",
      cuisine: "thai",
      difficulty: "beginner",
      maxMinutes: 45
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.slug).toBe("thai-red-curry");
  });

  it("sorts recipes by heat when requested", () => {
    const sorted = sortRecipes(recipes, "hottest");

    expect(sorted[0]?.slug).toBe("naga-chicken-curry");
    expect(sorted[2]?.slug).toBe("thai-red-curry");
  });

  it("keeps featured sorting fresh by favoring newer featured recipes", () => {
    const now = new Date("2026-04-14T12:00:00.000Z");
    const sorted = sortRecipes(
      [
        {
          ...recipes[0],
          id: 4,
          slug: "older-featured-classic",
          title: "Older Featured Classic",
          saveCount: 2,
          viewCount: 200,
          publishedAt: "2026-01-10T12:00:00.000Z"
        },
        {
          ...recipes[0],
          id: 5,
          slug: "new-featured-arrival",
          title: "New Featured Arrival",
          saveCount: 0,
          viewCount: 20,
          publishedAt: "2026-04-13T12:00:00.000Z"
        }
      ],
      "featured",
      now
    );

    expect(sorted[0]?.slug).toBe("new-featured-arrival");
  });

  it("mixes fresh recipes into the editorial front door", () => {
    const now = new Date("2026-04-14T12:00:00.000Z");
    const archive: Recipe[] = [
      {
        ...recipes[0],
        id: 6,
        slug: "evergreen-curry-winner",
        title: "Evergreen Curry Winner",
        saveCount: 22,
        viewCount: 1800,
        publishedAt: "2026-02-01T12:00:00.000Z"
      },
      {
        ...recipes[1],
        id: 7,
        slug: "classic-noodle-hit",
        title: "Classic Noodle Hit",
        cuisineType: "korean",
        tags: ["noodles", "weeknight"],
        ingredients: [{ amount: "8", unit: "oz", item: "ramen noodles" }],
        saveCount: 18,
        viewCount: 1500,
        publishedAt: "2026-02-04T12:00:00.000Z"
      },
      {
        ...recipes[2],
        id: 8,
        slug: "fresh-chili-crisp-noodles",
        title: "Fresh Chili Crisp Noodles",
        saveCount: 1,
        viewCount: 45,
        publishedAt: "2026-04-13T12:00:00.000Z"
      },
      {
        ...recipes[2],
        id: 9,
        slug: "fresh-taco-skillet",
        title: "Fresh Taco Skillet",
        cuisineType: "mexican",
        tags: ["taco", "skillet"],
        ingredients: [{ amount: "1", unit: "lb", item: "ground beef" }],
        instructions: [{ step: 1, text: "Cook the taco filling." }],
        saveCount: 0,
        viewCount: 20,
        publishedAt: "2026-04-12T12:00:00.000Z"
      }
    ];

    const sections = getRecipeEditorialSections(archive, now);
    const frontDoorSlugs = sections[0]?.items.map((recipe) => recipe.slug) ?? [];

    expect(frontDoorSlugs).toContain("fresh-chili-crisp-noodles");
    expect(frontDoorSlugs).toContain("fresh-taco-skillet");
  });

  it("paginates the archive safely", () => {
    const page = paginateRecipes(recipes, 2, 2);

    expect(page.totalPages).toBe(2);
    expect(page.currentPage).toBe(2);
    expect(page.items).toHaveLength(1);
    expect(page.startResult).toBe(3);
    expect(page.endResult).toBe(3);
  });
});
