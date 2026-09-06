import { absoluteUrl } from "@/lib/utils";

export const EDITORIAL_PERSONA_DISCLOSURE =
  "FlamingFoodies uses disclosed editorial pen names to keep each coverage lane consistent. These names identify an editorial voice and area of responsibility; they are not claims about a fictional employee's credentials, lived experience, or hands-on testing.";

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
      "A disclosed editorial pen name for ingredient explainers, pepper knowledge, food culture, and the stories behind spicy cooking.",
    longBio:
      "The Mara Santiago byline marks FlamingFoodies coverage that begins with context: what an ingredient is, how a pepper behaves, where a technique fits, and what readers should understand before they cook. It is an editorial persona, not a claim about one fictional writer's biography or personal experience.",
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
      "A disclosed editorial pen name for approachable recipes, useful substitutions, and heat that works for mixed-tolerance tables.",
    longBio:
      "The Tess Calder byline identifies the practical side of the FlamingFoodies kitchen: recipes designed for repeat cooking, clear timing, flexible substitutions, and a heat level readers can control. It is an editorial persona and does not represent a fictional cook's personal résumé or testing history.",
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
    role: "Technique & Test Kitchen Editor",
    personality: "Method-driven, detail-minded, and interested in how heat changes as food cooks.",
    shortBio:
      "A disclosed editorial pen name for cooking science, fermentation, grilling, and recipes where method matters as much as ingredients.",
    longBio:
      "The Rowan Flint byline marks technique-heavy FlamingFoodies work: longer cooks, grilling and smoke, fermentation, pepper science, and recipes where visual cues matter more than a timer alone. It is an editorial persona, not a claim of individual credentials or unrecorded hands-on testing.",
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
      "A disclosed editorial pen name for hot sauce reviews, buying guides, gear, and product comparisons with clear commercial context.",
    longBio:
      "The Miles Hart byline identifies FlamingFoodies coverage built around a buying decision: bottle reviews, shelf guides, gear, subscriptions, and product comparisons. The voice favors best-for, skip-if, price, and use-case context. It is an editorial persona and never substitutes for a clearly labeled hands-on test.",
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

const COMMERCE_PATTERN =
  /\b(best|bottle|brand|buy|buyer|buying|choose|comparison|gift|gear|pick|price|product|review|shelf|shop|subscription|value)\b/i;
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

  if (input.category === "gear" || input.category === "reviews" || COMMERCE_PATTERN.test(assignmentText)) {
    return "Miles Hart";
  }

  if (input.category === "science" || TECHNIQUE_PATTERN.test(assignmentText)) {
    return "Rowan Flint";
  }

  if (input.category === "recipes" || PRACTICAL_COOKING_PATTERN.test(assignmentText)) {
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
      description: author.shortBio,
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
