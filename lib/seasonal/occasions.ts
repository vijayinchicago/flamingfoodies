import type { CuisineType, HeatLevel } from "@/lib/types";

export interface SeasonalOccasion {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  eyebrow: string;
  seoTitle: string;
  seoDescription: string;
  /** Month(s) this is most relevant (1-indexed) */
  peakMonths: number[];
  recipeFilters: {
    query?: string;
    cuisines?: CuisineType[];
    heatLevels?: HeatLevel[];
    tags?: string[];
  };
  reviewFilters: {
    tags?: string[];
    heatLevels?: HeatLevel[];
    maxHeat?: HeatLevel;
  };
  editorialNote: string;
  buyingTip: string;
  guideLinks: Array<{ href: string; label: string }>;
}

export const SEASONAL_OCCASIONS: SeasonalOccasion[] = [
  {
    slug: "super-bowl",
    title: "Super Bowl Party Food",
    tagline: "Wing sauces, dips, and snacks that actually hit.",
    description:
      "Super Bowl food lives and dies by the spread. These are the hot sauce picks, wing recipes, dips, and pantry staples that make a game-day table feel intentional.",
    eyebrow: "Game Day",
    seoTitle: "Super Bowl Party Food: Hot Sauces, Wings, and Dips | FlamingFoodies",
    seoDescription:
      "The best hot sauces, wing recipes, and spicy dips for Super Bowl game day. Tested picks for wings, nachos, and dipping sauces.",
    peakMonths: [1, 2],
    recipeFilters: {
      tags: ["wings", "dip", "nachos", "game day", "snack", "appetizer"],
      query: "wings"
    },
    reviewFilters: {
      heatLevels: ["medium", "hot"]
    },
    editorialNote:
      "For game day, the crowd matters. Skip superhots unless you know the room — a medium habanero or cayenne-based sauce hits more people and pairs better with ranch and blue cheese.",
    buyingTip:
      "Stock one everyday pour for nachos, one wing sauce with heat, and one smoky option for the dipping platter. Three bottles cover every palate.",
    guideLinks: [
      { href: "/hot-sauces/best-for-wings", label: "Best sauces for wings" },
      { href: "/hot-sauces/best", label: "Top bottle picks" },
      { href: "/shop", label: "Shop the full spread" }
    ]
  },
  {
    slug: "bbq-season",
    title: "BBQ Season",
    tagline: "Grill-ready heat from Memorial Day to Labor Day.",
    description:
      "Grilling season calls for sauces and rubs that can handle fire. From brisket marinades to grilled shrimp finishers, these are the bottles and recipes that earn their place at the grill.",
    eyebrow: "Summer Grilling",
    seoTitle: "BBQ Season Hot Sauces and Grill Recipes | FlamingFoodies",
    seoDescription:
      "The best hot sauces, rubs, and marinades for BBQ season. Spicy grill recipes for wings, ribs, shrimp, and smoked meats.",
    peakMonths: [5, 6, 7, 8, 9],
    recipeFilters: {
      tags: ["grill", "bbq", "smoke", "marinade", "outdoor"],
      query: "grill"
    },
    reviewFilters: {
      heatLevels: ["medium", "hot"]
    },
    editorialNote:
      "Grilled food can take more heat than stovetop. Char and smoke absorb brightness, so sauces with acid, fruit, or bold pepper flavor read more clearly than they would on a milder dish.",
    buyingTip:
      "A smoky chipotle sauce and a bright habanero with fruit notes cover most grilling scenarios. Add a reaper option for those who want a moment.",
    guideLinks: [
      { href: "/hot-sauces/best", label: "Best grilling sauces" },
      { href: "/recipes?sort=hottest", label: "Hottest grill recipes" },
      { href: "/shop", label: "Shop grill gear" }
    ]
  },
  {
    slug: "cinco-de-mayo",
    title: "Cinco de Mayo",
    tagline: "Tacos, salsas, and margarita-friendly heat.",
    description:
      "Cinco de Mayo is taco night at full volume. These are the sauces, recipes, and pantry picks that make a proper spread — from birria to street corn to the right bottle on the table.",
    eyebrow: "May 5th",
    seoTitle: "Cinco de Mayo Recipes and Hot Sauces | FlamingFoodies",
    seoDescription:
      "The best hot sauces and spicy recipes for Cinco de Mayo — tacos, salsas, guacamole, and margarita-friendly heat picks.",
    peakMonths: [4, 5],
    recipeFilters: {
      cuisines: ["mexican"],
      query: "taco"
    },
    reviewFilters: {
      heatLevels: ["mild", "medium", "hot"]
    },
    editorialNote:
      "Mexican heat is usually about brightness and acid, not just burn. Valentina, Cholula, and good habanero sauces earn their place here because the flavors amplify rather than overwhelm.",
    buyingTip:
      "Start with an everyday pour like Valentina, add a fruitier habanero for tacos, and stock a smoky option for grilled meats. Three bottles, covered.",
    guideLinks: [
      { href: "/hot-sauces/best-for-tacos", label: "Best sauces for tacos" },
      { href: "/recipes?cuisine=mexican", label: "Browse Mexican recipes" },
      { href: "/hot-sauces/under-15", label: "Best under $15" }
    ]
  },
  {
    slug: "holiday-gifting",
    title: "Holiday Gift Guide",
    tagline: "Spicy gifts for the hot heads on your list.",
    description:
      "For the person who adds hot sauce to everything — thoughtful sets, discovery subscriptions, and pantry upgrades that land better than another novelty bottle with a skull on the label.",
    eyebrow: "Gift Season",
    seoTitle: "Spicy Food Gift Guide | Hot Sauce Gifts | FlamingFoodies",
    seoDescription:
      "The best hot sauce gifts and spicy food gift sets for the holiday season. Curated picks for heat lovers, home cooks, and foodies.",
    peakMonths: [11, 12],
    recipeFilters: {
      query: "holiday"
    },
    reviewFilters: {
      tags: ["giftable", "gift-set"],
      heatLevels: ["mild", "medium", "hot"]
    },
    editorialNote:
      "The best heat gifts are the ones the recipient actually uses. A curated set at a familiar heat level gets opened; a novelty superhot gets displayed.",
    buyingTip:
      "Subscription boxes and curated gift sets outperform single bottles as gifts because they signal effort and give the recipient something to explore over time.",
    guideLinks: [
      { href: "/hot-sauces/best-gift-sets", label: "Best hot sauce gift sets" },
      { href: "/hot-sauces/gifts-under-50", label: "Gifts under $50" },
      { href: "/subscriptions", label: "Explore subscriptions" }
    ]
  }
];

export function getOccasionBySlug(slug: string): SeasonalOccasion | null {
  return SEASONAL_OCCASIONS.find((o) => o.slug === slug) ?? null;
}

export function getCurrentOccasions(now = new Date()): SeasonalOccasion[] {
  const month = now.getMonth() + 1;
  return SEASONAL_OCCASIONS.filter((o) => o.peakMonths.includes(month));
}
