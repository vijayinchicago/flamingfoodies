import type { MetadataRoute } from "next";

import { getBlogPosts, getRecipes, getReviews } from "@/lib/services/content";
import { getGuides } from "@/lib/content/guides";
import { absoluteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogPosts, recipes, reviews, guides] = await Promise.all([
    getBlogPosts(),
    getRecipes(),
    getReviews(),
    getGuides()
  ]);

  return [
    "",
    "/blog",
    "/recipes",
    "/reviews",
    "/hot-sauces",
    "/hot-sauces/best",
    "/hot-sauces/best-for-eggs",
    "/hot-sauces/best-for-pizza",
    "/hot-sauces/best-for-seafood",
    "/hot-sauces/best-for-tacos",
    "/hot-sauces/best-for-wings",
    "/hot-sauces/best-gift-sets",
    "/hot-sauces/gifts-under-50",
    "/hot-sauces/under-15",
    "/community",
    "/guides",
    "/quiz",
    "/shop",
    "/subscriptions"
  ]
    .map((path) => ({
      url: absoluteUrl(path),
      lastModified: new Date()
    }))
    .concat(
      blogPosts.map((post) => ({
        url: absoluteUrl(`/blog/${post.slug}`),
        lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date()
      })),
      recipes.map((recipe) => ({
        url: absoluteUrl(`/recipes/${recipe.slug}`),
        lastModified: recipe.publishedAt ? new Date(recipe.publishedAt) : new Date()
      })),
      reviews.map((review) => ({
        url: absoluteUrl(`/reviews/${review.slug}`),
        lastModified: review.publishedAt ? new Date(review.publishedAt) : new Date()
      })),
      guides.map((guide) => ({
        url: absoluteUrl(`/guides/${guide.slug}`),
        lastModified: new Date(guide.publishedAt)
      }))
    );
}
