import { absoluteUrl } from "@/lib/utils";

export type PublicAuthorProfile = {
  slug: string;
  displayName: string;
  kind: "person" | "organization";
  role: string;
  shortBio: string;
  longBio: string;
  focusAreas: string[];
  aliases: string[];
};

const AUTHOR_PROFILES: PublicAuthorProfile[] = [
  {
    slug: "flamingfoodies-team",
    displayName: "FlamingFoodies Team",
    kind: "organization",
    role: "Editorial team",
    shortBio:
      "Publishes spicy food explainers, shopping guides, and culture coverage with a practical kitchen lens.",
    longBio:
      "The FlamingFoodies Team handles broader editorial coverage across spicy food culture, shelf-building, pantry guides, and practical stories meant to help readers cook and buy with more confidence.",
    focusAreas: [
      "Spicy food explainers",
      "Buying guides and shelf-building",
      "Ingredient, culture, and pantry coverage"
    ],
    aliases: [
      "FlamingFoodies",
      "FlamingFoodies Team",
      "FlamingFoodies editorial",
      "FlamingFoodies editorial team"
    ]
  },
  {
    slug: "flamingfoodies-test-kitchen",
    displayName: "FlamingFoodies Test Kitchen",
    kind: "organization",
    role: "Recipe development team",
    shortBio:
      "Develops and adapts recipes for weeknight cooking, mixed heat tolerances, and repeat use.",
    longBio:
      "The FlamingFoodies Test Kitchen focuses on recipes that can hold up in real kitchens: approachable spice levels, clear steps, and dishes that earn a repeat cook instead of reading like heat stunts.",
    focusAreas: [
      "Recipe development",
      "Weeknight dinner testing",
      "Heat-level calibration and substitutions"
    ],
    aliases: ["FlamingFoodies Test Kitchen"]
  },
  {
    slug: "flamingfoodies-review-desk",
    displayName: "FlamingFoodies Review Desk",
    kind: "organization",
    role: "Review desk",
    shortBio:
      "Covers hot sauce and spicy pantry products with an emphasis on flavor, heat behavior, repeat use, and fit.",
    longBio:
      "The FlamingFoodies Review Desk handles commercial-intent coverage that needs sharper product context, including bottle reviews, comparison pieces, and gift-oriented buying guides.",
    focusAreas: [
      "Hot sauce reviews",
      "Comparison coverage",
      "Gift guides and price-context recommendations"
    ],
    aliases: ["FlamingFoodies Review Desk"]
  },
  {
    slug: "mara-santiago",
    displayName: "Mara Santiago",
    kind: "person",
    role: "Contributor",
    shortBio:
      "Writes about chili technique, pantry staples, and how spicy ingredients fit into everyday cooking.",
    longBio:
      "Mara Santiago contributes explanatory pieces and cooking context around peppers, pantry staples, and the practical side of building more flavorful spicy-food habits at home.",
    focusAreas: [
      "Chili technique and pantry context",
      "Ingredient explainers",
      "Everyday cooking applications"
    ],
    aliases: ["Mara Santiago"]
  }
];

function normalizeAuthorName(value?: string) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

const AUTHOR_ALIAS_MAP = AUTHOR_PROFILES.reduce<Record<string, PublicAuthorProfile>>(
  (map, author) => {
    for (const alias of author.aliases) {
      map[normalizeAuthorName(alias)] = author;
    }

    return map;
  },
  {}
);

export function getAllPublicAuthors() {
  return AUTHOR_PROFILES;
}

export function getPublicAuthorBySlug(slug: string) {
  return AUTHOR_PROFILES.find((author) => author.slug === slug) ?? null;
}

export function getPublicAuthorByName(name?: string) {
  const normalized = normalizeAuthorName(name);
  if (!normalized) return null;
  return AUTHOR_ALIAS_MAP[normalized] ?? null;
}

export function matchesPublicAuthorName(author: PublicAuthorProfile, name?: string) {
  const normalized = normalizeAuthorName(name);
  if (!normalized) return false;
  return author.aliases.some((alias) => normalizeAuthorName(alias) === normalized);
}

export function getPublicAuthorHref(name?: string) {
  const author = getPublicAuthorByName(name);
  return author ? `/authors/${author.slug}` : "/about";
}

export function buildAuthorStructuredData(name?: string) {
  const author = getPublicAuthorByName(name);

  if (!author) {
    return {
      "@type": "Organization",
      name: "FlamingFoodies",
      url: absoluteUrl("/about")
    };
  }

  const url = absoluteUrl(`/authors/${author.slug}`);

  if (author.kind === "person") {
    return {
      "@type": "Person",
      name: author.displayName,
      url,
      description: author.shortBio
    };
  }

  return {
    "@type": "Organization",
    name: author.displayName,
    url,
    description: author.shortBio
  };
}
