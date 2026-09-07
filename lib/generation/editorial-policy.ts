import policy from "@/lib/generation/editorial-policy.json";
import type { RecipeQaIssue } from "@/lib/types";

export const FLAMINGFOODIES_EDITORIAL_POLICY = policy.rules.map((rule) => `- ${rule}`).join("\n");

const artifactPatterns = policy.artifactPatterns.map((pattern) => new RegExp(pattern, "i"));
const fillerPatterns = policy.fillerPatterns.map((pattern) => new RegExp(pattern, "i"));
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
  const copy = collectCopy(value).join("\n");
  const issues: RecipeQaIssue[] = [];
  if (artifactPatterns.some((pattern) => pattern.test(copy))) {
    issues.push({ severity: "blocker", code: "editorial-generation-artifact", message: "Remove generation markup, assistant boilerplate or invisible formatting artifacts from public copy." });
  }
  const filler = fillerPatterns.flatMap((pattern) => copy.match(pattern)?.[0] ?? []);
  if (filler.length) {
    issues.push({ severity: "blocker", code: "editorial-stock-filler", message: `Replace stock praise with useful specifics: ${[...new Set(filler)].join(", ")}.` });
  }
  const jargon = planningJargonPatterns.flatMap((pattern) => copy.match(pattern)?.[0] ?? []);
  if (jargon.length) {
    issues.push({ severity: "blocker", code: "editorial-planning-jargon", message: `Replace internal planning jargon with reader-facing specifics: ${[...new Set(jargon)].join(", ")}.` });
  }
  return issues;
}

export function assertEditorialCopy(value: unknown): void {
  const issues = getEditorialCopyIssues(value);
  if (issues.length) throw new Error(`Editorial copy check: ${issues.map((issue) => issue.message).join(" ")}`);
}
