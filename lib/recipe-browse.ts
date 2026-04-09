import type { CuisineType, HeatLevel, Recipe } from "@/lib/types";

export type RecipeSortKey = "featured" | "newest" | "quickest" | "hottest";

export const RECIPE_SORT_OPTIONS: Array<{ key: RecipeSortKey; label: string }> = [
  { key: "featured", label: "Featured first" },
  { key: "newest", label: "Newest first" },
  { key: "quickest", label: "Quickest first" },
  { key: "hottest", label: "Hottest first" }
];

export const RECIPE_TIME_OPTIONS = [
  { key: "all", label: "Any time", maxMinutes: null },
  { key: "30", label: "30 minutes or less", maxMinutes: 30 },
  { key: "45", label: "45 minutes or less", maxMinutes: 45 },
  { key: "60", label: "60 minutes or less", maxMinutes: 60 },
  { key: "90", label: "90 minutes or less", maxMinutes: 90 }
] as const;

type RecipeDifficulty = Recipe["difficulty"];

export type RecipeBrowseFilters = {
  query?: string;
  cuisine?: CuisineType | "all";
  heat?: HeatLevel | "all";
  difficulty?: RecipeDifficulty | "all";
  maxMinutes?: number | null;
  sort?: RecipeSortKey;
};

const HEAT_ORDER: Record<HeatLevel, number> = {
  mild: 1,
  medium: 2,
  hot: 3,
  inferno: 4,
  reaper: 5
};

const DIFFICULTY_ORDER: Record<RecipeDifficulty, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3
};

function normalizeText(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function getRecipeSearchCorpus(recipe: Recipe) {
  return normalizeText(
    [
      recipe.title,
      recipe.description,
      recipe.intro,
      recipe.heroSummary,
      recipe.cuisineType,
      recipe.heatLevel,
      recipe.difficulty,
      ...recipe.tags,
      ...recipe.ingredients.map((ingredient) => ingredient.item),
      ...recipe.equipment
    ].join(" ")
  );
}

export function getRecipeBrowseOptions(recipes: Recipe[]) {
  const cuisines = Array.from(new Set(recipes.map((recipe) => recipe.cuisineType))).sort();
  const heatLevels = Array.from(new Set(recipes.map((recipe) => recipe.heatLevel))).sort(
    (left, right) => HEAT_ORDER[left] - HEAT_ORDER[right]
  );
  const difficulties = Array.from(new Set(recipes.map((recipe) => recipe.difficulty))).sort(
    (left, right) => DIFFICULTY_ORDER[left] - DIFFICULTY_ORDER[right]
  );

  return {
    cuisines,
    heatLevels,
    difficulties
  };
}

export function filterRecipes(recipes: Recipe[], filters: RecipeBrowseFilters) {
  const query = normalizeText(filters.query);

  return recipes.filter((recipe) => {
    if (query && !getRecipeSearchCorpus(recipe).includes(query)) {
      return false;
    }

    if (filters.cuisine && filters.cuisine !== "all" && recipe.cuisineType !== filters.cuisine) {
      return false;
    }

    if (filters.heat && filters.heat !== "all" && recipe.heatLevel !== filters.heat) {
      return false;
    }

    if (
      filters.difficulty &&
      filters.difficulty !== "all" &&
      recipe.difficulty !== filters.difficulty
    ) {
      return false;
    }

    if (typeof filters.maxMinutes === "number" && recipe.totalTimeMinutes > filters.maxMinutes) {
      return false;
    }

    return true;
  });
}

export function sortRecipes(recipes: Recipe[], sort: RecipeSortKey = "featured") {
  const sorted = [...recipes];

  sorted.sort((left, right) => {
    if (sort === "quickest") {
      return left.totalTimeMinutes - right.totalTimeMinutes;
    }

    if (sort === "hottest") {
      return (
        HEAT_ORDER[right.heatLevel] - HEAT_ORDER[left.heatLevel] ||
        right.totalTimeMinutes - left.totalTimeMinutes
      );
    }

    if (sort === "newest") {
      return (right.publishedAt || "").localeCompare(left.publishedAt || "");
    }

    if (left.featured !== right.featured) {
      return left.featured ? -1 : 1;
    }

    return (right.publishedAt || "").localeCompare(left.publishedAt || "");
  });

  return sorted;
}

export function paginateRecipes(recipes: Recipe[], page: number, perPage = 12) {
  const totalResults = recipes.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / perPage));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;

  return {
    items: recipes.slice(startIndex, endIndex),
    totalResults,
    totalPages,
    currentPage,
    startResult: totalResults === 0 ? 0 : startIndex + 1,
    endResult: Math.min(endIndex, totalResults)
  };
}
