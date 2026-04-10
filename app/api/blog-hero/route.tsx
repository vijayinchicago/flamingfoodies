import { ImageResponse } from "next/og";

import type { CuisineType, HeatLevel } from "@/lib/types";
import { env } from "@/lib/env";

export const runtime = "edge";

function dedupeList(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function normalizePhotoSearchQuery(value?: string | null) {
  const trimmed = value?.replace(/\s+/g, " ").trim();
  return trimmed && trimmed.length >= 4 ? trimmed : undefined;
}

function formatCuisineQuery(cuisineType?: string | null) {
  if (!cuisineType || cuisineType === "other") {
    return undefined;
  }

  return cuisineType.replace(/_/g, " ").trim();
}

function stripBlogTitleQualifiers(value: string) {
  return value
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/^(why|how|what makes|where|when)\s+/i, "")
    .replace(/\s+(are having their moment right now|right now|today)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildBlogTopicHints(title: string, cuisineLabel?: string) {
  const value = title.toLowerCase();
  const hints: string[] = [];

  if (value.includes("spice blend")) {
    if (cuisineLabel) {
      hints.push(`${cuisineLabel} spice blend`);
      hints.push(`${cuisineLabel} spices`);
      hints.push(`${cuisineLabel} food spread`);
    } else {
      hints.push("spice blend bowls");
      hints.push("assorted spices on table");
    }
  }

  if (value.includes("sauce")) {
    hints.push(cuisineLabel ? `${cuisineLabel} sauce bowl` : "spicy sauce bowl");
  }

  if (value.includes("paste")) {
    hints.push(cuisineLabel ? `${cuisineLabel} chili paste bowl` : "chili paste bowl");
  }

  if (value.includes("pepper")) {
    hints.push(cuisineLabel ? `${cuisineLabel} chili peppers` : "fresh chili peppers");
  }

  if (!hints.length && cuisineLabel) {
    hints.push(`${cuisineLabel} food spread`);
    hints.push(`${cuisineLabel} dishes`);
  }

  return hints;
}

function buildBlogPhotoSearchQueries(input: {
  title: string;
  category?: string | null;
  cuisineType?: string | null;
  heroImageQuery?: string | null;
}) {
  const cleanTitle = stripBlogTitleQualifiers(input.title);
  const cuisineLabel = formatCuisineQuery(input.cuisineType);
  const categoryLabel = input.category?.replace(/-/g, " ").trim();
  const topicHints = buildBlogTopicHints(cleanTitle, cuisineLabel);

  return dedupeList(
    [
      normalizePhotoSearchQuery(input.heroImageQuery),
      ...topicHints,
      cuisineLabel ? `${cuisineLabel} food` : undefined,
      categoryLabel && cuisineLabel ? `${categoryLabel} ${cuisineLabel} food` : undefined,
      cleanTitle,
      `${cleanTitle} food`,
      cuisineLabel ? `${cuisineLabel} ${cleanTitle}` : undefined,
      cuisineLabel ? `${cuisineLabel} dishes` : undefined,
      categoryLabel ? `${categoryLabel} spicy food` : undefined
    ].filter(Boolean) as string[]
  ).slice(0, 8);
}

async function fetchImageForQuery(query: string) {
  if (env.UNSPLASH_ACCESS_KEY) {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`
          }
        }
      );

      if (response.ok) {
        const json = await response.json();
        const imageUrl = json.results?.[0]?.urls?.regular;
        if (imageUrl) return imageUrl as string;
      }
    } catch {
      // Fall through to Pexels and then fallback art.
    }
  }

  if (env.PEXELS_API_KEY) {
    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
        {
          headers: {
            Authorization: env.PEXELS_API_KEY
          }
        }
      );

      if (response.ok) {
        const json = await response.json();
        const imageUrl = json.photos?.[0]?.src?.large2x;
        if (imageUrl) return imageUrl as string;
      }
    } catch {
      return undefined;
    }
  }

  return undefined;
}

const cuisinePalettes: Record<
  string,
  { background: string; glow: string; accent: string; surface: string; garnish: string; spice: string }
> = {
  ethiopian: {
    background: "linear-gradient(135deg, #17110d 0%, #4a2711 42%, #8a2f0f 100%)",
    glow: "#f59e0b",
    accent: "#fde68a",
    surface: "#26160e",
    garnish: "#fcd34d",
    spice: "#ef4444"
  },
  indian: {
    background: "linear-gradient(135deg, #19110d 0%, #5b2d10 40%, #9a3412 100%)",
    glow: "#fb923c",
    accent: "#fde68a",
    surface: "#29170f",
    garnish: "#facc15",
    spice: "#dc2626"
  },
  korean: {
    background: "linear-gradient(135deg, #180c0d 0%, #571c1f 45%, #b91c1c 100%)",
    glow: "#fb7185",
    accent: "#fecaca",
    surface: "#260d10",
    garnish: "#fcd34d",
    spice: "#ef4444"
  },
  mexican: {
    background: "linear-gradient(135deg, #1a120d 0%, #5b2713 42%, #9a3412 100%)",
    glow: "#fb923c",
    accent: "#fde68a",
    surface: "#2b170f",
    garnish: "#86efac",
    spice: "#ef4444"
  },
  other: {
    background: "linear-gradient(135deg, #151418 0%, #2b2220 42%, #5b2d10 100%)",
    glow: "#fb923c",
    accent: "#f8fafc",
    surface: "#1d1a1f",
    garnish: "#fde68a",
    spice: "#f97316"
  }
};

function getPalette(cuisine?: string | null) {
  const normalized = cuisine?.toLowerCase().replace(/\s+/g, "_") || "other";
  return cuisinePalettes[normalized] || cuisinePalettes.other;
}

function formatLabel(value?: string | null) {
  return value
    ? value
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase())
    : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "FlamingFoodies Story";
  const eyebrow = searchParams.get("eyebrow") || "Story";
  const subtitle = searchParams.get("subtitle") || "FlamingFoodies editorial";
  const category = searchParams.get("category") || "story";
  const cuisine = searchParams.get("cuisine") as CuisineType | null;
  const heat = searchParams.get("heat") as HeatLevel | null;
  const heroImageQuery = searchParams.get("query");

  const queries = buildBlogPhotoSearchQueries({
    title,
    category,
    cuisineType: cuisine,
    heroImageQuery
  });

  for (const query of queries) {
    const imageUrl = await fetchImageForQuery(query);

    if (imageUrl) {
      return new Response(null, {
        status: 307,
        headers: {
          Location: imageUrl,
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800"
        }
      });
    }
  }

  const palette = getPalette(cuisine);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "stretch",
          padding: 54,
          background: palette.background,
          color: "white"
        }}
      >
        <div
          style={{
            width: 470,
            height: "100%",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 420,
              height: 420,
              borderRadius: 9999,
              background: `radial-gradient(circle, ${palette.glow} 0%, rgba(255,255,255,0) 70%)`,
              opacity: 0.28
            }}
          />
          <div
            style={{
              position: "relative",
              width: 330,
              height: 330,
              borderRadius: 9999,
              background: "#f7f2ea",
              border: "18px solid rgba(0,0,0,0.16)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 24px 60px rgba(0,0,0,0.28)"
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 170,
                height: 170,
                borderRadius: 9999,
                background: palette.spice,
                top: 72,
                left: 80,
                filter: "blur(1px)"
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 120,
                height: 120,
                borderRadius: 9999,
                background: palette.garnish,
                top: 112,
                left: 156,
                opacity: 0.95
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 82,
                height: 82,
                borderRadius: 9999,
                background: palette.accent,
                top: 98,
                left: 128
              }}
            />
          </div>
        </div>
        <div
          style={{
            width: 580,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                fontSize: 26,
                letterSpacing: 6,
                textTransform: "uppercase",
                opacity: 0.78
              }}
            >
              {eyebrow}
            </div>
            <div style={{ fontSize: 68, lineHeight: 1.03, fontWeight: 800 }}>
              {title}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 28, opacity: 0.88 }}>
            <div>{subtitle}</div>
            <div>
              {[formatLabel(cuisine), formatLabel(heat), "FlamingFoodies editorial"]
                .filter(Boolean)
                .join(" • ")}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
