import type { Metadata } from "next";

import { absoluteUrl } from "@/lib/utils";

export function buildMetadata({
  title,
  description,
  path,
  images,
  noIndex
}: {
  title: string;
  description: string;
  path?: string;
  images?: string[];
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
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
      type: "website",
      images: images?.length ? images : [absoluteUrl("/api/og?title=FlamingFoodies")]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images?.length ? images : [absoluteUrl("/api/og?title=FlamingFoodies")]
    },
    robots: noIndex
      ? {
          index: false,
          follow: false
        }
      : undefined
  };
}
