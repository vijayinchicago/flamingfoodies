import { describe, expect, it } from "vitest";

import {
  parseCsvList,
  parseLineList,
  parseRecipeFaqs,
  parseRecipeIngredients,
  parseRecipeIngredientSections,
  parseRecipeInstructions,
  parseRecipeMethodSteps,
  parseStringListJson
} from "@/lib/parsers";
import { getRecipeIngredientSections, getRecipeMethodSteps, scaleIngredientAmount } from "@/lib/recipes";

describe("parsers", () => {
  it("parses line lists and trims blank lines", () => {
    expect(parseLineList("one\n\ntwo\n three ")).toEqual(["one", "two", "three"]);
  });

  it("parses csv lists into lowercase tokens", () => {
    expect(parseCsvList("Spicy, Weeknight,  Noodles ")).toEqual([
      "spicy",
      "weeknight",
      "noodles"
    ]);
  });

  it("parses recipe ingredients from pipe syntax", () => {
    expect(
      parseRecipeIngredients("1 | tbsp | gochujang | fermented chilli paste")
    ).toEqual([
      {
        amount: "1",
        unit: "tbsp",
        item: "gochujang",
        notes: "fermented chilli paste"
      }
    ]);
  });

  it("parses recipe instructions with optional tips", () => {
    expect(parseRecipeInstructions("Whisk the sauce | reserve noodle water")).toEqual([
      {
        step: 1,
        text: "Whisk the sauce",
        tip: "reserve noodle water"
      }
    ]);
  });

  it("parses structured ingredient sections from json", () => {
    expect(
      parseRecipeIngredientSections(
        JSON.stringify([
          {
            title: "For the sauce",
            items: [{ amount: "2", unit: "tbsp", item: "gochujang" }]
          }
        ])
      )
    ).toEqual([
      {
        title: "For the sauce",
        items: [{ amount: "2", unit: "tbsp", item: "gochujang", notes: undefined }]
      }
    ]);
  });

  it("parses structured recipe method steps from json", () => {
    expect(
      parseRecipeMethodSteps(
        JSON.stringify([
          {
            title: "Whisk the sauce",
            body: "Stir until smooth.",
            cue: "No dry pockets remain.",
            durationMinutes: 2,
            ingredientRefs: ["gochujang", "soy sauce"]
          }
        ])
      )
    ).toEqual([
      {
        step: 1,
        title: "Whisk the sauce",
        body: "Stir until smooth.",
        cue: "No dry pockets remain.",
        tip: undefined,
        durationMinutes: 2,
        ingredientRefs: ["gochujang", "soy sauce"],
        imageUrl: undefined,
        imageAlt: undefined
      }
    ]);
  });

  it("parses string list json and faqs", () => {
    expect(parseStringListJson(JSON.stringify(["One", "Two"]))).toEqual(["One", "Two"]);
    expect(
      parseRecipeFaqs(
        JSON.stringify([{ question: "Can I make it ahead?", answer: "Yes, one day ahead." }])
      )
    ).toEqual([{ question: "Can I make it ahead?", answer: "Yes, one day ahead." }]);
  });
});

describe("recipe normalization", () => {
  it("derives grouped ingredients for legacy recipes", () => {
    expect(
      getRecipeIngredientSections({
        ingredients: [{ amount: "1", unit: "tbsp", item: "gochujang" }]
      })
    ).toEqual([
      {
        title: "For the recipe",
        items: [{ amount: "1", unit: "tbsp", item: "gochujang", notes: undefined }]
      }
    ]);
  });

  it("derives method steps for legacy recipes", () => {
    expect(
      getRecipeMethodSteps({
        instructions: [{ step: 1, text: "Whisk the sauce until smooth.", tip: "Do not rush it." }]
      })
    ).toEqual([
      {
        step: 1,
        title: "Whisk the sauce until smooth",
        body: "Whisk the sauce until smooth.",
        tip: "Do not rush it.",
        cue: "Do not rush it."
      }
    ]);
  });

  it("scales ingredient amounts when the amount is numeric or fractional", () => {
    expect(scaleIngredientAmount("1 1/2", 2)).toBe("3");
    expect(scaleIngredientAmount("1/2", 3)).toBe("1 1/2");
    expect(scaleIngredientAmount("to taste", 2)).toBe("to taste");
  });
});
