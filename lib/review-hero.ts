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

function slugifyToken(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeReviewImageUrl(imageUrl?: string | null) {
  const trimmed = imageUrl?.trim();

  if (!trimmed) {
    return undefined;
  }

  if (/^(null|undefined)$/i.test(trimmed)) {
    return undefined;
  }

  return trimmed;
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
    brand: brand || formatReviewEyebrow(category, brand),
    category: category || "review",
    heat: heatLevel || "medium",
    subtitle: formatReviewSubtitle(category, heatLevel)
  });

  return absoluteUrl(`/api/review-hero?${params.toString()}`);
}

export function buildReviewHeroImageAlt(title: string, productName?: string) {
  return `FlamingFoodies illustrated bottle hero for ${productName || title}`;
}

export function buildReviewProductImageAlt(productName?: string, brand?: string) {
  const label = [brand, productName].filter(Boolean).join(" ").trim() || productName || brand || "product";
  return `${label} product image`;
}

export function isGeneratedReviewHeroCardImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return false;

  return imageUrl.includes("/api/review-hero?") || imageUrl.includes("/api/og?");
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

export function hasTrustedReviewProductImage(imageUrl?: string | null) {
  const normalizedImageUrl = normalizeReviewImageUrl(imageUrl);

  return Boolean(
    normalizedImageUrl &&
      !isGeneratedReviewHeroCardImageUrl(normalizedImageUrl) &&
      !isLikelyGenericStockReviewImageUrl(normalizedImageUrl)
  );
}

export function getReviewHeroFields(
  review: Pick<
    Review,
    "title" | "productName" | "brand" | "category" | "heatLevel" | "imageUrl" | "imageAlt"
  >
): {
  imageUrl: string;
  imageAlt: string;
  usesGeneratedHeroCard: boolean;
  usesTrustedProductImage: boolean;
} {
  const normalizedImageUrl = normalizeReviewImageUrl(review.imageUrl);
  const shouldUseGeneratedHero =
    !normalizedImageUrl || isLikelyGenericStockReviewImageUrl(normalizedImageUrl);
  const imageUrl: string = shouldUseGeneratedHero
    ? buildReviewHeroImageUrl({
        title: review.title,
        productName: review.productName,
        brand: review.brand,
        category: review.category,
        heatLevel: review.heatLevel
      })
    : (normalizedImageUrl ?? buildReviewHeroImageUrl({
        title: review.title,
        productName: review.productName,
        brand: review.brand,
        category: review.category,
        heatLevel: review.heatLevel
      }));
  const imageAlt =
    shouldUseGeneratedHero
      ? buildReviewHeroImageAlt(review.title, review.productName)
      : review.imageAlt || buildReviewProductImageAlt(review.productName, review.brand);

  return {
    imageUrl,
    imageAlt,
    usesGeneratedHeroCard: shouldUseGeneratedHero,
    usesTrustedProductImage: hasTrustedReviewProductImage(normalizedImageUrl)
  };
}

export function buildReviewHeroAssetName(productName?: string, brand?: string) {
  const label = productName || brand || "flamingfoodies-review";
  return slugifyToken(label);
}
