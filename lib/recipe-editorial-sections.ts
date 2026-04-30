import { sortRecipesByDiscovery } from "@/lib/recipe-browse";
import type { Recipe } from "@/lib/types";

export interface RecipeEditorialSection {
  key: string;
  eyebrow: string;
  title: string;
  description: string;
  items: Recipe[];
}

function normalizeText(value?: string | null) {
  return (value || "").toLowerCase();
}

const primaryIngredientStopTokens = [
  "broth",
  "stock",
  "bouillon",
  "water",
  "oil",
  "vinegar",
  "salt",
  "pepper",
  "paprika",
  "cayenne",
  "oregano",
  "garlic",
  "onion",
  "shallot",
  "ginger",
  "scallion",
  "lemon",
  "lime",
  "sugar",
  "honey",
  "soy sauce",
  "fish sauce",
  "butter",
  "cream",
  "milk",
  "yogurt",
  "rice",
  "pasta",
  "noodle",
  "noodles",
  "tortilla",
  "bread",
  "bun",
  "roll",
  "pickle",
  "slaw",
  "tomato",
  "tomatoes"
] as const;

function buildRecipeIdentityCorpus(recipe: Recipe) {
  return normalizeText(
    [
      recipe.title,
      recipe.description,
      recipe.intro,
      recipe.heroSummary,
      recipe.tags.join(" "),
      recipe.cuisineType,
      recipe.heatLevel
    ].join(" ")
  );
}

function isPrimaryIngredientCandidate(item: string) {
  const normalized = normalizeText(item);

  if (!normalized) {
    return false;
  }

  return !primaryIngredientStopTokens.some((token) => normalized.includes(token));
}

function buildRecipePrimaryIngredientCorpus(recipe: Recipe) {
  const directIngredients = recipe.ingredients.map((ingredient) => ingredient.item);
  const sectionItems =
    recipe.ingredientSections?.flatMap((section) => section.items.map((item) => item.item)) ?? [];

  const uniquePrimaryIngredients = [...new Set([...directIngredients, ...sectionItems])]
    .map((item) => item.trim())
    .filter(isPrimaryIngredientCandidate);

  return normalizeText(uniquePrimaryIngredients.join(" "));
}

type RecipeMatchSource = "identity" | "primary-ingredients";

function hasAnyToken(
  recipe: Recipe,
  tokens: string[],
  sources: RecipeMatchSource[] = ["identity"]
) {
  const corpora = {
    identity: buildRecipeIdentityCorpus(recipe),
    "primary-ingredients": buildRecipePrimaryIngredientCorpus(recipe)
  };

  return tokens.some((token) =>
    sources.some((source) => corpora[source].includes(normalizeText(token)))
  );
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getRecipePublishedTimestamp(recipe: Recipe) {
  const raw = recipe.publishedAt ?? recipe.createdAt;
  if (!raw) {
    return 0;
  }

  const timestamp = new Date(raw).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortRecipesForShowcase(recipes: Recipe[], now = new Date()) {
  return sortRecipesByDiscovery(recipes, now);
}

function sortRecipesByNewest(recipes: Recipe[]) {
  return [...recipes].sort(
    (left, right) => getRecipePublishedTimestamp(right) - getRecipePublishedTimestamp(left)
  );
}

function wasPublishedRecently(recipe: Recipe, now: Date, days = 35) {
  const publishedAt = getRecipePublishedTimestamp(recipe);
  if (!publishedAt) {
    return false;
  }

  return now.getTime() - publishedAt <= days * DAY_IN_MS;
}

function takeUniqueRecipes(recipes: Recipe[], usedIds: Set<number>, limit: number) {
  const picked: Recipe[] = [];

  for (const recipe of recipes) {
    if (usedIds.has(recipe.id)) {
      continue;
    }

    picked.push(recipe);
    usedIds.add(recipe.id);

    if (picked.length === limit) {
      break;
    }
  }

  return picked;
}

export function getRecipeEditorialSections(recipes: Recipe[], now = new Date()) {
  const usedIds = new Set<number>();
  const sortedRecipes = sortRecipesForShowcase(recipes, now);

  const sectionBlueprints: Array<{
    key: string;
    eyebrow: string;
    title: string;
    description: string;
    matchSources?: RecipeMatchSource[];
    matcher: (recipe: Recipe) => boolean;
  }> = [
    {
      key: "big-right-now",
      eyebrow: "Big right now",
      title: "The recipes readers should hit first.",
      description:
        "A front door that mixes proven winners with fresher recipes so the archive does not feel frozen.",
      matcher: () => true
    },
    {
      key: "hall-of-fame-chicken",
      eyebrow: "Hall of fame chicken",
      title: "Chicken recipes with real staying power.",
      description: "The curries, grills, braises, and weeknight wins that keep chicken from going flat.",
      matchSources: ["identity", "primary-ingredients"],
      matcher: (recipe) =>
        hasAnyToken(
          recipe,
          ["chicken", "thigh", "drumstick", "wings", "carnitas chicken"],
          ["identity", "primary-ingredients"]
        )
    },
    {
      key: "noodle-nights",
      eyebrow: "Noodle nights",
      title: "Bowls and noodles with enough bite to feel worth repeating.",
      description: "Fast, slurpable, sauce-driven lanes for nights when a glossy bowl is the answer.",
      matcher: (recipe) =>
        hasAnyToken(recipe, ["noodle", "noodles", "ramen", "udon", "pasta", "spaghetti", "linguine"])
    },
    {
      key: "taco-night",
      eyebrow: "Taco night",
      title: "Tacos, wraps, and hand-held spicy favorites.",
      description: "The recipes that know exactly how people actually eat on a busy weeknight.",
      matcher: (recipe) => hasAnyToken(recipe, ["taco", "tacos", "quesadilla", "wrap", "birria"])
    },
    {
      key: "curry-house",
      eyebrow: "Curry house",
      title: "Curries, stews, and braises for slower comfort.",
      description: "The richer, deeper dishes that make the site feel bigger than one-off heat hits.",
      matcher: (recipe) =>
        hasAnyToken(recipe, ["curry", "stew", "braise", "wat", "masala", "goat", "doro", "korma"])
    }
  ];

  return sectionBlueprints
    .map((section) => {
      if (section.key === "big-right-now") {
        const items = [
          ...takeUniqueRecipes(sortedRecipes, usedIds, 2),
          ...takeUniqueRecipes(
            sortRecipesByNewest(sortedRecipes.filter((recipe) => wasPublishedRecently(recipe, now))),
            usedIds,
            2
          )
        ];

        if (items.length < 4) {
          items.push(...takeUniqueRecipes(sortedRecipes, usedIds, 4 - items.length));
        }

        if (items.length < 2) {
          return null;
        }

        return {
          key: section.key,
          eyebrow: section.eyebrow,
          title: section.title,
          description: section.description,
          items
        } satisfies RecipeEditorialSection;
      }

      const pool = sortRecipesForShowcase(sortedRecipes.filter(section.matcher), now);
      const items = takeUniqueRecipes(pool, usedIds, 3);

      if (items.length < 2) {
        return null;
      }

      return {
        key: section.key,
        eyebrow: section.eyebrow,
        title: section.title,
        description: section.description,
        items
      } satisfies RecipeEditorialSection;
    })
    .filter((section): section is RecipeEditorialSection => Boolean(section));
}
