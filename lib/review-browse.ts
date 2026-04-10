import type { HeatLevel, Review } from "@/lib/types";
import { HOT_SAUCE_FILTERS, getFilteredHotSauceReviews, type HotSauceFilterKey } from "@/lib/hot-sauces";

export type ReviewSortKey = "featured" | "top-rated" | "newest" | "hottest" | "price-low";

export const REVIEW_SORT_OPTIONS: Array<{ key: ReviewSortKey; label: string }> = [
  { key: "featured", label: "Featured first" },
  { key: "top-rated", label: "Top rated" },
  { key: "newest", label: "Newest first" },
  { key: "hottest", label: "Hottest first" },
  { key: "price-low", label: "Lowest price" }
];

const HEAT_ORDER: Record<HeatLevel, number> = {
  mild: 1,
  medium: 2,
  hot: 3,
  inferno: 4,
  reaper: 5
};

function normalizeText(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function getReviewSearchCorpus(review: Review) {
  return normalizeText(
    [
      review.title,
      review.description,
      review.productName,
      review.brand,
      review.category,
      review.content,
      review.cuisineOrigin,
      review.heatLevel,
      ...review.tags,
      ...review.flavorNotes,
      ...review.pros,
      ...review.cons
    ].join(" ")
  );
}

export function formatReviewCategoryLabel(value: string) {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatReviewHeatLabel(value: HeatLevel) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function parseReviewIntent(value: string | undefined): HotSauceFilterKey {
  return HOT_SAUCE_FILTERS.some((entry) => entry.key === value)
    ? (value as HotSauceFilterKey)
    : "all";
}

export function parseReviewSort(value: string | undefined): ReviewSortKey {
  return REVIEW_SORT_OPTIONS.some((entry) => entry.key === value)
    ? (value as ReviewSortKey)
    : "featured";
}

export function getReviewBrowseOptions(reviews: Review[]) {
  const categories = Array.from(new Set(reviews.map((review) => review.category))).sort();
  const heatLevels = Array.from(
    new Set(reviews.map((review) => review.heatLevel).filter(Boolean) as HeatLevel[])
  ).sort((left, right) => HEAT_ORDER[left] - HEAT_ORDER[right]);

  return {
    intents: HOT_SAUCE_FILTERS,
    categories,
    heatLevels
  };
}

export function filterReviews(
  reviews: Review[],
  filters: {
    query?: string;
    intent?: HotSauceFilterKey;
    category?: string;
    heat?: HeatLevel | "all";
  }
) {
  const query = normalizeText(filters.query);
  const intentFiltered =
    filters.intent && filters.intent !== "all"
      ? getFilteredHotSauceReviews(reviews, filters.intent)
      : reviews;

  return intentFiltered.filter((review) => {
    if (query && !getReviewSearchCorpus(review).includes(query)) {
      return false;
    }

    if (filters.category && filters.category !== "all" && review.category !== filters.category) {
      return false;
    }

    if (filters.heat && filters.heat !== "all" && review.heatLevel !== filters.heat) {
      return false;
    }

    return true;
  });
}

export function sortReviews(reviews: Review[], sort: ReviewSortKey = "featured") {
  const sorted = [...reviews];

  sorted.sort((left, right) => {
    if (sort === "top-rated") {
      return right.rating - left.rating || (right.viewCount ?? 0) - (left.viewCount ?? 0);
    }

    if (sort === "newest") {
      return (right.publishedAt || "").localeCompare(left.publishedAt || "");
    }

    if (sort === "hottest") {
      return (
        HEAT_ORDER[right.heatLevel ?? "mild"] - HEAT_ORDER[left.heatLevel ?? "mild"] ||
        right.rating - left.rating
      );
    }

    if (sort === "price-low") {
      const leftPrice = typeof left.priceUsd === "number" ? left.priceUsd : Number.POSITIVE_INFINITY;
      const rightPrice = typeof right.priceUsd === "number" ? right.priceUsd : Number.POSITIVE_INFINITY;
      return leftPrice - rightPrice || right.rating - left.rating;
    }

    if ((left.featured ?? false) !== (right.featured ?? false)) {
      return left.featured ? -1 : 1;
    }

    if (left.recommended !== right.recommended) {
      return left.recommended ? -1 : 1;
    }

    return right.rating - left.rating || (right.publishedAt || "").localeCompare(left.publishedAt || "");
  });

  return sorted;
}

export function paginateReviews(reviews: Review[], page: number, perPage = 10) {
  const totalResults = reviews.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / perPage));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;

  return {
    items: reviews.slice(startIndex, endIndex),
    totalResults,
    totalPages,
    currentPage,
    startResult: totalResults === 0 ? 0 : startIndex + 1,
    endResult: Math.min(endIndex, totalResults)
  };
}
