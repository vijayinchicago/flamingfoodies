import { describe, expect, it } from "vitest";

import { buildRecipeQaReport, getRecipeManualReviewState } from "@/lib/recipe-qa";
import type { Recipe } from "@/lib/types";

const baseRecipe: Recipe = {
  id: 1,
  type: "recipe",
  slug: "test-recipe",
  title: "Szechuan Chili Crisp Dumpling Bowls",
  description: "A spicy dumpling bowl with sesame sauce and sharp vinegar.",
  intro: "Fast, spicy, and built around dumplings and chili crisp.",
  heroSummary: "A fast dumpling bowl with crunch and heat.",
  authorName: "FlamingFoodies Team",
  heatLevel: "hot",
  cuisineType: "szechuan",
  prepTimeMinutes: 10,
  cookTimeMinutes: 12,
  totalTimeMinutes: 22,
  activeTimeMinutes: 18,
  servings: 4,
  difficulty: "beginner",
  ingredients: [
    { amount: "1", unit: "bag", item: "frozen dumplings" },
    { amount: "2", unit: "tbsp", item: "chili crisp" }
  ],
  ingredientSections: [
    {
      title: "For the sauce",
      items: [
        { amount: "2", unit: "tbsp", item: "sesame paste" },
        { amount: "1", unit: "tbsp", item: "black vinegar" }
      ]
    },
    {
      title: "For the bowl",
      items: [
        { amount: "1", unit: "bag", item: "frozen dumplings" },
        { amount: "2", unit: "tbsp", item: "chili crisp" }
      ]
    }
  ],
  instructions: [
    { step: 1, text: "Whisk the sauce." },
    { step: 2, text: "Cook the dumplings." },
    { step: 3, text: "Finish the bowl." }
  ],
  methodSteps: [
    {
      step: 1,
      title: "Whisk a sauce with body and bite",
      body: "Whisk sesame paste, black vinegar, and chili crisp until smooth.",
      durationMinutes: 4,
      ingredientRefs: ["sesame paste", "black vinegar", "chili crisp"]
    },
    {
      step: 2,
      title: "Cook the dumplings",
      body: "Boil the dumplings until tender and hot through.",
      cue: "The dumplings should feel plush and hot all the way through.",
      durationMinutes: 8,
      ingredientRefs: ["frozen dumplings"]
    },
    {
      step: 3,
      title: "Coat and finish the bowl",
      body: "Toss the dumplings with sauce and finish with extra chili crisp.",
      cue: "The dumplings should look glossy rather than dry.",
      durationMinutes: 3,
      ingredientRefs: ["frozen dumplings", "chili crisp"],
      imageUrl: "https://example.com/dumplings.jpg",
      imageAlt: "Dumplings plated with chopsticks"
    },
    {
      step: 4,
      title: "Serve right away",
      body: "Finish with scallions and peanuts for crunch.",
      durationMinutes: 2,
      ingredientRefs: ["scallions", "peanuts"]
    }
  ],
  tips: ["Keep a splash of dumpling water nearby."],
  variations: ["Add bok choy for greens."],
  makeAheadNotes: "Whisk the sauce ahead.",
  storageNotes: "Store the sauce separate from the dumplings.",
  reheatNotes: "Reheat the dumplings gently and reassemble.",
  servingSuggestions: ["Serve with extra chili crisp.", "Add a cucumber salad."],
  substitutions: ["Use tahini if sesame paste is unavailable."],
  faqs: [
    {
      question: "Can I make it less spicy?",
      answer: "Yes, use less chili crisp."
    },
    {
      question: "What dumplings work best?",
      answer: "Any good frozen dumplings you like."
    }
  ],
  equipment: ["pot", "mixing bowl"],
  imageUrl: "https://example.com/dumplings.jpg",
  imageAlt: "Dumplings on a wooden plate with chopsticks",
  heroImageReviewed: true,
  cuisineQaReviewed: true,
  featured: true,
  source: "editorial",
  status: "published",
  tags: ["dumplings", "szechuan", "chili crisp"],
  viewCount: 0,
  likeCount: 0,
  ratingCount: 0,
  saveCount: 0
};

describe("recipe QA", () => {
  it("flags blockers when image review and alt checks are missing", () => {
    const report = buildRecipeQaReport({
      ...baseRecipe,
      imageUrl: undefined,
      imageAlt: "",
      heroImageReviewed: false,
      cuisineQaReviewed: false
    });

    expect(report.status).toBe("fail");
    expect(report.blockers.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "missing-hero-image",
        "missing-hero-alt",
        "hero-review-required",
        "cuisine-review-required"
      ])
    );
  });

  it("passes a reviewed flagship-style recipe", () => {
    const report = buildRecipeQaReport(baseRecipe);

    expect(report.status).toBe("pass");
    expect(report.blockers).toHaveLength(0);
  });

  it("blocks legacy recipe hero cards and warns on generic alt text", () => {
    const report = buildRecipeQaReport({
      ...baseRecipe,
      imageUrl:
        "https://flamingfoodies.com/api/og?title=Szechuan+Chili+Crisp+Dumpling+Bowls&eyebrow=Szechuan+Recipe&subtitle=Hot+heat",
      imageAlt: "FlamingFoodies recipe card for Szechuan Chili Crisp Dumpling Bowls"
    });

    expect(report.blockers.map((issue) => issue.code)).toContain("legacy-generated-hero");
    expect(report.warnings.map((issue) => issue.code)).toContain("generic-hero-alt");
  });

  it("warns when recipe copy sounds formulaic in the opener", () => {
    const report = buildRecipeQaReport({
      ...baseRecipe,
      description:
        "A bowl packed with flavor and perfect for busy weeknights, with heat that takes things to the next level.",
      intro:
        "This recipe is packed with flavor and comes together fast, making it perfect for busy weeknights.",
      heroSummary:
        "The result is a bowl you'll love, with heat in all the right ways."
    });

    expect(report.warnings.map((issue) => issue.code)).toContain("formulaic-recipe-voice");
  });

  it("auto-approves the curated flagship recipe set for sync imports", () => {
    expect(
      getRecipeManualReviewState({
        slug: "nashville-hot-chicken-sandwiches",
        heroImageReviewed: undefined,
        cuisineQaReviewed: undefined,
        qaNotes: undefined
      })
    ).toMatchObject({
      heroImageReviewed: true,
      cuisineQaReviewed: true
    });
  });
});
