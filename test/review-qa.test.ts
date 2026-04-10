import { describe, expect, it } from "vitest";

import { buildReviewQaReport, getReviewManualReviewState } from "@/lib/review-qa";
import type { Review } from "@/lib/types";

const baseReview: Review = {
  id: 1,
  type: "review",
  slug: "yellowbird-habanero-hot-sauce-review",
  title: "Yellowbird Habanero Hot Sauce Review",
  description: "A bright, carroty habanero sauce with real table-sauce versatility.",
  productName: "Yellowbird Habanero Hot Sauce",
  brand: "Yellowbird",
  rating: 4.4,
  priceUsd: 6.99,
  affiliateUrl: "https://example.com/yellowbird",
  content:
    "<p>This habanero sauce opens bright and carroty, then lands with a lime-leaning citrus note that makes it feel at home on tacos, breakfast eggs, and roast chicken.</p><p>The heat builds fast but stays usable, with enough body to cling without turning syrupy, and the finish keeps a clear orange-habanero identity instead of tasting generically spicy.</p>",
  heatLevel: "hot",
  scovilleMin: 5000,
  scovilleMax: 15000,
  flavorNotes: ["bright", "carroty", "citrusy"],
  cuisineOrigin: "mexican",
  category: "hot-sauce",
  pros: ["Useful on multiple foods", "Balanced fruit and acid"],
  cons: ["Too sweet for vinegar-sauce purists"],
  imageUrl: "https://example.com/yellowbird.jpg",
  imageAlt: "Yellowbird habanero hot sauce bottle on a wooden table",
  imageReviewed: true,
  factQaReviewed: true,
  qaNotes: "Tasted and checked against the current bottle art.",
  qaReport: undefined,
  recommended: true,
  featured: true,
  source: "editorial",
  status: "published",
  tags: ["yellowbird", "habanero", "hot sauce", "mexican"],
  viewCount: 0,
  likeCount: 0,
  publishedAt: "2026-04-04T00:00:00.000Z"
};

describe("review QA", () => {
  it("flags blockers when image review and fact review are missing", () => {
    const report = buildReviewQaReport({
      ...baseReview,
      imageUrl: undefined,
      imageAlt: "",
      imageReviewed: false,
      factQaReviewed: false
    });

    expect(report.status).toBe("fail");
    expect(report.blockers.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "missing-review-image",
        "missing-review-alt",
        "review-image-check-required",
        "review-fact-check-required"
      ])
    );
  });

  it("passes a reviewed, fully structured review", () => {
    const report = buildReviewQaReport(baseReview);

    expect(report.status).toBe("pass");
    expect(report.blockers).toHaveLength(0);
  });

  it("warns when a review relies on a generic stock image host", () => {
    const report = buildReviewQaReport({
      ...baseReview,
      imageUrl: "https://images.unsplash.com/photo-123",
      imageAlt: "Yellowbird habanero hot sauce bottle on a wooden table"
    });

    expect(report.warnings.map((issue) => issue.code)).toContain("generic-stock-review-image");
  });

  it("blocks affiliate-linked reviews that do not have an exact product image", () => {
    const report = buildReviewQaReport({
      ...baseReview,
      imageUrl: "https://flamingfoodies.com/api/review-hero?title=Yellowbird",
      imageAlt: "FlamingFoodies illustrated bottle hero for Yellowbird Habanero Hot Sauce"
    });

    expect(report.blockers.map((issue) => issue.code)).toContain(
      "affiliate-review-exact-image-required"
    );
  });

  it("auto-approves the curated sample review set for imports", () => {
    expect(
      getReviewManualReviewState({
        slug: "yellowbird-habanero-hot-sauce-review",
        imageReviewed: undefined,
        factQaReviewed: undefined,
        qaNotes: undefined
      })
    ).toMatchObject({
      imageReviewed: true,
      factQaReviewed: true
    });
  });
});
