import { describe, expect, it } from "vitest";
import { assertEditorialCopy, getEditorialCopyIssues, FLAMINGFOODIES_EDITORIAL_POLICY } from "@/lib/generation/editorial-policy";
import { RECIPE_PROMPT, BLOG_POST_PROMPT, REVIEW_PROMPT, SOCIAL_CAPTION_PROMPT } from "@/lib/generation/prompts";

describe("shared editorial copy checks", () => {
  it.each([
    "As an AI, I cannot taste this.",
    "As a large language model, I cannot taste this.",
    "As a language model, here is a recipe.",
    "Soup :contentReference[oaicite:0]{index=0}",
    "Written by ChatGPT",
    "Soup\u200b with noodles",
    "Sauce \ue200cite\ue202turn0search1\ue201",
    "<antml:thinking>draft plan</antml:thinking>",
    "<analysis>reasoning</analysis>",
    "Certainly! Here is the recipe."
  ])("blocks generation artifacts in nested public copy: %s", (text) => {
    expect(getEditorialCopyIssues({ faqs: [{ answer: text }] })).toContainEqual(expect.objectContaining({ code: "editorial-generation-artifact", severity: "blocker" }));
  });

  it.each(["A mouthwatering dinner", "A game-changer", "Packed with flavor", "Make your taste buds dance"])("blocks stock praise: %s", (description) => {
    expect(() => assertEditorialCopy({ description })).toThrow("Replace stock praise");
  });

  it("preserves legitimate language, provenance, disclosures and links", () => {
    const draft = {
      title: "Crème fraîche, sichuan pepper and piri-piri",
      intro: "I cannot recommend freezing the garnish. Claude's sauce has vinegar in it. Cook until browned—about 10 minutes. مرچ मिर्च 👩‍🍳",
      source: "ai_generated", qaNotes: "As an AI: rejected previous draft",
      sourceUrl: "https://example.com/turn0search1", disclosure: "Written by ChatGPT; edited by the publisher."
    };
    expect(getEditorialCopyIssues(draft)).toEqual([]);
    expect(() => assertEditorialCopy(draft)).not.toThrow();
  });

  it("does not mutate copy or remove credits", () => {
    const draft = { description: "A game-changer", imageCredit: "Creator / license" };
    const before = structuredClone(draft);
    getEditorialCopyIssues(draft);
    expect(draft).toEqual(before);
  });

  it.each([
    "What this lane covers.", "Stay in the same heat lane", "Flavor lanes for dinner",
    "Choose newsletter lanes", "Browse by intent", "A stronger why-buy case",
    "Build content pillars", "Use engagement signals", "Improve the conversion funnel"
  ])("blocks internal planning jargon in public copy: %s", (text) => {
    expect(getEditorialCopyIssues({ faqs: [{ answer: text }] })).toContainEqual(expect.objectContaining({ code: "editorial-planning-jargon", severity: "blocker" }));
    expect(() => assertEditorialCopy({ seo_description: text })).toThrow("planning jargon");
  });

  it("allows literal lanes, culinary clusters and internal taxonomy", () => {
    expect(getEditorialCopyIssues({
      content: "The bakery is on Penny Lane. Serve clusters of roasted grapes. Work on a floured surface.",
      recipe_lane: "heat lane", recipeLane: "kitchen lane", qaNotes: "Reject this lane wording.",
      sourceUrl: "https://example.com/content-pillars", imageCredit: "Lane Photography"
    })).toEqual([]);
  });

  it("shares the rules across prompt templates", () => {
    expect(RECIPE_PROMPT({ cuisine_type: "mexican", heat_level: "medium" })).toContain(FLAMINGFOODIES_EDITORIAL_POLICY);
    expect(SOCIAL_CAPTION_PROMPT({ type: "recipe", title: "Salsa" }, "instagram")).toContain(FLAMINGFOODIES_EDITORIAL_POLICY);
    expect(BLOG_POST_PROMPT({ category: "culture" })).toContain(FLAMINGFOODIES_EDITORIAL_POLICY);
    expect(REVIEW_PROMPT({ category: "hot-sauce" })).toContain(FLAMINGFOODIES_EDITORIAL_POLICY);
  });
});
