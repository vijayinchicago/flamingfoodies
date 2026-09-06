import { describe, expect, it } from "vitest";

import { selectHomepageRecipes } from "@/lib/services/content";
import { sampleRecipes } from "@/lib/sample-data";
import type { Recipe } from "@/lib/types";

describe("homepage recipe rotation", () => {
  it("leads with the newest recipe and includes non-featured recipes", () => {
    const newest: Recipe = {
      ...sampleRecipes[0],
      id: 9001,
      slug: "brand-new-recipe",
      title: "Brand New Recipe",
      featured: false,
      publishedAt: "2026-09-06T12:00:00.000Z"
    };
    const olderFeatured: Recipe = {
      ...sampleRecipes[0],
      id: 9002,
      slug: "older-featured-recipe",
      title: "Older Featured Recipe",
      featured: true,
      publishedAt: "2026-03-01T12:00:00.000Z"
    };

    const selected = selectHomepageRecipes(
      [olderFeatured, newest, ...sampleRecipes.slice(1, 8)],
      6,
      42
    );

    expect(selected[0]?.slug).toBe("brand-new-recipe");
    expect(selected.some((recipe) => recipe.featured === false)).toBe(true);
  });

  it("changes the supporting mix when the daily seed changes", () => {
    const archive = sampleRecipes.slice(0, 12).map((recipe, index) => ({
      ...recipe,
      featured: index < 2
    }));

    const firstDay = selectHomepageRecipes(archive, 6, 100).map((recipe) => recipe.id);
    const secondDay = selectHomepageRecipes(archive, 6, 101).map((recipe) => recipe.id);

    expect(firstDay[0]).toBe(secondDay[0]);
    expect(firstDay.slice(1)).not.toEqual(secondDay.slice(1));
  });
});
