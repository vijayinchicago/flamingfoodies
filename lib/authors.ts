import { absoluteUrl } from "@/lib/utils";

export const EDITORIAL_PERSONA_DISCLOSURE =
  "These are FlamingFoodies editorial pen names, each covering a different subject. They do not represent individual employees or personal testing experience.";

export type PublicAuthorProfile = {
  slug: string;
  displayName: string;
  kind: "person" | "organization";
  profileType: "editorial_persona" | "contributor";
  role: string;
  personality: string;
  shortBio: string;
  longBio: string;
  focusAreas: string[];
  aliases: string[];
  /**
   * Optional cross-publication credit. Render an "Also writes at" line linking
   * to a sibling publication when this author contributes to both.
   */
  alsoWritesAt?: { name: string; url: string };
};

const AUTHOR_PROFILES: PublicAuthorProfile[] = [
  {
    slug: "mara-santiago",
    displayName: "Mara Santiago",
    kind: "person",
    profileType: "editorial_persona",
    role: "Ingredients & Culture Editor",
    personality: "Curious, context-first, and careful with cultural claims.",
    shortBio:
      "Pepper varieties, pantry ingredients, and the regional traditions behind spicy cooking.",
    longBio:
      "Mara Santiago is our byline for ingredient and food-culture guides. Expect clear explanations of unfamiliar peppers, regional names and pantry staples, with care taken to distinguish a dish's traditions from our adaptations.",
    focusAreas: [
      "Pepper and ingredient explainers",
      "Spicy food culture and history",
      "Pantry context and regional traditions"
    ],
    aliases: ["Mara Santiago"]
  },
  {
    slug: "tess-calder",
    displayName: "Tess Calder",
    kind: "person",
    profileType: "editorial_persona",
    role: "Weeknight Recipe Editor",
    personality: "Practical, encouraging, and suspicious of unnecessary steps.",
    shortBio:
      "Weeknight dinners, useful substitutions, and simple ways to adjust the heat.",
    longBio:
      "Tess Calder is our byline for everyday cooking: noodles, tacos, bowls and dinners that fit into a busy evening. The focus is on clear timing, sensible substitutions and knowing which steps are worth the effort.",
    focusAreas: [
      "Weeknight and beginner-friendly recipes",
      "Substitutions and heat-level calibration",
      "Bowls, noodles, tacos, and fast dinners"
    ],
    aliases: ["Tess Calder"]
  },
  {
    slug: "rowan-flint",
    displayName: "Rowan Flint",
    kind: "person",
    profileType: "editorial_persona",
    role: "Technique Editor",
    personality: "Method-driven, detail-minded, and interested in how heat changes as food cooks.",
    shortBio:
      "Grilling, slow cooking, fermentation, and the details that make a method work.",
    longBio:
      "Rowan Flint is our byline for cooking techniques and weekend projects. These guides pay attention to temperature, texture and the signs that tell you when to move to the next step, from browning a braise to tending a grill.",
    focusAreas: [
      "Cooking science and pepper behavior",
      "Grilling, smoke, braises, and fermentation",
      "Longer-cook and advanced recipe projects"
    ],
    aliases: ["Rowan Flint"]
  },
  {
    slug: "miles-hart",
    displayName: "Miles Hart",
    kind: "person",
    profileType: "editorial_persona",
    role: "Reviews & Gear Editor",
    personality: "Skeptical, value-minded, and focused on fit instead of hype.",
    shortBio:
      "Hot sauce, kitchen gear, and buying advice that explains who a product is for.",
    longBio:
      "Miles Hart is our byline for bottle reviews, gear and buying guides. The focus is on practical comparisons: what a product offers, who might find it useful, where the information comes from and when to skip it.",
    focusAreas: [
      "Hot sauce and pantry-product reviews",
      "Buying guides, gear, and comparisons",
      "Price, value, and best-for recommendations"
    ],
    aliases: ["Miles Hart"]
  }
];

export type EditorialAuthorAssignmentInput = {
  type: "blog" | "recipe" | "review";
  title: string;
  category?: string | null;
  tags?: string[] | null;
  difficulty?: string | null;
  totalTimeMinutes?: number | null;
  currentAuthorName?: string | null;
};

const LEGACY_EDITORIAL_BYLINES = new Set(
  [
    "FlamingFoodies",
    "FlamingFoodies Team",
    "FlamingFoodies editorial",
    "FlamingFoodies editorial team",
    "FlamingFoodies Test Kitchen",
    "FlamingFoodies AI Test Kitchen",
    "FlamingFoodies Review Desk",
    "FlamingFoodies AI Desk",
    "QA"
  ].map((name) => name.toLowerCase())
);

const STRONG_COMMERCE_PATTERN =
  /\b(buying guide|gift guide|product review|shopping guide|subscription box)\b/i;
const GUIDE_COMMERCE_PATTERN =
  /\b(best|bottle|buy|buyer|buying|choose|comparison|gift|hot sauce|pick|price|review|shelf|shop|subscription|value)\b/i;
const TECHNIQUE_PATTERN =
  /\b(barbecue|bbq|brais\w*|capsaicin|chemistry|ferment\w*|grill\w*|method|pressure[- ]cook\w*|roast\w*|science|scoville|slow[- ]cook\w*|smok\w*|technique)\b/i;
const PRACTICAL_COOKING_PATTERN =
  /\b(bowl|breakfast|cook\w*|dinner|lunch|meal|noodle|pasta|quick|recipe|serve|substitut\w*|taco|weeknight)\b/i;
const PROJECT_RECIPE_PATTERN =
  /\b(barbecue|bbq|birria|brais\w*|brisket|ferment\w*|grill\w*|jerk|pressure[- ]cook\w*|project|rib\w*|roast\w*|slow[- ]cook\w*|smok\w*)\b/i;

function normalizeAuthorName(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

function isLegacyEditorialByline(value?: string | null) {
  const normalized = normalizeAuthorName(value);
  return !normalized || LEGACY_EDITORIAL_BYLINES.has(normalized);
}

function getAssignmentText(input: EditorialAuthorAssignmentInput) {
  return [input.title, input.category, ...(input.tags ?? [])].filter(Boolean).join(" ");
}

export function resolveEditorialAuthorName(input: EditorialAuthorAssignmentInput) {
  if (!isLegacyEditorialByline(input.currentAuthorName)) {
    return input.currentAuthorName!.trim();
  }

  if (input.type === "review") {
    return "Miles Hart";
  }

  const assignmentText = getAssignmentText(input);

  if (input.type === "recipe") {
    const isProjectRecipe =
      input.difficulty === "advanced" ||
      (input.totalTimeMinutes ?? 0) >= 75 ||
      PROJECT_RECIPE_PATTERN.test(assignmentText);

    return isProjectRecipe ? "Rowan Flint" : "Tess Calder";
  }

  if (
    input.category === "gear" ||
    input.category === "reviews" ||
    STRONG_COMMERCE_PATTERN.test(assignmentText) ||
    (input.category === "guides" && GUIDE_COMMERCE_PATTERN.test(assignmentText))
  ) {
    return "Miles Hart";
  }

  if (input.category === "science" || TECHNIQUE_PATTERN.test(assignmentText)) {
    return "Rowan Flint";
  }

  if (input.category === "culture") {
    return "Mara Santiago";
  }

  if (
    input.category === "recipes" ||
    (!input.category && PRACTICAL_COOKING_PATTERN.test(assignmentText))
  ) {
    return "Tess Calder";
  }

  return "Mara Santiago";
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
      jobTitle: author.role,
      description: `${author.shortBio} ${EDITORIAL_PERSONA_DISCLOSURE}`,
      knowsAbout: author.focusAreas,
      worksFor: {
        "@type": "Organization",
        name: "FlamingFoodies",
        url: absoluteUrl("/about")
      }
    };
  }

  return {
    "@type": "Organization",
    name: author.displayName,
    url,
    description: author.shortBio
  };
}

export function buildAuthorProfileStructuredData(author: PublicAuthorProfile) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: buildAuthorStructuredData(author.displayName)
  };
}
