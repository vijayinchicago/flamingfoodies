import { env } from "@/lib/env";
import type { CuisineType, HeatLevel } from "@/lib/types";

export type AffiliateCategory =
  | "hot_sauce"
  | "gear"
  | "ingredient"
  | "subscription";

export interface AffiliateLinkDefinition {
  partner: string;
  product: string;
  url: string;
  category: AffiliateCategory;
  badge: string;
  description: string;
  priceLabel?: string;
  bestFor: string;
  cuisines?: CuisineType[];
  heatLevels?: HeatLevel[];
}

export interface AffiliateLinkEntry extends AffiliateLinkDefinition {
  key: string;
}

export interface MerchItem {
  slug: string;
  name: string;
  category: string;
  badge: string;
  description: string;
  priceLabel: string;
  status: "preview" | "waitlist";
  accent: string;
  href: string;
  ctaLabel: string;
}

const AMAZON_TAG = env.NEXT_PUBLIC_AMAZON_TAG || "flamingfoodies-20";

export function buildAmazonSearchUrl(query: string) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${AMAZON_TAG}`;
}

export const AFFILIATE_LINKS: Record<string, AffiliateLinkDefinition> = {
  "amazon-cast-iron-skillet": {
    partner: "amazon",
    product: "12-Inch Cast Iron Skillet",
    url: buildAmazonSearchUrl("12 inch cast iron skillet lodge"),
    category: "gear",
    badge: "Kitchen staple",
    description: "The sear-and-char pan for smash burgers, fajitas, cornbread, and anything that likes hard edges.",
    priceLabel: "$25-$45",
    bestFor: "Weeknight proteins and pan sauces",
    cuisines: ["american", "mexican", "cajun"],
    heatLevels: ["medium", "hot", "inferno"]
  },
  "amazon-carbon-steel-wok": {
    partner: "amazon",
    product: "Carbon Steel Wok",
    url: buildAmazonSearchUrl("carbon steel wok round bottom"),
    category: "gear",
    badge: "Fast heat",
    description: "Built for smoky stir-fries, chili oil noodles, and any dinner that needs real burner contact.",
    priceLabel: "$35-$70",
    bestFor: "High-heat noodles and fried rice",
    cuisines: ["thai", "szechuan", "chinese", "korean"],
    heatLevels: ["hot", "inferno", "reaper"]
  },
  "amazon-molcajete": {
    partner: "amazon",
    product: "Molcajete Mortar and Pestle",
    url: buildAmazonSearchUrl("molcajete mortar pestle volcanic stone"),
    category: "gear",
    badge: "Sauce lab",
    description: "The right move for salsa macha, charred pepper pastes, and rough-textured marinades with bite.",
    priceLabel: "$35-$60",
    bestFor: "Fresh salsa and chunky chili pastes",
    cuisines: ["mexican", "peruvian", "american"],
    heatLevels: ["medium", "hot", "inferno", "reaper"]
  },
  "amazon-fermentation-jar-kit": {
    partner: "amazon",
    product: "Fermentation Jar Kit",
    url: buildAmazonSearchUrl("fermentation jar kit weights airlock"),
    category: "gear",
    badge: "DIY hot sauce",
    description: "A clean starter kit for building fermented hot sauces and pepper mash at home.",
    priceLabel: "$20-$35",
    bestFor: "Homemade sauce projects",
    cuisines: ["other"],
    heatLevels: ["hot", "inferno", "reaper"]
  },
  "amazon-gochujang-paste": {
    partner: "amazon",
    product: "Korean Gochujang Paste",
    url: buildAmazonSearchUrl("gochujang paste"),
    category: "ingredient",
    badge: "Flavor builder",
    description: "Fermented chili paste for noodles, wings, marinades, and that sweet-savory Korean backbone.",
    priceLabel: "$8-$15",
    bestFor: "Layered heat with umami",
    cuisines: ["korean"],
    heatLevels: ["medium", "hot"]
  },
  "amazon-calabrian-chili-paste": {
    partner: "amazon",
    product: "Calabrian Chili Paste",
    url: buildAmazonSearchUrl("calabrian chili paste"),
    category: "ingredient",
    badge: "Pantry heat",
    description: "Fruity Italian chili paste that wakes up vodka sauce, roast chicken, and garlicky pasta nights.",
    priceLabel: "$10-$18",
    bestFor: "Pasta, sandwiches, and finishing sauces",
    cuisines: ["italian"],
    heatLevels: ["medium", "hot"]
  },
  "amazon-berbere-blend": {
    partner: "amazon",
    product: "Berbere Spice Blend",
    url: buildAmazonSearchUrl("berbere spice blend"),
    category: "ingredient",
    badge: "Warm spice",
    description: "A smoky-spiced shortcut for lentils, roasted vegetables, stews, and fast weeknight braises.",
    priceLabel: "$9-$16",
    bestFor: "Sheet pan dinners and stews",
    cuisines: ["ethiopian", "west_african", "moroccan"],
    heatLevels: ["mild", "medium", "hot"]
  },
  "amazon-chili-crisp": {
    partner: "amazon",
    product: "Crunchy Chili Crisp",
    url: buildAmazonSearchUrl("chili crisp"),
    category: "ingredient",
    badge: "Texture hit",
    description: "Crunch, oil, and lingering heat for dumplings, eggs, noodles, and roasted vegetables.",
    priceLabel: "$10-$16",
    bestFor: "Finishing bowls and dumplings",
    cuisines: ["szechuan", "chinese", "thai"],
    heatLevels: ["medium", "hot", "inferno"]
  },
  "amazon-yellowbird-habanero": {
    partner: "amazon",
    product: "Yellowbird Habanero Hot Sauce",
    url: buildAmazonSearchUrl("Yellowbird habanero hot sauce"),
    category: "hot_sauce",
    badge: "Everyday bottle",
    description: "Bright carrot-habanero heat with enough body to work on eggs, tacos, and roasted vegetables.",
    priceLabel: "$7-$12",
    bestFor: "Breakfasts, tacos, and meal prep bowls",
    cuisines: ["mexican", "american"],
    heatLevels: ["medium", "hot"]
  },
  "amazon-torchbearer-garlic-reaper": {
    partner: "amazon",
    product: "Torchbearer Garlic Reaper",
    url: buildAmazonSearchUrl("Torchbearer Garlic Reaper sauce"),
    category: "hot_sauce",
    badge: "Heavy hitter",
    description: "Garlic-forward, punishingly hot, and best used when you want real reaper-level commitment.",
    priceLabel: "$13-$18",
    bestFor: "Wings, pizza, and tiny but serious dashes",
    cuisines: ["american", "italian"],
    heatLevels: ["inferno", "reaper"]
  },
  "amazon-fly-by-jing-sichuan-gold": {
    partner: "amazon",
    product: "Fly By Jing Sichuan Gold",
    url: buildAmazonSearchUrl("Fly By Jing Sichuan Gold"),
    category: "hot_sauce",
    badge: "Numbing heat",
    description: "A more citrusy, peppercorn-leaning sauce when you want flavor movement instead of pure capsaicin.",
    priceLabel: "$12-$18",
    bestFor: "Dumplings, noodles, and fried eggs",
    cuisines: ["szechuan", "chinese"],
    heatLevels: ["medium", "hot"]
  },
  "amazon-queen-majesty-scotch-bonnet-ginger": {
    partner: "amazon",
    product: "Queen Majesty Scotch Bonnet and Ginger",
    url: buildAmazonSearchUrl("Queen Majesty Scotch Bonnet Ginger"),
    category: "hot_sauce",
    badge: "Bright and fruity",
    description: "A sharper, fruitier bottle that cuts through rich seafood, roasted carrots, and fried chicken.",
    priceLabel: "$12-$16",
    bestFor: "Seafood, grilled veg, and jerk-inspired meals",
    cuisines: ["jamaican", "caribbean"],
    heatLevels: ["hot", "inferno"]
  },
  "mike-hot-honey-original": {
    partner: "mike_hot_sauce",
    product: "Mike's Hot Honey",
    url: "https://mikeshothoney.com/products/mikes-hot-honey-original",
    category: "ingredient",
    badge: "Sweet heat",
    description: "The fast-track drizzle for pizza, fried chicken, salmon, Brussels sprouts, and hot sandwiches.",
    priceLabel: "$10-$16",
    bestFor: "Finishing sweet-spicy dishes",
    cuisines: ["american", "italian"],
    heatLevels: ["mild", "medium", "hot"]
  },
  "heatonist-los-calientes-rojo": {
    partner: "heatonist",
    product: "Heatonist Los Calientes Rojo",
    url: "https://heatonist.com/products/los-calientes-rojo",
    category: "hot_sauce",
    badge: "Editor favorite",
    description: "A smoky, tomato-rich red sauce with enough complexity to be useful more often than extreme bottles are.",
    priceLabel: "$13",
    bestFor: "Tacos, eggs, grilled chicken, and chili dogs",
    cuisines: ["mexican", "american"],
    heatLevels: ["medium", "hot"]
  },
  "heatonist-hot-ones-season-22": {
    partner: "heatonist",
    product: "Hot Ones Lineup Collection",
    url: "https://heatonist.com/collections/hot-ones-hot-sauces",
    category: "subscription",
    badge: "Shelf builder",
    description: "The easiest way to stack a tasting flight of credible sauces without hunting down makers one by one.",
    priceLabel: "$35+",
    bestFor: "Gifting and sauce tastings",
    cuisines: ["other"],
    heatLevels: ["medium", "hot", "inferno", "reaper"]
  },
  "heatonist-gift-set": {
    partner: "heatonist",
    product: "Heatonist Gift Set",
    url: "https://heatonist.com/collections/hot-sauce-gift-sets",
    category: "subscription",
    badge: "Giftable",
    description: "A clean gift path for holiday drops, host presents, and getting someone deeper into hot sauce culture.",
    priceLabel: "$30+",
    bestFor: "New chili-heads and gift season",
    cuisines: ["other"],
    heatLevels: ["mild", "medium", "hot"]
  },
  "fuego-box-monthly-subscription": {
    partner: "fuego_box",
    product: "Fuego Box Monthly Subscription",
    url: "https://fuegobox.com/products/monthly-subscription",
    category: "subscription",
    badge: "Recurring favorite",
    description: "A credible discovery box for people who want new sauces arriving without falling into novelty-gag territory.",
    priceLabel: "$30+/month",
    bestFor: "Monthly discovery and gifting",
    cuisines: ["other"],
    heatLevels: ["medium", "hot", "inferno"]
  },
  "pepper-joe-superhot-seed-pack": {
    partner: "pepper_joe",
    product: "Superhot Pepper Seed Pack",
    url: "https://pepperjoe.com/collections/super-hot-pepper-seeds",
    category: "subscription",
    badge: "Grow your own",
    description: "For readers who want the gardening pipeline behind their own sauce projects and fresh mash experiments.",
    priceLabel: "$8-$25",
    bestFor: "Growers and sauce makers",
    cuisines: ["other"],
    heatLevels: ["inferno", "reaper"]
  }
};

export const HOME_FEATURED_AFFILIATE_KEYS = [
  "heatonist-los-calientes-rojo",
  "fuego-box-monthly-subscription",
  "amazon-cast-iron-skillet",
  "amazon-yellowbird-habanero"
] as const;

export const HOT_SAUCE_SPOTLIGHT_KEYS = [
  "heatonist-los-calientes-rojo",
  "amazon-yellowbird-habanero",
  "amazon-queen-majesty-scotch-bonnet-ginger",
  "amazon-fly-by-jing-sichuan-gold",
  "amazon-torchbearer-garlic-reaper",
  "heatonist-hot-ones-season-22"
] as const;

export const KITCHEN_GEAR_KEYS = [
  "amazon-cast-iron-skillet",
  "amazon-carbon-steel-wok",
  "amazon-molcajete",
  "amazon-fermentation-jar-kit"
] as const;

export const PANTRY_HEAT_KEYS = [
  "amazon-gochujang-paste",
  "amazon-calabrian-chili-paste",
  "amazon-berbere-blend",
  "amazon-chili-crisp",
  "mike-hot-honey-original"
] as const;

export const SUBSCRIPTION_KEYS = [
  "fuego-box-monthly-subscription",
  "heatonist-hot-ones-season-22",
  "heatonist-gift-set",
  "pepper-joe-superhot-seed-pack"
] as const;

export const MERCH_COLLECTION: MerchItem[] = [
  {
    slug: "sauce-lab-tee",
    name: "Sauce Lab Tee",
    category: "Apparel",
    badge: "Drop 01",
    description: "Soft heavyweight tee with a back print that maps the brand's five-stage heat ladder.",
    priceLabel: "$32",
    status: "preview",
    accent: "from-flame/30 via-ember/20 to-transparent",
    href: "/shop#merch-waitlist",
    ctaLabel: "Join merch waitlist"
  },
  {
    slug: "flame-club-hoodie",
    name: "Flame Club Hoodie",
    category: "Apparel",
    badge: "Cold-weather staple",
    description: "Oversized hoodie for smokers, late-night cooks, and anyone who treats hot sauce like pantry infrastructure.",
    priceLabel: "$68",
    status: "waitlist",
    accent: "from-ember/30 via-flame/15 to-transparent",
    href: "/shop#merch-waitlist",
    ctaLabel: "Reserve the first drop"
  },
  {
    slug: "kitchen-apron",
    name: "Kitchen Apron",
    category: "Kitchen gear",
    badge: "Cook-ready",
    description: "Waxed-canvas style apron concept with towel loop, tasting spoon pocket, and FlamingFoodies chest mark.",
    priceLabel: "$44",
    status: "preview",
    accent: "from-gold/25 via-ember/15 to-transparent",
    href: "/shop#merch-waitlist",
    ctaLabel: "Get launch access"
  },
  {
    slug: "tasting-flight-enamel-mugs",
    name: "Tasting Flight Enamel Mug Set",
    category: "Drinkware",
    badge: "Gift set",
    description: "Four mugs labeled mild through reaper for sauce flights, camp coffee, and competition judging days.",
    priceLabel: "$36",
    status: "waitlist",
    accent: "from-white/10 via-flame/15 to-transparent",
    href: "/shop#merch-waitlist",
    ctaLabel: "Join merch waitlist"
  },
  {
    slug: "heat-scale-hat",
    name: "Heat Scale Dad Hat",
    category: "Headwear",
    badge: "Low-key logo",
    description: "Clean cap with tonal embroidery for the people who want spicy references without billboard branding.",
    priceLabel: "$28",
    status: "preview",
    accent: "from-cream/10 via-ember/10 to-transparent",
    href: "/shop#merch-waitlist",
    ctaLabel: "Get launch access"
  },
  {
    slug: "sauce-station-towel-pack",
    name: "Sauce Station Towel Pack",
    category: "Kitchen linens",
    badge: "Utility set",
    description: "A trio of heavy kitchen towels built around wipe-down duty, grill nights, and messy wing sessions.",
    priceLabel: "$24",
    status: "waitlist",
    accent: "from-flame/20 via-white/10 to-transparent",
    href: "/shop#merch-waitlist",
    ctaLabel: "Reserve the first drop"
  }
];

export function getAffiliateLinkEntries(
  keys: readonly string[]
): AffiliateLinkEntry[] {
  return keys.flatMap((key) =>
    AFFILIATE_LINKS[key]
      ? [
          {
            key,
            ...AFFILIATE_LINKS[key]
          }
        ]
      : []
  );
}

export function findAffiliateLinkByUrl(url?: string | null) {
  if (!url) return null;

  const entry = Object.entries(AFFILIATE_LINKS).find(([, link]) => link.url === url);
  if (!entry) return null;

  return {
    key: entry[0],
    ...entry[1]
  };
}

function scoreRecipeRecommendation(
  link: AffiliateLinkDefinition,
  cuisineType?: CuisineType,
  heatLevel?: HeatLevel
) {
  let score = link.category === "gear" ? 3 : 2;

  if (link.cuisines?.includes(cuisineType || "other")) {
    score += 4;
  }

  if (link.heatLevels?.includes(heatLevel || "medium")) {
    score += 2;
  }

  if (link.category === "ingredient") {
    score += 1;
  }

  return score;
}

function scoreReviewRecommendation(
  link: AffiliateLinkDefinition,
  category?: string,
  cuisineType?: CuisineType,
  heatLevel?: HeatLevel
) {
  let score =
    link.category === "hot_sauce" || link.category === "subscription" ? 4 : 2;

  if (category?.includes("subscription") && link.category === "subscription") {
    score += 3;
  }

  if (category?.includes("hot-sauce") && link.category === "hot_sauce") {
    score += 3;
  }

  if (link.cuisines?.includes(cuisineType || "other")) {
    score += 2;
  }

  if (link.heatLevels?.includes(heatLevel || "medium")) {
    score += 1;
  }

  return score;
}

export function getRecipeAffiliateRecommendations({
  cuisineType,
  heatLevel,
  limit = 3
}: {
  cuisineType?: CuisineType;
  heatLevel?: HeatLevel;
  limit?: number;
}) {
  return Object.entries(AFFILIATE_LINKS)
    .map(([key, link]) => ({
      key,
      ...link,
      score: scoreRecipeRecommendation(link, cuisineType, heatLevel)
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ score: _score, ...entry }) => entry);
}

export function getReviewAffiliateRecommendations({
  category,
  cuisineType,
  heatLevel,
  excludeKeys = [],
  limit = 3
}: {
  category?: string;
  cuisineType?: CuisineType;
  heatLevel?: HeatLevel;
  excludeKeys?: string[];
  limit?: number;
}) {
  return Object.entries(AFFILIATE_LINKS)
    .filter(([key]) => !excludeKeys.includes(key))
    .map(([key, link]) => ({
      key,
      ...link,
      score: scoreReviewRecommendation(link, category, cuisineType, heatLevel)
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ score: _score, ...entry }) => entry);
}
