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

function buildRecipeCorpus(recipe: Recipe) {
  const sectionItems =
    recipe.ingredientSections?.flatMap((section) => section.items.map((item) => item.item)) ?? [];
  const methodCopy =
    recipe.methodSteps?.map((step) => `${step.title} ${step.body}`) ?? [];

  return normalizeText(
    [
      recipe.title,
      recipe.description,
      recipe.intro,
      recipe.heroSummary,
      recipe.tags.join(" "),
      recipe.ingredients.map((ingredient) => ingredient.item).join(" "),
      sectionItems.join(" "),
      recipe.instructions.map((step) => step.text).join(" "),
      methodCopy.join(" "),
      recipe.cuisineType,
      recipe.heatLevel
    ].join(" ")
  );
}

function hasAnyToken(recipe: Recipe, tokens: string[]) {
  const corpus = buildRecipeCorpus(recipe);
  return tokens.some((token) => corpus.includes(token));
}

function sortRecipesForShowcase(recipes: Recipe[]) {
  return [...recipes].sort((left, right) => {
    if ((left.featured ?? false) !== (right.featured ?? false)) {
      return left.featured ? -1 : 1;
    }

    if ((left.saveCount ?? 0) !== (right.saveCount ?? 0)) {
      return (right.saveCount ?? 0) - (left.saveCount ?? 0);
    }

    if ((left.viewCount ?? 0) !== (right.viewCount ?? 0)) {
      return (right.viewCount ?? 0) - (left.viewCount ?? 0);
    }

    return (right.publishedAt || "").localeCompare(left.publishedAt || "");
  });
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

export function getRecipeEditorialSections(recipes: Recipe[]) {
  const usedIds = new Set<number>();
  const sortedRecipes = sortRecipesForShowcase(recipes);

  const sectionBlueprints: Array<{
    key: string;
    eyebrow: string;
    title: string;
    description: string;
    matcher: (recipe: Recipe) => boolean;
  }> = [
    {
      key: "big-right-now",
      eyebrow: "Big right now",
      title: "The recipes readers should hit first.",
      description: "A quick front door for the meals already pulling attention, saves, and repeat clicks.",
      matcher: () => true
    },
    {
      key: "hall-of-fame-chicken",
      eyebrow: "Hall of fame chicken",
      title: "Chicken recipes with real staying power.",
      description: "The curries, grills, braises, and weeknight wins that keep chicken from going flat.",
      matcher: (recipe) =>
        hasAnyToken(recipe, ["chicken", "thigh", "drumstick", "wings", "carnitas chicken"])
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
      matcher: (recipe) =>
        hasAnyToken(recipe, ["taco", "tacos", "quesadilla", "wrap", "birria", "carnitas"])
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
      const pool =
        section.key === "big-right-now"
          ? sortedRecipes
          : sortRecipesForShowcase(sortedRecipes.filter(section.matcher));
      const items = takeUniqueRecipes(pool, usedIds, section.key === "big-right-now" ? 4 : 3);

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
