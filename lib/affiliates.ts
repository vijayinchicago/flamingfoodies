import { env } from "@/lib/env";
import type { CuisineType, HeatLevel } from "@/lib/types";

export type AffiliateCategory =
  | "hot_sauce"
  | "gear"
  | "ingredient"
  | "subscription";

export const SHOP_SEASONAL_MOMENTS = [
  "weeknight",
  "game_day",
  "grill_season",
  "summer_fresh",
  "tailgate",
  "holiday_gifting",
  "cold_weather",
  "brunch",
  "seafood_night",
  "sauce_making"
] as const;

export type ShopSeasonalMoment = (typeof SHOP_SEASONAL_MOMENTS)[number];

export interface AffiliateLinkDefinition {
  partner: string;
  product: string;
  url: string;
  amazonOnlyUrl?: string;
  category: AffiliateCategory;
  badge: string;
  description: string;
  priceLabel?: string;
  bestFor: string;
  cuisines?: CuisineType[];
  heatLevels?: HeatLevel[];
  seasonalMoments?: ShopSeasonalMoment[];
}

export interface AffiliateLinkEntry extends AffiliateLinkDefinition {
  key: string;
}

export type AffiliateMonetizationStrategy =
  | "amazon_tag_redirect"
  | "skimlinks_javascript"
  | "merchant_redirect";

export type AffiliateClickTrackingMode = "server_redirect" | "client_beacon";
export type AffiliateDestinationKind =
  | "amazon_product"
  | "amazon_search"
  | "merchant_page";

export interface ResolvedAffiliateLink extends AffiliateLinkEntry {
  href: string;
  isExternal: boolean;
  monetizationStrategy: AffiliateMonetizationStrategy;
  trackingMode: AffiliateClickTrackingMode;
}

const AMAZON_TAG = env.NEXT_PUBLIC_AMAZON_TAG || "flamingfoodies-20";
const SKIMLINKS_ENABLED = Boolean(env.NEXT_PUBLIC_SKIMLINKS_ID);
const AMAZON_ONLY_MODE = true;

export const AFFILIATE_DISCLOSURE_SUMMARY =
  "Some links on FlamingFoodies point to Amazon. If you buy through them, FlamingFoodies may earn a commission at no extra cost to you.";

export const AFFILIATE_DISCLOSURE_DETAIL =
  "FlamingFoodies may earn commissions from qualifying purchases made through Amazon commerce links. We only want those links next to content where they help the reader cook, compare, or buy more confidently.";

export function buildAmazonSearchUrl(query: string) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${AMAZON_TAG}`;
}

export function buildAmazonProductUrl(asin: string) {
  return `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
}

export function buildAffiliateDestinationUrl(
  entry: AffiliateLinkEntry | AffiliateLinkDefinition
) {
  if (AMAZON_ONLY_MODE && entry.partner !== "amazon") {
    return entry.amazonOnlyUrl ?? buildAmazonSearchUrl(entry.product);
  }

  return entry.url;
}

export function getAffiliateDestinationKind(
  entry: AffiliateLinkEntry | AffiliateLinkDefinition
): AffiliateDestinationKind {
  const destination = buildAffiliateDestinationUrl(entry);

  if (/amazon\.com\/dp\//i.test(destination)) {
    return "amazon_product";
  }

  if (/amazon\.com\/s\?/i.test(destination)) {
    return "amazon_search";
  }

  return "merchant_page";
}

export function isExactAmazonProductDestination(
  entry: AffiliateLinkEntry | AffiliateLinkDefinition
) {
  return getAffiliateDestinationKind(entry) === "amazon_product";
}

function buildAffiliateRedirectHref(
  partnerKey: string,
  sourcePage?: string,
  position?: string
) {
  const params = new URLSearchParams();

  if (sourcePage) {
    params.set("source", sourcePage);
  }

  if (position) {
    params.set("position", position);
  }

  const suffix = params.toString();
  return suffix ? `/go/${partnerKey}?${suffix}` : `/go/${partnerKey}`;
}

export function getActiveShopSeasonalMoments(date = new Date()) {
  const month = date.getUTCMonth() + 1;
  const moments = new Set<ShopSeasonalMoment>(["weeknight"]);

  if (month <= 2) {
    moments.add("cold_weather");
    moments.add("game_day");
  } else if (month <= 4) {
    moments.add("brunch");
    moments.add("seafood_night");
    if (month === 4) {
      moments.add("grill_season");
    }
  } else if (month <= 6) {
    moments.add("grill_season");
    moments.add("summer_fresh");
    moments.add("brunch");
    moments.add("seafood_night");
  } else if (month <= 8) {
    moments.add("grill_season");
    moments.add("summer_fresh");
    moments.add("sauce_making");
  } else if (month <= 10) {
    moments.add("tailgate");
    moments.add("grill_season");
    moments.add("sauce_making");
  } else {
    moments.add("holiday_gifting");
    moments.add("cold_weather");
    if (month === 11) {
      moments.add("game_day");
    }
  }

  return [...moments];
}

export const AFFILIATE_LINKS: Record<string, AffiliateLinkDefinition> = {
  "amazon-cast-iron-skillet": {
    partner: "amazon",
    product: "12-Inch Cast Iron Skillet",
    url: buildAmazonProductUrl("B0714CXBTF"),
    category: "gear",
    badge: "Kitchen staple",
    description: "The sear-and-char pan for smash burgers, fajitas, cornbread, and anything that likes hard edges.",
    priceLabel: "$25-$45",
    bestFor: "Weeknight proteins and pan sauces",
    cuisines: ["american", "mexican", "cajun"],
    heatLevels: ["medium", "hot", "inferno"],
    seasonalMoments: ["weeknight", "game_day", "tailgate", "cold_weather"]
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
    heatLevels: ["hot", "inferno", "reaper"],
    seasonalMoments: ["weeknight", "brunch", "cold_weather"]
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
    heatLevels: ["medium", "hot", "inferno", "reaper"],
    seasonalMoments: ["game_day", "tailgate", "summer_fresh", "sauce_making"]
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
    heatLevels: ["hot", "inferno", "reaper"],
    seasonalMoments: ["sauce_making", "summer_fresh", "holiday_gifting"]
  },
  "amazon-digital-meat-thermometer": {
    partner: "amazon",
    product: "Instant-Read Meat Thermometer",
    url: buildAmazonSearchUrl("instant read meat thermometer"),
    category: "gear",
    badge: "Never overcook it",
    description: "The low-drama upgrade for grilled chicken, roast salmon, burgers, steaks, and serious meal prep.",
    priceLabel: "$15-$35",
    bestFor: "Grilling, roasting, and high-value proteins",
    cuisines: ["american", "brazilian", "cajun", "turkish"],
    heatLevels: ["mild", "medium", "hot", "inferno"],
    seasonalMoments: ["grill_season", "tailgate", "holiday_gifting", "weeknight"]
  },
  "amazon-grill-basket": {
    partner: "amazon",
    product: "Stainless Steel Grill Basket",
    url: buildAmazonSearchUrl("stainless steel grill basket vegetables seafood"),
    category: "gear",
    badge: "Summer helper",
    description: "A cleaner route for shrimp, peppers, onions, and small vegetables that would otherwise disappear into the grates.",
    priceLabel: "$18-$30",
    bestFor: "Seafood, fajitas, and charred vegetables",
    cuisines: ["american", "greek", "jamaican", "caribbean", "brazilian"],
    heatLevels: ["mild", "medium", "hot"],
    seasonalMoments: ["grill_season", "summer_fresh", "seafood_night", "tailgate"]
  },
  "amazon-half-sheet-pan-set": {
    partner: "amazon",
    product: "Half Sheet Pan Set",
    url: buildAmazonSearchUrl("half sheet pan set heavy duty"),
    category: "gear",
    badge: "Weeknight workhorse",
    description: "The tray set that makes roasted wings, vegetables, salmon, and sheet-pan dinners feel like a plan instead of a scramble.",
    priceLabel: "$22-$40",
    bestFor: "Wings, sheet-pan dinners, and broiler finishes",
    cuisines: ["american", "italian", "greek", "middle_eastern"],
    heatLevels: ["mild", "medium", "hot"],
    seasonalMoments: ["weeknight", "game_day", "cold_weather", "holiday_gifting"]
  },
  "amazon-rice-cooker": {
    partner: "amazon",
    product: "Compact Rice Cooker",
    url: buildAmazonSearchUrl("compact rice cooker"),
    category: "gear",
    badge: "Meal-prep anchor",
    description: "A simple countertop win for rice bowls, congee, spicy fried rice, and the carb base that makes leftovers useful.",
    priceLabel: "$30-$60",
    bestFor: "Bowls, fried rice, and weekly meal prep",
    cuisines: ["japanese", "korean", "filipino", "malaysian", "thai"],
    heatLevels: ["mild", "medium", "hot"],
    seasonalMoments: ["weeknight", "brunch", "cold_weather"]
  },
  "amazon-tortilla-press": {
    partner: "amazon",
    product: "Cast Iron Tortilla Press",
    url: buildAmazonSearchUrl("cast iron tortilla press"),
    category: "gear",
    badge: "Taco night upgrade",
    description: "The fastest way to make taco night feel worth inviting people over for instead of just reheating store-bought tortillas.",
    priceLabel: "$22-$38",
    bestFor: "Taco night, flatbreads, and masa prep",
    cuisines: ["mexican", "peruvian", "american"],
    heatLevels: ["medium", "hot", "inferno"],
    seasonalMoments: ["game_day", "tailgate", "brunch", "summer_fresh"]
  },
  "amazon-immersion-blender": {
    partner: "amazon",
    product: "Immersion Blender",
    url: buildAmazonSearchUrl("immersion blender"),
    category: "gear",
    badge: "Sauce smoother",
    description: "A fast cleanup tool for creamy soups, peri-peri marinades, blender salsas, and smoother hot sauce batches.",
    priceLabel: "$25-$45",
    bestFor: "Soups, sauces, and marinades",
    cuisines: ["american", "italian", "moroccan", "middle_eastern"],
    heatLevels: ["mild", "medium", "hot"],
    seasonalMoments: ["weeknight", "cold_weather", "sauce_making"]
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
    heatLevels: ["medium", "hot"],
    seasonalMoments: ["weeknight", "game_day", "cold_weather"]
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
    heatLevels: ["medium", "hot"],
    seasonalMoments: ["weeknight", "cold_weather", "game_day"]
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
    heatLevels: ["mild", "medium", "hot"],
    seasonalMoments: ["weeknight", "cold_weather"]
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
    heatLevels: ["medium", "hot", "inferno"],
    seasonalMoments: ["weeknight", "brunch", "summer_fresh"]
  },
  "amazon-harissa-paste": {
    partner: "amazon",
    product: "Harissa Paste",
    url: buildAmazonSearchUrl("harissa paste"),
    category: "ingredient",
    badge: "Roast-anything helper",
    description: "The smoky-chili shortcut for roast carrots, meatballs, chicken thighs, and yogurt sauces that need a little menace.",
    priceLabel: "$8-$15",
    bestFor: "Roasts, braises, and yogurt sauces",
    cuisines: ["moroccan", "middle_eastern", "turkish"],
    heatLevels: ["medium", "hot", "inferno"],
    seasonalMoments: ["weeknight", "cold_weather", "holiday_gifting"]
  },
  "amazon-jerk-seasoning": {
    partner: "amazon",
    product: "Jerk Seasoning",
    url: buildAmazonSearchUrl("jerk seasoning"),
    category: "ingredient",
    badge: "Backyard hero",
    description: "A fast flavor base for shrimp skewers, chicken thighs, grilled corn, and any cookout that needs more swagger.",
    priceLabel: "$8-$14",
    bestFor: "Chicken, shrimp, and grilling marinades",
    cuisines: ["jamaican", "caribbean"],
    heatLevels: ["medium", "hot", "inferno"],
    seasonalMoments: ["grill_season", "summer_fresh", "tailgate"]
  },
  "amazon-chipotle-in-adobo": {
    partner: "amazon",
    product: "Chipotle Peppers in Adobo",
    url: buildAmazonSearchUrl("chipotle peppers in adobo"),
    category: "ingredient",
    badge: "Smoky shortcut",
    description: "The pantry move for smoky mayo, burger sauce, taco braises, and chili that tastes like you actually thought ahead.",
    priceLabel: "$4-$10",
    bestFor: "Burger sauce, chili, and taco fillings",
    cuisines: ["mexican", "american"],
    heatLevels: ["medium", "hot", "inferno"],
    seasonalMoments: ["game_day", "tailgate", "grill_season", "cold_weather"]
  },
  "amazon-cajun-seasoning": {
    partner: "amazon",
    product: "Cajun Seasoning Blend",
    url: buildAmazonSearchUrl("cajun seasoning blend"),
    category: "ingredient",
    badge: "Fast crust",
    description: "A no-nonsense seasoning for salmon, fries, wings, and sheet-pan dinners when you want flavor in under thirty seconds.",
    priceLabel: "$6-$12",
    bestFor: "Salmon, fries, wings, and roasted vegetables",
    cuisines: ["cajun", "american"],
    heatLevels: ["medium", "hot"],
    seasonalMoments: ["weeknight", "game_day", "tailgate"]
  },
  "amazon-peri-peri-sauce": {
    partner: "amazon",
    product: "Peri-Peri Sauce",
    url: buildAmazonSearchUrl("peri peri sauce"),
    category: "ingredient",
    badge: "Char-ready marinade",
    description: "The bottle to grab when chicken needs acid, garlic, and real heat before it hits the grill or broiler.",
    priceLabel: "$8-$14",
    bestFor: "Chicken, skewers, and grilled vegetables",
    cuisines: ["west_african", "nigerian", "brazilian", "american"],
    heatLevels: ["hot", "inferno"],
    seasonalMoments: ["grill_season", "weeknight", "summer_fresh"]
  },
  "amazon-sambal-oelek": {
    partner: "amazon",
    product: "Sambal Oelek",
    url: buildAmazonSearchUrl("sambal oelek"),
    category: "ingredient",
    badge: "Clean chile hit",
    description: "Straight chili paste for fried rice, noodle sauces, mayo mixes, and dishes that want heat without sweetness.",
    priceLabel: "$7-$12",
    bestFor: "Fried rice, noodles, and spicy sauces",
    cuisines: ["malaysian", "thai", "vietnamese", "filipino"],
    heatLevels: ["medium", "hot", "inferno"],
    seasonalMoments: ["weeknight", "summer_fresh", "brunch"]
  },
  "amazon-tajin-clasico": {
    partner: "amazon",
    product: "Tajin Clasico",
    url: buildAmazonSearchUrl("tajin clasico seasoning"),
    category: "ingredient",
    badge: "Bright finisher",
    description: "Citrusy chile seasoning for fruit, grilled corn, rims, cucumbers, and the kind of summer snacks that disappear fast.",
    priceLabel: "$4-$8",
    bestFor: "Fruit, corn, snacks, and margarita nights",
    cuisines: ["mexican", "american", "peruvian"],
    heatLevels: ["mild", "medium", "hot"],
    seasonalMoments: ["summer_fresh", "brunch", "seafood_night"]
  },
  "amazon-kewpie-mayo": {
    partner: "amazon",
    product: "Kewpie Mayonnaise",
    url: buildAmazonSearchUrl("kewpie mayonnaise"),
    category: "ingredient",
    badge: "Creamy upgrade",
    description: "The easy way to make spicy mayo, egg sandwiches, yakisoba drizzles, and quick sauces taste richer and more intentional.",
    priceLabel: "$6-$12",
    bestFor: "Spicy mayo, sandwiches, and bowl sauces",
    cuisines: ["japanese", "korean", "filipino", "american"],
    heatLevels: ["mild", "medium"],
    seasonalMoments: ["weeknight", "brunch", "game_day"]
  },
  "amazon-yellowbird-habanero": {
    partner: "amazon",
    product: "Yellowbird Habanero Hot Sauce",
    url: buildAmazonProductUrl("B09JBN8F5G"),
    category: "hot_sauce",
    badge: "Everyday bottle",
    description: "Bright carrot-habanero heat with enough body to work on eggs, tacos, and roasted vegetables.",
    priceLabel: "$7-$12",
    bestFor: "Breakfasts, tacos, and meal prep bowls",
    cuisines: ["mexican", "american"],
    heatLevels: ["medium", "hot"],
    seasonalMoments: ["weeknight", "brunch", "summer_fresh"]
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
    heatLevels: ["inferno", "reaper"],
    seasonalMoments: ["game_day", "holiday_gifting", "cold_weather"]
  },
  "amazon-fly-by-jing-sichuan-gold": {
    partner: "amazon",
    product: "Fly By Jing Sichuan Gold",
    url: buildAmazonProductUrl("B0BF9R213D"),
    category: "hot_sauce",
    badge: "Numbing heat",
    description: "A more citrusy, peppercorn-leaning sauce when you want flavor movement instead of pure capsaicin.",
    priceLabel: "$12-$18",
    bestFor: "Dumplings, noodles, and fried eggs",
    cuisines: ["szechuan", "chinese"],
    heatLevels: ["medium", "hot"],
    seasonalMoments: ["weeknight", "brunch", "holiday_gifting"]
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
    heatLevels: ["hot", "inferno"],
    seasonalMoments: ["summer_fresh", "seafood_night", "grill_season"]
  },
  "amazon-secret-aardvark-habanero": {
    partner: "amazon",
    product: "Secret Aardvark Habanero Sauce",
    url: buildAmazonSearchUrl("Secret Aardvark Habanero sauce"),
    category: "hot_sauce",
    badge: "Cookout all-rounder",
    description: "One of the easiest all-purpose bottles for tacos, burgers, breakfast potatoes, and fast dinners that need a save.",
    priceLabel: "$9-$14",
    bestFor: "Burgers, breakfast potatoes, and taco nights",
    cuisines: ["american", "mexican"],
    heatLevels: ["medium", "hot"],
    seasonalMoments: ["weeknight", "game_day", "tailgate", "grill_season"]
  },
  "amazon-crystal-hot-sauce": {
    partner: "amazon",
    product: "Crystal Hot Sauce",
    url: buildAmazonSearchUrl("Crystal hot sauce"),
    category: "hot_sauce",
    badge: "Table staple",
    description: "The vinegar-forward Louisiana workhorse for fried chicken, beans, collards, po' boys, and everyday splashing.",
    priceLabel: "$4-$9",
    bestFor: "Fried foods, greens, and everyday table use",
    cuisines: ["american", "cajun"],
    heatLevels: ["mild", "medium", "hot"],
    seasonalMoments: ["game_day", "tailgate", "brunch", "weeknight"]
  },
  "amazon-marie-sharps-belizean-heat": {
    partner: "amazon",
    product: "Marie Sharp's Belizean Heat",
    url: buildAmazonSearchUrl("Marie Sharp's Belizean Heat"),
    category: "hot_sauce",
    badge: "Caribbean kick",
    description: "A fruit-forward habanero bottle that feels alive on grilled fish, rice bowls, chicken, and roasted vegetables.",
    priceLabel: "$8-$13",
    bestFor: "Grilled fish, chicken, and bright bowls",
    cuisines: ["caribbean", "jamaican", "american"],
    heatLevels: ["hot", "inferno"],
    seasonalMoments: ["grill_season", "summer_fresh", "seafood_night"]
  },
  "amazon-tabasco-chipotle": {
    partner: "amazon",
    product: "Tabasco Chipotle Sauce",
    url: buildAmazonSearchUrl("Tabasco chipotle sauce"),
    category: "hot_sauce",
    badge: "Smoky finisher",
    description: "A more barbecue-friendly bottle for wings, burgers, chili, roasted sweet potatoes, and smoky mayo situations.",
    priceLabel: "$4-$8",
    bestFor: "Wings, burgers, and smoky sauces",
    cuisines: ["american", "mexican"],
    heatLevels: ["medium", "hot"],
    seasonalMoments: ["game_day", "tailgate", "grill_season", "cold_weather"]
  },
  "amazon-valentina-black-label": {
    partner: "amazon",
    product: "Valentina Black Label",
    url: buildAmazonSearchUrl("Valentina Black Label hot sauce"),
    category: "hot_sauce",
    badge: "Budget killer",
    description: "The low-cost bottle that still feels useful on eggs, popcorn, tacos, and huge batches of meal-prep food.",
    priceLabel: "$4-$7",
    bestFor: "Eggs, snacks, tacos, and pantry backup",
    cuisines: ["mexican", "american"],
    heatLevels: ["medium", "hot", "inferno"],
    seasonalMoments: ["weeknight", "game_day", "brunch", "tailgate"]
  },
  "amazon-bravado-black-garlic-reaper": {
    partner: "amazon",
    product: "Bravado Black Garlic Carolina Reaper",
    url: buildAmazonSearchUrl("Bravado black garlic carolina reaper sauce"),
    category: "hot_sauce",
    badge: "Gift flex",
    description: "A bold, savory superhot that feels more like a niche recommendation than a default bottle, which makes it good for gifting.",
    priceLabel: "$12-$18",
    bestFor: "Pizza, wings, and serious hot sauce gifts",
    cuisines: ["american", "italian"],
    heatLevels: ["inferno", "reaper"],
    seasonalMoments: ["holiday_gifting", "game_day", "cold_weather"]
  },
  "amazon-el-yucateco-green-habanero": {
    partner: "amazon",
    product: "El Yucateco Green Habanero",
    url: buildAmazonSearchUrl("El Yucateco green habanero"),
    category: "hot_sauce",
    badge: "Taco truck energy",
    description: "A punchy green habanero bottle for tacos, grilled chicken, burrito bowls, and people who want bright heat without sweetness.",
    priceLabel: "$4-$8",
    bestFor: "Tacos, grilled chicken, and rice bowls",
    cuisines: ["mexican", "american"],
    heatLevels: ["hot", "inferno"],
    seasonalMoments: ["weeknight", "grill_season", "summer_fresh"]
  },
  "mike-hot-honey-original": {
    partner: "mike_hot_sauce",
    product: "Mike's Hot Honey",
    url: "https://mikeshothoney.com/products/mikes-hot-honey-original",
    amazonOnlyUrl: buildAmazonProductUrl("B085B1YZ8Q"),
    category: "ingredient",
    badge: "Sweet heat",
    description: "The fast-track drizzle for pizza, fried chicken, salmon, Brussels sprouts, and hot sandwiches.",
    priceLabel: "$10-$16",
    bestFor: "Finishing sweet-spicy dishes",
    cuisines: ["american", "italian"],
    heatLevels: ["mild", "medium", "hot"],
    seasonalMoments: ["weeknight", "game_day", "holiday_gifting", "brunch"]
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
    heatLevels: ["medium", "hot"],
    seasonalMoments: ["weeknight", "game_day", "grill_season", "holiday_gifting"]
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
    heatLevels: ["medium", "hot", "inferno", "reaper"],
    seasonalMoments: ["holiday_gifting", "game_day"]
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
    heatLevels: ["mild", "medium", "hot"],
    seasonalMoments: ["holiday_gifting", "game_day"]
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
    heatLevels: ["medium", "hot", "inferno"],
    seasonalMoments: ["holiday_gifting", "game_day", "cold_weather"]
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
    heatLevels: ["inferno", "reaper"],
    seasonalMoments: ["sauce_making", "holiday_gifting"]
  },
  "amazon-hot-sauce-gift-box": {
    partner: "amazon",
    product: "Hot Sauce Gift Box",
    url: buildAmazonSearchUrl("hot sauce gift box"),
    category: "subscription",
    badge: "Easy win",
    description: "The least complicated path when you want a spice-lover gift to feel intentional without researching every bottle yourself.",
    priceLabel: "$25-$45",
    bestFor: "Holiday gifting and host presents",
    cuisines: ["other"],
    heatLevels: ["mild", "medium", "hot", "inferno"],
    seasonalMoments: ["holiday_gifting", "game_day"]
  },
  "amazon-bbq-rub-gift-set": {
    partner: "amazon",
    product: "BBQ Rub Gift Set",
    url: buildAmazonSearchUrl("bbq rub gift set"),
    category: "subscription",
    badge: "Pitmaster starter",
    description: "A clean route into grilling gifts, especially for people who care more about cookouts than novelty heat stunts.",
    priceLabel: "$24-$40",
    bestFor: "Grilling gifts and backyard cooks",
    cuisines: ["american", "cajun", "brazilian"],
    heatLevels: ["mild", "medium", "hot"],
    seasonalMoments: ["holiday_gifting", "grill_season", "tailgate"]
  },
  "amazon-spicy-ramen-gift-box": {
    partner: "amazon",
    product: "Spicy Ramen Gift Box",
    url: buildAmazonSearchUrl("spicy ramen gift box"),
    category: "subscription",
    badge: "Cold-night gift",
    description: "A more weeknight-friendly gifting option for readers who lean noodles, pantry comfort, and quick heat over barbecue culture.",
    priceLabel: "$25-$40",
    bestFor: "Cold-weather gifting and pantry restocks",
    cuisines: ["japanese", "korean", "malaysian"],
    heatLevels: ["medium", "hot", "inferno"],
    seasonalMoments: ["holiday_gifting", "cold_weather", "weeknight"]
  }
};

export const HOME_FEATURED_AFFILIATE_KEYS = [
  "heatonist-los-calientes-rojo",
  "amazon-digital-meat-thermometer",
  "amazon-cast-iron-skillet",
  "amazon-hot-sauce-gift-box"
] as const;

export const HOT_SAUCE_SPOTLIGHT_KEYS = [
  "heatonist-los-calientes-rojo",
  "amazon-yellowbird-habanero",
  "amazon-secret-aardvark-habanero",
  "amazon-valentina-black-label",
  "amazon-queen-majesty-scotch-bonnet-ginger",
  "amazon-fly-by-jing-sichuan-gold",
  "amazon-marie-sharps-belizean-heat",
  "amazon-tabasco-chipotle",
  "amazon-crystal-hot-sauce",
  "amazon-el-yucateco-green-habanero",
  "amazon-bravado-black-garlic-reaper",
  "amazon-torchbearer-garlic-reaper",
  "heatonist-hot-ones-season-22"
] as const;

export const KITCHEN_GEAR_KEYS = [
  "amazon-cast-iron-skillet",
  "amazon-carbon-steel-wok",
  "amazon-molcajete",
  "amazon-fermentation-jar-kit",
  "amazon-digital-meat-thermometer",
  "amazon-grill-basket",
  "amazon-half-sheet-pan-set",
  "amazon-rice-cooker",
  "amazon-tortilla-press",
  "amazon-immersion-blender"
] as const;

export const PANTRY_HEAT_KEYS = [
  "amazon-gochujang-paste",
  "amazon-calabrian-chili-paste",
  "amazon-berbere-blend",
  "amazon-chili-crisp",
  "amazon-harissa-paste",
  "amazon-jerk-seasoning",
  "amazon-chipotle-in-adobo",
  "amazon-cajun-seasoning",
  "amazon-peri-peri-sauce",
  "amazon-sambal-oelek",
  "amazon-tajin-clasico",
  "amazon-kewpie-mayo",
  "mike-hot-honey-original"
] as const;

export const SUBSCRIPTION_KEYS = [
  "fuego-box-monthly-subscription",
  "heatonist-hot-ones-season-22",
  "heatonist-gift-set",
  "pepper-joe-superhot-seed-pack",
  "amazon-hot-sauce-gift-box",
  "amazon-bbq-rub-gift-set",
  "amazon-spicy-ramen-gift-box"
] as const;

export const AUTOMATED_SHOP_PICK_KEYS = Array.from(
  new Set([
    ...HOT_SAUCE_SPOTLIGHT_KEYS,
    ...KITCHEN_GEAR_KEYS,
    ...PANTRY_HEAT_KEYS,
    ...SUBSCRIPTION_KEYS
  ])
);

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

export function getAutomatedShopPickEntries() {
  return getAffiliateLinkEntries(AUTOMATED_SHOP_PICK_KEYS);
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

export function getAffiliateMonetizationStrategy(
  entry: AffiliateLinkEntry | AffiliateLinkDefinition,
  options?: {
    hasSkimlinksJavascript?: boolean;
  }
): AffiliateMonetizationStrategy {
  if (AMAZON_ONLY_MODE) {
    return "amazon_tag_redirect";
  }

  const hasSkimlinksJavascript =
    options?.hasSkimlinksJavascript ?? SKIMLINKS_ENABLED;

  if (entry.partner === "amazon") {
    return "amazon_tag_redirect";
  }

  if (hasSkimlinksJavascript) {
    return "skimlinks_javascript";
  }

  return "merchant_redirect";
}

export function getAffiliateMonetizationLabel(
  strategy: AffiliateMonetizationStrategy
) {
  switch (strategy) {
    case "amazon_tag_redirect":
      return "Amazon tag";
    case "skimlinks_javascript":
      return "Skimlinks JS";
    case "merchant_redirect":
    default:
      return "Direct merchant";
  }
}

export function resolveAffiliateLink(
  partnerKey: string,
  options?: {
    sourcePage?: string;
    position?: string;
    hasSkimlinksJavascript?: boolean;
  }
): ResolvedAffiliateLink | null {
  const entry = AFFILIATE_LINKS[partnerKey];
  if (!entry) {
    return null;
  }

  const monetizationStrategy = getAffiliateMonetizationStrategy(entry, {
    hasSkimlinksJavascript: options?.hasSkimlinksJavascript
  });

  return {
    key: partnerKey,
    ...entry,
    href:
      monetizationStrategy === "skimlinks_javascript"
        ? buildAffiliateDestinationUrl(entry)
        : buildAffiliateRedirectHref(partnerKey, options?.sourcePage, options?.position),
    isExternal: monetizationStrategy === "skimlinks_javascript",
    monetizationStrategy,
    trackingMode:
      monetizationStrategy === "skimlinks_javascript"
        ? "client_beacon"
        : "server_redirect"
  };
}

export function getAffiliateRegistry() {
  return Object.entries(AFFILIATE_LINKS).map(([key, entry]) => ({
    key,
    ...entry,
    monetizationStrategy: getAffiliateMonetizationStrategy(entry),
    monetizationLabel: getAffiliateMonetizationLabel(
      getAffiliateMonetizationStrategy(entry)
    )
  }));
}
