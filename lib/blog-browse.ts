import type { BlogPost, CuisineType, HeatLevel } from "@/lib/types";

export type BlogSortKey = "featured" | "newest" | "read-time" | "hottest";

export const BLOG_SORT_OPTIONS: Array<{ key: BlogSortKey; label: string }> = [
  { key: "featured", label: "Featured first" },
  { key: "newest", label: "Newest first" },
  { key: "read-time", label: "Shortest read" },
  { key: "hottest", label: "Most heat-forward" }
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

function getBlogSearchCorpus(post: BlogPost) {
  return normalizeText(
    [
      post.title,
      post.description,
      post.content,
      post.category,
      post.cuisineType,
      post.heatLevel,
      ...post.tags
    ].join(" ")
  );
}

export function formatBlogCategoryLabel(value: string) {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatBlogCuisineLabel(value: CuisineType) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatBlogHeatLabel(value: HeatLevel) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function parseBlogSort(value: string | undefined): BlogSortKey {
  return BLOG_SORT_OPTIONS.some((entry) => entry.key === value)
    ? (value as BlogSortKey)
    : "featured";
}

export function getBlogBrowseOptions(posts: BlogPost[]) {
  const categories = Array.from(new Set(posts.map((post) => post.category))).sort();
  const cuisines = Array.from(
    new Set(posts.map((post) => post.cuisineType).filter(Boolean) as CuisineType[])
  ).sort();
  const heatLevels = Array.from(
    new Set(posts.map((post) => post.heatLevel).filter(Boolean) as HeatLevel[])
  ).sort((left, right) => HEAT_ORDER[left] - HEAT_ORDER[right]);

  return {
    categories,
    cuisines,
    heatLevels
  };
}

export function filterBlogPosts(
  posts: BlogPost[],
  filters: {
    query?: string;
    category?: string;
    cuisine?: CuisineType | "all";
    heat?: HeatLevel | "all";
  }
) {
  const query = normalizeText(filters.query);

  return posts.filter((post) => {
    if (query && !getBlogSearchCorpus(post).includes(query)) {
      return false;
    }

    if (filters.category && filters.category !== "all" && post.category !== filters.category) {
      return false;
    }

    if (filters.cuisine && filters.cuisine !== "all" && post.cuisineType !== filters.cuisine) {
      return false;
    }

    if (filters.heat && filters.heat !== "all" && post.heatLevel !== filters.heat) {
      return false;
    }

    return true;
  });
}

export function sortBlogPosts(posts: BlogPost[], sort: BlogSortKey = "featured") {
  const sorted = [...posts];

  sorted.sort((left, right) => {
    if (sort === "newest") {
      return (right.publishedAt || "").localeCompare(left.publishedAt || "");
    }

    if (sort === "read-time") {
      return (left.readTimeMinutes ?? Number.POSITIVE_INFINITY) - (right.readTimeMinutes ?? Number.POSITIVE_INFINITY);
    }

    if (sort === "hottest") {
      return (
        HEAT_ORDER[right.heatLevel ?? "mild"] - HEAT_ORDER[left.heatLevel ?? "mild"] ||
        (right.publishedAt || "").localeCompare(left.publishedAt || "")
      );
    }

    if ((left.featured ?? false) !== (right.featured ?? false)) {
      return left.featured ? -1 : 1;
    }

    return (right.publishedAt || "").localeCompare(left.publishedAt || "");
  });

  return sorted;
}

export function paginateBlogPosts(posts: BlogPost[], page: number, perPage = 10) {
  const totalResults = posts.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / perPage));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;

  return {
    items: posts.slice(startIndex, endIndex),
    totalResults,
    totalPages,
    currentPage,
    startResult: totalResults === 0 ? 0 : startIndex + 1,
    endResult: Math.min(endIndex, totalResults)
  };
}
