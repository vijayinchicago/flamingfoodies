const BLOG_REVIEW_HOLD_SLUGS = new Set<string>();

export function isReviewHoldBlogSlug(slug: string) {
  return BLOG_REVIEW_HOLD_SLUGS.has(slug);
}

export function shouldPromoteBlogPost(input: { slug: string; source: string }) {
  return !isReviewHoldBlogSlug(input.slug);
}
