import { describe, expect, it } from "vitest";

import {
  parseCsvList,
  parseLineList,
  parseRecipeIngredients,
  parseRecipeInstructions
} from "@/lib/parsers";

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
});
