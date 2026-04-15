import type {
  CuisineType,
  RecipeQaIssue,
  RecipeQaReport,
  Review
} from "@/lib/types";
import {
  hasTrustedReviewProductImage,
  isLikelyGenericStockReviewImageUrl
} from "@/lib/review-hero";

const tokenStopwords = new Set([
  "and",
  "with",
  "from",
  "that",
  "this",
  "into",
  "over",
  "your",
  "just",
  "have",
  "review",
  "best",
  "easy",
  "quick",
  "style",
  "sauce",
  "hot",
  "food",
  "heat",
  "pepper"
]);

const cuisineSignatures: Partial<Record<CuisineType, string[]>> = {
  jamaican: ["jerk", "allspice", "scotch", "bonnet", "ginger", "thyme"],
  szechuan: ["sichuan", "szechuan", "chili", "peppercorn", "crisp", "numbing"],
  korean: ["gochujang", "gochugaru", "soy", "sesame", "kimchi"],
  thai: ["bird", "lime", "fish", "galangal", "lemongrass"],
  mexican: ["habanero", "verde", "rojo", "chipotle", "lime"],
  italian: ["calabrian", "pepperoncino", "tomato"],
  cajun: ["cajun", "cayenne", "garlic"],
  caribbean: ["scotch", "bonnet", "ginger", "tropical"],
  filipino: ["calamansi", "suka", "garlic", "siling", "toyomansi"],
  greek: ["oregano", "lemon", "olive", "feta"],
  turkish: ["aleppo", "isot", "sumac", "kebab", "yogurt"],
  brazilian: ["malagueta", "moqueca", "dende", "lime"],
  nigerian: ["suya", "yaji", "jollof", "pepper"],
  malaysian: ["sambal", "belacan", "lemongrass", "coconut"]
};

const preReviewedReviewSlugs = new Set([
  "heatonist-los-calientes-rojo-review",
  "fuego-box-monthly-subscription-review",
  "yellowbird-habanero-hot-sauce-review",
  "torchbearer-garlic-reaper-review",
  "queen-majesty-scotch-bonnet-ginger-review",
  "fly-by-jing-sichuan-gold-review",
  "mikes-hot-honey-review",
  "hot-ones-lineup-collection-review",
  "heatonist-gift-set-review",
  "pepper-joe-superhot-seed-pack-review"
]);

type ReviewQaCandidate = Pick<
  Review,
  | "slug"
  | "title"
  | "description"
  | "productName"
  | "brand"
  | "content"
  | "affiliateUrl"
  | "imageUrl"
  | "imageAlt"
  | "heatLevel"
  | "scovilleMin"
  | "scovilleMax"
  | "flavorNotes"
  | "cuisineOrigin"
  | "category"
  | "pros"
  | "cons"
  | "tags"
  | "imageReviewed"
  | "factQaReviewed"
  | "source"
>;

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]+/g, " ");
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !tokenStopwords.has(token));
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function createIssue(
  severity: "blocker" | "warning",
  code: string,
  message: string
): RecipeQaIssue {
  return { severity, code, message };
}

function getImageKeywordOverlap(review: ReviewQaCandidate) {
  const productTokens = unique([
    ...tokenize(review.title),
    ...tokenize(review.productName),
    ...tokenize(review.brand),
    ...tokenize(review.category),
    ...(review.cuisineOrigin ? cuisineSignatures[review.cuisineOrigin] ?? [] : [])
  ]);
  const imageTokens = tokenize(review.imageAlt || "");

  return productTokens.filter((token) =>
    imageTokens.some(
      (imageToken) =>
        imageToken === token ||
        imageToken.startsWith(token) ||
        token.startsWith(imageToken)
    )
  );
}

function getCuisineMatchCount(review: ReviewQaCandidate) {
  if (!review.cuisineOrigin || review.cuisineOrigin === "other") {
    return 0;
  }

  const signature = cuisineSignatures[review.cuisineOrigin] ?? [];
  const corpus = normalizeText(
    [
      review.title,
      review.description,
      review.content,
      review.productName,
      review.brand,
      review.category,
      review.flavorNotes.join(" "),
      review.pros.join(" "),
      review.cons.join(" "),
      review.tags.join(" ")
    ]
      .filter(Boolean)
      .join(" ")
  );

  return signature.filter((token) => corpus.includes(token)).length;
}

export function getReviewManualReviewState(
  review: Pick<Review, "slug" | "imageReviewed" | "factQaReviewed" | "qaNotes">
) {
  const autoReviewed = preReviewedReviewSlugs.has(review.slug);

  return {
    imageReviewed: review.imageReviewed ?? autoReviewed,
    factQaReviewed: review.factQaReviewed ?? autoReviewed,
    qaNotes:
      review.qaNotes ??
      (autoReviewed
        ? "Editorial QA reviewed for product identity, hero image accuracy, and tasting-note credibility."
        : undefined)
  };
}

export function buildReviewQaReport(review: ReviewQaCandidate): RecipeQaReport {
  const blockers: RecipeQaIssue[] = [];
  const warnings: RecipeQaIssue[] = [];
  const imageKeywordOverlap = getImageKeywordOverlap(review);
  const cuisineMatchCount = getCuisineMatchCount(review);

  if (!review.imageUrl) {
    blockers.push(
      createIssue("blocker", "missing-review-image", "Add a product image before publishing.")
    );
  }

  if (!review.imageAlt) {
    blockers.push(
      createIssue(
        "blocker",
        "missing-review-alt",
        "Add descriptive alt text for the review image before publishing."
      )
    );
  } else if (!imageKeywordOverlap.length) {
    blockers.push(
      createIssue(
        "blocker",
        "review-image-mismatch",
        "Review image alt text does not clearly match the product, brand, or category."
      )
    );
  }

  if (!review.imageReviewed) {
    blockers.push(
      createIssue(
        "blocker",
        "review-image-check-required",
        "Manually confirm the review image shows the actual product before publishing."
      )
    );
  }

  if (review.affiliateUrl && !hasTrustedReviewProductImage(review.imageUrl)) {
    blockers.push(
      createIssue(
        "blocker",
        "affiliate-review-exact-image-required",
        "Affiliate-linked reviews need an exact product image, not a stock image or illustrated fallback."
      )
    );
  }

  if (!review.factQaReviewed) {
    blockers.push(
      createIssue(
        "blocker",
        "review-fact-check-required",
        "Manual tasting and fact QA signoff is required before publishing."
      )
    );
  }

  if (isLikelyGenericStockReviewImageUrl(review.imageUrl)) {
    warnings.push(
      createIssue(
        "warning",
        "generic-stock-review-image",
        "Replace the generic stock hero with product-faithful bottle art or a branded review card."
      )
    );
  }

  if (review.scovilleMin && review.scovilleMax && review.scovilleMin > review.scovilleMax) {
    blockers.push(
      createIssue(
        "blocker",
        "invalid-scoville-range",
        "Scoville minimum cannot be higher than the maximum."
      )
    );
  }

  if (review.pros.length < 2) {
    warnings.push(
      createIssue(
        "warning",
        "thin-pros",
        "Add at least two concrete pros so the verdict feels earned."
      )
    );
  }

  if (!review.cons.length) {
    warnings.push(
      createIssue(
        "warning",
        "missing-cons",
        "Add at least one honest drawback so the review reads credibly."
      )
    );
  }

  if (review.flavorNotes.length < 2) {
    warnings.push(
      createIssue(
        "warning",
        "thin-flavor-notes",
        "Add multiple flavor notes so readers understand the sauce beyond heat."
      )
    );
  }

  const plainTextContent = review.content.replace(/<[^>]+>/g, " ").trim();
  if (plainTextContent.length < 220) {
    warnings.push(
      createIssue(
        "warning",
        "short-review-body",
        "Expand the tasting notes so the review has more real-world detail."
      )
    );
  }

  if (review.category === "hot-sauce" && (!review.scovilleMin || !review.scovilleMax)) {
    warnings.push(
      createIssue(
        "warning",
        "missing-scoville-context",
        "Add a Scoville range for hot sauce reviews so the heat claim feels grounded."
      )
    );
  }

  if (review.cuisineOrigin && review.cuisineOrigin !== "other" && cuisineMatchCount < 1) {
    warnings.push(
      createIssue(
        "warning",
        "weak-cuisine-origin-signals",
        "The tasting notes do not strongly reinforce the selected cuisine origin yet."
      )
    );
  }

  const score = Math.max(0, 100 - blockers.length * 18 - warnings.length * 5);
  const status = blockers.length ? "fail" : warnings.length ? "warn" : "pass";

  return {
    status,
    score,
    blockers,
    warnings
  };
}

export function getReviewQaPublishError(report: RecipeQaReport) {
  if (!report.blockers.length) {
    return null;
  }

  return report.blockers[0]?.message || "Review QA blockers must be resolved before publishing.";
}
