import { describe, expect, it, vi } from "vitest";

import {
  BLOG_POST_PROMPT,
  RECIPE_PROMPT,
  REVIEW_PROMPT,
  getTodayCuisines
} from "@/lib/generation/prompts";
import { getQuizResult } from "@/lib/quiz";
import {
  GENERATION_JOB_TIMEOUT_MINUTES,
  buildTimedOutGenerationJobMessage,
  expireTimedOutGenerationJobs,
  shouldRetryGenerationFailure
} from "@/lib/services/generation-jobs";
import {
  buildBlogPhotoSearchQueries,
  buildReviewPhotoSearchQueries,
  buildRecipePhotoSearchQueries,
  getAgentQaAutomationDecision,
  mergeAgentQaReviewForAutonomousDraft,
  normalizeGeneratedCommonPayload,
  normalizeGeneratedRecipePayload,
  pickBalancedHotSauceFocus,
  planBalancedCuisines,
  planBalancedHeatLevels,
  planBalancedRecipeLanes,
  resolveAutonomousPublishAt,
  shouldAutonomousPublish
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

  it("adds recipe lane guidance when requested", () => {
    const prompt = RECIPE_PROMPT({
      cuisine_type: "american",
      heat_level: "hot",
      recipe_lane: "burger_sandwich"
    });

    expect(prompt).toContain("Recipe lane: Burger Sandwich");
    expect(prompt).toContain("Lane guidance:");
    expect(prompt).toContain("handheld, sandwich, burger");
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
    expect(prompt).toContain("\"hero_image_query\"");
  });

  it("locks a review prompt to a specific hot sauce when one is selected", () => {
    const prompt = REVIEW_PROMPT({
      category: "hot-sauce",
      cuisine_origin: "mexican",
      heat_level: "hot",
      product_focus: {
        product_name: "Los Calientes Rojo",
        brand: "Heatonist",
        description: "A smoky tomato-rich red with repeat-use appeal.",
        heat_level: "hot",
        flavor_notes: ["smoky", "tomato", "savory"],
        cuisine_origin: "mexican",
        affiliate_url: "https://heatonist.com/products/los-calientes-rojo"
      }
    });

    expect(prompt).toContain("Review this exact product");
    expect(prompt).toContain("Heatonist Los Calientes Rojo");
    expect(prompt).toContain("product_name and brand must match the named product exactly");
  });

  it("returns requested cuisine count", () => {
    expect(getTodayCuisines(3)).toHaveLength(3);
  });

  it("balances cuisine plans away from recently overused lanes", () => {
    const plan = planBalancedCuisines({
      qty: 3,
      type: "recipe",
      history: [
        {
          type: "recipe",
          cuisine: "jamaican",
          createdAt: "2026-04-10T12:00:00Z",
          profile: "default",
          hotSauceSlug: null
        },
        {
          type: "recipe",
          cuisine: "jamaican",
          createdAt: "2026-04-09T12:00:00Z",
          profile: "default",
          hotSauceSlug: null
        },
        {
          type: "blog_post",
          cuisine: "jamaican",
          createdAt: "2026-04-08T12:00:00Z",
          profile: "default",
          hotSauceSlug: null
        },
        {
          type: "review",
          cuisine: "jamaican",
          createdAt: "2026-04-07T12:00:00Z",
          profile: "default",
          hotSauceSlug: null
        },
        {
          type: "recipe",
          cuisine: "mexican",
          createdAt: "2026-04-06T12:00:00Z",
          profile: "default",
          hotSauceSlug: null
        }
      ],
      date: new Date("2026-04-11T12:00:00Z"),
      rng: () => 0
    });

    expect(plan).toHaveLength(3);
    expect(new Set(plan).size).toBe(3);
    expect(plan[0]).not.toBe("jamaican");
  });

  it("rotates through the full heat ladder instead of locking to the first three slots", () => {
    const plan = planBalancedHeatLevels({
      qty: 5,
      type: "recipe",
      history: [],
      date: new Date("2026-04-14T12:00:00Z"),
      rng: () => 0
    });

    expect(plan).toHaveLength(5);
    expect(new Set(plan).size).toBe(5);
    expect(plan).toContain("inferno");
    expect(plan).toContain("reaper");
  });

  it("mixes recipe lanes so generation does not keep landing in one format", () => {
    const plan = planBalancedRecipeLanes({
      qty: 4,
      history: [],
      date: new Date("2026-04-14T12:00:00Z"),
      rng: () => 0
    });

    expect(plan).toHaveLength(4);
    expect(new Set(plan).size).toBe(4);
    expect(plan).toContain("burger_sandwich");
    expect(plan).toContain("weeknight");
  });

  it("avoids reusing the same hot sauce too aggressively when alternatives exist", () => {
    const pick = pickBalancedHotSauceFocus(
      [
        {
          slug: "yellowbird-habanero",
          productName: "Habanero Hot Sauce",
          brand: "Yellowbird",
          description: "Bright carrot-forward heat.",
          heatLevel: "hot",
          flavorNotes: ["carrot", "citrus"],
          cuisineOrigin: "mexican",
          featured: true
        },
        {
          slug: "queen-majesty-scotch-bonnet-ginger",
          productName: "Scotch Bonnet and Ginger",
          brand: "Queen Majesty",
          description: "Bright, gingery, and fruit-forward.",
          heatLevel: "hot",
          flavorNotes: ["ginger", "fruit"],
          cuisineOrigin: "caribbean",
          featured: true
        }
      ],
      [
        {
          type: "recipe",
          cuisine: "mexican",
          createdAt: "2026-04-10T12:00:00Z",
          profile: "hot_sauce_recipe",
          hotSauceSlug: "yellowbird-habanero"
        },
        {
          type: "recipe",
          cuisine: "mexican",
          createdAt: "2026-04-03T12:00:00Z",
          profile: "hot_sauce_recipe",
          hotSauceSlug: "yellowbird-habanero"
        }
      ],
      new Set<string>(),
      0,
      new Date("2026-04-11T12:00:00Z")
    );

    expect(pick?.slug).toBe("queen-majesty-scotch-bonnet-ginger");
  });

  it("rotates review generation away from the last hot sauce that was already used", () => {
    const pick = pickBalancedHotSauceFocus(
      [
        {
          slug: "yellowbird-habanero",
          productName: "Habanero Hot Sauce",
          brand: "Yellowbird",
          description: "Bright carrot-forward heat.",
          heatLevel: "hot",
          flavorNotes: ["carrot", "citrus"],
          cuisineOrigin: "mexican",
          featured: true
        },
        {
          slug: "los-calientes-rojo",
          productName: "Los Calientes Rojo",
          brand: "Heatonist",
          description: "Smoky tomato-rich heat.",
          heatLevel: "hot",
          flavorNotes: ["smoky", "tomato"],
          cuisineOrigin: "mexican",
          featured: true
        }
      ],
      [
        {
          type: "review",
          cuisine: "mexican",
          createdAt: "2026-04-13T12:00:00Z",
          profile: "default",
          hotSauceSlug: "yellowbird-habanero"
        }
      ],
      new Set<string>(),
      0,
      new Date("2026-04-14T12:00:00Z"),
      "review"
    );

    expect(pick?.slug).toBe("los-calientes-rojo");
  });

  it("treats revise verdicts as automation-pass guidance instead of hard failure", () => {
    expect(
      getAgentQaAutomationDecision({
        verdict: "revise",
        blockers: ["Needs stronger sourcing note"]
      })
    ).toEqual({
      passesAutomation: true,
      demoteBlockersToWarnings: true
    });

    expect(
      getAgentQaAutomationDecision({
        verdict: "fail",
        blockers: ["Cuisine is not credible"]
      })
    ).toEqual({
      passesAutomation: false,
      demoteBlockersToWarnings: false
    });
  });

  it("demotes revise blockers to warnings for autonomous draft QA display", () => {
    const report = mergeAgentQaReviewForAutonomousDraft(
      {
        status: "pass",
        score: 100,
        blockers: [],
        warnings: []
      },
      {
        verdict: "revise",
        blockers: ["Tighten the intro"],
        warnings: ["Add one better serving suggestion"]
      }
    );

    expect(report.blockers).toHaveLength(0);
    expect(report.warnings.map((issue) => issue.message)).toContain("Tighten the intro");
    expect(report.warnings.map((issue) => issue.message)).toContain(
      "Add one better serving suggestion"
    );
  });

  it("allows autonomous publish when hard QA passes and the editorial verdict is revise", () => {
    const eligible = shouldAutonomousPublish({
      agentReview: {
        verdict: "revise",
        blockers: ["Needs stronger sourcing note"]
      },
      baseReport: {
        status: "warn",
        score: 90,
        blockers: [],
        warnings: []
      },
      readinessChecks: [true, true],
      scoreThreshold: 84
    });

    expect(eligible).toBe(true);
  });

  it("still blocks autonomous publish when the editorial verdict is fail", () => {
    const eligible = shouldAutonomousPublish({
      agentReview: {
        verdict: "fail",
        blockers: ["Cuisine is not credible"]
      },
      baseReport: {
        status: "warn",
        score: 95,
        blockers: [],
        warnings: []
      },
      readinessChecks: [true, true],
      scoreThreshold: 84
    });

    expect(eligible).toBe(false);
  });

  it("catches up overdue autonomous publish times during reevaluation", () => {
    const publishAt = resolveAutonomousPublishAt({
      createdAt: "2026-04-10T12:00:00Z",
      delayHours: 4,
      now: new Date("2026-04-14T12:00:00Z")
    });

    expect(publishAt).toBe("2026-04-14T12:00:00.000Z");
  });

  it("preserves the original delay window for recent drafts during reevaluation", () => {
    const publishAt = resolveAutonomousPublishAt({
      createdAt: "2026-04-14T09:30:00Z",
      delayHours: 4,
      now: new Date("2026-04-14T12:00:00Z")
    });

    expect(publishAt).toBe("2026-04-14T13:30:00.000Z");
  });

  it("retries malformed recipe payload failures once but not unrelated errors", () => {
    expect(
      shouldRetryGenerationFailure(
        "recipe",
        "Draft generation returned an invalid recipe payload: Required"
      )
    ).toBe(true);
    expect(
      shouldRetryGenerationFailure("recipe", "Draft generation returned an empty recipe payload.")
    ).toBe(true);
    expect(
      shouldRetryGenerationFailure("recipe", "Draft generation hit the Anthropic max_tokens limit before completing JSON.")
    ).toBe(false);
    expect(
      shouldRetryGenerationFailure("blog_post", "Draft generation returned an invalid blog_post payload: Required")
    ).toBe(false);
  });

  it("marks stale generating jobs as failed with a timeout message", async () => {
    const select = vi.fn().mockResolvedValue({
      data: [{ id: 12 }, { id: 13 }],
      error: null
    });
    const query = {
      eq: vi.fn(),
      not: vi.fn(),
      lt: vi.fn(),
      in: vi.fn(),
      select
    } as Record<string, ReturnType<typeof vi.fn>>;
    query.eq.mockReturnValue(query);
    query.not.mockReturnValue(query);
    query.lt.mockReturnValue(query);
    query.in.mockReturnValue(query);

    const update = vi.fn().mockReturnValue(query);
    const supabase = {
      from: vi.fn().mockReturnValue({
        update
      })
    } as any;
    const now = new Date("2026-04-15T12:00:00Z");

    const result = await expireTimedOutGenerationJobs(supabase, {
      jobTypes: ["recipe"],
      now
    });

    expect(update).toHaveBeenCalledWith({
      status: "failed",
      error_message: buildTimedOutGenerationJobMessage(GENERATION_JOB_TIMEOUT_MINUTES),
      completed_at: now.toISOString()
    });
    expect(query.eq).toHaveBeenCalledWith("status", "generating");
    expect(query.not).toHaveBeenCalledWith("started_at", "is", null);
    expect(query.lt).toHaveBeenCalledWith("started_at", "2026-04-15T11:15:00.000Z");
    expect(query.in).toHaveBeenCalledWith("job_type", ["recipe"]);
    expect(select).toHaveBeenCalledWith("id");
    expect(result).toEqual({
      count: 2,
      timeoutMinutes: GENERATION_JOB_TIMEOUT_MINUTES,
      cutoffIso: "2026-04-15T11:15:00.000Z"
    });
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

  it("backfills missing top-level recipe fields before validation", () => {
    const payload = normalizeGeneratedRecipePayload({
      title: "Yellowbird Habanero Carnitas Tacos",
      description:
        "Slow-cooked pork shoulder gets a fiery finish with Yellowbird Habanero sauce, delivering serious heat balanced by bright carrot and citrus notes for rich, juicy tacos.",
      heat_level: "hot",
      cuisine_type: "mexican",
      ingredients: [
        { amount: "3", unit: "lb", item: "pork shoulder" },
        { amount: "1/3", unit: "cup", item: "Yellowbird Habanero Hot Sauce" },
        { amount: "12", unit: "", item: "corn tortillas" }
      ],
      instructions: [
        {
          step: 1,
          text: "Season the pork shoulder well, then braise it gently until tender enough to shred with a spoon."
        },
        {
          step: 2,
          text: "Toss the shredded pork with Yellowbird Habanero sauce and pan-roast the edges until sticky and caramelized."
        },
        {
          step: 3,
          text: "Warm the tortillas, pile on the carnitas, and finish with onion, cilantro, and lime."
        }
      ],
      tips: ["Crisp the pork in batches so the edges brown instead of steaming."],
      variations: ["Swap in chicken thighs if you want a faster version."],
      equipment: ["Dutch oven"],
      tags: ["tacos", "pork"]
    });

    expect(payload.intro).toContain("Yellowbird Habanero");
    expect(payload.prep_time_minutes).toBe(20);
    expect(payload.cook_time_minutes).toBe(35);
    expect(payload.servings).toBe(4);
    expect(payload.difficulty).toBe("intermediate");
    expect(payload.seo_title).toContain("Yellowbird Habanero Carnitas Tacos");
    expect(payload.seo_description).toContain("Yellowbird Habanero");
    expect(payload.image_alt).toContain("Yellowbird Habanero Carnitas Tacos");
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

  it("builds exact-product search queries for generated reviews", () => {
    const queries = buildReviewPhotoSearchQueries({
      productName: "Yellowbird Habanero Hot Sauce",
      brand: "Yellowbird",
      category: "hot-sauce",
      cuisineOrigin: "mexican",
      heroImageQuery: "Yellowbird Habanero Hot Sauce bottle"
    });

    expect(queries[0]).toBe("Yellowbird Habanero Hot Sauce bottle");
    expect(queries).toContain("Yellowbird Habanero Hot Sauce hot sauce bottle");
    expect(queries).toContain("Yellowbird hot sauce bottle");
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

  it("maps newer cuisine aliases into the supported taxonomy", () => {
    const payload = normalizeGeneratedCommonPayload({
      cuisine_type: "Philippine",
      cuisine_origin: "Malaysia"
    });

    expect(payload.cuisine_type).toBe("filipino");
    expect(payload.cuisine_origin).toBe("malaysian");
  });

  it("maps common cuisine aliases like Sichuan to the supported enum", () => {
    const payload = normalizeGeneratedCommonPayload({
      cuisine_type: "Sichuan"
    });

    expect(payload.cuisine_type).toBe("szechuan");
  });
});
