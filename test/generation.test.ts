import { describe, expect, it } from "vitest";

import { BLOG_POST_PROMPT, RECIPE_PROMPT, getTodayCuisines } from "@/lib/generation/prompts";
import { getQuizResult } from "@/lib/quiz";

describe("generation prompts", () => {
  it("creates a recipe prompt with heat and cuisine details", () => {
    const prompt = RECIPE_PROMPT({ cuisine_type: "thai", heat_level: "hot" });
    expect(prompt).toContain("Cuisine: thai");
    expect(prompt).toContain("Heat level: hot");
  });

  it("creates a blog prompt with category details", () => {
    const prompt = BLOG_POST_PROMPT({ category: "culture" });
    expect(prompt).toContain("Topic category: culture");
  });

  it("returns requested cuisine count", () => {
    expect(getTodayCuisines(3)).toHaveLength(3);
  });

  it("scores quiz answers into a persona", () => {
    expect(getQuizResult([3, 3, 3, 3, 3])).toBe("reaper-chaser");
  });
});
