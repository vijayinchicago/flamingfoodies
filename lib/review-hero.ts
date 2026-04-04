import type { HeatLevel, Review } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

const genericStockHosts = [
  "images.unsplash.com",
  "unsplash.com",
  "images.pexels.com",
  "pexels.com"
];

function formatHeroLabel(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatReviewEyebrow(category?: string, brand?: string) {
  if (brand) {
    return `${brand} Review`;
  }

  if (category) {
    return `${formatHeroLabel(category)} Review`;
  }

  return "FlamingFoodies Review";
}

function formatReviewSubtitle(category?: string, heatLevel?: HeatLevel) {
  const parts = [];

  if (category) {
    parts.push(formatHeroLabel(category));
  } else {
    parts.push("Product Review");
  }

  if (heatLevel) {
    parts.push(`${formatHeroLabel(heatLevel)} heat`);
  }

  return parts.join(" • ");
}

export function buildReviewHeroImageUrl({
  title,
  productName,
  brand,
  category,
  heatLevel
}: {
  title: string;
  productName?: string;
  brand?: string;
  category?: string;
  heatLevel?: HeatLevel;
}) {
  const params = new URLSearchParams({
    title: productName || title.replace(/\s+review$/i, ""),
    eyebrow: formatReviewEyebrow(category, brand),
    subtitle: formatReviewSubtitle(category, heatLevel)
  });

  return absoluteUrl(`/api/og?${params.toString()}`);
}

export function buildReviewHeroImageAlt(title: string, productName?: string) {
  return `FlamingFoodies review card for ${productName || title}`;
}

export function isGeneratedReviewHeroCardImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return false;

  return imageUrl.includes("/api/og?");
}

export function isLikelyGenericStockReviewImageUrl(imageUrl?: string | null) {
  if (!imageUrl || isGeneratedReviewHeroCardImageUrl(imageUrl)) {
    return false;
  }

  try {
    const hostname = new URL(imageUrl).hostname.toLowerCase();
    return genericStockHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    const normalized = imageUrl.toLowerCase();
    return genericStockHosts.some((host) => normalized.includes(host));
  }
}

export function getReviewHeroFields(
  review: Pick<
    Review,
    "title" | "productName" | "brand" | "category" | "heatLevel" | "imageUrl" | "imageAlt"
  >
) {
  const shouldUseGeneratedHero =
    !review.imageUrl || isLikelyGenericStockReviewImageUrl(review.imageUrl);
  const imageUrl = shouldUseGeneratedHero
    ? buildReviewHeroImageUrl({
        title: review.title,
        productName: review.productName,
        brand: review.brand,
        category: review.category,
        heatLevel: review.heatLevel
      })
    : review.imageUrl;
  const imageAlt =
    shouldUseGeneratedHero || !review.imageAlt
      ? buildReviewHeroImageAlt(review.title, review.productName)
      : review.imageAlt;

  return {
    imageUrl,
    imageAlt,
    usesGeneratedHeroCard: shouldUseGeneratedHero
  };
}
