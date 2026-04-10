import { describe, expect, it } from "vitest";

import {
  BLOG_POST_PROMPT,
  RECIPE_PROMPT,
  REVIEW_PROMPT,
  getTodayCuisines
} from "@/lib/generation/prompts";
import { getQuizResult } from "@/lib/quiz";
import {
  buildBlogPhotoSearchQueries,
  buildRecipePhotoSearchQueries,
  normalizeGeneratedCommonPayload,
  normalizeGeneratedRecipePayload
} from "@/lib/services/automation";

describe("generation prompts", () => {
  it("creates a recipe prompt with heat and cuisine details", () => {
    const prompt = RECIPE_PROMPT({ cuisine_type: "thai", heat_level: "hot" });
    expect(prompt).toContain("Cuisine: thai");
    expect(prompt).toContain("Heat level: hot");
    expect(prompt).toContain("\"hero_image_query\"");
    expect(prompt).toContain("Write with the voice of a sharp, experienced food editor");
    expect(prompt).toContain("family-table oriented");
  });

  it("creates a hot sauce recipe prompt with featured sauce context", () => {
    const prompt = RECIPE_PROMPT({
      cuisine_type: "mexican",
      heat_level: "medium",
      hot_sauce_focus: {
        product_name: "Habanero Hot Sauce",
        brand: "Yellowbird",
        description: "A bright carrot-forward sauce with citrus and useful heat.",
        heat_level: "hot",
        flavor_notes: ["carrot", "citrus", "peppery"],
        cuisine_origin: "mexican"
      }
    });

    expect(prompt).toContain("This is a featured hot sauce recipe.");
    expect(prompt).toContain("Yellowbird Habanero Hot Sauce");
    expect(prompt).toContain("must appear in the ingredients and in at least one method step");
  });

  it("creates a blog prompt with category details", () => {
    const prompt = BLOG_POST_PROMPT({ category: "culture" });
    expect(prompt).toContain("Topic category: culture");
    expect(prompt).toContain("at least 3 H2 subheadings");
    expect(prompt).toContain("at least 1 short bullet or numbered list");
    expect(prompt).toContain("Write like a strong magazine-style food writer");
    expect(prompt).toContain("family-table oriented");
    expect(prompt).toContain("\"hero_image_query\"");
  });

  it("creates a review prompt with warmer editorial guidance", () => {
    const prompt = REVIEW_PROMPT({ category: "hot-sauce", cuisine_origin: "jamaican", heat_level: "hot" });

    expect(prompt).toContain("warm, generous, and family-table oriented");
    expect(prompt).toContain("what the bottle tastes like");
    expect(prompt).toContain("Avoid macho heat language");
  });

  it("returns requested cuisine count", () => {
    expect(getTodayCuisines(3)).toHaveLength(3);
  });

  it("scores quiz answers into a persona", () => {
    expect(getQuizResult([3, 3, 3, 3, 3])).toBe("reaper-chaser");
  });

  it("normalizes sparse generated recipe payloads before validation", () => {
    const payload = normalizeGeneratedRecipePayload({
      title: "Turkish Spiced Bulgur Pilaf with Mild Pepper Paste",
      description:
        "A comforting Turkish bulgur pilaf infused with mild red pepper paste, aromatic spices, and tender vegetables that delivers gentle warmth without overwhelming the palate.",
      intro:
        "This Turkish-inspired bulgur pilaf keeps the heat soft and rounded, using mild pepper paste, warm spices, and savory vegetables for a deeply comforting bowl.",
      heat_level: "mild",
      cuisine_type: "other",
      prep_time_minutes: 15,
      cook_time_minutes: 25,
      servings: 4,
      difficulty: "beginner",
      ingredients: [
        { amount: "1", unit: "cup", item: "coarse bulgur" },
        { amount: "2", unit: "tbsp", item: "mild red pepper paste" },
        { amount: "1", unit: "", item: "onion", notes: "finely diced" }
      ],
      instructions: [
        { step: 1, text: "Saute the onion in olive oil until soft, then stir in the pepper paste until fragrant." },
        { step: 2, text: "Add the bulgur, stock, and spices, then simmer gently until the grains are tender." },
        { step: 3, text: "Rest briefly, fluff with herbs, and serve warm with yogurt or salad." }
      ],
      tips: ["Rest the pilaf for five minutes so the grains finish absorbing steam."],
      variations: ["Fold in chickpeas for a heartier meal."],
      equipment: ["medium pot"],
      tags: ["turkish"],
      seo_title: "Turkish Spiced Bulgur Pilaf Recipe | FlamingFoodies",
      seo_description:
        "Make a gentle, savory Turkish-style bulgur pilaf with mild pepper paste, aromatic spices, and a softly warming finish.",
      image_alt: "A bowl of Turkish spiced bulgur pilaf with herbs"
    });

    expect(payload.instructions).toHaveLength(3);
    expect(payload.method_steps).toHaveLength(3);
    expect(payload.ingredient_sections?.[0]?.items).toHaveLength(3);
    expect(payload.faqs?.length).toBeGreaterThan(0);
    expect(payload.tags).toContain("spicy");
  });

  it("treats empty optional recipe arrays as missing and backfills them", () => {
    const payload = normalizeGeneratedRecipePayload({
      title: "Georgian Khachapuri with Mild Chili Oil",
      description:
        "Traditional Georgian cheese-filled bread boat topped with a gently spiced chili oil that adds warmth without overwhelming the rich, creamy filling.",
      intro:
        "This softer khachapuri variation keeps the bread rich and comforting while using a restrained chili oil for warmth rather than aggressive heat.",
      heat_level: "mild",
      cuisine_type: "other",
      prep_time_minutes: 30,
      cook_time_minutes: 20,
      servings: 4,
      difficulty: "intermediate",
      ingredients: [
        { amount: "2", unit: "cups", item: "flour" },
        { amount: "1", unit: "cup", item: "mozzarella" }
      ],
      instructions: [
        { step: 1, text: "Mix and knead the dough until smooth, then let it rest until supple." }
      ],
      tips: [],
      variations: [],
      serving_suggestions: [],
      substitutions: [],
      faqs: [],
      equipment: [],
      tags: [],
      seo_title: "Khachapuri with Mild Chili Oil | FlamingFoodies",
      seo_description:
        "Bake Georgian-style khachapuri with a gentle chili oil finish for warmth without overwhelming the rich cheese filling.",
      image_alt: "A Georgian khachapuri with mild chili oil"
    });

    expect(payload.tips.length).toBeGreaterThan(0);
    expect(payload.variations.length).toBeGreaterThan(0);
    expect(payload.serving_suggestions?.length).toBeGreaterThan(0);
    expect(payload.substitutions?.length).toBeGreaterThan(0);
    expect(payload.faqs?.length).toBeGreaterThan(0);
    expect(payload.equipment.length).toBeGreaterThan(0);
    expect(payload.tags).toContain("spicy");
  });

  it("builds photo-first search queries for generated recipes", () => {
    const queries = buildRecipePhotoSearchQueries({
      title: "Calabrian Chili Vodka Rigatoni",
      cuisineType: "italian",
      heroImageQuery: "calabrian chili vodka rigatoni plated"
    });

    expect(queries[0]).toBe("calabrian chili vodka rigatoni plated");
    expect(queries).toContain("Calabrian Chili Vodka Rigatoni");
    expect(queries).toContain("italian Calabrian Chili Vodka Rigatoni");
  });

  it("builds photo-first search queries for generated blog stories", () => {
    const queries = buildBlogPhotoSearchQueries({
      title: "Why Ethiopian Spice Blends Are Having Their Moment Right Now",
      category: "culture",
      cuisineType: "ethiopian",
      heroImageQuery: "ethiopian food spread injera berbere"
    });

    expect(queries[0]).toBe("ethiopian food spread injera berbere");
    expect(queries).toContain("ethiopian spices");
    expect(queries).toContain("ethiopian food");
    expect(queries).toContain("culture ethiopian food");
  });

  it("normalizes human-formatted enum labels before validation", () => {
    const payload = normalizeGeneratedCommonPayload({
      cuisine_type: "Ethiopian",
      cuisine_origin: "Middle Eastern",
      heat_level: "Hot"
    });

    expect(payload.cuisine_type).toBe("ethiopian");
    expect(payload.cuisine_origin).toBe("middle_eastern");
    expect(payload.heat_level).toBe("hot");
  });

  it("maps common cuisine aliases like Sichuan to the supported enum", () => {
    const payload = normalizeGeneratedCommonPayload({
      cuisine_type: "Sichuan"
    });

    expect(payload.cuisine_type).toBe("szechuan");
  });
});
