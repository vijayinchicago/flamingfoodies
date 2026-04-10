import { describe, expect, it } from "vitest";

import {
  filterReviews,
  getReviewBrowseOptions,
  paginateReviews,
  sortReviews
} from "@/lib/review-browse";
import type { Review } from "@/lib/types";

const reviews: Review[] = [
  {
    id: 1,
    type: "review",
    slug: "yellowbird-habanero",
    title: "Yellowbird Habanero Review",
    description: "Bright everyday heat for tacos and eggs.",
    imageUrl: "",
    imageAlt: "",
    featured: true,
    source: "editorial",
    status: "published",
    publishedAt: "2026-04-08T12:00:00.000Z",
    tags: ["eggs", "tacos"],
    viewCount: 10,
    likeCount: 0,
    productName: "Yellowbird Habanero",
    brand: "Yellowbird",
    rating: 4.8,
    priceUsd: 7.99,
    affiliateUrl: "https://example.com/yellowbird",
    content: "Bright, carroty, everyday heat.",
    heatLevel: "medium",
    scovilleMin: 0,
    scovilleMax: 15000,
    flavorNotes: ["bright", "carrot"],
    cuisineOrigin: "mexican",
    category: "hot-sauce",
    pros: ["Everyday use"],
    cons: ["Not for extreme heat"],
    recommended: true
  },
  {
    id: 2,
    type: "review",
    slug: "torchbearer-garlic-reaper",
    title: "Torchbearer Garlic Reaper Review",
    description: "A hotter bottle for wings and pizza.",
    imageUrl: "",
    imageAlt: "",
    featured: false,
    source: "editorial",
    status: "published",
    publishedAt: "2026-04-09T12:00:00.000Z",
    tags: ["wings", "pizza"],
    viewCount: 4,
    likeCount: 0,
    productName: "Torchbearer Garlic Reaper",
    brand: "Torchbearer",
    rating: 4.6,
    priceUsd: 13.99,
    affiliateUrl: "https://example.com/torchbearer",
    content: "Garlicky and hot enough for heat chasers.",
    heatLevel: "reaper",
    scovilleMin: 0,
    scovilleMax: 200000,
    flavorNotes: ["garlic", "hot"],
    cuisineOrigin: "american",
    category: "hot-sauce",
    pros: ["Great on wings"],
    cons: ["Too hot for casual eaters"],
    recommended: true
  }
];

describe("review browse helpers", () => {
  it("collects category and heat browse options", () => {
    const options = getReviewBrowseOptions(reviews);
    expect(options.categories).toEqual(["hot-sauce"]);
    expect(options.heatLevels).toEqual(["medium", "reaper"]);
  });

  it("filters by query, intent, and heat", () => {
    const result = filterReviews(reviews, {
      query: "wings",
      intent: "big-heat",
      heat: "reaper"
    });

    expect(result.map((review) => review.slug)).toEqual(["torchbearer-garlic-reaper"]);
  });

  it("sorts and paginates reviews", () => {
    const sorted = sortReviews(reviews, "top-rated");
    expect(sorted[0]?.slug).toBe("yellowbird-habanero");

    const paginated = paginateReviews(sorted, 1, 1);
    expect(paginated.items).toHaveLength(1);
    expect(paginated.totalPages).toBe(2);
  });
});
