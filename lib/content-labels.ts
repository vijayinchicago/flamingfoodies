import type { ContentSource } from "@/lib/types";

const automationQaNoteRewrites: Array<[string, string]> = [
  [
    "AI-generated draft uses a sourced plated dish photo.",
    "Draft uses a sourced plated dish photo."
  ],
  [
    "AI-generated draft uses a recipe-specific generated hero illustration after no suitable dish photo was found.",
    "Draft uses a recipe-specific illustrated cover after no suitable dish photo was found."
  ],
  [
    "AI-generated story uses a branded hero card and passed automated editorial QA checks where noted.",
    "Story draft uses a branded cover image and passed automated editorial QA checks where noted."
  ],
  [
    "AI-generated story is awaiting editorial image and content QA.",
    "Story draft is awaiting editorial image and content QA."
  ],
  [
    "AI-generated review uses a branded review card and passed automated editorial QA checks where noted.",
    "Review draft uses a branded cover image and passed automated editorial QA checks where noted."
  ],
  [
    "AI-generated draft awaiting editorial product-image and fact QA.",
    "Draft is awaiting editorial product-image and fact QA."
  ],
  [
    "AI editorial QA verdict:",
    "Editorial QA verdict:"
  ]
];

export function formatContentSourceLabel(source?: ContentSource | string) {
  if (source === "ai_generated") return "FlamingFoodies";
  if (source === "community") return "Community";
  return "Editorial";
}

export function sanitizeAutomationAuthorName(authorName?: string) {
  if (!authorName) return authorName;

  if (authorName === "FlamingFoodies AI Test Kitchen") {
    return "FlamingFoodies Test Kitchen";
  }

  if (authorName === "FlamingFoodies AI Desk") {
    return "FlamingFoodies Team";
  }

  return authorName;
}

export function sanitizeAutomationTags(tags: string[] | null | undefined) {
  return (tags ?? []).filter((tag) => {
    const normalized = tag.trim().toLowerCase();
    return normalized !== "ai-generated" && normalized !== "ai generated";
  });
}

export function sanitizeAutomationQaNotes(notes?: string | null) {
  if (!notes) return undefined;

  return automationQaNoteRewrites.reduce(
    (current, [from, to]) => current.replaceAll(from, to),
    notes
  );
}
