import { z } from "zod";
import { getEditorialCopyIssues } from "@/lib/generation/editorial-policy";

export const AFFILIATE_REVIEW_PATH = "/admin/automation/affiliate-reviews";
export const AFFILIATE_REVIEW_AGENT = "affiliate-product-reviewer" as const;
export const REVIEW_DISCLOSURE = "We may earn a commission from qualifying purchases made through our links, at no extra cost to you.";
export const REVIEW_METHOD = "This is a research-based product assessment, not a hands-on test.";

export function normalizeProductName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function productIdentity(product: string, destination: string) {
  const asin = destination.match(/amazon\.[^/]+\/(?:dp|gp\/product)\/([a-z0-9]{10})(?:[/?]|$)/i)?.[1];
  return asin ? `asin:${asin.toUpperCase()}` : `name:${normalizeProductName(product)}`;
}

export function safeSourceUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password &&
      url.hostname.includes(".") && !/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|\[)/i.test(url.hostname);
  } catch { return false; }
}

export const reviewDraftSchema = z.object({
  title: z.string().min(12).max(160),
  description: z.string().min(50).max(350),
  sections: z.array(z.object({
    heading: z.string().min(3).max(100),
    body: z.string().min(40).max(2200),
    sourceUrls: z.array(z.string().url()).min(1).max(5)
  }).strict()).min(3).max(7),
  pros: z.array(z.string().min(10).max(250)).min(1).max(4),
  cons: z.array(z.string().min(10).max(250)).min(1).max(4),
  unknowns: z.array(z.string().max(350)).max(8)
}).strict();

export type AffiliateReviewDraft = z.infer<typeof reviewDraftSchema>;
export type ResearchCitation = { url: string; title: string; citedText: string };

/** Only provider-returned citations count as evidence, never URLs invented in generated JSON. */
export function extractResearchCitations(content: unknown): ResearchCitation[] {
  if (!Array.isArray(content)) return [];
  const citations: ResearchCitation[] = [];
  for (const block of content) {
    if (block?.type !== "text" || !Array.isArray(block.citations)) continue;
    for (const citation of block.citations) {
      if (citation.type !== "web_search_result_location" || !safeSourceUrl(citation.url ?? "") || !citation.cited_text) continue;
      if (!citations.some((item) => item.url === citation.url && item.citedText === citation.cited_text)) {
        citations.push({ url: citation.url, title: String(citation.title ?? citation.url), citedText: citation.cited_text });
      }
    }
  }
  return citations;
}

export function reviewDraftBlockers(draft: AffiliateReviewDraft, citations: ResearchCitation[]) {
  const issues = getEditorialCopyIssues(draft).map((issue) => issue.message);
  const urls = new Set(citations.map((citation) => citation.url));
  if (urls.size < 2) issues.push("At least two cited product sources are required.");
  if (draft.sections.some((section) => section.sourceUrls.some((url) => !urls.has(url)))) {
    issues.push("The draft cites a URL that was not returned as a research citation.");
  }
  const copy = JSON.stringify(draft);
  if (/\b(?:we|I|our team)\s+(?:tested|tasted|tried|used|bought|cooked|found|loved)\b|\b(?:our test kitchen|our hands-on test|in our testing)\b/i.test(copy)) {
    issues.push("Remove unsupported first-hand testing or tasting claims.");
  }
  if (/\$\s*\d|\b\d(?:\.\d)?\s*(?:\/\s*5|out of (?:5|five)|stars?)\b/i.test(copy)) {
    issues.push("Do not invent or embed a price or star rating in research drafts.");
  }
  if (/<\/?[a-z][^>]*>|\]\([^)]*\)|https?:\/\//i.test(JSON.stringify({
    title: draft.title, description: draft.description,
    sections: draft.sections.map(({ heading, body }) => ({ heading, body })),
    pros: draft.pros, cons: draft.cons, unknowns: draft.unknowns
  }))) issues.push("Keep links in the validated sources list and use plain text, not HTML.");
  return [...new Set(issues)];
}

export function estimateReviewCost(model: string, input: number, output: number, searches: number) {
  // Estimate, not billing reconciliation. Unknown models intentionally remain unpriced.
  // Rates checked 2026-09-07: https://platform.claude.com/docs/en/about-claude/pricing
  if (!model.startsWith("claude-haiku-4-5")) return null;
  return (input + output * 5) / 1_000_000 + searches * 0.01;
}
