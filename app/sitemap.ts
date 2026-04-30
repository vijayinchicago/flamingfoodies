import type { MetadataRoute } from "next";

import { getBlogPosts, getRecipes, getReviews } from "@/lib/services/content";
import { getGuides } from "@/lib/content/guides";
import { getFestivalsFromDb } from "@/lib/festivals";
import { shouldNoIndexPath } from "@/lib/indexing-policy";
import { getPeppersFromDb } from "@/lib/peppers";
import { getBrandsFromDb } from "@/lib/brands";
import { getTutorialsFromDb } from "@/lib/tutorials";
import { absoluteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogPosts, recipes, reviews, guides, festivals, peppers, brands, tutorials] =
    await Promise.all([
      getBlogPosts(),
      getRecipes(),
      getReviews(),
      getGuides(),
      getFestivalsFromDb().catch(() => []),
      getPeppersFromDb().catch(() => []),
      getBrandsFromDb().catch(() => []),
      getTutorialsFromDb().catch(() => [])
    ]);

  // Static routes with fixed dates — update when content meaningfully changes
  const staticRoutes: Array<{ path: string; lastModified: string }> = [
    { path: "", lastModified: "2026-04-18" },
    { path: "/blog", lastModified: "2026-04-18" },
    { path: "/recipes", lastModified: "2026-04-18" },
    { path: "/reviews", lastModified: "2026-04-18" },
    { path: "/about", lastModified: "2025-01-01" },
    { path: "/contact", lastModified: "2025-01-01" },
    { path: "/privacy", lastModified: "2025-01-01" },
    { path: "/terms", lastModified: "2025-01-01" },
    { path: "/hot-sauces", lastModified: "2026-04-18" },
    { path: "/hot-sauces/best", lastModified: "2026-04-18" },
    { path: "/hot-sauces/best-for-eggs", lastModified: "2026-04-18" },
    { path: "/hot-sauces/best-for-fried-chicken", lastModified: "2026-04-18" },
    { path: "/hot-sauces/best-for-pizza", lastModified: "2026-04-18" },
    { path: "/hot-sauces/best-for-seafood", lastModified: "2026-04-18" },
    { path: "/hot-sauces/best-for-tacos", lastModified: "2026-04-18" },
    { path: "/hot-sauces/best-for-wings", lastModified: "2026-04-18" },
    { path: "/hot-sauces/best-gift-sets", lastModified: "2026-04-18" },
    { path: "/hot-sauces/gifts-under-50", lastModified: "2026-04-18" },
    { path: "/hot-sauces/under-15", lastModified: "2026-04-18" },
    { path: "/community", lastModified: "2026-04-18" },
    { path: "/guides", lastModified: "2026-04-18" },
    { path: "/quiz", lastModified: "2025-06-01" },
    { path: "/shop", lastModified: "2026-04-18" },
    { path: "/subscriptions", lastModified: "2026-04-18" },
    { path: "/festivals", lastModified: "2026-04-18" },
    { path: "/peppers", lastModified: "2026-04-18" },
    { path: "/brands", lastModified: "2026-04-18" },
    { path: "/how-to", lastModified: "2026-04-18" },
    { path: "/new-releases", lastModified: "2026-04-18" }
  ];

  return staticRoutes
    .filter(({ path }) => !shouldNoIndexPath(path))
    .map(({ path, lastModified }) => ({
      url: absoluteUrl(path),
      lastModified: new Date(lastModified)
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
      })),
      festivals
        .filter((festival) => !shouldNoIndexPath(`/festivals/${festival.slug}`))
        .map((festival) => ({
        url: absoluteUrl(`/festivals/${festival.slug}`),
        lastModified: new Date()
      })),
      peppers
        .filter((pepper) => !shouldNoIndexPath(`/peppers/${pepper.slug}`))
        .map((pepper) => ({
        url: absoluteUrl(`/peppers/${pepper.slug}`),
        lastModified: new Date()
      })),
      brands
        .filter((brand) => !shouldNoIndexPath(`/brands/${brand.slug}`))
        .map((brand) => ({
        url: absoluteUrl(`/brands/${brand.slug}`),
        lastModified: new Date()
      })),
      tutorials.map((tutorial) => ({
        url: absoluteUrl(`/how-to/${tutorial.slug}`),
        lastModified: new Date()
      }))
    );
}
