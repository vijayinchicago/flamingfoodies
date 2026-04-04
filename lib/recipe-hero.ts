import type { HeatLevel, CuisineType, Recipe } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

function formatHeroLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function buildRecipeHeroImageUrl({
  title,
  cuisineType,
  heatLevel
}: {
  title: string;
  cuisineType?: CuisineType;
  heatLevel?: HeatLevel;
}) {
  const params = new URLSearchParams({
    title,
    eyebrow: cuisineType ? `${formatHeroLabel(cuisineType)} Recipe` : "FlamingFoodies Recipe",
    subtitle: heatLevel
      ? `${formatHeroLabel(heatLevel)} heat`
      : "Flavor-first spicy cooking"
  });

  return absoluteUrl(`/api/og?${params.toString()}`);
}

export function buildRecipeHeroImageAlt(title: string) {
  return `FlamingFoodies recipe card for ${title}`;
}

export function isGeneratedHeroCardImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return false;

  return imageUrl.includes("/api/og?");
}

export function getRecipeHeroFields(
  recipe: Pick<Recipe, "title" | "cuisineType" | "heatLevel" | "imageUrl" | "imageAlt"> | {
    title: string;
    cuisineType?: CuisineType;
    heatLevel?: HeatLevel;
    imageUrl?: string | null;
    imageAlt?: string | null;
  }
) {
  const imageUrl =
    recipe.imageUrl ||
    buildRecipeHeroImageUrl({
      title: recipe.title,
      cuisineType: recipe.cuisineType,
      heatLevel: recipe.heatLevel
    });
  const imageAlt = recipe.imageAlt || buildRecipeHeroImageAlt(recipe.title);

  return {
    imageUrl,
    imageAlt,
    usesGeneratedHeroCard: isGeneratedHeroCardImageUrl(imageUrl)
  };
}
