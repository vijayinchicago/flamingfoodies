import type { BlogPost, RecipeQaIssue, RecipeQaReport } from "@/lib/types";

function createIssue(
  severity: "blocker" | "warning",
  code: string,
  message: string
): RecipeQaIssue {
  return {
    severity,
    code,
    message
  };
}

function getWordCount(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function getH2Count(content: string) {
  return (content.match(/^##\s+/gm) ?? []).length;
}

function hasBulletList(content: string) {
  return /(^|\n)(?:- |\* |\d+\. )/.test(content);
}

function containsAiDisclosure(content: string) {
  return /\b(as an ai|language model|chatgpt|claude|i can't|i cannot|i do not have access|i'm unable)\b/i.test(
    content
  );
}

const formulaicPhrases = [
  /\bpacked with flavor\b/i,
  /\bperfect for(?: busy)? weeknights?\b/i,
  /\btakes (?:it|things) to the next level\b/i,
  /\bbursting with\b/i,
  /\byou'?ll love\b/i,
  /\bin all the right ways\b/i,
  /\bthe result is(?: a| an)?\b/i,
  /\bwhether you'?re\b/i,
  /\bcomes together\b/i
];

function getFormulaicPhraseHits(content: string) {
  return formulaicPhrases.filter((pattern) => pattern.test(content)).length;
}

function normalizeCuisineLabel(value?: string) {
  return value ? value.replace(/_/g, " ").toLowerCase() : "";
}

export function buildBlogQaReport(post: BlogPost): RecipeQaReport {
  const blockers: RecipeQaIssue[] = [];
  const warnings: RecipeQaIssue[] = [];
  const wordCount = getWordCount(post.content);
  const h2Count = getH2Count(post.content);
  const titleLength = post.title.trim().length;
  const descriptionLength = post.description.trim().length;
  const seoDescriptionLength = (post.seoDescription ?? "").trim().length;
  const cuisineLabel = normalizeCuisineLabel(post.cuisineType);
  const lowerContent = post.content.toLowerCase();
  const lowerTitle = post.title.toLowerCase();
  const formulaicPhraseHits = getFormulaicPhraseHits(
    `${post.title}\n${post.description}\n${post.content}`
  );

  if (wordCount < 450) {
    blockers.push(
      createIssue(
        "blocker",
        "blog-word-count",
        "Blog draft is too thin for auto-publish and needs more useful depth."
      )
    );
  } else if (wordCount < 900) {
    warnings.push(
      createIssue(
        "warning",
        "blog-word-count-warning",
        "Blog draft is publishable, but a bit more depth would make it more competitive in search."
      )
    );
  }

  if (h2Count < 3) {
    blockers.push(
      createIssue(
        "blocker",
        "blog-structure",
        "Blog draft needs at least three clear H2 sections before auto-publish."
      )
    );
  }

  if (containsAiDisclosure(post.content)) {
    blockers.push(
      createIssue(
        "blocker",
        "blog-ai-disclosure",
        "Blog draft contains AI/meta language that should never ship to readers."
      )
    );
  }

  if (!hasBulletList(post.content)) {
    warnings.push(
      createIssue(
        "warning",
        "blog-list-support",
        "Blog draft would scan better with at least one short bullet or numbered list."
      )
    );
  }

  if (formulaicPhraseHits >= 2) {
    warnings.push(
      createIssue(
        "warning",
        "blog-formulaic-voice",
        "Blog draft leans on generic content phrases and needs a more human editorial voice."
      )
    );
  }

  if (post.tags.length < 3) {
    warnings.push(
      createIssue(
        "warning",
        "blog-tag-depth",
        "Blog draft should carry at least three useful tags for stronger internal linking."
      )
    );
  }

  if (titleLength < 36 || titleLength > 78) {
    warnings.push(
      createIssue(
        "warning",
        "blog-title-length",
        "Blog title is outside the preferred launch range for strong clickthrough."
      )
    );
  }

  if (descriptionLength < 90) {
    warnings.push(
      createIssue(
        "warning",
        "blog-description-depth",
        "Blog description is short and could do more to set reader expectations."
      )
    );
  }

  if (seoDescriptionLength > 0 && (seoDescriptionLength < 110 || seoDescriptionLength > 165)) {
    warnings.push(
      createIssue(
        "warning",
        "blog-seo-description",
        "SEO description should usually land in the 110-165 character range."
      )
    );
  }

  if (
    cuisineLabel &&
    !["other", "american"].includes(cuisineLabel) &&
    !lowerContent.includes(cuisineLabel) &&
    !lowerTitle.includes(cuisineLabel)
  ) {
    warnings.push(
      createIssue(
        "warning",
        "blog-cuisine-reference",
        "Blog draft sets a cuisine lane but barely references it in the body or title."
      )
    );
  }

  if (
    post.heatLevel &&
    !/heat|spice|chili|chile|pepper/i.test(post.content) &&
    !lowerTitle.includes(post.heatLevel)
  ) {
    warnings.push(
      createIssue(
        "warning",
        "blog-heat-reference",
        "Blog draft should connect its topic more directly to heat, peppers, or spicy cooking."
      )
    );
  }

  const score = Math.max(0, 100 - blockers.length * 18 - warnings.length * 5);

  return {
    status: blockers.length ? "fail" : warnings.length ? "warn" : "pass",
    score,
    blockers,
    warnings
  };
}

export function getBlogQaPublishError(report: RecipeQaReport) {
  if (!report.blockers.length) {
    return null;
  }

  return report.blockers[0]?.message || "Blog QA blockers must be resolved before publishing.";
}
