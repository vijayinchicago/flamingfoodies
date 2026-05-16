import type { Metadata } from "next";

import { shouldNoIndexPath } from "@/lib/indexing-policy";
import { absoluteUrl } from "@/lib/utils";

const SITE_NAME = "FlamingFoodies";
const DEFAULT_OG_DIMENSIONS = { width: 1200, height: 630 } as const;

export interface SeoImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export function buildMetadata({
  title,
  description,
  path,
  images,
  imageObjects,
  pinterestImage,
  noIndex,
  type = "website",
  publishedTime,
  modifiedTime,
  authors
}: {
  title: string;
  description: string;
  path?: string;
  /** Plain image URLs. Used when you only have URL strings. */
  images?: string[];
  /** Structured image objects with width/height/alt — preferred for content pages. */
  imageObjects?: SeoImage[];
  /** Pinterest-optimized image URL (recommend 1000×1500 / 2:3). Surfaced as a secondary og:image. */
  pinterestImage?: string;
  noIndex?: boolean;
  /** "article" for content pages (recipes, peppers, reviews, blog). "website" for indexes. */
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
}): Metadata {
  const url = absoluteUrl(path);
  const blockIndexing = Boolean(noIndex || shouldNoIndexPath(path));

  // Assemble openGraph images. Prefer structured imageObjects when available;
  // fall back to plain string images; default to the dynamic OG card.
  const primaryImages: NonNullable<Metadata["openGraph"]>["images"] =
    imageObjects && imageObjects.length > 0
      ? imageObjects.map((img) => ({
          url: img.url,
          alt: img.alt,
          width: img.width ?? DEFAULT_OG_DIMENSIONS.width,
          height: img.height ?? DEFAULT_OG_DIMENSIONS.height
        }))
      : images && images.length > 0
      ? images.map((url) => ({
          url,
          width: DEFAULT_OG_DIMENSIONS.width,
          height: DEFAULT_OG_DIMENSIONS.height
        }))
      : [
          {
            url: absoluteUrl("/api/og?title=FlamingFoodies"),
            width: DEFAULT_OG_DIMENSIONS.width,
            height: DEFAULT_OG_DIMENSIONS.height,
            alt: "FlamingFoodies"
          }
        ];

  // If the page has a Pinterest-optimized image, add it as an additional entry
  // sized 1000×1500 (2:3 portrait). Pinterest readers favor portrait pins.
  const ogImages: NonNullable<Metadata["openGraph"]>["images"] = pinterestImage
    ? [
        ...(Array.isArray(primaryImages) ? primaryImages : [primaryImages]),
        { url: pinterestImage, width: 1000, height: 1500, alt: `${title} — Pinterest pin` }
      ]
    : primaryImages;

  const twitterImages = images && images.length > 0
    ? images
    : imageObjects?.map((img) => img.url) ?? [absoluteUrl("/api/og?title=FlamingFoodies")];

  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type,
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
      ...(type === "article" && modifiedTime ? { modifiedTime } : {}),
      ...(type === "article" && authors && authors.length > 0 ? { authors } : {}),
      images: ogImages
    },
    twitter: {
      card: "summary_large_image",
      site: "@flamingfoodies",
      title,
      description,
      images: twitterImages
    },
    other: pinterestImage
      ? {
          // Pinterest-specific hint. Mirrors og:image but tells Pinterest the
          // dimensions are pin-optimized.
          "pinterest:image": pinterestImage,
          "pinterest:image:width": "1000",
          "pinterest:image:height": "1500"
        }
      : undefined,
    robots: blockIndexing
      ? {
          index: false,
          follow: false
        }
      : undefined
  };
}
