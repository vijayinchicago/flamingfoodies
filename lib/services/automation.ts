import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import {
  buildBlogHeroImageAlt,
  buildBlogHeroImageUrl,
  isGeneratedBlogHeroImageUrl
} from "@/lib/blog-hero";
import { buildBlogQaReport } from "@/lib/blog-qa";
import { env, flags } from "@/lib/env";
import {
  BLOG_POST_PROMPT,
  CUISINE_ROTATION,
  RECIPE_PROMPT,
  REVIEW_PROMPT
} from "@/lib/generation/prompts";
import {
  buildRecipeHeroImageAlt,
  buildRecipeHeroImageUrl,
  isGeneratedRecipeHeroImageUrl
} from "@/lib/recipe-hero";
import { buildRecipeQaReport } from "@/lib/recipe-qa";
import {
  getRecipeFaqs,
  getRecipeHeroSummary,
  getRecipeIngredientSections,
  getRecipeMethodSteps,
  splitInstructionText
} from "@/lib/recipes";
import { buildReviewQaReport } from "@/lib/review-qa";
import { buildReviewHeroImageUrl, hasTrustedReviewProductImage } from "@/lib/review-hero";
import {
  sampleBlogPosts,
  sampleGenerationJobs,
  sampleRecipes,
  sampleReviews
} from "@/lib/sample-data";
import {
  createSocialPostsForContent,
  publishDueScheduledSocialPosts
} from "@/lib/services/social";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  CuisineType,
  HeatLevel,
  Recipe,
  RecipeQaIssue,
  RecipeQaReport,
  Review
} from "@/lib/types";
import { calculateReadTime, slugify } from "@/lib/utils";

type GenerationType = "recipe" | "blog_post" | "review";
type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;
type GenerationTriggerSource = "manual" | "cron";
type GenerationProfile = "default" | "hot_sauce_recipe";
type AgentQaReview = {
  verdict?: "pass" | "revise" | "fail";
  blockers?: string[];
  warnings?: string[];
  cuisine_assessment?: string;
  image_assessment?: string;
  content_assessment?: string;
  method_assessment?: string;
  suggested_fixes?: string[];
};

type HotSauceFocus = {
  slug: string;
  productName: string;
  brand: string;
  description: string;
  heatLevel?: HeatLevel;
  flavorNotes: string[];
  cuisineOrigin?: CuisineType;
  affiliateUrl?: string;
  featured?: boolean;
};

type GenerationContext = {
  profile: GenerationProfile;
  cuisine: CuisineType;
  heatLevel: HeatLevel;
  hotSauceFocus?: HotSauceFocus | null;
};

type GenerationHistoryEntry = {
  type: GenerationType;
  cuisine: CuisineType;
  createdAt: string;
  profile: GenerationProfile;
  hotSauceSlug?: string | null;
};

const recipeIngredientSchema = z.object({
  amount: z.string().min(1),
  unit: z.string().optional().default(""),
  item: z.string().min(2),
  notes: z.string().optional()
});

const heatLevelEnumValues = ["mild", "medium", "hot", "inferno", "reaper"] as const;
const cuisineEnumValues = [
  "american",
  "mexican",
  "thai",
  "korean",
  "indian",
  "ethiopian",
  "peruvian",
  "jamaican",
  "cajun",
  "szechuan",
  "vietnamese",
  "west_african",
  "middle_eastern",
  "caribbean",
  "moroccan",
  "japanese",
  "italian",
  "chinese",
  "other"
] as const;
const heatLevelSet = new Set<string>(heatLevelEnumValues);
const cuisineSet = new Set<string>(cuisineEnumValues);
const cuisineAliasMap: Record<string, CuisineType> = {
  sichuan: "szechuan",
  sichuanese: "szechuan",
  chinese_sichuan: "szechuan",
  chinese_szechuan: "szechuan",
  middleeast: "middle_eastern",
  middle_east: "middle_eastern",
  middleeastern: "middle_eastern",
  westafrican: "west_african",
  west_africa: "west_african",
  westafrica: "west_african"
};

const recipeInstructionSchema = z.object({
  step: z.coerce.number().int().positive(),
  text: z.string().min(16),
  tip: z.string().optional()
});

const recipeMethodStepSchema = z.object({
  step: z.coerce.number().int().positive(),
  title: z.string().min(6),
  body: z.string().min(24),
  tip: z.string().optional(),
  cue: z.string().optional(),
  duration_minutes: z.coerce.number().int().positive().optional(),
  ingredient_refs: z.array(z.string().min(2)).optional(),
  image_url: z.string().url().optional(),
  image_alt: z.string().optional()
});

const recipeIngredientSectionSchema = z.object({
  title: z.string().min(2),
  items: z.array(recipeIngredientSchema).min(1)
});

const recipeIngredientSectionLooseSchema = z.object({
  title: z.string().optional().default("For the recipe"),
  items: z.array(recipeIngredientSchema).optional().default([])
});

const recipeFaqSchema = z.object({
  question: z.string().min(8),
  answer: z.string().min(12)
});

const generatedRecipeSchema = z
  .object({
    title: z.string().min(10),
    description: z.string().min(40),
    intro: z.string().min(40),
    hero_summary: z.string().min(30).optional(),
    heat_level: z.enum(heatLevelEnumValues).optional(),
    cuisine_type: z.enum(cuisineEnumValues).optional(),
    prep_time_minutes: z.coerce.number().int().positive(),
    cook_time_minutes: z.coerce.number().int().positive(),
    active_time_minutes: z.coerce.number().int().positive().optional(),
    servings: z.coerce.number().int().positive(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    ingredients: z.array(recipeIngredientSchema).min(1),
    ingredient_sections: z.array(recipeIngredientSectionSchema).min(1).optional(),
    instructions: z.array(recipeInstructionSchema).min(1),
    method_steps: z.array(recipeMethodStepSchema).min(1).optional(),
    tips: z.array(z.string().min(8)).min(1),
    variations: z.array(z.string().min(8)).min(1),
    make_ahead_notes: z.string().min(16).optional(),
    storage_notes: z.string().min(16).optional(),
    reheat_notes: z.string().min(16).optional(),
    serving_suggestions: z.array(z.string().min(8)).min(1).optional(),
    substitutions: z.array(z.string().min(8)).min(1).optional(),
    faqs: z.array(recipeFaqSchema).min(1).optional(),
    equipment: z.array(z.string().min(2)).min(1),
    tags: z.array(z.string().min(2)).min(1),
    seo_title: z.string().min(10),
    seo_description: z.string().min(40),
    hero_image_query: z.string().min(6).optional(),
    image_alt: z.string().min(12)
  })
  .passthrough();

const generatedRecipeLooseSchema = z
  .object({
    title: z.string().min(10),
    description: z.string().min(40),
    intro: z.string().min(24).optional(),
    hero_summary: z.string().min(20).optional(),
    heat_level: z.enum(heatLevelEnumValues).optional(),
    cuisine_type: z.enum(cuisineEnumValues).optional(),
    prep_time_minutes: z.coerce.number().int().positive().optional(),
    cook_time_minutes: z.coerce.number().int().positive().optional(),
    active_time_minutes: z.coerce.number().int().positive().optional(),
    servings: z.coerce.number().int().positive().optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    ingredients: z.array(recipeIngredientSchema).optional(),
    ingredient_sections: z.array(recipeIngredientSectionLooseSchema).optional(),
    instructions: z.array(recipeInstructionSchema).optional(),
    method_steps: z.array(recipeMethodStepSchema).optional(),
    tips: z.array(z.string().min(8)).optional(),
    variations: z.array(z.string().min(8)).optional(),
    make_ahead_notes: z.string().min(16).optional(),
    storage_notes: z.string().min(16).optional(),
    reheat_notes: z.string().min(16).optional(),
    serving_suggestions: z.array(z.string().min(8)).optional(),
    substitutions: z.array(z.string().min(8)).optional(),
    faqs: z.array(recipeFaqSchema).optional(),
    equipment: z.array(z.string().min(2)).optional(),
    tags: z.array(z.string().min(2)).optional(),
    seo_title: z.string().min(10).optional(),
    seo_description: z.string().min(40).optional(),
    hero_image_query: z.string().min(6).optional(),
    image_alt: z.string().min(12).optional()
  })
  .passthrough();

const generatedBlogSchema = z
  .object({
    title: z.string().min(10),
    description: z.string().min(40),
    content: z.string().min(500),
    category: z.string().min(2),
    tags: z.array(z.string().min(2)).min(2),
    heat_level: z.enum(heatLevelEnumValues).optional(),
    cuisine_type: z.enum(cuisineEnumValues).optional(),
    seo_title: z.string().min(10),
    seo_description: z.string().min(40),
    hero_image_query: z.string().min(6).optional(),
    image_alt: z.string().min(12)
  })
  .passthrough();

const generatedReviewSchema = z
  .object({
    title: z.string().min(10),
    description: z.string().min(32),
    content: z.string().min(280),
    product_name: z.string().min(4),
    brand: z.string().min(2),
    rating: z.coerce.number().min(1).max(5),
    price_usd: z.coerce.number().positive(),
    affiliate_url: z.string().url(),
    category: z.string().min(2),
    heat_level: z.enum(heatLevelEnumValues).optional(),
    scoville_min: z.coerce.number().nonnegative().optional(),
    scoville_max: z.coerce.number().nonnegative().optional(),
    flavor_notes: z.array(z.string().min(2)).min(2),
    cuisine_origin: z.enum(cuisineEnumValues).optional(),
    pros: z.array(z.string().min(6)).min(2),
    cons: z.array(z.string().min(6)).min(1),
    tags: z.array(z.string().min(2)).min(2),
    seo_title: z.string().min(10),
    seo_description: z.string().min(40),
    hero_image_query: z.string().min(6).optional(),
    image_alt: z.string().min(12),
    recommended: z.boolean()
  })
  .passthrough();

const recipeRewriteInstructionSchema = z.object({
  text: z.string().min(16),
  tip: z.string().min(4).optional()
});

const recipeRewriteMethodStepSchema = z.object({
  title: z.string().min(6),
  body: z.string().min(24),
  tip: z.string().optional(),
  cue: z.string().optional()
});

const recipeVoiceRewriteSchema = z.object({
  description: z.string().min(40),
  intro: z.string().min(24),
  hero_summary: z.string().min(20),
  instructions: z.array(recipeRewriteInstructionSchema).min(1),
  method_steps: z.array(recipeRewriteMethodStepSchema).min(1),
  tips: z.array(z.string().min(8)).min(1),
  variations: z.array(z.string().min(8)).min(1),
  make_ahead_notes: z.string().min(16).nullable().optional(),
  storage_notes: z.string().min(16).nullable().optional(),
  reheat_notes: z.string().min(16).nullable().optional(),
  serving_suggestions: z.array(z.string().min(8)).min(1).optional(),
  substitutions: z.array(z.string().min(8)).min(1).optional(),
  faqs: z.array(recipeFaqSchema).min(1).optional(),
  seo_description: z.string().min(40),
  image_alt: z.string().min(12)
});

const blogVoiceRewriteSchema = z.object({
  description: z.string().min(40),
  content: z.string().min(500),
  seo_description: z.string().min(40),
  image_alt: z.string().min(12)
});

const reviewVoiceRewriteSchema = z.object({
  description: z.string().min(32),
  content: z.string().min(280),
  pros: z.array(z.string().min(6)).min(2),
  cons: z.array(z.string().min(6)).min(1),
  seo_description: z.string().min(40),
  image_alt: z.string().min(12)
});

const AUTOMATED_RECIPE_PUBLISH_SCORE = 84;
const AUTOMATED_BLOG_PUBLISH_SCORE = 86;
const AUTOMATED_REVIEW_PUBLISH_SCORE = 86;
const ANTHROPIC_TEXT_MODEL = env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
const ANTHROPIC_GENERATION_MAX_TOKENS = 3200;
const ANTHROPIC_QA_MAX_TOKENS = 1400;
const ANTHROPIC_REWRITE_MAX_TOKENS = 4800;
const ANTHROPIC_JSON_CONTINUATION_LIMIT = 2;
type ValidatedGeneratedPayloadMap = {
  recipe: z.infer<typeof generatedRecipeSchema>;
  blog_post: z.infer<typeof generatedBlogSchema>;
  review: z.infer<typeof generatedReviewSchema>;
};

function stripCodeFence(value: string) {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function extractFirstJsonPayload(value: string) {
  const cleaned = stripCodeFence(value);
  const startIndex = cleaned.search(/[\{\[]/);

  if (startIndex === -1) {
    return null;
  }

  const openingChar = cleaned[startIndex];
  const closingChar = openingChar === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = startIndex; index < cleaned.length; index += 1) {
    const char = cleaned[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (char === "\\") {
        isEscaped = true;
        continue;
      }

      if (char === "\"") {
        inString = false;
      }

      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === openingChar) {
      depth += 1;
      continue;
    }

    if (char === closingChar) {
      depth -= 1;

      if (depth === 0) {
        return cleaned.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

function parseJsonResponse<T>(value: string): T | null {
  const cleaned = stripCodeFence(value);

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const extracted = extractFirstJsonPayload(cleaned);

    if (!extracted) {
      return null;
    }

    try {
      return JSON.parse(extracted) as T;
    } catch {
      return null;
    }
  }
}

function getAnthropicTextOutput(
  content: Array<{ type: string; text?: string }>
) {
  return content
    .map((item) => (item.type === "text" ? item.text || "" : ""))
    .join("\n")
    .trim();
}

function completeJsonPrefill(value: string) {
  const trimmed = value.trimStart();

  if (!trimmed) {
    return "";
  }

  return trimmed.startsWith("{") || trimmed.startsWith("[") ? trimmed : `{${trimmed}`;
}

function summarizeModelOutput(value: string) {
  const excerpt = stripCodeFence(value).replace(/\s+/g, " ").trim();
  return excerpt.slice(0, 220);
}

function dedupeList(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalizeEnumToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^\w\s-]+/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_");
}

function normalizeHeatLevelValue(value: unknown): HeatLevel | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = normalizeEnumToken(value);
  return heatLevelSet.has(normalized) ? (normalized as HeatLevel) : undefined;
}

function normalizeCuisineValue(value: unknown): CuisineType | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = normalizeEnumToken(value);

  if (cuisineSet.has(normalized)) {
    return normalized as CuisineType;
  }

  return cuisineAliasMap[normalized];
}

export function normalizeGeneratedCommonPayload(payload: Record<string, any>) {
  const normalized = { ...payload };
  const normalizedHeatLevel = normalizeHeatLevelValue(payload.heat_level);
  const normalizedCuisineType = normalizeCuisineValue(payload.cuisine_type);
  const normalizedCuisineOrigin = normalizeCuisineValue(payload.cuisine_origin);

  if (normalizedHeatLevel) {
    normalized.heat_level = normalizedHeatLevel;
  }

  if (normalizedCuisineType) {
    normalized.cuisine_type = normalizedCuisineType;
  }

  if (normalizedCuisineOrigin) {
    normalized.cuisine_origin = normalizedCuisineOrigin;
  }

  return normalized;
}

function buildFallbackRecipeInstructions() {
  return [
    {
      step: 1,
      text: "Build the aromatic base and season assertively so the finished dish still tastes lively.",
      tip: undefined
    },
    {
      step: 2,
      text: "Cook until the grains or vegetables turn tender and the spices smell rounded instead of raw.",
      tip: undefined
    },
    {
      step: 3,
      text: "Taste, adjust the seasoning, and finish with any herbs, acid, or garnish before serving.",
      tip: undefined
    }
  ];
}

function buildFallbackRecipeMethodSteps() {
  return [
    {
      step: 1,
      title: "Build the base",
      body: "Start by cooking the aromatics or vegetables until fragrant so the mild heat has something savory to cling to.",
      cue: "You want a sweet, rounded aroma instead of a raw edge."
    },
    {
      step: 2,
      title: "Cook until tender",
      body: "Add the main ingredient and liquid, then simmer or steam until the texture relaxes and everything tastes integrated.",
      cue: "The grains or vegetables should be tender, not watery."
    },
    {
      step: 3,
      title: "Taste and serve",
      body: "Check salt, brightness, and heat, then finish with the final garnish and serve warm.",
      cue: "The finish should feel balanced and gently warming."
    }
  ];
}

function buildFallbackRecipeFaqs(input: {
  title: string;
  makeAheadNotes?: string;
  storageNotes?: string;
  reheatNotes?: string;
  servingSuggestions?: string[];
}) {
  const faqs = [];

  if (input.makeAheadNotes) {
    faqs.push({
      question: `Can I make ${input.title} ahead?`,
      answer: input.makeAheadNotes
    });
  }

  if (input.storageNotes || input.reheatNotes) {
    faqs.push({
      question: "How should I store and reheat leftovers?",
      answer: [input.storageNotes, input.reheatNotes].filter(Boolean).join(" ")
    });
  }

  if (input.servingSuggestions?.length) {
    faqs.push({
      question: `What should I serve with ${input.title}?`,
      answer: input.servingSuggestions.join(" ")
    });
  }

  if (!faqs.length) {
    faqs.push({
      question: `Can I adjust the heat in ${input.title}?`,
      answer:
        "Yes. Keep the pepper component modest at first, taste near the end, and add more heat only after the dish feels balanced."
    });
  }

  return faqs.slice(0, 3);
}

export function normalizeGeneratedRecipePayload(payload: Record<string, any>) {
  const loose = generatedRecipeLooseSchema.parse(normalizeGeneratedCommonPayload(payload));
  const intro = loose.intro?.trim() || loose.description.trim();
  const heroSummary = loose.hero_summary?.trim() || intro;
  const cuisineType = loose.cuisine_type;

  const instructions =
    loose.instructions?.length
      ? loose.instructions.map((instruction, index) => ({
          step: index + 1,
          text: instruction.text.trim(),
          tip: instruction.tip?.trim()
        }))
      : loose.method_steps?.length
        ? loose.method_steps.map((step, index) => ({
            step: index + 1,
            text: `${step.title.trim()}. ${step.body.trim()}`.trim(),
            tip: step.tip?.trim()
          }))
        : buildFallbackRecipeInstructions();

  const methodSteps =
    loose.method_steps?.length
      ? loose.method_steps.map((step, index) => ({
          step: index + 1,
          title: step.title.trim(),
          body: step.body.trim(),
          tip: step.tip?.trim(),
          cue: step.cue?.trim(),
          duration_minutes: step.duration_minutes,
          ingredient_refs: step.ingredient_refs?.map((value) => value.trim()).filter(Boolean),
          image_url: step.image_url?.trim(),
          image_alt: step.image_alt?.trim()
        }))
      : instructions.length
        ? instructions.map((instruction, index) => {
            const split = splitInstructionText(instruction.text);

            return {
              step: index + 1,
              title: split.title.trim(),
              body: (split.body || instruction.text).trim(),
              tip: instruction.tip?.trim(),
              cue: instruction.tip?.trim()
            };
          })
        : buildFallbackRecipeMethodSteps();

  const ingredientSections =
    loose.ingredient_sections?.length
      ? loose.ingredient_sections
      : loose.ingredients?.length
        ? [
            {
              title: "For the recipe",
              items: loose.ingredients
            }
          ]
        : [
            {
              title: "For the recipe",
              items: [
                { amount: "1", unit: "tbsp", item: "mild chile paste" },
                { amount: "1", unit: "cup", item: "main grain or starch" },
                { amount: "2", unit: "cups", item: "stock or water" }
              ]
            }
          ];

  const ingredients =
    loose.ingredients?.length ? loose.ingredients : ingredientSections.flatMap((section) => section.items);

  const servingSuggestions = loose.serving_suggestions?.length
    ? loose.serving_suggestions
    : ["Serve warm with yogurt, pickles, or a bright salad for contrast."];

  const substitutions = loose.substitutions?.length
    ? loose.substitutions
    : loose.variations?.length
      ? loose.variations
      : ["Swap in a sweeter pepper or milder paste if you want an even gentler finish."];
  const seoTitle = loose.seo_title?.trim() || `${loose.title.trim()} Recipe | FlamingFoodies`;
  const seoDescription = loose.seo_description?.trim() || loose.description.trim();
  const imageAlt =
    loose.image_alt?.trim() ||
    buildRecipeHeroImageAlt({
      title: loose.title.trim(),
      description: loose.description,
      heroSummary,
      cuisineType
    });

  const normalized = {
    ...loose,
    intro,
    hero_summary: heroSummary,
    prep_time_minutes: loose.prep_time_minutes ?? 20,
    cook_time_minutes: loose.cook_time_minutes ?? 35,
    servings: loose.servings ?? 4,
    difficulty: loose.difficulty ?? "intermediate",
    ingredients,
    ingredient_sections: ingredientSections,
    instructions,
    method_steps: methodSteps,
    tips:
      loose.tips?.length
        ? loose.tips
        : ["Taste for balance before serving and use acid or herbs to keep the dish from feeling flat."],
    variations:
      loose.variations?.length
        ? loose.variations
        : ["Add a brighter garnish or a touch more pepper paste if you want a stronger finish."],
    serving_suggestions: servingSuggestions,
    substitutions,
    faqs:
      loose.faqs?.length
        ? loose.faqs
        : buildFallbackRecipeFaqs({
            title: loose.title,
            makeAheadNotes: loose.make_ahead_notes,
            storageNotes: loose.storage_notes,
            reheatNotes: loose.reheat_notes,
            servingSuggestions
          }),
    equipment: loose.equipment?.length ? loose.equipment : ["large skillet", "pot", "spoon"],
    tags: dedupeList([...(loose.tags ?? []), cuisineType || "", "spicy"]).slice(0, 6),
    seo_title: seoTitle,
    seo_description: seoDescription,
    image_alt: imageAlt
  };

  return generatedRecipeSchema.parse(normalized);
}

async function requestJsonFromAnthropic(
  anthropic: Anthropic,
  prompt: string,
  options: {
    maxTokens: number;
  }
) {
  let output = "{";
  let tokensUsed = 0;
  let stopReason: string | null = null;

  for (let attempt = 0; attempt <= ANTHROPIC_JSON_CONTINUATION_LIMIT; attempt += 1) {
    const messages =
      attempt === 0
        ? [
            {
              role: "user" as const,
              content: prompt
            },
            {
              role: "assistant" as const,
              content: "{"
            }
          ]
        : [
            {
              role: "user" as const,
              content: prompt
            },
            {
              role: "assistant" as const,
              content: output
            },
            {
              role: "user" as const,
              content:
                "Continue exactly where you left off. Return only the remaining JSON characters needed to complete the same object. Do not restart the object. Do not add explanation or markdown fences."
            }
          ];

    const response = await anthropic.messages.create({
      model: ANTHROPIC_TEXT_MODEL,
      max_tokens: options.maxTokens,
      messages
    });

    const chunk =
      attempt === 0
        ? completeJsonPrefill(getAnthropicTextOutput(response.content))
        : getAnthropicTextOutput(response.content);

    output = attempt === 0 ? chunk : `${output}${chunk}`;
    tokensUsed +=
      Number(response.usage?.input_tokens ?? 0) + Number(response.usage?.output_tokens ?? 0);
    stopReason = response.stop_reason ?? null;

    if (parseJsonResponse(output)) {
      break;
    }

    if (response.stop_reason !== "max_tokens") {
      break;
    }
  }

  return {
    output,
    payload: parseJsonResponse<Record<string, any>>(output),
    tokensUsed,
    stopReason
  };
}

function validateGeneratedPayload<T extends GenerationType>(
  type: T,
  payload: Record<string, any> | null
): ValidatedGeneratedPayloadMap[T] {
  if (!payload) {
    throw new Error(`Draft generation returned an empty ${type} payload.`);
  }

  if (type === "recipe") {
    try {
      return normalizeGeneratedRecipePayload(payload) as ValidatedGeneratedPayloadMap[T];
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Draft generation returned an invalid ${type} payload: ${error.issues[0]?.message || "schema mismatch"}`
        );
      }

      throw error;
    }
  }

  const normalizedPayload = normalizeGeneratedCommonPayload(payload);
  const schema =
    type === "blog_post" ? generatedBlogSchema : generatedReviewSchema;
  const parsed = schema.safeParse(normalizedPayload);

  if (!parsed.success) {
    throw new Error(
      `Draft generation returned an invalid ${type} payload: ${parsed.error.issues[0]?.message || "schema mismatch"}`
    );
  }

  return parsed.data as ValidatedGeneratedPayloadMap[T];
}

function buildHumanizeDraftPrompt(
  type: "recipe" | "blog_post" | "review",
  payload:
    | z.infer<typeof generatedRecipeSchema>
    | z.infer<typeof generatedBlogSchema>
    | z.infer<typeof generatedReviewSchema>
) {
  const baseRules = `You are the FlamingFoodies editorial polish pass.

Rewrite this draft so it sounds:
- warm, generous, and family-table oriented
- specific, grounded, and useful enough to send to a friend
- lightly opinionated without sounding macho, corporate, or templated

Do not:
- change the factual substance
- add new ingredients, quantities, timings, claims, anecdotes, testing notes, or sourcing
- add AI references or meta commentary
- flatten the piece into generic content-farm language
`;

  if (type === "recipe") {
    return `${baseRules}
Keep these unchanged:
- title
- heat_level
- cuisine_type
- prep_time_minutes
- cook_time_minutes
- active_time_minutes
- servings
- difficulty
- ingredients and ingredient_sections
- equipment
- tags
- hero_image_query
- the number and order of instructions and method steps

Rewrite only the prose fields and keep each instruction and method step attached to the same stage of the cook.

Return ONLY valid JSON with this exact structure:
{
  "description": "...",
  "intro": "...",
  "hero_summary": "...",
  "instructions": [{"text": "...", "tip": "optional"}],
  "method_steps": [{"title": "...", "body": "...", "tip": "optional", "cue": "optional"}],
  "tips": ["..."],
  "variations": ["..."],
  "make_ahead_notes": "... or null",
  "storage_notes": "... or null",
  "reheat_notes": "... or null",
  "serving_suggestions": ["..."],
  "substitutions": ["..."],
  "faqs": [{"question": "...", "answer": "..."}],
  "seo_description": "...",
  "image_alt": "..."
}

Draft payload:
${JSON.stringify(payload, null, 2)}`;
  }

  if (type === "blog_post") {
    return `${baseRules}
Keep these unchanged:
- title
- category
- tags
- heat_level
- cuisine_type
- seo_title

Rewrite the description and article body so the piece feels more like a trusted food editor with a strong point of view and less like a template.

Return ONLY valid JSON with this exact structure:
{
  "description": "...",
  "content": "...",
  "seo_description": "...",
  "image_alt": "..."
}

Draft payload:
${JSON.stringify(payload, null, 2)}`;
  }

  return `${baseRules}
Keep these unchanged:
- title
- product_name
- brand
- rating
- price_usd
- affiliate_url
- category
- heat_level
- scoville_min
- scoville_max
- flavor_notes
- cuisine_origin
- recommended
- tags
- seo_title

Rewrite the review so it feels like a generous, specific tasting note from a real editor. Keep the substance the same, but make the judgments clearer and the language less templated.

Return ONLY valid JSON with this exact structure:
{
  "description": "...",
  "content": "...",
  "pros": ["..."],
  "cons": ["..."],
  "seo_description": "...",
  "image_alt": "..."
}

Draft payload:
${JSON.stringify(payload, null, 2)}`;
}

function mergeRecipeVoiceRewrite(
  payload: z.infer<typeof generatedRecipeSchema>,
  rewrite: z.infer<typeof recipeVoiceRewriteSchema>
) {
  const originalMethodSteps = payload.method_steps ?? [];
  const instructions =
    rewrite.instructions.length === payload.instructions.length
      ? payload.instructions.map((instruction, index) => ({
          ...instruction,
          text: rewrite.instructions[index]?.text ?? instruction.text,
          tip: rewrite.instructions[index]?.tip ?? instruction.tip
        }))
      : payload.instructions;

  const methodSteps =
    rewrite.method_steps.length === originalMethodSteps.length
      ? originalMethodSteps.map((step, index) => ({
          ...step,
          title: rewrite.method_steps[index]?.title ?? step.title,
          body: rewrite.method_steps[index]?.body ?? step.body,
          tip: rewrite.method_steps[index]?.tip ?? step.tip,
          cue: rewrite.method_steps[index]?.cue ?? step.cue
        }))
      : originalMethodSteps;

  return validateGeneratedPayload("recipe", {
    ...payload,
    description: rewrite.description,
    intro: rewrite.intro,
    hero_summary: rewrite.hero_summary,
    instructions,
    method_steps: methodSteps,
    tips: rewrite.tips,
    variations: rewrite.variations,
    make_ahead_notes:
      rewrite.make_ahead_notes === null ? undefined : rewrite.make_ahead_notes ?? payload.make_ahead_notes,
    storage_notes:
      rewrite.storage_notes === null ? undefined : rewrite.storage_notes ?? payload.storage_notes,
    reheat_notes:
      rewrite.reheat_notes === null ? undefined : rewrite.reheat_notes ?? payload.reheat_notes,
    serving_suggestions: rewrite.serving_suggestions ?? payload.serving_suggestions,
    substitutions: rewrite.substitutions ?? payload.substitutions,
    faqs: rewrite.faqs ?? payload.faqs,
    seo_description: rewrite.seo_description,
    image_alt: rewrite.image_alt
  });
}

function mergeBlogVoiceRewrite(
  payload: z.infer<typeof generatedBlogSchema>,
  rewrite: z.infer<typeof blogVoiceRewriteSchema>
) {
  return validateGeneratedPayload("blog_post", {
    ...payload,
    description: rewrite.description,
    content: rewrite.content,
    seo_description: rewrite.seo_description,
    image_alt: rewrite.image_alt
  });
}

function mergeReviewVoiceRewrite(
  payload: z.infer<typeof generatedReviewSchema>,
  rewrite: z.infer<typeof reviewVoiceRewriteSchema>
) {
  return validateGeneratedPayload("review", {
    ...payload,
    description: rewrite.description,
    content: rewrite.content,
    pros: rewrite.pros,
    cons: rewrite.cons,
    seo_description: rewrite.seo_description,
    image_alt: rewrite.image_alt
  });
}

async function humanizeGeneratedDraft<T extends "recipe" | "blog_post" | "review">(
  anthropic: Anthropic | null,
  type: T,
  payload: ValidatedGeneratedPayloadMap[T]
): Promise<ValidatedGeneratedPayloadMap[T]> {
  if (!anthropic) {
    return payload;
  }

  try {
    const response = await requestJsonFromAnthropic(
      anthropic,
      buildHumanizeDraftPrompt(type, payload),
      {
        maxTokens: ANTHROPIC_REWRITE_MAX_TOKENS
      }
    );

    if (!response.payload) {
      return payload;
    }

    if (type === "recipe") {
      const parsed = recipeVoiceRewriteSchema.safeParse(response.payload);
      if (!parsed.success) {
        return payload;
      }

      return mergeRecipeVoiceRewrite(
        payload as z.infer<typeof generatedRecipeSchema>,
        parsed.data
      ) as ValidatedGeneratedPayloadMap[T];
    }

    if (type === "blog_post") {
      const parsed = blogVoiceRewriteSchema.safeParse(response.payload);
      if (!parsed.success) {
        return payload;
      }

      return mergeBlogVoiceRewrite(
        payload as z.infer<typeof generatedBlogSchema>,
        parsed.data
      ) as ValidatedGeneratedPayloadMap[T];
    }

    const parsed = reviewVoiceRewriteSchema.safeParse(response.payload);
    if (!parsed.success) {
      return payload;
    }

    return mergeReviewVoiceRewrite(
      payload as z.infer<typeof generatedReviewSchema>,
      parsed.data
    ) as ValidatedGeneratedPayloadMap[T];
  } catch {
    return payload;
  }
}

function buildAutomationHeroImageUrl(type: GenerationType, title: string, cuisine: CuisineType) {
  if (type === "review") {
    const params = new URLSearchParams({
      title,
      eyebrow: "Review",
      subtitle: `${cuisine.replace(/_/g, " ")} tasting notes`
    });

    return `${env.NEXT_PUBLIC_SITE_URL}/api/og?${params.toString()}`;
  }

  return buildBlogHeroImageUrl({
    title,
    category: "story",
    cuisineType: cuisine
  });
}

function stripRecipeTitleQualifiers(value: string) {
  return value.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
}

function normalizePhotoSearchQuery(value?: string | null) {
  const trimmed = value?.replace(/\s+/g, " ").trim();

  return trimmed && trimmed.length >= 6 ? trimmed : undefined;
}

function formatCuisineQuery(cuisineType?: CuisineType) {
  if (!cuisineType || cuisineType === "other") {
    return undefined;
  }

  return cuisineType.replace(/_/g, " ");
}

export function buildRecipePhotoSearchQueries(input: {
  title: string;
  cuisineType?: CuisineType;
  fallbackCuisineType?: CuisineType;
  heroImageQuery?: string | null;
}) {
  const cleanTitle = stripRecipeTitleQualifiers(input.title);
  const cuisineLabel =
    formatCuisineQuery(input.cuisineType) || formatCuisineQuery(input.fallbackCuisineType);

  return dedupeList(
    [
      normalizePhotoSearchQuery(input.heroImageQuery),
      cleanTitle,
      `${cleanTitle} plated`,
      `${cleanTitle} plated dish`,
      cuisineLabel ? `${cuisineLabel} ${cleanTitle}` : undefined,
      cuisineLabel ? `${cuisineLabel} ${cleanTitle} plated` : undefined
    ].filter(Boolean) as string[]
  ).slice(0, 6);
}

export function buildBlogPhotoSearchQueries(input: {
  title: string;
  category?: string | null;
  cuisineType?: CuisineType;
  fallbackCuisineType?: CuisineType;
  heroImageQuery?: string | null;
}) {
  const cleanTitle = stripRecipeTitleQualifiers(input.title);
  const cuisineLabel =
    formatCuisineQuery(input.cuisineType) || formatCuisineQuery(input.fallbackCuisineType);
  const categoryLabel = input.category?.replace(/-/g, " ").trim();
  const lowerTitle = cleanTitle.toLowerCase();
  const topicHints = dedupeList(
    [
      lowerTitle.includes("spice blend") ? (cuisineLabel ? `${cuisineLabel} spice blend` : "spice blend bowls") : "",
      lowerTitle.includes("spice")
        ? cuisineLabel
          ? `${cuisineLabel} spices`
          : "assorted spices"
        : "",
      lowerTitle.includes("sauce")
        ? cuisineLabel
          ? `${cuisineLabel} sauce bowl`
          : "spicy sauce bowl"
        : "",
      lowerTitle.includes("paste")
        ? cuisineLabel
          ? `${cuisineLabel} chili paste bowl`
          : "chili paste bowl"
        : "",
      cuisineLabel ? `${cuisineLabel} food spread` : "",
      cuisineLabel ? `${cuisineLabel} dishes` : ""
    ].filter(Boolean)
  );

  return dedupeList(
    [
      normalizePhotoSearchQuery(input.heroImageQuery),
      ...topicHints,
      cuisineLabel ? `${cuisineLabel} food` : undefined,
      categoryLabel && cuisineLabel ? `${categoryLabel} ${cuisineLabel} food` : undefined,
      cleanTitle,
      `${cleanTitle} food`,
      cuisineLabel ? `${cuisineLabel} ${cleanTitle}` : undefined,
      cuisineLabel ? `${cuisineLabel} dishes` : undefined,
      categoryLabel ? `${categoryLabel} spicy food` : undefined
    ].filter(Boolean) as string[]
  ).slice(0, 8);
}

export function buildReviewPhotoSearchQueries(input: {
  productName: string;
  brand?: string | null;
  category?: string | null;
  cuisineOrigin?: CuisineType;
  heroImageQuery?: string | null;
}) {
  const productLabel = stripRecipeTitleQualifiers(input.productName);
  const brandLabel = input.brand?.trim();
  const cuisineLabel = formatCuisineQuery(input.cuisineOrigin);
  const categoryLabel = input.category?.replace(/-/g, " ").trim();
  const normalizedProductLabel =
    brandLabel && productLabel.toLowerCase().startsWith(brandLabel.toLowerCase())
      ? productLabel
      : brandLabel
        ? `${brandLabel} ${productLabel}`
        : productLabel;

  return dedupeList(
    [
      normalizePhotoSearchQuery(input.heroImageQuery),
      `${normalizedProductLabel} bottle`,
      `${normalizedProductLabel} hot sauce bottle`,
      `${normalizedProductLabel} product`,
      brandLabel && categoryLabel ? `${brandLabel} ${categoryLabel} bottle` : undefined,
      brandLabel && cuisineLabel ? `${brandLabel} ${cuisineLabel} sauce bottle` : undefined,
      `${productLabel} bottle`,
      `${productLabel} product`
    ].filter(Boolean) as string[]
  ).slice(0, 8);
}

type ResolvedRecipeHeroAsset = {
  imageUrl: string;
  heroSource: "photo" | "generated";
  searchQuery: string | null;
};

type ResolvedEditorialHeroAsset = {
  imageUrl: string;
  heroSource: "photo" | "generated";
  searchQuery: string | null;
};

type ResolvedReviewHeroAsset = {
  imageUrl: string;
  heroSource: "photo" | "generated";
  searchQuery: string | null;
};

function usesAutomationHeroCard(imageUrl?: string | null) {
  if (!imageUrl) return false;

  return (
    imageUrl.includes("/api/og?") ||
    isGeneratedRecipeHeroImageUrl(imageUrl) ||
    isGeneratedBlogHeroImageUrl(imageUrl)
  );
}

function isAgentQaPass(agentReview: AgentQaReview | null) {
  return Boolean(agentReview && agentReview.verdict === "pass" && !(agentReview.blockers ?? []).length);
}

export function getAgentQaAutomationDecision(agentReview: AgentQaReview | null) {
  const verdict = agentReview?.verdict ?? null;

  return {
    passesAutomation: Boolean(agentReview) && verdict !== "fail",
    demoteBlockersToWarnings: verdict === "revise"
  };
}

export function shouldAutonomousPublish(input: {
  baseReport: RecipeQaReport;
  readinessChecks: boolean[];
  agentReview: AgentQaReview | null;
  scoreThreshold: number;
}) {
  const decision = getAgentQaAutomationDecision(input.agentReview);

  return (
    decision.passesAutomation &&
    input.readinessChecks.every(Boolean) &&
    input.baseReport.blockers.length === 0 &&
    input.baseReport.score >= input.scoreThreshold
  );
}

function getHeatLevel(index: number): HeatLevel {
  const heatLevels: HeatLevel[] = ["mild", "medium", "hot", "inferno", "reaper"];
  return heatLevels[index % heatLevels.length];
}

function coerceGenerationType(value?: string | null): GenerationType | null {
  if (value === "recipe" || value === "blog_post" || value === "review") {
    return value;
  }

  return null;
}

function deterministicSelectionJitter(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 9973;
  }

  return hash % 17;
}

function scoreCuisineCandidate(input: {
  cuisine: CuisineType;
  type: GenerationType;
  history: GenerationHistoryEntry[];
  index: number;
  date: Date;
}) {
  const sameTypeHistory = input.history.filter((entry) => entry.type === input.type);
  const sameTypeLastIndex = sameTypeHistory.findIndex((entry) => entry.cuisine === input.cuisine);
  const globalLastIndex = input.history.findIndex((entry) => entry.cuisine === input.cuisine);
  const sameTypeRecentCount = sameTypeHistory
    .slice(0, 12)
    .filter((entry) => entry.cuisine === input.cuisine).length;
  const globalRecentCount = input.history
    .slice(0, 24)
    .filter((entry) => entry.cuisine === input.cuisine).length;
  const sameTypeCooldownPenalty =
    sameTypeLastIndex === 0 ? 110 : sameTypeLastIndex === 1 ? 70 : sameTypeLastIndex === 2 ? 35 : 0;
  const globalCooldownPenalty =
    globalLastIndex === 0 ? 45 : globalLastIndex === 1 ? 20 : 0;
  const sameTypeRecencyReward =
    sameTypeLastIndex === -1 ? 48 : Math.min(sameTypeLastIndex, 12) * 4;
  const globalRecencyReward =
    globalLastIndex === -1 ? 22 : Math.min(globalLastIndex, 18);
  const saturationPenalty = sameTypeRecentCount * 18 + globalRecentCount * 7;
  const jitter = deterministicSelectionJitter(
    `${input.date.toISOString().slice(0, 10)}:${input.type}:${input.index}:${input.cuisine}`
  );

  return sameTypeRecencyReward + globalRecencyReward + jitter - saturationPenalty - sameTypeCooldownPenalty - globalCooldownPenalty;
}

export function planBalancedCuisines(input: {
  qty: number;
  type: GenerationType;
  history: GenerationHistoryEntry[];
  date?: Date;
}) {
  const date = input.date ?? new Date();
  const planningHistory = [...input.history];
  const plan: CuisineType[] = [];

  for (let index = 0; index < input.qty; index += 1) {
    const rankedCuisines = CUISINE_ROTATION.map((cuisine) => ({
      cuisine,
      score: scoreCuisineCandidate({
        cuisine,
        type: input.type,
        history: planningHistory,
        index,
        date
      })
    })).sort((left, right) => right.score - left.score || left.cuisine.localeCompare(right.cuisine));

    const selectedCuisine =
      rankedCuisines[0]?.cuisine ?? CUISINE_ROTATION[index % CUISINE_ROTATION.length];

    plan.push(selectedCuisine);
    planningHistory.unshift({
      type: input.type,
      cuisine: selectedCuisine,
      createdAt: new Date(date.getTime() + index).toISOString(),
      profile: "default",
      hotSauceSlug: null
    });
  }

  return plan;
}

function normalizeGenerationProfile(
  type: GenerationType,
  profile?: string | null
): GenerationProfile {
  if (type === "recipe" && profile === "hot_sauce_recipe") {
    return "hot_sauce_recipe";
  }

  return "default";
}

function sortHotSauceCandidates<T extends { featured?: boolean; publishedAt?: string }>(rows: T[]) {
  return [...rows].sort((left, right) => {
    if (Boolean(left.featured) !== Boolean(right.featured)) {
      return Number(Boolean(right.featured)) - Number(Boolean(left.featured));
    }

    return new Date(right.publishedAt || 0).getTime() - new Date(left.publishedAt || 0).getTime();
  });
}

function buildSampleGenerationHistory() {
  return [
    ...sampleRecipes.map((recipe) => ({
      type: "recipe" as const,
      cuisine: recipe.cuisineType,
      createdAt: recipe.publishedAt || new Date(0).toISOString(),
      profile: "default" as const,
      hotSauceSlug: null
    })),
    ...sampleBlogPosts.map((post) => ({
      type: "blog_post" as const,
      cuisine: post.cuisineType ?? "other",
      createdAt: post.publishedAt || new Date(0).toISOString(),
      profile: "default" as const,
      hotSauceSlug: null
    })),
    ...sampleReviews.map((review) => ({
      type: "review" as const,
      cuisine: review.cuisineOrigin ?? "other",
      createdAt: review.publishedAt || new Date(0).toISOString(),
      profile: "default" as const,
      hotSauceSlug: null
    }))
  ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

async function listRecentGenerationHistory(supabase: AdminClient) {
  const { data } = await supabase
    .from("content_generation_jobs")
    .select("job_type, status, created_at, parameters")
    .order("created_at", { ascending: false })
    .limit(180);

  return (data ?? [])
    .flatMap((row) => {
      if (row.status === "failed") {
        return [];
      }

      const type = coerceGenerationType(row.job_type);
      if (!type) {
        return [];
      }

      const parameters =
        row.parameters && typeof row.parameters === "object" ? row.parameters : {};
      const parameterRecord = parameters as Record<string, unknown>;
      const normalizedParameters = normalizeGeneratedCommonPayload(
        parameterRecord
      );
      const cuisine =
        typeof normalizedParameters.cuisine_type === "string"
          ? (normalizedParameters.cuisine_type as CuisineType)
          : null;

      if (!cuisine || !cuisineSet.has(cuisine)) {
        return [];
      }

      const rawProfile = typeof parameterRecord.profile === "string" ? parameterRecord.profile : null;
      const profile = normalizeGenerationProfile(type, rawProfile);
      const hotSauceSlug =
        typeof parameterRecord.hot_sauce_slug === "string"
          ? String(parameterRecord.hot_sauce_slug)
          : null;

      return [
        {
          type,
          cuisine,
          createdAt: row.created_at || new Date(0).toISOString(),
          profile,
          hotSauceSlug
        } satisfies GenerationHistoryEntry
      ];
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

async function listPublishedHotSauceCandidates(supabase: AdminClient) {
  const { data } = await supabase
    .from("reviews")
    .select(
      "slug, product_name, brand, description, heat_level, flavor_notes, cuisine_origin, affiliate_url, featured, published_at"
    )
    .eq("status", "published")
    .eq("category", "hot-sauce")
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false });

  const liveCandidates = (data ?? [])
    .map((row) => ({
      slug: row.slug,
      productName: row.product_name,
      brand: row.brand,
      description: row.description,
      heatLevel: row.heat_level ?? undefined,
      flavorNotes: Array.isArray(row.flavor_notes) ? row.flavor_notes.filter(Boolean) : [],
      cuisineOrigin: row.cuisine_origin ?? undefined,
      affiliateUrl: row.affiliate_url ?? undefined,
      featured: Boolean(row.featured),
      publishedAt: row.published_at ?? undefined
    }))
    .filter((row) => row.slug && row.productName && row.brand && row.description);

  if (liveCandidates.length) {
    return sortHotSauceCandidates(liveCandidates).map(({ publishedAt: _publishedAt, ...candidate }) => candidate);
  }

  return sortHotSauceCandidates(
    sampleReviews
      .filter((review) => review.status === "published" && review.category === "hot-sauce")
      .map((review) => ({
        slug: review.slug,
        productName: review.productName,
        brand: review.brand,
        description: review.description,
        heatLevel: review.heatLevel,
        flavorNotes: review.flavorNotes ?? [],
        cuisineOrigin: review.cuisineOrigin,
        affiliateUrl: review.affiliateUrl,
        featured: review.featured,
        publishedAt: review.publishedAt
      }))
  ).map(({ publishedAt: _publishedAt, ...candidate }) => candidate);
}

export function pickBalancedHotSauceFocus(
  candidates: HotSauceFocus[],
  history: GenerationHistoryEntry[],
  usedSlugs: Set<string>,
  index: number,
  date = new Date()
) {
  if (!candidates.length) {
    return null;
  }

  const hotSauceHistory = history.filter(
    (entry) => entry.type === "recipe" && entry.profile === "hot_sauce_recipe"
  );

  const rankedCandidates = candidates
    .map((candidate, candidateIndex) => {
      const slugLastIndex = hotSauceHistory.findIndex(
        (entry) => entry.hotSauceSlug === candidate.slug
      );
      const slugRecentCount = hotSauceHistory
        .slice(0, 10)
        .filter((entry) => entry.hotSauceSlug === candidate.slug).length;
      const slugPenalty =
        usedSlugs.has(candidate.slug)
          ? 200
          : slugLastIndex === 0
            ? 120
            : slugLastIndex === 1
              ? 70
              : slugLastIndex === 2
                ? 35
                : 0;
      const cuisineScore =
        candidate.cuisineOrigin && candidate.cuisineOrigin !== "other"
          ? scoreCuisineCandidate({
              cuisine: candidate.cuisineOrigin,
              type: "recipe",
              history,
              index,
              date
            })
          : 0;
      const featuredBoost = candidate.featured ? 10 : 0;
      const freshnessBoost = Math.max(candidates.length - candidateIndex, 1);

      return {
        candidate,
        score: cuisineScore + featuredBoost + freshnessBoost - slugPenalty - slugRecentCount * 28
      };
    })
    .sort((left, right) => right.score - left.score);

  const selected = rankedCandidates[0]?.candidate ?? candidates[0];
  if (selected) {
    usedSlugs.add(selected.slug);
  }

  return selected;
}

function buildGenerationContext(
  index: number,
  cuisine: CuisineType,
  profile: GenerationProfile,
  hotSauceFocus?: HotSauceFocus | null
): GenerationContext {
  const heatLevel = hotSauceFocus?.heatLevel ?? getHeatLevel(index);
  const normalizedCuisine =
    profile === "hot_sauce_recipe" &&
    hotSauceFocus?.cuisineOrigin &&
    hotSauceFocus.cuisineOrigin !== "other"
      ? hotSauceFocus.cuisineOrigin
      : cuisine;

  return {
    profile,
    cuisine: normalizedCuisine,
    heatLevel,
    hotSauceFocus
  };
}

function buildPrompt(type: GenerationType, context: GenerationContext, index: number) {
  if (type === "recipe") {
    return RECIPE_PROMPT({
      cuisine_type: context.cuisine,
      heat_level: context.heatLevel,
      hot_sauce_focus: context.hotSauceFocus
        ? {
            product_name: context.hotSauceFocus.productName,
            brand: context.hotSauceFocus.brand,
            description: context.hotSauceFocus.description,
            heat_level: context.hotSauceFocus.heatLevel,
            flavor_notes: context.hotSauceFocus.flavorNotes,
            cuisine_origin: context.hotSauceFocus.cuisineOrigin
          }
        : undefined
    });
  }

  if (type === "blog_post") {
    return BLOG_POST_PROMPT({
      category: ["culture", "science", "guides", "gear"][index % 4],
      topic: `The most craveable spicy ${context.cuisine.replace(/_/g, " ")} dish styles right now`
    });
  }

  return REVIEW_PROMPT({
    category: "hot-sauce",
    cuisine_origin: context.cuisine,
    heat_level: context.heatLevel
  });
}

function buildEditorialQaPrompt(
  type: "recipe" | "review" | "blog_post",
  payload: Record<string, any>
) {
  const scope =
    type === "recipe"
      ? "a spicy recipe draft for publication readiness"
      : type === "review"
        ? "a spicy product review draft for publication readiness"
        : "a spicy food blog post draft for publication readiness";

  return `You are the FlamingFoodies Cuisine QA agent.

Your job is to review ${scope}.
Be strict, concrete, and editorially useful.

Evaluate:
1. Topic or content identity
2. Cuisine fit or origin credibility where relevant
3. Structure, method, or tasting-note credibility
4. Heat credibility
5. Image accuracy based on the provided alt text and named content
   - If hero_image_source and hero_image_query_used are provided, use them to judge whether the selected image is plausible for the dish.
6. Missing support or context that would make this feel weak in production
7. Unsupported claims, filler, or generic AI-style writing

Return valid JSON with:
- verdict: pass | revise | fail
- blockers: array of concise blocker strings
- warnings: array of concise warning strings
- cuisine_assessment: short paragraph
- image_assessment: short paragraph
- content_assessment: short paragraph
- suggested_fixes: array of specific edits

Draft payload:
${JSON.stringify(payload, null, 2)}`;
}

async function runEditorialQaReview(
  anthropic: Anthropic | null,
  type: "recipe" | "review" | "blog_post",
  payload: Record<string, any>
) {
  if (!anthropic) {
    return null;
  }

  const response = await requestJsonFromAnthropic(
    anthropic,
    buildEditorialQaPrompt(type, payload),
    {
      maxTokens: ANTHROPIC_QA_MAX_TOKENS
    }
  );

  return parseJsonResponse<AgentQaReview>(response.output);
}

function buildQaIssue(
  severity: "blocker" | "warning",
  prefix: string,
  index: number,
  message: string
): RecipeQaIssue {
  return {
    severity,
    code: `${prefix}-${index + 1}`,
    message
  };
}

function mergeAgentQaReview(
  report: RecipeQaReport,
  agentReview: AgentQaReview | null,
  options?: { demoteReviseBlockersToWarnings?: boolean }
) {
  if (!agentReview) {
    return report;
  }

  const automationDecision = getAgentQaAutomationDecision(agentReview);
  const demoteAgentBlockers =
    Boolean(options?.demoteReviseBlockersToWarnings) &&
    automationDecision.demoteBlockersToWarnings;

  const blockers = [
    ...report.blockers,
    ...(!demoteAgentBlockers
      ? (agentReview.blockers ?? []).map((message, index) =>
          buildQaIssue("blocker", "agent-blocker", index, message)
        )
      : [])
  ];
  const warnings = [
    ...report.warnings,
    ...(demoteAgentBlockers
      ? (agentReview.blockers ?? []).map((message, index) =>
          buildQaIssue("warning", "agent-review-note", index, message)
        )
      : []),
    ...(agentReview.warnings ?? []).map((message, index) =>
      buildQaIssue("warning", "agent-warning", index, message)
    )
  ];

  const score = Math.max(
    0,
    100 - blockers.length * 18 - warnings.length * 5 - ((agentReview.suggested_fixes?.length ?? 0) > 3 ? 4 : 0)
  );
  const status = blockers.length ? "fail" : warnings.length ? "warn" : "pass";

  return {
    status,
    score,
    blockers,
    warnings
  } satisfies RecipeQaReport;
}

export function mergeAgentQaReviewForAutonomousDraft(
  report: RecipeQaReport,
  agentReview: AgentQaReview | null
) {
  return mergeAgentQaReview(report, agentReview, {
    demoteReviseBlockersToWarnings: true
  });
}

function buildAgentQaNotes(baseNote: string, agentReview: AgentQaReview | null) {
  const QA_NOTES_MAX_LENGTH = 4000;
  const truncateQaNotes = (value: string) =>
    value.length <= QA_NOTES_MAX_LENGTH
      ? value
      : `${value.slice(0, QA_NOTES_MAX_LENGTH - 15).trimEnd()}\n[truncated]`;

  if (!agentReview) {
    return truncateQaNotes(baseNote);
  }

  const sections = [
    baseNote,
    `Editorial QA verdict: ${agentReview.verdict ?? "revise"}.`,
    agentReview.cuisine_assessment
      ? `Cuisine assessment: ${agentReview.cuisine_assessment}`
      : null,
    agentReview.image_assessment ? `Image assessment: ${agentReview.image_assessment}` : null,
    agentReview.content_assessment || agentReview.method_assessment
      ? `Content assessment: ${agentReview.content_assessment ?? agentReview.method_assessment}`
      : null,
    agentReview.suggested_fixes?.length
      ? `Suggested fixes: ${agentReview.suggested_fixes.join("; ")}`
      : null
  ].filter(Boolean);

  return truncateQaNotes(sections.join("\n"));
}

async function fetchImageForQuery(query: string) {
  if (env.UNSPLASH_ACCESS_KEY) {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`
          }
        }
      );

      if (response.ok) {
        const json = await response.json();
        const imageUrl = json.results?.[0]?.urls?.regular;
        if (imageUrl) return imageUrl;
      }
    } catch {
      // Fall through to Pexels and then undefined.
    }
  }

  if (env.PEXELS_API_KEY) {
    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
        {
          headers: {
            Authorization: env.PEXELS_API_KEY
          }
        }
      );

      if (response.ok) {
        const json = await response.json();
        const imageUrl = json.photos?.[0]?.src?.large2x;
        if (imageUrl) return imageUrl;
      }
    } catch {
      return undefined;
    }
  }

  return undefined;
}

async function resolveRecipeHeroAsset(input: {
  generated: z.infer<typeof generatedRecipeSchema>;
  cuisine: CuisineType;
}): Promise<ResolvedRecipeHeroAsset> {
  const queries = buildRecipePhotoSearchQueries({
    title: input.generated.title,
    cuisineType: input.generated.cuisine_type,
    fallbackCuisineType: input.cuisine,
    heroImageQuery: input.generated.hero_image_query
  });

  for (const query of queries) {
    const imageUrl = await fetchImageForQuery(query);

    if (imageUrl) {
      return {
        imageUrl,
        heroSource: "photo",
        searchQuery: query
      };
    }
  }

  return {
    imageUrl: buildRecipeHeroImageUrl({
      title: input.generated.title,
      cuisineType: input.generated.cuisine_type || input.cuisine,
      heatLevel: input.generated.heat_level,
      description: input.generated.description,
      heroSummary: input.generated.hero_summary
    }),
    heroSource: "generated",
    searchQuery: null
  };
}

async function resolveBlogHeroAsset(input: {
  generated: z.infer<typeof generatedBlogSchema>;
  cuisine: CuisineType;
}): Promise<ResolvedEditorialHeroAsset> {
  const queries = buildBlogPhotoSearchQueries({
    title: input.generated.title,
    category: input.generated.category,
    cuisineType: input.generated.cuisine_type,
    fallbackCuisineType: input.cuisine,
    heroImageQuery: input.generated.hero_image_query
  });

  for (const query of queries) {
    const imageUrl = await fetchImageForQuery(query);

    if (imageUrl) {
      return {
        imageUrl,
        heroSource: "photo",
        searchQuery: query
      };
    }
  }

  return {
    imageUrl: buildBlogHeroImageUrl({
      title: input.generated.title,
      category: input.generated.category,
      cuisineType: input.generated.cuisine_type || input.cuisine,
      heatLevel: input.generated.heat_level,
      heroImageQuery: input.generated.hero_image_query
    }),
    heroSource: "generated",
    searchQuery: null
  };
}

async function resolveReviewHeroAsset(input: {
  generated: z.infer<typeof generatedReviewSchema>;
  cuisine: CuisineType;
}): Promise<ResolvedReviewHeroAsset> {
  const queries = buildReviewPhotoSearchQueries({
    productName: input.generated.product_name,
    brand: input.generated.brand,
    category: input.generated.category,
    cuisineOrigin: input.generated.cuisine_origin || input.cuisine,
    heroImageQuery: input.generated.hero_image_query
  });

  for (const query of queries) {
    const imageUrl = await fetchImageForQuery(query);

    if (imageUrl) {
      return {
        imageUrl,
        heroSource: "photo",
        searchQuery: query
      };
    }
  }

  return {
    imageUrl: buildReviewHeroImageUrl({
      title: input.generated.title,
      productName: input.generated.product_name,
      brand: input.generated.brand,
      category: input.generated.category,
      heatLevel: input.generated.heat_level
    }),
    heroSource: "generated",
    searchQuery: null
  };
}

async function makeUniqueSlug(
  supabase: AdminClient,
  table: "blog_posts" | "recipes" | "reviews",
  title: string
) {
  const base = slugify(title);
  let candidate = base;
  let suffix = 1;

  while (true) {
    const { data } = await supabase
      .from(table)
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function buildRecipeDraft(
  cuisine: CuisineType,
  index: number,
  generated?: z.infer<typeof generatedRecipeSchema>,
  imageUrl?: string
) {
  const fallbackTitle = `${cuisine.replace(/_/g, " ")} fire recipe ${index + 1}`;
  const title = generated?.title || fallbackTitle;
  const description =
    generated?.description ||
    `A bold ${cuisine.replace(/_/g, " ")} recipe built for people who want real heat and actual flavor.`;
  const intro =
    generated?.intro ||
    `This draft leans into ${cuisine.replace(/_/g, " ")} heat traditions while keeping the recipe practical for home cooks.`;
  const heroSummary = generated?.hero_summary || intro;

  return {
    title,
    description,
    intro,
    hero_summary: heroSummary,
    author_name: "FlamingFoodies Test Kitchen",
    heat_level: generated?.heat_level || getHeatLevel(index),
    cuisine_type: generated?.cuisine_type || cuisine,
    prep_time_minutes: Number(generated?.prep_time_minutes ?? 20),
    cook_time_minutes: Number(generated?.cook_time_minutes ?? 25),
    active_time_minutes: Number(
      generated?.active_time_minutes ?? generated?.prep_time_minutes ?? 20
    ),
    servings: Number(generated?.servings ?? 4),
    difficulty: generated?.difficulty || "intermediate",
    ingredients:
      generated?.ingredients ?? [
        { amount: "2", unit: "tbsp", item: "chili paste", notes: "adjust to taste" },
        { amount: "1", unit: "lb", item: "main ingredient" }
      ],
    ingredient_sections: generated?.ingredient_sections ?? null,
    instructions:
      generated?.instructions ?? [
        { step: 1, text: "Build the aromatic base and season aggressively." },
        { step: 2, text: "Cook until the sauce turns glossy and the heat blooms." },
        { step: 3, text: "Serve hot and finish with a bright counterpoint." }
      ],
    method_steps: generated?.method_steps
      ? generated.method_steps.map((step) => ({
          step: step.step,
          title: step.title,
          body: step.body,
          tip: step.tip ?? null,
          cue: step.cue ?? null,
          duration_minutes: step.duration_minutes ?? null,
          ingredient_refs: step.ingredient_refs ?? []
        }))
      : null,
    tips: generated?.tips ?? ["Taste for balance before adding more heat."],
    variations: generated?.variations ?? ["Add a fermented pepper element for more depth."],
    make_ahead_notes: generated?.make_ahead_notes ?? null,
    storage_notes: generated?.storage_notes ?? null,
    reheat_notes: generated?.reheat_notes ?? null,
    serving_suggestions: generated?.serving_suggestions ?? [],
    substitutions: generated?.substitutions ?? generated?.variations ?? [],
    faqs: generated?.faqs ?? [],
    equipment: generated?.equipment ?? ["large skillet", "mixing bowl"],
    tags: generated?.tags ?? [cuisine, "spicy"],
    image_url: imageUrl ?? null,
    image_alt:
      generated?.image_alt ||
      buildRecipeHeroImageAlt({
        title,
        description,
        heroSummary,
        cuisineType: generated?.cuisine_type || cuisine
      }),
    featured: false,
    source: "ai_generated",
    seo_title: generated?.seo_title || `${title} Recipe | FlamingFoodies`,
    seo_description: generated?.seo_description || description.slice(0, 160),
    affiliate_disclosure: true
  };
}

function buildBlogDraft(
  cuisine: CuisineType,
  index: number,
  generated?: z.infer<typeof generatedBlogSchema>,
  imageUrl?: string
) {
  const title =
    generated?.title ||
    `What ${cuisine.replace(/_/g, " ")} cooking teaches us about layered heat`;
  const description =
    generated?.description ||
    `A culture-first look at how ${cuisine.replace(/_/g, " ")} dishes build spicy depth without flattening flavor.`;
  const content =
    generated?.content ||
    `## The draw\n\n${title} is not about brute force. It is about pacing, contrast, and dishes that stay craveable.\n\n## Why it works\n\nThe best spicy food balances heat with acid, texture, and aroma.\n\n## What to cook next\n\nUse this post as a starting point for cooking and reading deeper into the subject.\n`;

  return {
    title,
    description,
    content,
    author_name: "FlamingFoodies",
    category: generated?.category || ["culture", "science", "guides", "gear"][index % 4],
    tags: generated?.tags ?? [cuisine, "spicy-food"],
    image_url: imageUrl ?? null,
    image_alt:
      generated?.image_alt ||
      buildBlogHeroImageAlt({
        title,
        category: generated?.category || ["culture", "science", "guides", "gear"][index % 4],
        cuisineType: generated?.cuisine_type || cuisine
      }),
    heat_level: generated?.heat_level || getHeatLevel(index),
    cuisine_type: generated?.cuisine_type || cuisine,
    scoville_rating: 7 + (index % 3),
    featured: false,
    affiliate_disclosure: true,
    status: "draft",
    source: "ai_generated",
    seo_title: generated?.seo_title || `${title} | FlamingFoodies`,
    seo_description: generated?.seo_description || description.slice(0, 160),
    read_time_minutes: calculateReadTime(content)
  };
}

function buildReviewDraft(
  cuisine: CuisineType,
  index: number,
  generated?: z.infer<typeof generatedReviewSchema>,
  imageUrl?: string
) {
  const productName =
    generated?.product_name || `${cuisine.replace(/_/g, " ")} pepper sauce reserve`;
  const title = generated?.title || `${productName} review`;
  const description =
    generated?.description ||
    `A tasting-focused review of ${productName}, including heat curve, flavor notes, and who it actually suits.`;
  const content =
    generated?.content ||
    `## First taste\n\n${productName} opens with personality and finishes with enough heat to matter.\n\n## Where it lands\n\nThis bottle stands out most when you match it to the right foods and heat tolerance.\n`;

  return {
    title,
    description,
    content,
    product_name: productName,
    brand: generated?.brand || "FlamingFoodies Test Kitchen",
    rating: Number(generated?.rating ?? 4.2),
    price_usd: Number(generated?.price_usd ?? 12.99),
    affiliate_url:
      generated?.affiliate_url || "https://fuegobox.com/products/monthly-subscription",
    image_url: imageUrl ?? null,
    image_alt: generated?.image_alt || `${productName} bottle product image`,
    heat_level: generated?.heat_level || getHeatLevel(index),
    scoville_min: Number(generated?.scoville_min ?? 1500),
    scoville_max: Number(generated?.scoville_max ?? 4500),
    flavor_notes: generated?.flavor_notes ?? ["bright", "smoky", "fruity"],
    cuisine_origin: generated?.cuisine_origin || cuisine,
    category: generated?.category || "hot-sauce",
    pros: generated?.pros ?? ["Balanced heat", "Useful on multiple foods"],
    cons: generated?.cons ?? ["Needs hands-on tasting before publish"],
    tags: generated?.tags ?? [cuisine, "review"],
    recommended: Boolean(generated?.recommended ?? true),
    featured: false,
    source: "ai_generated",
    seo_title: generated?.seo_title || `${title} | FlamingFoodies`,
    seo_description: generated?.seo_description || description.slice(0, 160)
  };
}

function buildGeneratedRecipeQaState(
  payload: ReturnType<typeof buildRecipeDraft>,
  agentReview: AgentQaReview | null,
  heroAsset?: Pick<ResolvedRecipeHeroAsset, "heroSource" | "searchQuery">
) {
  const heroSource =
    heroAsset?.heroSource ??
    (isGeneratedRecipeHeroImageUrl(payload.image_url) ? "generated" : payload.image_url ? "photo" : "generated");
  const automationDecision = getAgentQaAutomationDecision(agentReview);
  const automatedCuisineQa = automationDecision.passesAutomation;
  const automatedHeroReview = Boolean(payload.image_url) && (heroSource === "generated" || automatedCuisineQa);
  const heroSourceNote =
    heroSource === "photo"
      ? "Draft uses a sourced plated dish photo."
      : "Draft uses a recipe-specific illustrated cover after no suitable dish photo was found.";
  const heroQueryNote =
    heroSource === "photo" && heroAsset?.searchQuery
      ? ` Photo search query: "${heroAsset.searchQuery}".`
      : "";
  const baseQaNote =
    automatedHeroReview || automatedCuisineQa
      ? `${heroSourceNote}${heroQueryNote} Automated editorial QA passed where noted.`
      : `${heroSourceNote}${heroQueryNote} Draft is awaiting editorial image review and cuisine QA.`;
  const recipeQaCandidate: Recipe = {
    id: 0,
    type: "recipe",
    slug: "draft",
    title: payload.title,
    description: payload.description,
    intro: payload.intro,
    heroSummary:
      payload.hero_summary ||
      getRecipeHeroSummary({
        description: payload.description,
        intro: payload.intro,
        heroSummary: payload.intro
      }),
    authorName: payload.author_name,
    heatLevel: payload.heat_level,
    cuisineType: payload.cuisine_type,
    prepTimeMinutes: payload.prep_time_minutes,
    cookTimeMinutes: payload.cook_time_minutes,
    totalTimeMinutes: payload.prep_time_minutes + payload.cook_time_minutes,
    activeTimeMinutes: payload.active_time_minutes ?? payload.prep_time_minutes,
    servings: payload.servings,
    difficulty: payload.difficulty,
    ingredients: payload.ingredients,
    ingredientSections: getRecipeIngredientSections({
      ingredients: payload.ingredients,
      ingredientSections: payload.ingredient_sections ?? []
    }),
    instructions: payload.instructions,
    methodSteps: getRecipeMethodSteps({
      instructions: payload.instructions,
      methodSteps:
        payload.method_steps?.map((step) => ({
          step: step.step,
          title: step.title,
          body: step.body,
          tip: step.tip ?? undefined,
          cue: step.cue ?? undefined,
          durationMinutes: step.duration_minutes ?? undefined,
          ingredientRefs: step.ingredient_refs ?? []
        })) ?? []
    }),
    tips: payload.tips,
    variations: payload.variations,
    makeAheadNotes: payload.make_ahead_notes ?? undefined,
    storageNotes: payload.storage_notes ?? undefined,
    reheatNotes: payload.reheat_notes ?? undefined,
    servingSuggestions: payload.serving_suggestions ?? [],
    substitutions: payload.substitutions ?? payload.variations ?? [],
    faqs: payload.faqs ?? [],
    equipment: payload.equipment,
    tags: payload.tags,
    imageUrl: payload.image_url ?? undefined,
    imageAlt: payload.image_alt,
    heroImageReviewed: automatedHeroReview,
    cuisineQaReviewed: automatedCuisineQa,
    qaNotes: buildAgentQaNotes(baseQaNote, agentReview),
    featured: payload.featured,
    source: "ai_generated",
    status: "pending_review",
    viewCount: 0,
    likeCount: 0,
    ratingCount: 0,
    saveCount: 0
  };

  const baseQaReport = buildRecipeQaReport(recipeQaCandidate);
  const qaReport = mergeAgentQaReviewForAutonomousDraft(baseQaReport, agentReview);

  return {
    hero_summary: payload.hero_summary || getRecipeHeroSummary(recipeQaCandidate),
    active_time_minutes: payload.active_time_minutes ?? payload.prep_time_minutes,
    ingredient_sections: getRecipeIngredientSections(recipeQaCandidate),
    method_steps: getRecipeMethodSteps(recipeQaCandidate),
    substitutions: payload.substitutions ?? payload.variations ?? [],
    serving_suggestions: payload.serving_suggestions ?? [],
    faqs: getRecipeFaqs({ faqs: payload.faqs ?? [] }),
    make_ahead_notes: payload.make_ahead_notes ?? null,
    storage_notes: payload.storage_notes ?? null,
    reheat_notes: payload.reheat_notes ?? null,
    hero_image_reviewed: automatedHeroReview,
    cuisine_qa_reviewed: automatedCuisineQa,
    qa_notes: buildAgentQaNotes(baseQaNote, agentReview),
    qa_report: qaReport,
    qa_checked_at: automatedHeroReview || automatedCuisineQa ? new Date().toISOString() : null,
    automated_publish_eligible: shouldAutonomousPublish({
      agentReview,
      baseReport: baseQaReport,
      readinessChecks: [automatedHeroReview, automatedCuisineQa],
      scoreThreshold: AUTOMATED_RECIPE_PUBLISH_SCORE
    })
  };
}

function buildGeneratedBlogQaState(
  payload: ReturnType<typeof buildBlogDraft>,
  agentReview: AgentQaReview | null,
  heroAsset?: Pick<ResolvedEditorialHeroAsset, "heroSource" | "searchQuery">
) {
  const heroSource =
    heroAsset?.heroSource ??
    (usesAutomationHeroCard(payload.image_url) ? "generated" : payload.image_url ? "photo" : "generated");
  const automationDecision = getAgentQaAutomationDecision(agentReview);
  const automatedEditorialQa = automationDecision.passesAutomation;
  const automatedImageQa = Boolean(payload.image_url) && (heroSource === "generated" || automatedEditorialQa);
  const heroSourceNote =
    heroSource === "photo"
      ? "Story draft uses a sourced editorial cover image."
      : "Story draft uses a branded cover image.";
  const heroQueryNote =
    heroSource === "photo" && heroAsset?.searchQuery
      ? ` Photo search query: "${heroAsset.searchQuery}".`
      : "";
  const baseQaNote =
    automatedImageQa || automatedEditorialQa
      ? `${heroSourceNote}${heroQueryNote} Automated editorial QA passed where noted.`
      : `${heroSourceNote}${heroQueryNote} Story draft is awaiting editorial image and content QA.`;
  const blogQaCandidate = {
    id: 0,
    type: "blog" as const,
    slug: "draft",
    title: payload.title,
    description: payload.description,
    imageUrl: payload.image_url ?? undefined,
    imageAlt: payload.image_alt,
    featured: payload.featured,
    source: "ai_generated" as const,
    status: "pending_review" as const,
    publishedAt: undefined,
    tags: payload.tags,
    viewCount: 0,
    likeCount: 0,
    authorName: payload.author_name,
    category: payload.category,
    content: payload.content,
    seoTitle: payload.seo_title,
    seoDescription: payload.seo_description,
    cuisineType: payload.cuisine_type,
    heatLevel: payload.heat_level,
    scovilleRating: payload.scoville_rating,
    readTimeMinutes: payload.read_time_minutes
  };

  const baseQaReport = buildBlogQaReport(blogQaCandidate);
  const qaReport = mergeAgentQaReviewForAutonomousDraft(baseQaReport, agentReview);

  return {
    qaNotes: buildAgentQaNotes(baseQaNote, agentReview),
    qaReport,
    automated_publish_eligible: shouldAutonomousPublish({
      agentReview,
      baseReport: baseQaReport,
      readinessChecks: [automatedImageQa, automatedEditorialQa],
      scoreThreshold: AUTOMATED_BLOG_PUBLISH_SCORE
    })
  };
}

function buildGeneratedReviewQaState(
  payload: ReturnType<typeof buildReviewDraft>,
  agentReview: AgentQaReview | null,
  heroAsset?: Pick<ResolvedReviewHeroAsset, "heroSource" | "searchQuery">
) {
  const heroSource =
    heroAsset?.heroSource ??
    (usesAutomationHeroCard(payload.image_url) ? "generated" : payload.image_url ? "photo" : "generated");
  const automationDecision = getAgentQaAutomationDecision(agentReview);
  const automatedFactQa = automationDecision.passesAutomation;
  const exactImageFound = heroSource === "photo" && hasTrustedReviewProductImage(payload.image_url);
  const automatedImageQa = exactImageFound;
  const baseQaNote = exactImageFound
    ? `Review draft uses a sourced exact product image.${heroAsset?.searchQuery ? ` Photo search query: "${heroAsset.searchQuery}".` : ""} Automated image QA passed where noted.`
    : "Review draft uses an illustrated fallback and is awaiting an exact product image plus editorial fact QA.";
  const reviewQaCandidate: Review = {
    id: 0,
    type: "review",
    slug: "draft",
    title: payload.title,
    description: payload.description,
    productName: payload.product_name,
    brand: payload.brand,
    rating: payload.rating,
    priceUsd: payload.price_usd,
    affiliateUrl: payload.affiliate_url,
    content: payload.content,
    heatLevel: payload.heat_level,
    scovilleMin: payload.scoville_min,
    scovilleMax: payload.scoville_max,
    flavorNotes: payload.flavor_notes,
    cuisineOrigin: payload.cuisine_origin,
    category: payload.category,
    pros: payload.pros,
    cons: payload.cons,
    imageUrl: payload.image_url ?? undefined,
    imageAlt: payload.image_alt,
    imageReviewed: automatedImageQa,
    factQaReviewed: automatedFactQa,
    qaNotes: buildAgentQaNotes(baseQaNote, agentReview),
    qaReport: undefined,
    recommended: payload.recommended,
    featured: payload.featured,
    source: "ai_generated",
    status: "pending_review",
    tags: payload.tags,
    viewCount: 0,
    likeCount: 0
  };

  const baseQaReport = buildReviewQaReport(reviewQaCandidate);
  const qaReport = mergeAgentQaReviewForAutonomousDraft(baseQaReport, agentReview);

  return {
    image_reviewed: automatedImageQa,
    fact_qa_reviewed: automatedFactQa,
    qa_notes: buildAgentQaNotes(baseQaNote, agentReview),
    qa_report: qaReport,
    qa_checked_at: automatedImageQa || automatedFactQa ? new Date().toISOString() : null,
    automated_publish_eligible: shouldAutonomousPublish({
      agentReview,
      baseReport: baseQaReport,
      readinessChecks: [exactImageFound, automatedFactQa],
      scoreThreshold: AUTOMATED_REVIEW_PUBLISH_SCORE
    })
  };
}

async function generateStructuredDraft(
  anthropic: Anthropic | null,
  type: GenerationType,
  context: GenerationContext,
  index: number
) {
  if (!anthropic) {
    return {
      payload: null as Record<string, any> | null,
      output: "",
      tokensUsed: 0
    };
  }

  const response = await requestJsonFromAnthropic(anthropic, buildPrompt(type, context, index), {
    maxTokens:
      type === "recipe"
        ? ANTHROPIC_GENERATION_MAX_TOKENS
        : Math.max(2000, ANTHROPIC_QA_MAX_TOKENS)
  });

  return {
    payload: response.payload,
    output: response.output,
    tokensUsed: response.tokensUsed,
    stopReason: response.stopReason
  };
}

async function getSettingMap(supabase: AdminClient) {
  const { data } = await supabase.from("site_settings").select("key, value");
  return new Map((data ?? []).map((row) => [row.key, row.value]));
}

async function getGenerationScheduleRow(
  supabase: AdminClient,
  type: GenerationType
) {
  const { data } = await supabase
    .from("generation_schedule")
    .select("id, quantity, is_active, last_run_at")
    .eq("job_type", type)
    .maybeSingle();

  return data ?? null;
}

async function insertGeneratedContent(
  supabase: AdminClient,
  anthropic: Anthropic | null,
  type: GenerationType,
  index: number,
  settings: Map<string, any>,
  generated: Record<string, any> | null,
  cuisine: CuisineType
) {
  const autoPublishSetting = settings.get("auto_publish_ai_content");
  const autoPublish =
    autoPublishSetting === undefined ? true : Boolean(autoPublishSetting);
  const delayHours = Number(settings.get("auto_publish_delay_hours") ?? 4);
  const publishAt = autoPublish
    ? new Date(Date.now() + delayHours * 60 * 60 * 1000).toISOString()
    : null;

  if (type === "recipe") {
    const validatedGenerated = await humanizeGeneratedDraft(
      anthropic,
      type,
      validateGeneratedPayload(type, generated)
    );
    const heroAsset = await resolveRecipeHeroAsset({
      generated: validatedGenerated,
      cuisine
    });
    const payload = buildRecipeDraft(
      cuisine,
      index,
      validatedGenerated,
      heroAsset.imageUrl
    );
    const slug = await makeUniqueSlug(supabase, "recipes", payload.title);
    const agentReview = await runEditorialQaReview(anthropic, "recipe", {
      slug,
      ...payload,
      hero_image_source: heroAsset.heroSource,
      hero_image_query_used: heroAsset.searchQuery
    });
    const qaState = buildGeneratedRecipeQaState(payload, agentReview, heroAsset);
    const { automated_publish_eligible: automatedPublishEligible, ...persistedQaState } = qaState;
    const shouldScheduleAutoPublish = Boolean(autoPublish && automatedPublishEligible && publishAt);
    const { data, error } = await supabase
      .from("recipes")
      .insert({
        ...payload,
        ...persistedQaState,
        slug,
        status: shouldScheduleAutoPublish ? "draft" : "pending_review",
        published_at: shouldScheduleAutoPublish ? publishAt : null
      })
      .select("id, slug, title, image_url")
      .single();

    if (error) throw new Error(error.message);

    if (shouldScheduleAutoPublish) {
      await createSocialPostsForContent({
        contentType: "recipe",
        contentId: data.id,
        title: data.title,
        slug: data.slug,
        imageUrl: data.image_url ?? undefined,
        scheduledAt: publishAt
      });
    }

    return {
      resultId: data.id,
      resultType: "recipe",
      slug: data.slug,
      title: data.title,
      publishAt: shouldScheduleAutoPublish ? publishAt : null
    };
  }

  if (type === "blog_post") {
    const validatedGenerated = await humanizeGeneratedDraft(
      anthropic,
      type,
      validateGeneratedPayload(type, generated)
    );
    const heroAsset = await resolveBlogHeroAsset({
      generated: validatedGenerated,
      cuisine
    });
    const payload = buildBlogDraft(
      cuisine,
      index,
      validatedGenerated,
      heroAsset.imageUrl
    );
    const slug = await makeUniqueSlug(supabase, "blog_posts", payload.title);
    const agentReview = await runEditorialQaReview(anthropic, "blog_post", {
      slug,
      ...payload,
      hero_image_source: heroAsset.heroSource,
      hero_image_query_used: heroAsset.searchQuery
    });
    const qaState = buildGeneratedBlogQaState(payload, agentReview, heroAsset);
    const shouldScheduleAutoPublish = Boolean(
      autoPublish && qaState.automated_publish_eligible && publishAt
    );
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        ...payload,
        slug,
        status: shouldScheduleAutoPublish ? "draft" : "pending_review",
        published_at: shouldScheduleAutoPublish ? publishAt : null
      })
      .select("id, slug, title, image_url")
      .single();

    if (error) throw new Error(error.message);

    if (shouldScheduleAutoPublish) {
      await createSocialPostsForContent({
        contentType: "blog_post",
        contentId: data.id,
        title: data.title,
        slug: data.slug,
        imageUrl: data.image_url ?? undefined,
        scheduledAt: publishAt
      });
    }

    return {
      resultId: data.id,
      resultType: "blog_post",
      slug: data.slug,
      title: data.title,
      publishAt: shouldScheduleAutoPublish ? publishAt : null
    };
  }

  const validatedGenerated = await humanizeGeneratedDraft(
    anthropic,
    type,
    validateGeneratedPayload(type, generated)
  );
  const heroAsset = await resolveReviewHeroAsset({
    generated: validatedGenerated,
    cuisine
  });
  const payload = buildReviewDraft(
    cuisine,
    index,
    validatedGenerated,
    heroAsset.imageUrl
  );
  const slug = await makeUniqueSlug(supabase, "reviews", payload.title);
  const agentReview = await runEditorialQaReview(anthropic, "review", {
    slug,
    ...payload,
    hero_image_source: heroAsset.heroSource,
    hero_image_query_used: heroAsset.searchQuery
  });
  const qaState = buildGeneratedReviewQaState(payload, agentReview, heroAsset);
  const shouldScheduleAutoPublish = Boolean(
    autoPublish && qaState.automated_publish_eligible && publishAt
  );
  const { automated_publish_eligible: _reviewAutoPublishEligible, ...persistedQaState } = qaState;
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      ...payload,
      ...persistedQaState,
      slug,
      status: shouldScheduleAutoPublish ? "draft" : "pending_review",
      published_at: shouldScheduleAutoPublish ? publishAt : null
    })
    .select("id, slug, title, image_url")
    .single();

  if (error) throw new Error(error.message);

  if (shouldScheduleAutoPublish) {
    await createSocialPostsForContent({
      contentType: "review",
      contentId: data.id,
      title: data.title,
      slug: data.slug,
      imageUrl: data.image_url ?? undefined,
      scheduledAt: publishAt
    });
  }

  return {
    resultId: data.id,
    resultType: "review",
    slug: data.slug,
    title: data.title,
    publishAt: shouldScheduleAutoPublish ? publishAt : null
  };
}

export async function runGenerationPipeline(
  type: string,
  qty?: number,
  options?: {
    source?: GenerationTriggerSource;
    profile?: GenerationProfile;
  }
) {
  const generationType = (type === "recipe" || type === "blog_post" || type === "review"
    ? type
    : "recipe") as GenerationType;
  const source = options?.source ?? "manual";
  const profile = normalizeGenerationProfile(generationType, options?.profile);
  const requestedQty = Math.min(Math.max(qty ?? 1, 1), 20);
  const sampleHistory = buildSampleGenerationHistory();
  const requestedCuisinePlan = planBalancedCuisines({
    qty: requestedQty,
    type: generationType,
    history: sampleHistory
  });

  if (!flags.hasSupabaseAdmin) {
    return {
      mode: "mock",
      createdJobs: Array.from({ length: requestedQty }, (_, index) => ({
        id: sampleGenerationJobs.length + index + 1,
        type: generationType,
        slug: slugify(
          `${generationType}-${requestedCuisinePlan[index] || "flamingfoodies"}-${Date.now()}-${index}`
        ),
        scheduledCuisine: requestedCuisinePlan[index] || null,
        profile
      }))
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      mode: "mock",
      createdJobs: Array.from({ length: requestedQty }, (_, index) => ({
        id: sampleGenerationJobs.length + index + 1,
        type: generationType,
        slug: slugify(
          `${generationType}-${requestedCuisinePlan[index] || "flamingfoodies"}-${Date.now()}-${index}`
        ),
        scheduledCuisine: requestedCuisinePlan[index] || null,
        profile
      }))
    };
  }

  if (!flags.hasAnthropic) {
    return {
      mode: "disabled",
      createdJobs: [],
      skippedReason:
        source === "cron"
          ? "ANTHROPIC_API_KEY is not configured for scheduled generation."
          : "ANTHROPIC_API_KEY is not configured."
    };
  }

  const settings = await getSettingMap(supabase);
  const scheduleRow = await getGenerationScheduleRow(supabase, generationType);
  if (source === "cron" && scheduleRow?.is_active === false) {
    return {
      mode: "disabled",
      createdJobs: [],
      skippedReason: `${generationType} generation is currently inactive in generation_schedule.`
    };
  }

  const effectiveQty = Math.min(
    Math.max(
      source === "cron" && profile === "default" && scheduleRow?.quantity
        ? Number(scheduleRow.quantity)
        : requestedQty,
      1
    ),
    20
  );
  const generationHistory = await listRecentGenerationHistory(supabase);
  const effectiveCuisines = planBalancedCuisines({
    qty: effectiveQty,
    type: generationType,
    history: generationHistory
  });
  const anthropic = flags.hasAnthropic
    ? new Anthropic({
        apiKey: env.ANTHROPIC_API_KEY
      })
    : null;
  const hotSauceCandidates =
    generationType === "recipe" && profile === "hot_sauce_recipe"
      ? await listPublishedHotSauceCandidates(supabase)
      : [];

  const createdJobs: Array<Record<string, unknown>> = [];
  const planningHistory = [...generationHistory];
  const usedHotSauceSlugs = new Set<string>();

  for (let index = 0; index < effectiveQty; index += 1) {
    const defaultCuisine =
      effectiveCuisines[index] ?? CUISINE_ROTATION[index % CUISINE_ROTATION.length];
    const hotSauceFocus =
      generationType === "recipe" && profile === "hot_sauce_recipe"
        ? pickBalancedHotSauceFocus(
            hotSauceCandidates,
            planningHistory,
            usedHotSauceSlugs,
            index
          )
        : null;
    const generationContext = buildGenerationContext(
      index,
      defaultCuisine,
      profile,
      hotSauceFocus
    );
    planningHistory.unshift({
      type: generationType,
      cuisine: generationContext.cuisine,
      createdAt: new Date().toISOString(),
      profile,
      hotSauceSlug: hotSauceFocus?.slug ?? null
    });
    const { data: job, error: jobError } = await supabase
      .from("content_generation_jobs")
      .insert({
        job_type: generationType,
        model_used: ANTHROPIC_TEXT_MODEL,
        prompt_template:
          generationType === "recipe"
            ? profile === "hot_sauce_recipe"
              ? "RECIPE_PROMPT_HOT_SAUCE"
              : "RECIPE_PROMPT"
            : generationType === "blog_post"
              ? "BLOG_POST_PROMPT"
              : "REVIEW_PROMPT",
        parameters: {
          cuisine_type: generationContext.cuisine,
          heat_level: generationContext.heatLevel,
          profile,
          hot_sauce_slug: hotSauceFocus?.slug ?? null,
          hot_sauce_name: hotSauceFocus
            ? `${hotSauceFocus.brand} ${hotSauceFocus.productName}`
            : null
        },
        status: "queued"
      })
      .select("id, attempts")
      .single();

    if (jobError) {
      throw new Error(jobError.message);
    }

    let lastOutput = "";
    let lastTokensUsed = 0;

    try {
      await supabase
        .from("content_generation_jobs")
        .update({
          status: "generating",
          model_used: ANTHROPIC_TEXT_MODEL,
          started_at: new Date().toISOString(),
          attempts: (job.attempts ?? 0) + 1
        })
        .eq("id", job.id);

      const generated = await generateStructuredDraft(
        anthropic,
        generationType,
        generationContext,
        index
      );
      lastOutput = generated.output;
      lastTokensUsed = generated.tokensUsed;

      if (!generated.payload && generated.stopReason === "max_tokens") {
        throw new Error(
          "Draft generation hit the Anthropic max_tokens limit before completing JSON."
        );
      }

      const inserted = await insertGeneratedContent(
        supabase,
        anthropic,
        generationType,
        index,
        settings,
        generated.payload,
        generationContext.cuisine
      );

      await supabase
        .from("content_generation_jobs")
        .update({
          status: "completed",
          model_used: ANTHROPIC_TEXT_MODEL,
          result_id: inserted.resultId,
          result_type: inserted.resultType,
          tokens_used: lastTokensUsed,
          completed_at: new Date().toISOString()
        })
        .eq("id", job.id);

      createdJobs.push({
        id: job.id,
        type: generationType,
        slug: inserted.slug,
        title: inserted.title,
        scheduledCuisine: generationContext.cuisine,
        publishAt: inserted.publishAt,
        profile,
        featuredSauce: hotSauceFocus
          ? `${hotSauceFocus.brand} ${hotSauceFocus.productName}`
          : null
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Generation failed";
      await supabase
        .from("content_generation_jobs")
        .update({
          status: "failed",
          model_used: ANTHROPIC_TEXT_MODEL,
          error_message:
            typeof lastOutput === "string" && lastOutput.trim()
              ? `${message} Output excerpt: ${summarizeModelOutput(lastOutput)}`
              : message,
          tokens_used: lastTokensUsed,
          completed_at: new Date().toISOString()
        })
        .eq("id", job.id);

      createdJobs.push({
        id: job.id,
        type: generationType,
        scheduledCuisine: generationContext.cuisine,
        profile,
        featuredSauce: hotSauceFocus
          ? `${hotSauceFocus.brand} ${hotSauceFocus.productName}`
          : null,
        error: message
      });
    }
  }

  if (source === "cron" && scheduleRow?.id && profile === "default") {
    await supabase
      .from("generation_schedule")
      .update({
        last_run_at: new Date().toISOString()
      })
      .eq("id", scheduleRow.id);
  }

  return {
    mode: anthropic ? "live" : "mock",
    createdJobs
  };
}

async function publishFromTable(
  supabase: AdminClient,
  table: "blog_posts" | "recipes" | "reviews"
) {
  const { data: rows } = await supabase
    .from(table)
    .select("id, slug, title, published_at, status, source")
    .eq("source", "ai_generated")
    .eq("status", "draft")
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString());

  const published: Array<{ id: number; slug: string; title: string; type: string }> = [];

  for (const row of rows ?? []) {
    const { data, error } = await supabase
      .from(table)
      .update({
        status: "published"
      })
      .eq("id", row.id)
      .select("id, slug, title")
      .single();

    if (!error && data) {
      published.push({
        id: data.id,
        slug: data.slug,
        title: data.title,
        type: table === "blog_posts" ? "blog_post" : table === "recipes" ? "recipe" : "review"
      });
    }
  }

  return published;
}

export async function publishScheduledContent() {
  if (!flags.hasSupabaseAdmin) {
    return {
      published: [
        ...sampleRecipes.filter((recipe) => recipe.status === "published").slice(0, 1),
        ...sampleBlogPosts.filter((post) => post.status === "published").slice(0, 1),
        ...sampleReviews.filter((review) => review.status === "published").slice(0, 1)
      ]
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      published: [
        ...sampleRecipes.filter((recipe) => recipe.status === "published").slice(0, 1),
        ...sampleBlogPosts.filter((post) => post.status === "published").slice(0, 1),
        ...sampleReviews.filter((review) => review.status === "published").slice(0, 1)
      ]
    };
  }

  const recipes = await publishFromTable(supabase, "recipes");
  const blogPosts = await publishFromTable(supabase, "blog_posts");
  const reviews = await publishFromTable(supabase, "reviews");

  return {
    published: [...recipes, ...blogPosts, ...reviews]
  };
}

export async function queueSocialScheduler() {
  if (!flags.hasSupabaseAdmin) {
    return {
      queued: 2,
      published: 0,
      platforms: ["instagram", "pinterest", "facebook"]
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      queued: 2,
      published: 0,
      platforms: ["instagram", "pinterest", "facebook"]
    };
  }

  const { data: pendingPosts } = await supabase
    .from("social_posts")
    .select("id, platform")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(12);

  let queued = 0;

  for (const [index, post] of (pendingPosts ?? []).entries()) {
    const scheduledAt = new Date(Date.now() + (index + 1) * 45 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("social_posts")
      .update({
        status: "scheduled",
        scheduled_at: scheduledAt
      })
      .eq("id", post.id);

    if (!error) {
      queued += 1;
    }
  }

  const publishedNow = await publishDueScheduledSocialPosts();

  return {
    queued,
    published: publishedNow.published,
    platforms: Array.from(new Set((pendingPosts ?? []).map((post) => post.platform)))
  };
}

export async function createWeeklyDigest() {
  if (!flags.hasSupabaseAdmin) {
    return {
      mode: flags.hasAnthropic ? "live" : "mock",
      subject: "This Week’s Hottest Recipes and Sauce Finds",
      draftCount: 1
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      mode: flags.hasAnthropic ? "live" : "mock",
      subject: "This Week’s Hottest Recipes and Sauce Finds",
      draftCount: 1
    };
  }

  const [recipes, blogPosts, reviews, subscribers] = await Promise.all([
    supabase
      .from("recipes")
      .select("title, slug")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(2),
    supabase
      .from("blog_posts")
      .select("title, slug")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(2),
    supabase
      .from("reviews")
      .select("title, slug")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(2),
    supabase
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
  ]);

  const subject = "What to cook, pour, and pass around this week";
  const previewText =
    "A few good dinners, a couple of smart reads, and the bottles worth talking about before the weekend gets away from you.";
  const htmlContent = `
    <h1>${subject}</h1>
    <p>${previewText}</p>
    <p>Here is the short version from FlamingFoodies: a couple of recipes to cook soon, a few stories worth opening, and the hot sauce reads that will save someone from buying the wrong bottle.</p>
    <h2>Cook this next</h2>
    <ul>${(recipes.data ?? [])
      .map((item) => `<li>${item.title}</li>`)
      .join("")}</ul>
    <h2>Read this over coffee</h2>
    <ul>${(blogPosts.data ?? [])
      .map((item) => `<li>${item.title}</li>`)
      .join("")}</ul>
    <h2>Worth pouring</h2>
    <ul>${(reviews.data ?? [])
      .map((item) => `<li>${item.title}</li>`)
      .join("")}</ul>
    <p>Save the links you want for later, send one to the friend who keeps the hot sauce shelf stocked, and we will be back next week with a fresh round.</p>
  `;
  const textContent = [
    subject,
    previewText,
    "",
    "Here is the short version from FlamingFoodies: a couple of recipes to cook soon, a few stories worth opening, and the hot sauce reads that will save someone from buying the wrong bottle.",
    "",
    "Cook this next:",
    ...(recipes.data ?? []).map((item) => `- ${item.title}`),
    "",
    "Read this over coffee:",
    ...(blogPosts.data ?? []).map((item) => `- ${item.title}`),
    "",
    "Worth pouring:",
    ...(reviews.data ?? []).map((item) => `- ${item.title}`),
    "",
    "Save what looks good, send one link to the friend who keeps the hot sauce shelf stocked, and we will be back next week with a fresh round."
  ].join("\n");

  const { error } = await supabase.from("newsletter_campaigns").insert({
    subject,
    preview_text: previewText,
    html_content: htmlContent,
    text_content: textContent,
    status: "draft",
    recipient_count: subscribers.count ?? 0
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    mode: flags.hasAnthropic ? "live" : "mock",
    subject,
    draftCount: 1
  };
}
