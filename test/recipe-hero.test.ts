import { describe, expect, it } from "vitest";

import {
  buildRecipeHeroImageAlt,
  getRecipeHeroFields,
  isGeneratedRecipeHeroImageUrl,
  isLegacyGeneratedRecipeHeroImageUrl,
  isRecipeHeroFallbackAlt
} from "@/lib/recipe-hero";

describe("recipe hero fallbacks", () => {
  it("builds a recipe-specific fallback hero image when a recipe is missing one", () => {
    const hero = getRecipeHeroFields({
      title: "Test Kitchen Chili Crisp Noodles",
      cuisineType: "szechuan",
      heatLevel: "hot",
      description: "Chewy noodles tossed with chili crisp, sesame, and scallions."
    });

    expect(hero.imageUrl).toContain("/api/recipe-hero?");
    expect(hero.imageUrl).toContain("Test+Kitchen+Chili+Crisp+Noodles");
    expect(hero.usesGeneratedHeroCard).toBe(true);
    expect(hero.imageAlt).toBe(
      buildRecipeHeroImageAlt({
        title: "Test Kitchen Chili Crisp Noodles",
        description: "Chewy noodles tossed with chili crisp, sesame, and scallions.",
        cuisineType: "szechuan"
      })
    );
  });

  it("preserves an existing recipe image while backfilling alt text", () => {
    const hero = getRecipeHeroFields({
      title: "Peri-Peri Roast Chicken Traybake",
      cuisineType: "other",
      heatLevel: "medium",
      imageUrl: "https://images.unsplash.com/photo-123",
      imageAlt: "",
      description: "Roast chicken with peppers and a lemony peri-peri marinade."
    });

    expect(hero.imageUrl).toBe("https://images.unsplash.com/photo-123");
    expect(hero.usesGeneratedHeroCard).toBe(false);
    expect(hero.imageAlt).toBe(
      buildRecipeHeroImageAlt({
        title: "Peri-Peri Roast Chicken Traybake",
        description: "Roast chicken with peppers and a lemony peri-peri marinade."
      })
    );
  });

  it("upgrades the legacy generic recipe card url and alt text", () => {
    const hero = getRecipeHeroFields({
      title: "Georgian Khachapuri with Mild Adjika",
      cuisineType: "other",
      heatLevel: "mild",
      description: "A Georgian cheese bread boat with egg and a mild red pepper spread.",
      imageUrl: "https://flamingfoodies.com/api/og?title=Khachapuri",
      imageAlt: "FlamingFoodies recipe card for Georgian Khachapuri with Mild Adjika"
    });

    expect(hero.imageUrl).toContain("/api/recipe-hero?");
    expect(hero.usesLegacyGeneratedHeroCard).toBe(true);
    expect(isRecipeHeroFallbackAlt(hero.imageAlt)).toBe(false);
  });

  it("recognizes generated hero image urls correctly", () => {
    expect(
      isGeneratedRecipeHeroImageUrl("https://flamingfoodies.com/api/recipe-hero?title=Test")
    ).toBe(true);
    expect(
      isLegacyGeneratedRecipeHeroImageUrl("https://flamingfoodies.com/api/og?title=Test")
    ).toBe(true);
    expect(isGeneratedRecipeHeroImageUrl("https://images.unsplash.com/photo-123")).toBe(false);
  });
});
