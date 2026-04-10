import type { BlogPost, CuisineType, HeatLevel } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

function normalizeBlogImageUrl(imageUrl?: string | null) {
  const trimmed = imageUrl?.trim();

  if (!trimmed) {
    return undefined;
  }

  if (/^(null|undefined)$/i.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}

function isLocalOnlyBlogImageUrl(imageUrl?: string | null) {
  if (!imageUrl) {
    return false;
  }

  try {
    const hostname = new URL(imageUrl).hostname.toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
  } catch {
    return false;
  }
}

export function buildBlogHeroImageUrl(input: {
  title: string;
  category?: string;
  cuisineType?: CuisineType;
  heatLevel?: HeatLevel;
  heroImageQuery?: string | null;
}) {
  const eyebrow = input.category
    ? input.category.replace(/-/g, " ")
    : "Story";
  const subtitleParts = [
    input.cuisineType && input.cuisineType !== "other"
      ? input.cuisineType.replace(/_/g, " ")
      : null,
    input.heatLevel ? `${input.heatLevel} heat` : null
  ].filter(Boolean);

  const subtitle = subtitleParts.length ? subtitleParts.join(" · ") : "FlamingFoodies editorial";
  const params = new URLSearchParams({
    title: input.title,
    eyebrow,
    subtitle,
    category: input.category || "story",
    cuisine: input.cuisineType || "other",
    heat: input.heatLevel || "medium"
  });

  if (input.heroImageQuery?.trim()) {
    params.set("query", input.heroImageQuery.trim());
  }

  return absoluteUrl(`/api/blog-hero?${params.toString()}`);
}

export function buildBlogHeroImageAlt(input: {
  title: string;
  category?: string;
  cuisineType?: CuisineType;
}) {
  const descriptors = [
    input.category ? input.category.replace(/-/g, " ") : null,
    input.cuisineType && input.cuisineType !== "other"
      ? input.cuisineType.replace(/_/g, " ")
      : null
  ].filter(Boolean);

  const context = descriptors.length ? ` for a ${descriptors.join(" ")} story` : "";
  return `Cover image${context}: ${input.title}`;
}

export function getBlogHeroFields(
  blog: Pick<BlogPost, "title" | "category" | "cuisineType" | "heatLevel" | "imageUrl" | "imageAlt">
) {
  const normalizedImageUrl = normalizeBlogImageUrl(blog.imageUrl);
  const usesGeneratedHeroCard =
    !normalizedImageUrl ||
    isGeneratedBlogHeroImageUrl(normalizedImageUrl) ||
    isLocalOnlyBlogImageUrl(normalizedImageUrl);

  return {
    imageUrl:
      (!usesGeneratedHeroCard ? normalizedImageUrl : undefined) ||
      buildBlogHeroImageUrl({
        title: blog.title,
        category: blog.category,
        cuisineType: blog.cuisineType,
        heatLevel: blog.heatLevel
      }),
    imageAlt:
      blog.imageAlt ||
      buildBlogHeroImageAlt({
        title: blog.title,
        category: blog.category,
        cuisineType: blog.cuisineType
      }),
    usesGeneratedHeroCard
  };
}

export function isGeneratedBlogHeroImageUrl(imageUrl?: string | null) {
  if (!imageUrl) {
    return false;
  }

  return imageUrl.includes("/api/blog-hero?") || imageUrl.includes("/api/og?");
}
