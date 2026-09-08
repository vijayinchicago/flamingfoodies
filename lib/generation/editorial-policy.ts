import policy from "@/lib/generation/editorial-policy.json";
import type { RecipeQaIssue } from "@/lib/types";

export const FLAMINGFOODIES_EDITORIAL_POLICY = policy.rules.map((rule) => `- ${rule}`).join("\n");

const artifactPatterns = policy.artifactPatterns.map((pattern) => new RegExp(pattern, "i"));
const fillerPatterns = policy.fillerPatterns.map((pattern) => new RegExp(pattern, "i"));
const boilerplatePatterns = policy.boilerplatePatterns.map((pattern) => new RegExp(pattern, "i"));
const planningJargonPatterns = policy.planningJargonPatterns.map((pattern) => new RegExp(pattern, "i"));

// Scan copy, not provenance, URLs, internal QA messages or publishing metadata.
const excludedFields = /(?:url|slug|source|credit|license|disclosure|qa|author|reviewed|status|model|prompt|token|_id$|^id$|^recipe_?lane$)/i;

function collectCopy(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectCopy);
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => excludedFields.test(key) ? [] : collectCopy(child));
}

/** Deterministic checks for known artifacts, not a statistical AI-authorship detector. */
export function getEditorialCopyIssues(value: unknown): RecipeQaIssue[] {
  const pieces = collectCopy(value);
  const copy = pieces.join("\n");
  const issues: RecipeQaIssue[] = [];
  if (artifactPatterns.some((pattern) => pattern.test(copy))) {
    issues.push({ severity: "blocker", code: "editorial-generation-artifact", message: "Remove generation markup, assistant boilerplate or invisible formatting artifacts from public copy." });
  }
  const filler = fillerPatterns.flatMap((pattern) => copy.match(pattern)?.[0] ?? []);
  if (filler.length) {
    issues.push({ severity: "blocker", code: "editorial-stock-filler", message: `Replace stock praise with useful specifics: ${[...new Set(filler)].join(", ")}.` });
  }
  const jargon = pieces.flatMap((piece) => planningJargonPatterns.flatMap((pattern) => piece.match(pattern)?.[0] ?? []));
  const boilerplate = pieces.flatMap((piece) => boilerplatePatterns.flatMap((pattern) => piece.match(pattern)?.[0] ?? []));
  if (boilerplate.length) {
    issues.push({ severity: "blocker", code: "editorial-template-filler", message: `Remove generic slogans or replace them with supported specifics: ${[...new Set(boilerplate)].join(", ")}.` });
  }
  const repeatedParagraph = pieces.some((piece) => {
    const seen = new Set<string>();
    return piece.split(/\n\s*\n/).some((paragraph) => {
      const normalized = paragraph.trim().replace(/\s+/g, " ").toLowerCase();
      if (normalized.length < 100) return false;
      if (seen.has(normalized)) return true;
      seen.add(normalized);
      return false;
    });
  });
  if (repeatedParagraph) {
    issues.push({ severity: "blocker", code: "editorial-repeated-paragraph", message: "Remove the duplicated paragraph; do not restate the same explanation to fill space." });
  }
  if (jargon.length) {
    issues.push({ severity: "blocker", code: "editorial-planning-jargon", message: `Replace internal planning jargon with reader-facing specifics: ${[...new Set(jargon)].join(", ")}.` });
  }
  return issues;
}

export function assertEditorialCopy(value: unknown): void {
  const issues = getEditorialCopyIssues(value);
  if (issues.length) throw new Error(`Editorial copy check: ${issues.map((issue) => issue.message).join(" ")}`);
}
