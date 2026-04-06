import type { CuisineType, HeatLevel, Recipe } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

function formatHeroLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function normalizeSentence(value?: string | null, maxLength = 160) {
  const trimmed = value?.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.length <= maxLength) {
    return trimmed.replace(/[.?!]+$/, "");
  }

  return trimmed.slice(0, maxLength - 1).trimEnd().replace(/[,\-:;]+$/, "");
}

function stripRecipeCardPrefix(value?: string | null) {
  return value?.replace(/^FlamingFoodies recipe card for\s+/i, "").trim();
}

export function buildRecipeHeroImageUrl({
  title,
  cuisineType,
  heatLevel,
  description,
  heroSummary
}: {
  title: string;
  cuisineType?: CuisineType;
  heatLevel?: HeatLevel;
  description?: string | null;
  heroSummary?: string | null;
}) {
  const params = new URLSearchParams({
    title,
    cuisine: cuisineType ? formatHeroLabel(cuisineType) : "Recipe",
    heat: heatLevel ? formatHeroLabel(heatLevel) : "Flavor First",
    subtitle:
      normalizeSentence(heroSummary, 80) ||
      normalizeSentence(description, 80) ||
      "Flavor-first spicy cooking"
  });

  return absoluteUrl(`/api/recipe-hero?${params.toString()}`);
}

export function buildRecipeHeroImageAlt({
  title,
  description,
  heroSummary,
  cuisineType
}: {
  title: string;
  description?: string | null;
  heroSummary?: string | null;
  cuisineType?: CuisineType;
}) {
  const detail =
    normalizeSentence(heroSummary, 120) ||
    normalizeSentence(description, 120) ||
    undefined;
  const cuisine =
    cuisineType && cuisineType !== "other" ? `${formatHeroLabel(cuisineType)} ` : "";

  const value = detail
    ? `${cuisine}${title} plated hero image showing ${detail.charAt(0).toLowerCase() + detail.slice(1)}.`
    : `${cuisine}${title} plated hero image.`;

  return value.length <= 180
    ? value
    : `${value.slice(0, 177).trimEnd().replace(/[,\-:;]+$/, "")}...`;
}

export function isLegacyGeneratedRecipeHeroImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return false;

  return imageUrl.includes("/api/og?");
}

export function isGeneratedRecipeHeroImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return false;

  return imageUrl.includes("/api/recipe-hero?");
}

export function isRecipeHeroFallbackAlt(imageAlt?: string | null) {
  if (!imageAlt) return false;

  return /flamingfoodies recipe card for/i.test(imageAlt);
}

export function getRecipeHeroFields(
  recipe:
    | Pick<
        Recipe,
        | "title"
        | "cuisineType"
        | "heatLevel"
        | "description"
        | "heroSummary"
        | "imageUrl"
        | "imageAlt"
      >
    | {
        title: string;
        cuisineType?: CuisineType;
        heatLevel?: HeatLevel;
        description?: string | null;
        heroSummary?: string | null;
        imageUrl?: string | null;
        imageAlt?: string | null;
      }
) {
  const shouldUseGeneratedHero =
    !recipe.imageUrl || isLegacyGeneratedRecipeHeroImageUrl(recipe.imageUrl);
  const imageUrl: string = shouldUseGeneratedHero
    ? buildRecipeHeroImageUrl({
        title: recipe.title,
        cuisineType: recipe.cuisineType,
        heatLevel: recipe.heatLevel,
        description: recipe.description,
        heroSummary: recipe.heroSummary
      })
    : (recipe.imageUrl as string);
  const imageAlt: string =
    !recipe.imageAlt || isRecipeHeroFallbackAlt(recipe.imageAlt)
      ? buildRecipeHeroImageAlt({
          title: stripRecipeCardPrefix(recipe.title) || recipe.title,
          description: recipe.description,
          heroSummary: recipe.heroSummary,
          cuisineType: recipe.cuisineType
        })
      : recipe.imageAlt;

  return {
    imageUrl,
    imageAlt,
    usesGeneratedHeroCard: isGeneratedRecipeHeroImageUrl(imageUrl),
    usesLegacyGeneratedHeroCard: isLegacyGeneratedRecipeHeroImageUrl(recipe.imageUrl)
  };
}
