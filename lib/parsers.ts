import { z } from "zod";

import type {
  RecipeFaq,
  RecipeIngredient,
  RecipeIngredientSection,
  RecipeInstruction,
  RecipeMethodStep
} from "@/lib/types";

export function parseLineList(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseCsvList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function parseRecipeIngredients(value: string): RecipeIngredient[] {
  return parseLineList(value).map((line) => {
    const [amount = "", unit = "", item = "", notes = ""] = line
      .split("|")
      .map((part) => part.trim());

    return {
      amount,
      unit,
      item: item || amount,
      notes: notes || undefined
    };
  });
}

export function parseRecipeInstructions(value: string): RecipeInstruction[] {
  return parseLineList(value).map((line, index) => {
    const [text = "", tip = ""] = line.split("|").map((part) => part.trim());

    return {
      step: index + 1,
      text,
      tip: tip || undefined
    };
  });
}

const ingredientSchema = z.object({
  amount: z.string().trim().default(""),
  unit: z.string().trim().default(""),
  item: z.string().trim().min(1),
  notes: z.string().trim().optional()
});

const ingredientSectionSchema = z.object({
  title: z.string().trim().min(1),
  items: z.array(ingredientSchema).min(1)
});

const methodStepSchema = z.object({
  step: z.coerce.number().int().min(1).optional(),
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  tip: z.string().trim().optional(),
  cue: z.string().trim().optional(),
  durationMinutes: z.coerce.number().int().min(1).optional(),
  ingredientRefs: z.array(z.string().trim().min(1)).optional(),
  imageUrl: z.string().url().optional(),
  imageAlt: z.string().trim().optional()
});

const faqSchema = z.object({
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1)
});

function parseJsonInput(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return [];
  }

  try {
    return JSON.parse(normalized);
  } catch {
    throw new Error("Invalid structured recipe payload");
  }
}

export function parseRecipeIngredientSections(value: string): RecipeIngredientSection[] {
  const parsed = z.array(ingredientSectionSchema).safeParse(parseJsonInput(value));

  if (!parsed.success) {
    throw new Error("Ingredient sections are invalid");
  }

  return parsed.data.map((section) => ({
    title: section.title,
    items: section.items.map((item) => ({
      amount: item.amount,
      unit: item.unit,
      item: item.item,
      notes: item.notes || undefined
    }))
  }));
}

export function parseRecipeMethodSteps(value: string): RecipeMethodStep[] {
  const parsed = z.array(methodStepSchema).safeParse(parseJsonInput(value));

  if (!parsed.success) {
    throw new Error("Method steps are invalid");
  }

  return parsed.data.map((step, index) => ({
    step: index + 1,
    title: step.title,
    body: step.body,
    tip: step.tip || undefined,
    cue: step.cue || undefined,
    durationMinutes: step.durationMinutes || undefined,
    ingredientRefs: step.ingredientRefs?.filter(Boolean) || undefined,
    imageUrl: step.imageUrl || undefined,
    imageAlt: step.imageAlt || undefined
  }));
}

export function parseStringListJson(value: string) {
  const parsed = z.array(z.string().trim().min(1)).safeParse(parseJsonInput(value));

  if (!parsed.success) {
    throw new Error("List payload is invalid");
  }

  return parsed.data;
}

export function parseRecipeFaqs(value: string): RecipeFaq[] {
  const parsed = z.array(faqSchema).safeParse(parseJsonInput(value));

  if (!parsed.success) {
    throw new Error("FAQ payload is invalid");
  }

  return parsed.data.map((faq) => ({
    question: faq.question,
    answer: faq.answer
  }));
}
