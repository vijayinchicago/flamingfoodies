import type {
  CuisineType,
  Recipe,
  RecipeIngredientSection,
  RecipeMethodStep,
  RecipeQaIssue,
  RecipeQaReport
} from "@/lib/types";
import {
  isGeneratedRecipeHeroImageUrl,
  isLegacyGeneratedRecipeHeroImageUrl,
  isRecipeHeroFallbackAlt
} from "@/lib/recipe-hero";

const tokenStopwords = new Set([
  "and",
  "with",
  "from",
  "that",
  "this",
  "into",
  "over",
  "your",
  "just",
  "have",
  "recipe",
  "spicy",
  "crispy",
  "creamy",
  "best",
  "easy",
  "quick",
  "style",
  "bowl",
  "bowls",
  "dish",
  "food",
  "weeknight",
  "homemade"
]);

const cuisineSignatures: Partial<Record<CuisineType, string[]>> = {
  jamaican: ["jerk", "allspice", "thyme", "scallion", "lime", "shrimp"],
  szechuan: ["dumpling", "chili", "crisp", "vinegar", "scallion", "sesame"],
  korean: ["gochujang", "sesame", "soy", "scallion", "kimchi", "noodle"],
  thai: ["basil", "fish", "lime", "curry", "coconut", "noodle"],
  mexican: ["tortilla", "consome", "salsa", "cilantro", "lime", "birria"],
  italian: ["rigatoni", "pecorino", "basil", "tomato", "pasta", "vodka"],
  cajun: ["cajun", "rice", "salmon", "honey", "yogurt"],
  american: ["sandwich", "chicken", "pickle", "bun", "burger", "slaw"]
};

const preReviewedRecipeSlugs = new Set([
  "birria-quesatacos-with-arbol-salsa",
  "nashville-hot-chicken-sandwiches",
  "spicy-korean-gochujang-noodles",
  "smoky-habanero-smash-burgers",
  "thai-drunken-noodles-birds-eye-chili",
  "jamaican-jerk-shrimp-skewers",
  "szechuan-chili-crisp-dumpling-bowls",
  "cajun-hot-honey-salmon-rice-bowls",
  "calabrian-chili-vodka-rigatoni",
  "peri-peri-roast-chicken-traybake",
  "green-curry-coconut-meatballs"
]);

type RecipeQaCandidate = Pick<
  Recipe,
  | "slug"
  | "title"
  | "description"
  | "intro"
  | "heroSummary"
  | "cuisineType"
  | "ingredientSections"
  | "ingredients"
  | "methodSteps"
  | "instructions"
  | "makeAheadNotes"
  | "storageNotes"
  | "reheatNotes"
  | "servingSuggestions"
  | "substitutions"
  | "faqs"
  | "equipment"
  | "tags"
  | "imageUrl"
  | "imageAlt"
  | "heroImageReviewed"
  | "cuisineQaReviewed"
  | "source"
>;

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]+/g, " ");
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !tokenStopwords.has(token));
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function buildTextCorpus(recipe: RecipeQaCandidate) {
  const ingredientText = (recipe.ingredientSections ?? [])
    .flatMap((section) =>
      section.items.map((item) => `${item.item} ${item.notes || ""}`.trim())
    )
    .join(" ");
  const methodText = (recipe.methodSteps ?? [])
    .map((step) => `${step.title} ${step.body} ${step.cue || ""} ${step.tip || ""}`.trim())
    .join(" ");

  return [
    recipe.title,
    recipe.description,
    recipe.intro || "",
    recipe.heroSummary || "",
    ingredientText,
    methodText,
    (recipe.tags ?? []).join(" ")
  ]
    .filter(Boolean)
    .join(" ");
}

function createIssue(
  severity: "blocker" | "warning",
  code: string,
  message: string
): RecipeQaIssue {
  return { severity, code, message };
}

function getImageKeywordOverlap(recipe: RecipeQaCandidate) {
  const dishTokens = unique([
    ...tokenize(recipe.title),
    ...tokenize(recipe.description),
    ...(cuisineSignatures[recipe.cuisineType] ?? [])
  ]);
  const imageTokens = tokenize(recipe.imageAlt || "");

  return dishTokens.filter((token) =>
    imageTokens.some(
      (imageToken) =>
        imageToken === token ||
        imageToken.startsWith(token) ||
        token.startsWith(imageToken)
    )
  );
}

function getCuisineMatchCount(recipe: RecipeQaCandidate) {
  const signature = cuisineSignatures[recipe.cuisineType] ?? [];
  const corpus = normalizeText(buildTextCorpus(recipe));

  return signature.filter((token) => corpus.includes(token)).length;
}

export function getRecipeManualReviewState(
  recipe: Pick<Recipe, "slug" | "heroImageReviewed" | "cuisineQaReviewed" | "qaNotes">
) {
  const autoReviewed = preReviewedRecipeSlugs.has(recipe.slug);

  return {
    heroImageReviewed: recipe.heroImageReviewed ?? autoReviewed,
    cuisineQaReviewed: recipe.cuisineQaReviewed ?? autoReviewed,
    qaNotes:
      recipe.qaNotes ??
      (autoReviewed
        ? "Editorial QA reviewed for cuisine fit, hero image accuracy, and recipe-detail completeness."
        : undefined)
  };
}

export function buildRecipeQaReport(recipe: RecipeQaCandidate): RecipeQaReport {
  const blockers: RecipeQaIssue[] = [];
  const warnings: RecipeQaIssue[] = [];
  const ingredientSections = recipe.ingredientSections ?? [];
  const methodSteps = recipe.methodSteps ?? [];
  const servingSuggestions = recipe.servingSuggestions ?? [];
  const faqs = recipe.faqs ?? [];
  const imageKeywordOverlap = getImageKeywordOverlap(recipe);
  const cuisineMatchCount = getCuisineMatchCount(recipe);

  if (!recipe.imageUrl) {
    blockers.push(
      createIssue("blocker", "missing-hero-image", "Add a hero image before publishing.")
    );
  }

  if (!recipe.imageAlt) {
    blockers.push(
      createIssue(
        "blocker",
        "missing-hero-alt",
        "Add descriptive alt text for the hero image before publishing."
      )
    );
  } else if (!imageKeywordOverlap.length) {
    blockers.push(
      createIssue(
        "blocker",
        "hero-alt-mismatch",
        "Hero image alt text does not clearly match the dish or cuisine keywords."
      )
    );
  }

  if (!recipe.heroImageReviewed) {
    blockers.push(
      createIssue(
        "blocker",
        "hero-review-required",
        "Manually review and confirm the hero image before publishing."
      )
    );
  }

  if (!recipe.cuisineQaReviewed) {
    blockers.push(
      createIssue(
        "blocker",
        "cuisine-review-required",
        "Cuisine QA signoff is required before publishing."
      )
    );
  }

  if (!recipe.heroSummary) {
    warnings.push(
      createIssue(
        "warning",
        "missing-hero-summary",
        "Add a stronger hero summary so the page opens with a clear editorial payoff."
      )
    );
  }

  if (isLegacyGeneratedRecipeHeroImageUrl(recipe.imageUrl)) {
    blockers.push(
      createIssue(
        "blocker",
        "legacy-generated-hero",
        "Replace the legacy text-only hero fallback with the new recipe hero image before publishing."
      )
    );
  }

  if (isRecipeHeroFallbackAlt(recipe.imageAlt)) {
    warnings.push(
      createIssue(
        "warning",
        "generic-hero-alt",
        "Replace the generic fallback alt text with a dish-specific hero description."
      )
    );
  }

  if (isGeneratedRecipeHeroImageUrl(recipe.imageUrl)) {
    warnings.push(
      createIssue(
        "warning",
        "generated-hero-card",
        "This recipe is using the generated recipe hero illustration. Upload or confirm a stronger dish image when available."
      )
    );
  }

  if (ingredientSections.length < 2) {
    warnings.push(
      createIssue(
        "warning",
        "low-ingredient-structure",
        "Group ingredients into at least two sections for a better shopping and cook flow."
      )
    );
  }

  if (methodSteps.length < 4) {
    warnings.push(
      createIssue(
        "warning",
        "low-method-depth",
        "Add at least four structured method steps so the cooking flow feels premium."
      )
    );
  }

  if (!methodSteps.some((step) => step.durationMinutes)) {
    warnings.push(
      createIssue(
        "warning",
        "missing-step-timers",
        "Add at least one timed method step so cook mode has real pacing guidance."
      )
    );
  }

  if (!methodSteps.some((step) => step.imageUrl)) {
    warnings.push(
      createIssue(
        "warning",
        "missing-step-images",
        "Add a step image to the method so the page feels more visual and trustworthy."
      )
    );
  }

  if (!recipe.makeAheadNotes) {
    warnings.push(
      createIssue(
        "warning",
        "missing-make-ahead",
        "Add make-ahead guidance so the page helps with planning, not just cooking."
      )
    );
  }

  if (!recipe.storageNotes || !recipe.reheatNotes) {
    warnings.push(
      createIssue(
        "warning",
        "missing-storage-reheat",
        "Add both storage and reheat notes so leftovers are fully covered."
      )
    );
  }

  if (servingSuggestions.length < 2) {
    warnings.push(
      createIssue(
        "warning",
        "thin-serving-guidance",
        "Add more serving suggestions so the page lands like a complete meal guide."
      )
    );
  }

  if (faqs.length < 2) {
    warnings.push(
      createIssue(
        "warning",
        "thin-faqs",
        "Add at least two meaningful FAQs to cover repeat reader questions."
      )
    );
  }

  if (cuisineMatchCount < 2 && recipe.cuisineType !== "other") {
    warnings.push(
      createIssue(
        "warning",
        "weak-cuisine-signals",
        "The ingredient and method copy does not strongly reinforce the selected cuisine yet."
      )
    );
  }

  const score = Math.max(0, 100 - blockers.length * 18 - warnings.length * 5);
  const status = blockers.length ? "fail" : warnings.length ? "warn" : "pass";

  return {
    status,
    score,
    blockers,
    warnings
  };
}

export function getRecipeQaPublishError(report: RecipeQaReport) {
  if (!report.blockers.length) {
    return null;
  }

  return report.blockers[0]?.message || "Recipe QA blockers must be resolved before publishing.";
}
