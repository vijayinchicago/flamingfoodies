import {
  KITCHEN_GEAR_KEYS,
  PANTRY_HEAT_KEYS,
  getAffiliateLinkEntries,
  type AffiliateLinkEntry
} from "@/lib/affiliates";
import type { CuisineType, HeatLevel, Recipe, Review } from "@/lib/types";

const stopwords = new Set([
  "about",
  "after",
  "again",
  "along",
  "built",
  "cook",
  "cooks",
  "dish",
  "fast",
  "from",
  "good",
  "into",
  "just",
  "like",
  "make",
  "more",
  "most",
  "need",
  "over",
  "real",
  "rich",
  "same",
  "side",
  "some",
  "than",
  "that",
  "their",
  "them",
  "there",
  "these",
  "they",
  "this",
  "with",
  "your"
]);

const cuisineSignals: Partial<Record<CuisineType, string[]>> = {
  mexican: ["taco", "tacos", "birria", "salsa", "quesa", "quesataco", "adobo"],
  korean: ["korean", "gochujang", "kimchi", "ramyun", "bulgogi"],
  jamaican: ["jerk", "scotch", "bonnet", "allspice", "caribbean"],
  caribbean: ["jerk", "scotch", "bonnet", "plantain", "caribbean"],
  thai: ["thai", "curry", "fish sauce", "basil"],
  szechuan: ["szechuan", "sichuan", "peppercorn", "dumpling", "chili crisp"],
  chinese: ["dumpling", "noodle", "chili crisp", "soy"],
  italian: ["calabrian", "vodka", "rigatoni", "pasta"],
  cajun: ["cajun", "blackened", "smash", "hot honey"],
  american: ["burger", "wings", "sandwich", "fried chicken"],
  filipino: ["adobo", "sisig", "calamansi", "suka", "garlic"],
  greek: ["feta", "oregano", "lemon", "olive", "gyro"],
  turkish: ["kebab", "sumac", "yogurt", "aleppo", "doner"],
  brazilian: ["malagueta", "moqueca", "farofa", "feijoada", "lime"],
  nigerian: ["suya", "jollof", "yaji", "pepper soup", "plantain"],
  malaysian: ["sambal", "laksa", "belacan", "nasi", "coconut"]
};

const affiliateSignals: Record<string, string[]> = {
  "amazon-cast-iron-skillet": ["burger", "smash", "sandwich", "cajun", "sear", "char"],
  "amazon-carbon-steel-wok": ["noodle", "noodles", "dumpling", "fried rice", "stir fry", "wok"],
  "amazon-molcajete": ["taco", "tacos", "salsa", "birria", "mexican", "charred"],
  "amazon-fermentation-jar-kit": ["ferment", "fermented", "sauce", "mash"],
  "amazon-gochujang-paste": ["gochujang", "korean", "ramyun"],
  "amazon-calabrian-chili-paste": ["calabrian", "vodka", "rigatoni", "italian", "pasta"],
  "amazon-berbere-blend": ["berbere", "ethiopian", "moroccan", "west african", "stew"],
  "amazon-chili-crisp": ["chili crisp", "dumpling", "szechuan", "sichuan", "noodle", "fried egg"],
  "mike-hot-honey-original": ["hot honey", "wings", "fried chicken", "salmon", "pizza", "sandwich"]
};

const heatRank: Record<HeatLevel, number> = {
  mild: 1,
  medium: 2,
  hot: 3,
  inferno: 4,
  reaper: 5
};

export interface RecipeSaucePairing {
  review: Review;
  reason: string;
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !stopwords.has(token));
}

function getRecipeSignals(recipe: Recipe) {
  const explicitSignals = cuisineSignals[recipe.cuisineType] ?? [];
  const ingredientSignals = recipe.ingredients.flatMap((ingredient) =>
    tokenize(`${ingredient.item} ${ingredient.notes ?? ""}`)
  );

  return Array.from(
    new Set([
      ...tokenize(recipe.title),
      ...tokenize(recipe.description),
      ...tokenize(recipe.intro ?? ""),
      ...recipe.tags.flatMap((tag) => tokenize(tag)),
      ...explicitSignals.flatMap((signal) => tokenize(signal)),
      ...ingredientSignals
    ])
  );
}

function countSignalMatches(signals: string[], haystack: string) {
  return signals.reduce((count, signal) => (haystack.includes(signal) ? count + 1 : count), 0);
}

function getHeatCloseness(left?: HeatLevel, right?: HeatLevel) {
  if (!left || !right) return 0;

  const distance = Math.abs(heatRank[left] - heatRank[right]);
  return Math.max(0, 3 - distance);
}

function getReviewHaystack(review: Review) {
  return [
    review.title,
    review.productName,
    review.brand,
    review.description,
    review.content,
    review.category,
    review.flavorNotes.join(" "),
    review.pros.join(" ")
  ]
    .join(" ")
    .toLowerCase();
}

function getAffiliateHaystack(entry: AffiliateLinkEntry) {
  return [
    entry.product,
    entry.badge,
    entry.description,
    entry.bestFor,
    entry.category,
    (entry.cuisines ?? []).join(" ")
  ]
    .join(" ")
    .toLowerCase();
}

function scoreRecipeSaucePairing(recipe: Recipe, review: Review) {
  const haystack = getReviewHaystack(review);
  const signals = getRecipeSignals(recipe);
  let score = review.recommended ? 8 : 3;

  if (/gift|subscription|seed/i.test(review.category)) {
    score -= 8;
  }

  if (review.cuisineOrigin && review.cuisineOrigin === recipe.cuisineType) {
    score += 6;
  }

  if (review.category.includes("hot-sauce")) {
    score += 4;
  }

  if (review.category.includes("pantry")) {
    score += 2;
  }

  score += getHeatCloseness(recipe.heatLevel, review.heatLevel);
  score += countSignalMatches(signals, haystack) * 2;
  score += Math.round(review.rating);

  return score;
}

function scoreRecipeAffiliateEntry(
  recipe: Recipe,
  entry: AffiliateLinkEntry,
  type: "pantry" | "gear"
) {
  const haystack = getAffiliateHaystack(entry);
  const signals = getRecipeSignals(recipe);
  const signalHaystack = signals.join(" ");
  let score = 2;

  if (type === "pantry" && entry.category === "ingredient") {
    score += 5;
  }

  if (type === "gear" && entry.category === "gear") {
    score += 5;
  }

  if (entry.cuisines?.includes(recipe.cuisineType)) {
    score += 6;
  }

  if (entry.heatLevels?.includes(recipe.heatLevel)) {
    score += 2;
  }

  score += countSignalMatches(signals, haystack) * 2;
  score += countSignalMatches(affiliateSignals[entry.key] ?? [], signalHaystack) * 3;

  return score;
}

function buildPairingReason(recipe: Recipe, review: Review) {
  if (review.cuisineOrigin && review.cuisineOrigin === recipe.cuisineType) {
    return `This bottle fits the ${recipe.cuisineType.replace(/_/g, " ")} lane of the recipe and keeps the heat profile pointed in the same direction.`;
  }

  if (review.heatLevel && heatRank[review.heatLevel] >= heatRank[recipe.heatLevel]) {
    return "It brings enough heat to cut through the richer bites without flattening the rest of the dish.";
  }

  return `Use this when you want a brighter finishing hit next to the deeper flavors already built into ${recipe.title.toLowerCase()}.`;
}

function scoreRelatedRecipe(currentRecipe: Recipe, recipe: Recipe) {
  const currentSignals = new Set(getRecipeSignals(currentRecipe));
  const candidateSignals = getRecipeSignals(recipe);
  let score = 1;

  if (recipe.cuisineType === currentRecipe.cuisineType) {
    score += 5;
  }

  score += getHeatCloseness(currentRecipe.heatLevel, recipe.heatLevel);
  score += candidateSignals.reduce(
    (count, signal) => (currentSignals.has(signal) ? count + 1 : count),
    0
  );

  return score;
}

export function getRecipeSaucePairings(
  recipe: Recipe,
  reviews: Review[],
  limit = 2
): RecipeSaucePairing[] {
  return reviews
    .filter((review) => review.status === "published" && review.slug !== recipe.slug)
    .map((review) => ({
      review,
      reason: buildPairingReason(recipe, review),
      score: scoreRecipeSaucePairing(recipe, review)
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ score: _score, ...entry }) => entry);
}

export function getRecipePantryRecommendations(recipe: Recipe, limit = 3) {
  return getAffiliateLinkEntries(PANTRY_HEAT_KEYS)
    .map((entry) => ({
      ...entry,
      score: scoreRecipeAffiliateEntry(recipe, entry, "pantry")
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ score: _score, ...entry }) => entry);
}

export function getRecipeGearRecommendations(recipe: Recipe, limit = 2) {
  return getAffiliateLinkEntries(KITCHEN_GEAR_KEYS)
    .map((entry) => ({
      ...entry,
      score: scoreRecipeAffiliateEntry(recipe, entry, "gear")
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ score: _score, ...entry }) => entry);
}

export function getRelatedRecipesForRecipe(
  currentRecipe: Recipe,
  recipes: Recipe[],
  limit = 3
) {
  return recipes
    .filter(
      (recipe) =>
        recipe.slug !== currentRecipe.slug && recipe.status === "published"
    )
    .map((recipe) => ({
      recipe,
      score: scoreRelatedRecipe(currentRecipe, recipe)
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ score: _score, recipe }) => recipe);
}
