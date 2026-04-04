import { describe, expect, it } from "vitest";

import {
  buildRecipeHeroImageAlt,
  getRecipeHeroFields,
  isGeneratedHeroCardImageUrl
} from "@/lib/recipe-hero";

describe("recipe hero fallbacks", () => {
  it("builds a branded fallback hero image when a recipe is missing one", () => {
    const hero = getRecipeHeroFields({
      title: "Test Kitchen Chili Crisp Noodles",
      cuisineType: "szechuan",
      heatLevel: "hot"
    });

    expect(hero.imageUrl).toContain("/api/og?");
    expect(hero.imageUrl).toContain("Test+Kitchen+Chili+Crisp+Noodles");
    expect(hero.usesGeneratedHeroCard).toBe(true);
    expect(hero.imageAlt).toBe(buildRecipeHeroImageAlt("Test Kitchen Chili Crisp Noodles"));
  });

  it("preserves an existing recipe image while backfilling alt text", () => {
    const hero = getRecipeHeroFields({
      title: "Peri-Peri Roast Chicken Traybake",
      cuisineType: "other",
      heatLevel: "medium",
      imageUrl: "https://images.unsplash.com/photo-123",
      imageAlt: ""
    });

    expect(hero.imageUrl).toBe("https://images.unsplash.com/photo-123");
    expect(hero.usesGeneratedHeroCard).toBe(false);
    expect(hero.imageAlt).toBe(
      buildRecipeHeroImageAlt("Peri-Peri Roast Chicken Traybake")
    );
  });

  it("recognizes generated hero card URLs", () => {
    expect(
      isGeneratedHeroCardImageUrl("https://flamingfoodies.com/api/og?title=Test")
    ).toBe(true);
    expect(isGeneratedHeroCardImageUrl("https://images.unsplash.com/photo-123")).toBe(false);
  });
});
