const BLOG_REVIEW_HOLD_SLUGS = new Set([
  "best-hot-sauces-for-taco-night",
  "how-to-build-your-first-hot-sauce-shelf",
  "how-to-pick-a-hot-sauce-for-eggs-breakfast-tacos-and-hash",
  "what-makes-a-hot-sauce-good-on-pizza-and-wings",
  "how-to-choose-a-hot-sauce-for-seafood"
]);

export function isReviewHoldBlogSlug(slug: string) {
  return BLOG_REVIEW_HOLD_SLUGS.has(slug);
}

export function shouldPromoteBlogPost(input: { slug: string; source: string }) {
  return input.source !== "ai_generated" && !isReviewHoldBlogSlug(input.slug);
}
