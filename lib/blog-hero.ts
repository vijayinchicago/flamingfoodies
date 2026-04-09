import type { BlogPost, CuisineType, HeatLevel } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

export function buildBlogHeroImageUrl(input: {
  title: string;
  category?: string;
  cuisineType?: CuisineType;
  heatLevel?: HeatLevel;
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
    subtitle
  });

  return absoluteUrl(`/api/og?${params.toString()}`);
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
  const usesGeneratedHeroCard = !blog.imageUrl || isGeneratedBlogHeroImageUrl(blog.imageUrl);

  return {
    imageUrl:
      blog.imageUrl ||
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

  return imageUrl.includes("/api/og?");
}
