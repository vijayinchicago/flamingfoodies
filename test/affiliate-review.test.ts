import { describe, expect, it } from "vitest";
import {
  estimateReviewCost, extractResearchCitations, normalizeProductName,
  productIdentity, reviewDraftBlockers, reviewDraftSchema, safeSourceUrl,
  type AffiliateReviewDraft, type ResearchCitation
} from "@/lib/affiliate-review";

const citations: ResearchCitation[] = [
  { url: "https://maker.example/product", title: "Manufacturer", citedText: "The bottle contains vinegar and peppers." },
  { url: "https://retailer.example/product", title: "Retailer", citedText: "Product model ABC." }
];
const draft: AffiliateReviewDraft = {
  title: "A closer look at the pepper sauce",
  description: "A research-based look at the documented ingredients and what remains unknown about this sauce.",
  sections: ["Ingredients", "Who it suits", "What to check"].map((heading) => ({ heading,
    body: "The manufacturer lists vinegar and peppers. Check the product label before buying if either ingredient is a concern.", sourceUrls: citations.map((c) => c.url) })),
  pros: ["The manufacturer publishes a full ingredient list."],
  cons: ["Actual heat preference will vary; this has not been taste-tested by our editors."],
  unknowns: ["Texture and personal heat preference have not been assessed."]
};

describe("affiliate review evidence and draft safeguards", () => {
  it("accepts a sourced assessment that explicitly disclaims tasting", () => {
    expect(reviewDraftSchema.safeParse(draft).success).toBe(true);
    expect(reviewDraftBlockers(draft, citations)).toEqual([]);
  });
  it("deduplicates punctuation variants and exact ASIN aliases", () => {
    expect(normalizeProductName("Maker’s: Sauce!")).toBe("makerssauce");
    expect(productIdentity("Sauce", "https://www.amazon.com/dp/B012345678?tag=x")).toBe("asin:B012345678");
    expect(productIdentity("Another alias", "https://www.amazon.com/gp/product/B012345678/")).toBe("asin:B012345678");
    expect(productIdentity("Sauce", "https://example.com/product")).toBe("name:sauce");
  });
  it("rejects executable and local source URLs", () => {
    for (const url of ["javascript:alert(1)", "http://example.com", "https://localhost/a", "https://127.0.0.1/a", "https://user:pass@example.com"]) expect(safeSourceUrl(url)).toBe(false);
    expect(safeSourceUrl("https://maker.example/product")).toBe(true);
  });
  it("only trusts native search citation objects, not generated URLs", () => {
    expect(extractResearchCitations([{ type: "text", text: citations[0].url }])).toEqual([]);
    const citation = { type: "web_search_result_location", url: citations[0].url, title: "Manufacturer", cited_text: citations[0].citedText };
    expect(extractResearchCitations([{ type: "text", citations: [citation, citation] }])).toEqual([citations[0]]);
  });
  it("rejects model-supplied rating, price or affiliate fields", () => {
    for (const extra of [{ rating: 5 }, { price_usd: 20 }, { affiliate_url: "https://example.com/commission" }]) expect(reviewDraftSchema.safeParse({ ...draft, ...extra }).success).toBe(false);
  });
  it("requires source coverage and flags invented source URLs", () => {
    expect(reviewDraftBlockers(draft, [])).toContain("At least two cited product sources are required.");
    const changed = structuredClone(draft);
    changed.sections[0].sourceUrls = ["https://invented.example/product"];
    expect(reviewDraftBlockers(changed, citations).some((issue) => issue.includes("not returned"))).toBe(true);
  });
  it("blocks fake testing, prices, ratings and planning jargon", () => {
    for (const body of ["We tested this sauce and loved it.", "The current price is $12.99.", "We give this 4.5 out of 5.", "What this lane covers."]) {
      const changed = structuredClone(draft);
      changed.sections[0].body = body;
      expect(reviewDraftBlockers(changed, citations).length).toBeGreaterThan(0);
    }
  });
  it("blocks HTML and links outside validated source fields", () => {
    const changed = structuredClone(draft);
    changed.sections[0].body = '<a href="https://wrong.example">Buy here</a>';
    expect(reviewDraftBlockers(changed, citations).some((issue) => issue.includes("plain text"))).toBe(true);
  });
  it("does not estimate unrecognized model prices", () => {
    expect(estimateReviewCost("unknown", 1000, 1000, 2)).toBeNull();
    expect(estimateReviewCost("claude-haiku-4-5-20251001", 1000, 1000, 2)).toBeCloseTo(0.026);
  });
});
