import { getGuides } from "@/lib/content/guides";
import { getBlogPosts, getRecipes, getReviews } from "@/lib/services/content";
import type { BlogPost, Recipe, Review } from "@/lib/types";

export type SearchResultType = "recipe" | "blog_post" | "review" | "guide";

export interface SearchResult {
  type: SearchResultType;
  title: string;
  description: string;
  href: string;
  imageUrl?: string;
  meta: string;
  score: number;
}

function normalizeSearchValue(value: string) {
  return value.toLowerCase().trim();
}

function tokenize(query: string) {
  return normalizeSearchValue(query)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function scoreSearchText(text: string, tokens: string[]) {
  const haystack = normalizeSearchValue(text);
  let score = 0;

  for (const token of tokens) {
    if (haystack === token) {
      score += 12;
      continue;
    }

    if (haystack.startsWith(token)) {
      score += 8;
      continue;
    }

    if (haystack.includes(token)) {
      score += 4;
    }
  }

  return score;
}

function scoreRecipe(recipe: Recipe, tokens: string[]) {
  return (
    scoreSearchText(recipe.title, tokens) * 3 +
    scoreSearchText(recipe.description, tokens) * 2 +
    scoreSearchText(recipe.cuisineType, tokens) * 2 +
    scoreSearchText(recipe.tags.join(" "), tokens)
  );
}

function scoreBlogPost(post: BlogPost, tokens: string[]) {
  return (
    scoreSearchText(post.title, tokens) * 3 +
    scoreSearchText(post.description, tokens) * 2 +
    scoreSearchText(post.category, tokens) * 2 +
    scoreSearchText(post.tags.join(" "), tokens)
  );
}

function scoreReview(review: Review, tokens: string[]) {
  return (
    scoreSearchText(review.title, tokens) * 3 +
    scoreSearchText(review.description, tokens) * 2 +
    scoreSearchText(review.brand, tokens) * 2 +
    scoreSearchText(review.productName, tokens) * 2 +
    scoreSearchText(review.category, tokens)
  );
}

function scoreGuide(
  guide: Awaited<ReturnType<typeof getGuides>>[number],
  tokens: string[]
) {
  return (
    scoreSearchText(guide.title, tokens) * 3 +
    scoreSearchText(guide.description, tokens) * 2
  );
}

export async function searchSite(query: string) {
  const trimmedQuery = query.trim();
  const tokens = tokenize(trimmedQuery);

  if (!tokens.length) {
    return [];
  }

  const [recipes, blogPosts, reviews, guides] = await Promise.all([
    getRecipes(),
    getBlogPosts(),
    getReviews(),
    getGuides()
  ]);

  const results: SearchResult[] = [
    ...recipes
      .map((recipe) => ({
        type: "recipe" as const,
        title: recipe.title,
        description: recipe.description,
        href: `/recipes/${recipe.slug}`,
        imageUrl: recipe.imageUrl,
        meta: `${recipe.cuisineType} recipe`,
        score: scoreRecipe(recipe, tokens)
      }))
      .filter((item) => item.score > 0),
    ...blogPosts
      .map((post) => ({
        type: "blog_post" as const,
        title: post.title,
        description: post.description,
        href: `/blog/${post.slug}`,
        imageUrl: post.imageUrl,
        meta: `${post.category} article`,
        score: scoreBlogPost(post, tokens)
      }))
      .filter((item) => item.score > 0),
    ...reviews
      .map((review) => ({
        type: "review" as const,
        title: review.title,
        description: review.description,
        href: `/reviews/${review.slug}`,
        imageUrl: review.imageUrl,
        meta: `${review.brand} review`,
        score: scoreReview(review, tokens)
      }))
      .filter((item) => item.score > 0),
    ...guides
      .map((guide) => ({
        type: "guide" as const,
        title: guide.title,
        description: guide.description,
        href: `/guides/${guide.slug}`,
        meta: "guide",
        score: scoreGuide(guide, tokens)
      }))
      .filter((item) => item.score > 0)
  ];

  return results
    .sort((left, right) => right.score - left.score)
    .slice(0, 24);
}
