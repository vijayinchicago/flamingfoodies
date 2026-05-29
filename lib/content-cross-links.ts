import type { GuideWithBody } from "@/lib/content/guides";
import {
  findContentMentioningPepper,
  findPeppersInText,
  type Pepper
} from "@/lib/peppers";
import type { BlogPost, CuisineType, HeatLevel, Recipe, Review } from "@/lib/types";

// Shared utility: tokenize a body of text into a set of meaningful 4+ char
// tokens, stripping stopwords. Used to score topical overlap between two
// items when they don't share structured taxonomy fields.
const STOPWORDS = new Set([
  "about", "above", "after", "again", "against", "also", "always", "another",
  "around", "because", "before", "below", "between", "both", "could", "doing",
  "down", "during", "each", "even", "ever", "every", "feel", "feels", "from",
  "good", "great", "have", "having", "here", "into", "just", "keep", "kind",
  "know", "later", "less", "like", "look", "looks", "made", "make", "many",
  "more", "most", "much", "need", "needs", "never", "next", "often", "once",
  "only", "other", "over", "real", "really", "right", "same", "should", "some",
  "still", "such", "take", "than", "that", "their", "them", "then", "there",
  "these", "they", "this", "those", "through", "time", "times", "under",
  "until", "very", "want", "wants", "well", "what", "when", "where", "which",
  "while", "with", "would", "your", "yours"
]);

function tokenize(text: string): Set<string> {
  const tokens = new Set<string>();
  for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length < 4) continue;
    if (STOPWORDS.has(raw)) continue;
    tokens.add(raw);
  }
  return tokens;
}

function overlapCount(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const token of a) {
    if (b.has(token)) count += 1;
  }
  return count;
}

const HEAT_RANK: Record<HeatLevel, number> = {
  mild: 1,
  medium: 2,
  hot: 3,
  inferno: 4,
  reaper: 5
};

function heatCloseness(left?: HeatLevel, right?: HeatLevel): number {
  if (!left || !right) return 0;
  return Math.max(0, 3 - Math.abs(HEAT_RANK[left] - HEAT_RANK[right]));
}

function cuisineMatch(left?: CuisineType, right?: CuisineType): number {
  return left && right && left === right ? 5 : 0;
}

function getBlogPostHaystack(post: BlogPost): string {
  return [
    post.title,
    post.description,
    post.content,
    post.category,
    ...(post.tags ?? [])
  ].join(" ");
}

function getRecipeHaystack(recipe: Recipe): string {
  return [
    recipe.title,
    recipe.description,
    recipe.intro ?? "",
    recipe.cuisineType,
    recipe.heatLevel,
    ...(recipe.tags ?? []),
    ...recipe.ingredients.map((item) => `${item.item} ${item.notes ?? ""}`),
    ...recipe.instructions.map((step) => step.text)
  ].join(" ");
}

function getReviewHaystack(review: Review): string {
  return [
    review.title,
    review.productName,
    review.brand,
    review.description,
    review.content,
    review.category,
    review.cuisineOrigin ?? "",
    review.heatLevel ?? "",
    ...(review.flavorNotes ?? []),
    ...(review.pros ?? [])
  ].join(" ");
}

function getGuideHaystack(guide: GuideWithBody): string {
  return [guide.title, guide.description, guide.body].join(" ");
}

// ---------------------------------------------------------------------------
// Pepper-centric reverse links
// ---------------------------------------------------------------------------

/** Blog posts that mention this pepper by name or alias. */
export function getBlogPostsMentioningPepper(
  pepper: Pepper,
  posts: BlogPost[],
  limit = 3
): BlogPost[] {
  return findContentMentioningPepper(pepper, posts, getBlogPostHaystack).slice(0, limit);
}

/** Guides that mention this pepper by name or alias. */
export function getGuidesMentioningPepper(
  pepper: Pepper,
  guides: GuideWithBody[],
  limit = 2
): GuideWithBody[] {
  return findContentMentioningPepper(pepper, guides, getGuideHaystack).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Blog → other content (forward links from blog detail page)
// ---------------------------------------------------------------------------

/** Recipes that share cuisine, heat lane, or vocabulary with the blog post. */
export function getRecipesForBlogPost(
  post: BlogPost,
  recipes: Recipe[],
  limit = 3,
  minScore = 4
): Recipe[] {
  const postTokens = tokenize(getBlogPostHaystack(post));
  return recipes
    .map((recipe) => {
      let score = 0;
      score += cuisineMatch(post.cuisineType, recipe.cuisineType);
      score += heatCloseness(post.heatLevel, recipe.heatLevel);
      score += Math.min(overlapCount(postTokens, tokenize(getRecipeHaystack(recipe))), 8);
      return { recipe, score };
    })
    .filter(({ score }) => score >= minScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ recipe }) => recipe);
}

/** Reviews that share cuisine, heat lane, or vocabulary with the blog post. */
export function getReviewsForBlogPost(
  post: BlogPost,
  reviews: Review[],
  limit = 3,
  minScore = 4
): Review[] {
  const postTokens = tokenize(getBlogPostHaystack(post));
  return reviews
    .map((review) => {
      let score = 0;
      score += cuisineMatch(post.cuisineType, review.cuisineOrigin);
      score += heatCloseness(post.heatLevel, review.heatLevel);
      score += Math.min(overlapCount(postTokens, tokenize(getReviewHaystack(review))), 8);
      if (review.recommended) score += 1;
      return { review, score };
    })
    .filter(({ score }) => score >= minScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ review }) => review);
}

/** Guides whose vocabulary overlaps the blog post's. */
export function getGuidesForBlogPost(
  post: BlogPost,
  guides: GuideWithBody[],
  limit = 2,
  minScore = 3
): GuideWithBody[] {
  const postTokens = tokenize(getBlogPostHaystack(post));
  return guides
    .map((guide) => ({
      guide,
      score: overlapCount(postTokens, tokenize(getGuideHaystack(guide)))
    }))
    .filter(({ score }) => score >= minScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ guide }) => guide);
}

/** Peppers mentioned in a blog post — for the in-content chip strip. */
export function getPeppersInBlogPost(post: BlogPost, limit = 6): Pepper[] {
  return findPeppersInText(getBlogPostHaystack(post)).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Guide → other content (forward links from guide detail page)
// ---------------------------------------------------------------------------

export function getRecipesForGuide(
  guide: GuideWithBody,
  recipes: Recipe[],
  limit = 3,
  minScore = 4
): Recipe[] {
  const guideTokens = tokenize(getGuideHaystack(guide));
  return recipes
    .map((recipe) => ({
      recipe,
      score: overlapCount(guideTokens, tokenize(getRecipeHaystack(recipe)))
    }))
    .filter(({ score }) => score >= minScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ recipe }) => recipe);
}

export function getReviewsForGuide(
  guide: GuideWithBody,
  reviews: Review[],
  limit = 3,
  minScore = 4
): Review[] {
  const guideTokens = tokenize(getGuideHaystack(guide));
  return reviews
    .map((review) => ({
      review,
      score: overlapCount(guideTokens, tokenize(getReviewHaystack(review)))
    }))
    .filter(({ score }) => score >= minScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ review }) => review);
}

export function getBlogPostsForGuide(
  guide: GuideWithBody,
  posts: BlogPost[],
  limit = 3,
  minScore = 4
): BlogPost[] {
  const guideTokens = tokenize(getGuideHaystack(guide));
  return posts
    .map((post) => ({
      post,
      score: overlapCount(guideTokens, tokenize(getBlogPostHaystack(post)))
    }))
    .filter(({ score }) => score >= minScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ post }) => post);
}

/** Other guides relevant to the current guide (vocabulary overlap). */
export function getRelatedGuides(
  guide: GuideWithBody,
  guides: GuideWithBody[],
  limit = 2,
  minScore = 3
): GuideWithBody[] {
  const guideTokens = tokenize(getGuideHaystack(guide));
  return guides
    .filter((candidate) => candidate.slug !== guide.slug)
    .map((candidate) => ({
      candidate,
      score: overlapCount(guideTokens, tokenize(getGuideHaystack(candidate)))
    }))
    .filter(({ score }) => score >= minScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

/** Peppers mentioned in a guide body. */
export function getPeppersInGuide(guide: GuideWithBody, limit = 6): Pepper[] {
  return findPeppersInText(getGuideHaystack(guide)).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Recipe → blog/guide (reverse links from recipe detail page)
// ---------------------------------------------------------------------------

export function getBlogPostsForRecipe(
  recipe: Recipe,
  posts: BlogPost[],
  limit = 2,
  minScore = 4
): BlogPost[] {
  const recipeTokens = tokenize(getRecipeHaystack(recipe));
  return posts
    .map((post) => {
      let score = 0;
      score += cuisineMatch(recipe.cuisineType, post.cuisineType);
      score += heatCloseness(recipe.heatLevel, post.heatLevel);
      score += Math.min(overlapCount(recipeTokens, tokenize(getBlogPostHaystack(post))), 8);
      return { post, score };
    })
    .filter(({ score }) => score >= minScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ post }) => post);
}

export function getGuidesForRecipe(
  recipe: Recipe,
  guides: GuideWithBody[],
  limit = 2,
  minScore = 3
): GuideWithBody[] {
  const recipeTokens = tokenize(getRecipeHaystack(recipe));
  return guides
    .map((guide) => ({
      guide,
      score: overlapCount(recipeTokens, tokenize(getGuideHaystack(guide)))
    }))
    .filter(({ score }) => score >= minScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ guide }) => guide);
}

// ---------------------------------------------------------------------------
// Review → blog/guide (reverse links from review detail page)
// ---------------------------------------------------------------------------

export function getBlogPostsForReview(
  review: Review,
  posts: BlogPost[],
  limit = 2,
  minScore = 4
): BlogPost[] {
  const reviewTokens = tokenize(getReviewHaystack(review));
  return posts
    .map((post) => {
      let score = 0;
      score += cuisineMatch(review.cuisineOrigin, post.cuisineType);
      score += heatCloseness(review.heatLevel, post.heatLevel);
      score += Math.min(overlapCount(reviewTokens, tokenize(getBlogPostHaystack(post))), 8);
      return { post, score };
    })
    .filter(({ score }) => score >= minScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ post }) => post);
}

export function getGuidesForReview(
  review: Review,
  guides: GuideWithBody[],
  limit = 2,
  minScore = 3
): GuideWithBody[] {
  const reviewTokens = tokenize(getReviewHaystack(review));
  return guides
    .map((guide) => ({
      guide,
      score: overlapCount(reviewTokens, tokenize(getGuideHaystack(guide)))
    }))
    .filter(({ score }) => score >= minScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ guide }) => guide);
}
