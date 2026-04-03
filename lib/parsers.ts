import type { RecipeIngredient, RecipeInstruction } from "@/lib/types";

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
