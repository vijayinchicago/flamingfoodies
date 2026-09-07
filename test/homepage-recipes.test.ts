import { describe, expect, it } from "vitest";

import {
  getHomepageRecipeSchedule,
  selectHomepageRecipes
} from "@/lib/services/content";
import { sampleRecipes } from "@/lib/sample-data";
import type { Recipe } from "@/lib/types";

function makeRecipe(id: number, totalTimeMinutes: number, featured = false): Recipe {
  const base = sampleRecipes[id % sampleRecipes.length] ?? sampleRecipes[0];

  return {
    ...base,
    id: 9000 + id,
    slug: `rotation-recipe-${id}`,
    title: `Rotation Recipe ${id}`,
    featured,
    totalTimeMinutes,
    publishedAt: new Date(Date.UTC(2026, 8, 1, 12, id)).toISOString()
  };
}

describe("homepage recipe rotation", () => {
  it("automatically leads with a weekday-friendly recipe, even when it is not featured", () => {
    const archive = [
      makeRecipe(1, 30),
      makeRecipe(2, 40),
      makeRecipe(3, 75, true),
      makeRecipe(4, 90, true)
    ];

    const selected = selectHomepageRecipes(archive, 4, 42, "weekday");

    expect(selected[0]?.totalTimeMinutes).toBeLessThanOrEqual(45);
    expect(selected.some((recipe) => recipe.featured === false)).toBe(true);
  });

  it("favors quick recipes on weekdays and longer cooks on weekends", () => {
    const archive = [
      ...Array.from({ length: 10 }, (_, index) => makeRecipe(index + 1, 25 + index * 2)),
      ...Array.from({ length: 10 }, (_, index) => makeRecipe(index + 21, 60 + index * 5))
    ];

    const weekday = selectHomepageRecipes(archive, 7, 100, "weekday");
    const weekend = selectHomepageRecipes(archive, 7, 100, "weekend");

    expect(weekday[0]?.totalTimeMinutes).toBeLessThanOrEqual(45);
    expect(
      weekday.filter((recipe) => recipe.totalTimeMinutes <= 45).length
    ).toBeGreaterThanOrEqual(4);
    expect(weekend[0]?.totalTimeMinutes).toBeGreaterThan(45);
    expect(
      weekend.filter((recipe) => recipe.totalTimeMinutes > 45).length
    ).toBeGreaterThanOrEqual(4);
  });

  it("changes the full recipe mix when the daily seed changes", () => {
    const archive = Array.from({ length: 20 }, (_, index) =>
      makeRecipe(index + 1, 25 + index)
    );

    const firstDay = selectHomepageRecipes(archive, 7, 100, "weekday").map(
      (recipe) => recipe.id
    );
    const secondDay = selectHomepageRecipes(archive, 7, 101, "weekday").map(
      (recipe) => recipe.id
    );

    expect(firstDay).not.toEqual(secondDay);
  });

  it("rotates through more than the old eight-recipe candidate pool", () => {
    const archive = Array.from({ length: 30 }, (_, index) =>
      makeRecipe(index + 1, 25 + (index % 10))
    );
    const seenIds = new Set<number>();

    for (let seed = 100; seed < 116; seed += 1) {
      for (const recipe of selectHomepageRecipes(archive, 7, seed, "weekday")) {
        seenIds.add(recipe.id);
      }
    }

    expect(seenIds.size).toBeGreaterThan(8);
  });

  it("uses Eastern time to switch into the weekend schedule", () => {
    expect(getHomepageRecipeSchedule(new Date("2026-09-05T03:30:00.000Z"))).toBe(
      "weekday"
    );
    expect(getHomepageRecipeSchedule(new Date("2026-09-05T04:30:00.000Z"))).toBe(
      "weekend"
    );
  });
});
