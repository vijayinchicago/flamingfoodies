// Curated cross-references to Bark & Baste, FlamingFoodies' sibling food site
// focused on BBQ technique, rubs, and smoked cooking.
//
// Why this file exists:
//   Same-owner cross-linking helps SEO when it reads as editorial. Programmatic
//   reciprocal linking (same footer block on every page) gets discounted by
//   Google. This file holds *curated* mappings — each entry should be an
//   editorially-justified link, not a blanket reference.
//
// How to add an entry:
//   Only add a mapping when there is a real reason a reader of THIS pepper or
//   THIS recipe would benefit from the linked Bark & Baste content. Vary the
//   anchor text. Don't reciprocate 1:1 on the same pages — let the flow be
//   asymmetric.

export interface SisterSiteLink {
  /** Full URL on the sibling site. */
  url: string;
  /** Headline of the linked piece — used as the card title. */
  title: string;
  /** Anchor text suggestion (varied per entry to avoid exact-match patterns). */
  anchor?: string;
  /** One-sentence editorial reason this link is here. */
  reason: string;
  /** Optional eyebrow override; defaults to "From our BBQ desk". */
  eyebrow?: string;
}

export const SISTER_SITE = {
  name: "Bark & Baste",
  url: "https://www.barkandbaste.com",
  description: "Our sibling site covering BBQ technique, rubs, and smoked cooking."
} as const;

// Map pepper slug → curated Bark & Baste links. Leave empty for peppers where
// there is no genuine BBQ angle worth surfacing.
export const SISTER_LINKS_BY_PEPPER: Record<string, SisterSiteLink[]> = {
  // Example shape — edit / extend as Bark & Baste content is published:
  //
  // jalapeno: [
  //   {
  //     url: "https://www.barkandbaste.com/recipes/smoked-jalapeno-popper-burnt-ends",
  //     title: "Smoked jalapeño popper burnt ends",
  //     anchor: "the smoked popper version",
  //     reason: "Pairs the jalapeño profile readers already understand with a low-and-slow BBQ application."
  //   }
  // ]
};

// Map recipe slug → curated Bark & Baste links. Same rules apply.
export const SISTER_LINKS_BY_RECIPE: Record<string, SisterSiteLink[]> = {
  // Example shape — edit / extend over time:
  //
  // "cajun-hot-honey-salmon-rice-bowls": [
  //   {
  //     url: "https://www.barkandbaste.com/rubs/cajun-bbq-rub",
  //     title: "A balanced Cajun BBQ rub",
  //     anchor: "the Bark & Baste Cajun rub",
  //     reason: "The same Cajun heat profile applied to slow-smoked proteins."
  //   }
  // ]
};

// Map review slug → curated Bark & Baste links (for hot sauce review pages).
export const SISTER_LINKS_BY_REVIEW: Record<string, SisterSiteLink[]> = {};

export function getSisterLinksForPepper(slug: string): SisterSiteLink[] {
  return SISTER_LINKS_BY_PEPPER[slug] ?? [];
}

export function getSisterLinksForRecipe(slug: string): SisterSiteLink[] {
  return SISTER_LINKS_BY_RECIPE[slug] ?? [];
}

export function getSisterLinksForReview(slug: string): SisterSiteLink[] {
  return SISTER_LINKS_BY_REVIEW[slug] ?? [];
}

/** Whether ANY curated cross-references exist for a given identifier. */
export function hasSisterLinks(links: SisterSiteLink[]): boolean {
  return Array.isArray(links) && links.length > 0;
}
