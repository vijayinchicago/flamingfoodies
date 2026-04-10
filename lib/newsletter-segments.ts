export const NEWSLETTER_SEGMENTS = [
  {
    tag: "weekly-roundup",
    label: "Weekly Roundup",
    shortLabel: "Weekly",
    description: "The strongest recipes, guides, and bottle picks from across the site.",
    sourceLabel: "General readers"
  },
  {
    tag: "recipe-club",
    label: "Recipe Club",
    shortLabel: "Recipes",
    description: "Weeknight dinners, cookout ideas, and the spicy meals most worth saving.",
    sourceLabel: "Home cooks"
  },
  {
    tag: "hot-sauce-shelf",
    label: "Hot Sauce Shelf Notes",
    shortLabel: "Hot sauces",
    description: "Bottle picks, best-for guides, new reviews, and shelf-building advice.",
    sourceLabel: "Sauce shoppers"
  },
  {
    tag: "cook-shop",
    label: "Cook / Shop",
    shortLabel: "Cook / Shop",
    description: "A tighter mix of practical recipes and the gear, pantry, or bottles that support them.",
    sourceLabel: "Action-oriented buyers"
  }
] as const;

export type NewsletterSegmentTag = (typeof NEWSLETTER_SEGMENTS)[number]["tag"];

export function isNewsletterSegmentTag(value: string): value is NewsletterSegmentTag {
  return NEWSLETTER_SEGMENTS.some((segment) => segment.tag === value);
}

export function getNewsletterSegment(tag: string) {
  return NEWSLETTER_SEGMENTS.find((segment) => segment.tag === tag);
}

export function normalizeNewsletterSegmentTags(values: string[] | undefined) {
  return Array.from(new Set((values ?? []).filter(isNewsletterSegmentTag)));
}

export function formatNewsletterAudience(tags: string[] | undefined) {
  const normalized = normalizeNewsletterSegmentTags(tags);

  if (!normalized.length) {
    return "All active subscribers";
  }

  return normalized
    .map((tag) => getNewsletterSegment(tag)?.shortLabel ?? tag)
    .join(" + ");
}
