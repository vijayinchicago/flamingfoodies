import type {
  Recipe,
  RecipeFaq,
  RecipeIngredient,
  RecipeIngredientSection,
  RecipeMethodStep
} from "@/lib/types";

const stepStopwords = new Set([
  "and",
  "with",
  "from",
  "then",
  "into",
  "until",
  "your",
  "this",
  "that",
  "just",
  "have",
  "make",
  "keep",
  "more",
  "them",
  "very",
  "over",
  "side",
  "about",
  "need",
  "best"
]);

export function splitInstructionText(text: string) {
  const normalized = text.trim();
  const commaIndex = normalized.indexOf(",");
  const sentenceIndex = normalized.indexOf(".");
  const splitIndex = [commaIndex, sentenceIndex]
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0];

  if (splitIndex === undefined) {
    return {
      title: normalized.replace(/\.$/, ""),
      body: ""
    };
  }

  const title = normalized.slice(0, splitIndex).replace(/[,.]\s*$/, "").trim();
  const body = normalized.slice(splitIndex + 1).trim();

  return {
    title: title || normalized.replace(/\.$/, ""),
    body
  };
}

function normalizeIngredient(ingredient: RecipeIngredient): RecipeIngredient {
  return {
    amount: ingredient.amount || "",
    unit: ingredient.unit || "",
    item: ingredient.item || ingredient.amount || "",
    notes: ingredient.notes || undefined
  };
}

export function getRecipeIngredientSections(
  recipe: Pick<Recipe, "ingredientSections" | "ingredients">
) {
  if (recipe.ingredientSections?.length) {
    return recipe.ingredientSections
      .map((section, index) => ({
        title: section.title?.trim() || `Section ${index + 1}`,
        items: (section.items ?? []).map(normalizeIngredient).filter((item) => item.item)
      }))
      .filter((section) => section.items.length);
  }

  return recipe.ingredients?.length
    ? [
        {
          title: "For the recipe",
          items: recipe.ingredients.map(normalizeIngredient).filter((item) => item.item)
        }
      ]
    : [];
}

function normalizeMethodStep(step: RecipeMethodStep, index: number): RecipeMethodStep {
  return {
    step: index + 1,
    title: step.title?.trim() || `Step ${index + 1}`,
    body: step.body?.trim() || "",
    tip: step.tip?.trim() || undefined,
    cue: step.cue?.trim() || undefined,
    durationMinutes:
      typeof step.durationMinutes === "number" && step.durationMinutes > 0
        ? step.durationMinutes
        : undefined,
    ingredientRefs: step.ingredientRefs?.map((item) => item.trim()).filter(Boolean) || undefined,
    imageUrl: step.imageUrl?.trim() || undefined,
    imageAlt: step.imageAlt?.trim() || undefined
  };
}

export function getRecipeMethodSteps(recipe: Pick<Recipe, "methodSteps" | "instructions">) {
  if (recipe.methodSteps?.length) {
    return recipe.methodSteps
      .map((step, index) => normalizeMethodStep(step, index))
      .filter((step) => step.title || step.body);
  }

  return (recipe.instructions ?? []).map((instruction, index) => {
    const splitInstruction = splitInstructionText(instruction.text);

    return {
      step: index + 1,
      title: splitInstruction.title,
      body: splitInstruction.body || instruction.text,
      tip: instruction.tip,
      cue: instruction.tip,
      durationMinutes: undefined,
      ingredientRefs: undefined,
      imageUrl: undefined,
      imageAlt: undefined
    } satisfies RecipeMethodStep;
  });
}

export function getRecipeHeroSummary(
  recipe: Pick<Recipe, "heroSummary" | "intro" | "description">
) {
  return (
    recipe.heroSummary?.trim() ||
    recipe.intro?.trim() ||
    recipe.description.trim()
  );
}

export function getRecipeSupportList(value?: string[]) {
  return (value ?? []).map((item) => item.trim()).filter(Boolean);
}

export function getRecipeFaqs(recipe: Pick<Recipe, "faqs">): RecipeFaq[] {
  return (recipe.faqs ?? [])
    .map((faq) => ({
      question: faq.question?.trim() || "",
      answer: faq.answer?.trim() || ""
    }))
    .filter((faq) => faq.question && faq.answer);
}

function normalizeForMatch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]+/g, " ");
}

function getIngredientTokens(value: string) {
  return normalizeForMatch(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !stepStopwords.has(token));
}

export function getStepIngredientMatches(
  sections: RecipeIngredientSection[],
  step: Pick<RecipeMethodStep, "title" | "body" | "tip" | "ingredientRefs">
) {
  const ingredients = sections.flatMap((section) => section.items);

  if (step.ingredientRefs?.length) {
    const wanted = step.ingredientRefs.map((item) => normalizeForMatch(item));
    return ingredients.filter((ingredient) =>
      wanted.some((reference) =>
        normalizeForMatch(`${ingredient.item} ${ingredient.notes || ""}`).includes(reference)
      )
    );
  }

  const haystack = normalizeForMatch(`${step.title} ${step.body} ${step.tip || ""}`);

  return ingredients.filter((ingredient) => {
    const ingredientTokens = getIngredientTokens(`${ingredient.item} ${ingredient.notes || ""}`);
    return ingredientTokens.some((token) => haystack.includes(token));
  });
}

function parseMixedFraction(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return null;

  if (/^\d+\s+\d+\/\d+$/.test(trimmed)) {
    const [whole, fraction] = trimmed.split(/\s+/);
    const [numerator, denominator] = fraction.split("/").map(Number);
    return Number(whole) + numerator / denominator;
  }

  if (/^\d+\/\d+$/.test(trimmed)) {
    const [numerator, denominator] = trimmed.split("/").map(Number);
    return numerator / denominator;
  }

  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatScaledQuantity(value: number) {
  const rounded = Math.round(value * 100) / 100;
  const whole = Math.floor(rounded);
  const remainder = rounded - whole;
  const fractions = [
    { decimal: 0.125, text: "1/8" },
    { decimal: 0.25, text: "1/4" },
    { decimal: 1 / 3, text: "1/3" },
    { decimal: 0.5, text: "1/2" },
    { decimal: 2 / 3, text: "2/3" },
    { decimal: 0.75, text: "3/4" }
  ];

  if (Math.abs(rounded - Math.round(rounded)) < 0.02) {
    return String(Math.round(rounded));
  }

  const nearestFraction = fractions.find(
    (fraction) => Math.abs(remainder - fraction.decimal) < 0.04
  );

  if (nearestFraction) {
    if (whole === 0) return nearestFraction.text;
    return `${whole} ${nearestFraction.text}`;
  }

  return rounded.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

export function scaleIngredientAmount(amount: string, factor: number) {
  if (!amount || factor === 1) {
    return amount;
  }

  const scaled = parseMixedFraction(amount);
  if (scaled === null) {
    return amount;
  }

  return formatScaledQuantity(scaled * factor);
}
