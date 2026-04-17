export type BrandTier = "iconic" | "craft" | "premium" | "regional" | "subscription";
export type BrandOrigin = "usa" | "mexico" | "caribbean" | "uk" | "belize" | "canada" | "australia";

export interface BrandProduct {
  name: string;
  affiliateKey?: string;
  description: string;
}

export interface Brand {
  slug: string;
  name: string;
  tagline: string;
  founded: string;
  origin: BrandOrigin;
  city: string;
  tier: BrandTier;
  description: string;
  editorialNote: string;
  signatureProducts: BrandProduct[];
  whyItMatters: string;
  bestFor: string;
  pepperSlug?: string;   // cross-link to pepper encyclopedia
  featured: boolean;
  source: "editorial";
}

export const BRANDS: Brand[] = [
  {
    slug: "tabasco",
    name: "Tabasco",
    tagline: "The original American hot sauce — unchanged since 1868.",
    founded: "1868",
    origin: "usa",
    city: "Avery Island, Louisiana",
    tier: "iconic",
    description:
      "Made by the McIlhenny family on Avery Island, Louisiana since 1868, Tabasco is the most recognizable hot sauce on earth. Three ingredients — tabasco peppers, salt, and vinegar — aged in white oak barrels on a private island that's been in the same family for over 150 years.",
    editorialNote:
      "Tabasco's genius is its restraint. Three ingredients, a specific pepper, a specific barrel, a specific island. The vinegar-forward profile and 2,500–5,000 SHU heat level makes it a universal condiment rather than a bold statement — it goes on oysters, eggs, Bloody Marys, and pizza without competing. The family still controls every acre of production. The peppers are still graded against a wooden dowel for size. The mash still ages in white oak barrels. In an industry full of brand reinvention, Tabasco's commitment to the original formula is the brand story.",
    signatureProducts: [
      { name: "Original Red", affiliateKey: "amazon-tabasco-original", description: "The classic. Vinegar-forward, 2,500 SHU, universal." },
      { name: "Green Jalapeño", affiliateKey: "amazon-tabasco-green", description: "Milder, brighter, excellent on eggs and tacos." },
      { name: "Chipotle", affiliateKey: "amazon-tabasco-chipotle", description: "Smoked depth with the Tabasco base — best for BBQ." }
    ],
    whyItMatters:
      "Tabasco didn't just make hot sauce — it defined what hot sauce was to American consumers for over a century. Every other bottle on the table exists in relation to it.",
    bestFor: "Anyone who wants the definitive American hot sauce experience and a universal condiment that works with almost any food.",
    pepperSlug: "cayenne",
    featured: true,
    source: "editorial"
  },
  {
    slug: "franks-redhot",
    name: "Frank's RedHot",
    tagline: "The sauce that invented Buffalo wings.",
    founded: "1920",
    origin: "usa",
    city: "Louisiana / Cincinnati",
    tier: "iconic",
    description:
      "Frank's RedHot was used in the original buffalo wing recipe at the Anchor Bar in Buffalo, NY in 1964. The aged cayenne pepper base and butter-ready viscosity made it the defining wing sauce before anyone was using the phrase 'wing sauce.'",
    editorialNote:
      "Frank's occupies a strange position in hot sauce history: it became globally famous for a recipe that was invented without its knowledge. The Anchor Bar's Teressa Bellissimo mixed Frank's with butter to create buffalo wings in 1964, and the rest is American food history. The sauce itself is less aggressive than Tabasco — sweeter, lower acid, designed to blend rather than punch. That's why it works in cooking: as a marinade, a wing coating base, or a buffalo dip ingredient, it behaves. The 'I put that s**t on everything' campaign in 2011 made it the best-selling hot sauce in the US.",
    signatureProducts: [
      { name: "Original", affiliateKey: "amazon-franks-redhot", description: "The classic cayenne base — cook with it." },
      { name: "Buffalo Wing Sauce", affiliateKey: "amazon-franks-buffalo-wing", description: "Pre-buttered for wings — no mixing needed." }
    ],
    whyItMatters: "Frank's invented the flavor profile that defined American bar food. Buffalo wings don't exist without it.",
    bestFor: "Wing nights, cooking applications where you want cayenne heat without aggressive vinegar, and anyone building a foundational hot sauce collection.",
    pepperSlug: "cayenne",
    featured: true,
    source: "editorial"
  },
  {
    slug: "cholula",
    name: "Cholula",
    tagline: "Mexico's premium hot sauce export, named for an ancient city.",
    founded: "1989",
    origin: "mexico",
    city: "Chapala, Jalisco",
    tier: "iconic",
    description:
      "Named after one of the most sacred cities in pre-Columbian Mexico, Cholula uses a blend of pequin and arbol peppers with spices to create a thicker, more complex sauce than Louisiana-style competitors. The wooden cap is as iconic as the liquid inside.",
    editorialNote:
      "Cholula is the gateway to premium hot sauce for most American consumers who grew up on Tabasco or Frank's. The pequin-arbol blend adds a dried fruit depth that vinegar-only sauces lack, and the slightly thicker consistency means it clings to food rather than running off. The product line expansion (green tomatillo, chili garlic, sweet habanero) is done with unusual restraint — each variant tastes distinct from the original rather than being minor variations. The wooden cap is purely functional: it stays on better during shipping and pouring.",
    signatureProducts: [
      { name: "Original", affiliateKey: "amazon-cholula-original", description: "The flagship. Pequin-arbol blend with spice complexity." },
      { name: "Green Tomatillo", affiliateKey: "amazon-cholula-green-tomatillo", description: "Bright, tangy — excellent on eggs and fish tacos." },
      { name: "Chili Garlic", affiliateKey: "amazon-cholula-chili-garlic", description: "Deeper and more savory — best for cooking." },
      { name: "Sweet Habanero", affiliateKey: "amazon-cholula-sweet-habanero", description: "Fruit-forward heat — pairs with grilled pork." }
    ],
    whyItMatters: "Cholula proved that American consumers would pay a premium for Mexican hot sauce with real complexity — opening the door for every craft hot sauce that followed.",
    bestFor: "Mexican food, eggs, tacos, and anyone moving up from the basic vinegar sauces.",
    pepperSlug: "habanero",
    featured: true,
    source: "editorial"
  },
  {
    slug: "truff",
    name: "TRUFF",
    tagline: "The luxury hot sauce — black truffle, red chili, and zero apology.",
    founded: "2017",
    origin: "usa",
    city: "Los Angeles, California",
    tier: "premium",
    description:
      "TRUFF launched with a single product — black truffle hot sauce in a matte black bottle — and created a luxury hot sauce category that didn't exist before. Ripe chili peppers, black truffle, agave nectar, and a price point that signaled intention.",
    editorialNote:
      "TRUFF understood something most hot sauce brands missed: premium food gifts had no shelf representation. Wine had it. Olive oil had it. Hot sauce didn't. The matte black bottle, the truffle pedigree, and the $19 price point said 'this is a serious food product' in a category full of novelty gifts. The flavor backs it up — the truffle earthiness and agave sweetness round the chili heat into something that genuinely works on pasta, eggs, and pizza in ways a vinegar-forward sauce can't. Kylie Jenner's endorsement in 2019 created a sell-out moment; the product quality kept people buying afterward.",
    signatureProducts: [
      { name: "Original", affiliateKey: "amazon-truff-original", description: "The signature — black truffle, ripe red chilis, agave." }
    ],
    whyItMatters: "TRUFF created the luxury hot sauce category. Before it, no hot sauce cost $19 and sold out regularly. After it, dozens of premium brands entered the market.",
    bestFor: "Pasta, pizza, eggs, and anyone who wants hot sauce that functions as a finishing ingredient rather than a table condiment.",
    featured: true,
    source: "editorial"
  },
  {
    slug: "fly-by-jing",
    name: "Fly By Jing",
    tagline: "Chengdu-born heat — chili crisp redefined.",
    founded: "2018",
    origin: "usa",
    city: "Chengdu, China / Los Angeles, California",
    tier: "premium",
    description:
      "Founded by Jing Gao, Fly By Jing brought authentic Sichuan chili crisp to mainstream American food culture. The Sichuan Gold sauce and Zhong Sauce are the definitive modern expressions of Chengdu heat and flavor.",
    editorialNote:
      "Jing Gao's contribution to American hot sauce culture is specific: she made Sichuan flavors legible to Western consumers without simplifying them. Fly By Jing's chili crisp is texturally unlike anything in the Western hot sauce tradition — the crispy fried garlic, the numbing peppercorn, the layered fermented umami. The brand did more to educate American consumers about Sichuan flavor than any Chinese restaurant chain. The products are expensive and worth it.",
    signatureProducts: [
      { name: "Sichuan Chili Crisp", affiliateKey: "amazon-fly-by-jing-sichuan-gold", description: "The definitive Sichuan chili crisp for Western kitchens." }
    ],
    whyItMatters: "Fly By Jing brought Sichuan flavor complexity into the mainstream American hot sauce conversation and proved that Asian condiments could command premium pricing.",
    bestFor: "Anyone interested in Sichuan cooking, chili crisp enthusiasts, and cooks who want textural heat rather than liquid sauce.",
    pepperSlug: "gochugaru",
    featured: true,
    source: "editorial"
  },
  {
    slug: "walkerswood",
    name: "Walkerswood",
    tagline: "The definitive Jamaican pantry staple — jerk and scotch bonnet from the source.",
    founded: "1978",
    origin: "caribbean",
    city: "Walkerswood, Jamaica",
    tier: "iconic",
    description:
      "Walkerswood has been producing traditional Jamaican condiments — jerk seasoning, scotch bonnet pepper sauce, and jerk marinade — since 1978 from the village of Walkerswood in the St. Ann parish of Jamaica.",
    editorialNote:
      "If you want to cook authentic Jamaican food outside of Jamaica, Walkerswood products are the closest you'll get to the real thing. The Traditional Jerk Seasoning is a paste — scotch bonnets, allspice, scallions, thyme — that's been made the same way for decades. The Scotch Bonnet Pepper Sauce has the fruity, round heat that fresh scotch bonnets deliver and that no habanero substitute can replicate. These are products that home cooks use to cook real food, not novelty items.",
    signatureProducts: [
      { name: "Scotch Bonnet Pepper Sauce", affiliateKey: "amazon-walkerswood-scotch-bonnet", description: "The purest expression of scotch bonnet heat." },
      { name: "Traditional Jerk Seasoning", affiliateKey: "amazon-jerk-seasoning", description: "Paste-format jerk — the real thing." }
    ],
    whyItMatters: "Walkerswood is one of the few internationally distributed brands that genuinely represents its culinary tradition rather than approximating it for export markets.",
    bestFor: "Jerk cooking, Caribbean cuisine, and anyone who wants the actual flavor of scotch bonnet rather than a habanero approximation.",
    pepperSlug: "scotch-bonnet",
    featured: false,
    source: "editorial"
  },
  {
    slug: "yellowbird",
    name: "Yellowbird",
    tagline: "Austin-born clean-label heat — no vinegar, no shortcuts.",
    founded: "2013",
    origin: "usa",
    city: "Austin, Texas",
    tier: "craft",
    description:
      "Yellowbird Sauce launched in Austin with a commitment to fruit-based, vegetable-forward hot sauce with no added vinegar and no artificial anything. The habanero and serrano varieties became cult favorites for their clean, fruit-forward heat.",
    editorialNote:
      "Yellowbird identified a gap in the hot sauce market: people who wanted heat without vinegar's acidic profile. By using carrots and onions as the base rather than vinegar, Yellowbird creates sauces with a sweetness and body that pairs with food rather than cutting through it. The habanero sauce on eggs or grilled chicken is genuinely different from anything vinegar-based. Austin's food culture — which prizes craft and ingredient quality — was the right market to launch in, and the brand grew nationally from that base.",
    signatureProducts: [
      { name: "Habanero Condiment Sauce", affiliateKey: "amazon-yellowbird-habanero", description: "Fruit-forward, no vinegar — best on eggs and grilled meats." },
      { name: "Serrano Condiment Sauce", affiliateKey: "amazon-yellowbird-serrano", description: "Brighter and thinner — great for tacos." },
      { name: "Ghost Pepper Condiment", affiliateKey: "amazon-yellowbird-ghost-pepper", description: "The heat-seeker version — still clean and fruit-forward." }
    ],
    whyItMatters: "Yellowbird proved that the vinegar-forward formula wasn't mandatory — and opened a new sensory lane in hot sauce that many craft brands have since entered.",
    bestFor: "Anyone who wants heat without vinegar's sharpness, clean-label eaters, and fans of fruit-forward flavor profiles.",
    pepperSlug: "habanero",
    featured: false,
    source: "editorial"
  },
  {
    slug: "secret-aardvark",
    name: "Secret Aardvark",
    tagline: "Portland's favorite — habanero heat with a roasted tomato soul.",
    founded: "2003",
    origin: "usa",
    city: "Portland, Oregon",
    tier: "craft",
    description:
      "Secret Aardvark Trading Co. began as a sauce sold at Portland farmers markets and grew into one of the most beloved regional hot sauces in America. The habanero-tomato base with roasted vegetables is unlike any national brand.",
    editorialNote:
      "Secret Aardvark has a devoted following that borders on evangelical, and the sauce earns it. The habanero heat is real but the tomato and roasted vegetable base gives it a thickness and savoriness that makes it work as both a condiment and a cooking ingredient. Portlanders put it on burritos, eggs, pizza, and burgers with the confidence of people who know they have the best option available. The sauce genuinely tastes like it was made in someone's kitchen — because it was, for a long time.",
    signatureProducts: [
      { name: "Habanero Hot Sauce", affiliateKey: "amazon-secret-aardvark-habanero", description: "The flagship — habanero, roasted tomato, depth." }
    ],
    whyItMatters: "Secret Aardvark is the model for what a regional craft hot sauce can become — a genuine cult following built entirely on product quality and word of mouth.",
    bestFor: "Pacific Northwest food lovers, burrito and egg devotees, and anyone who wants a habanero sauce that behaves as a food ingredient rather than a condiment.",
    pepperSlug: "habanero",
    featured: false,
    source: "editorial"
  },
  {
    slug: "heatonist",
    name: "Heatonist",
    tagline: "Brooklyn's hot sauce curator — the home of Hot Ones.",
    founded: "2014",
    origin: "usa",
    city: "Brooklyn, New York",
    tier: "subscription",
    description:
      "Heatonist is the official sauce partner of the Hot Ones interview show and operates as both a retail shop and a curation service for the world's best hot sauces. Their gift sets and subscription boxes are the definitive way to explore the craft hot sauce world.",
    editorialNote:
      "Heatonist's partnership with Hot Ones is the most important distribution deal in craft hot sauce history. The show creates demand; Heatonist fulfills it and builds on it with its own curation. The Brooklyn shop is a genuine destination — the staff knows every sauce on the wall, the sampling culture is real, and the gift set packaging is the best in the business. For anyone trying to get into hot sauce seriously, a Heatonist gift set is the right starting point.",
    signatureProducts: [
      { name: "Los Calientes Rojo", affiliateKey: "heatonist-los-calientes-rojo", description: "The bestselling Hot Ones sauce — complex and widely loved." },
      { name: "Gift Set", affiliateKey: "heatonist-gift-set", description: "The ideal introduction to the craft hot sauce world." },
      { name: "Hot Ones Season 22", affiliateKey: "heatonist-hot-ones-season-22", description: "The full lineup from the show's latest season." }
    ],
    whyItMatters: "Heatonist and Hot Ones together did more to grow the craft hot sauce market than any other single force in the past decade.",
    bestFor: "Gift-givers, beginners who want a curated introduction, and anyone who watches Hot Ones and wants to eat along.",
    featured: true,
    source: "editorial"
  },
  {
    slug: "valentina",
    name: "Valentina",
    tagline: "Mexico's household sauce — the working-class Tabasco.",
    founded: "1960",
    origin: "mexico",
    city: "Guadalajara, Jalisco",
    tier: "iconic",
    description:
      "Valentina is the dominant hot sauce in Mexican homes and street food stalls. Thicker than Tabasco, spicier than Cholula, and priced for everyday use — it's on every taqueria table in Mexico and increasingly on American ones too.",
    editorialNote:
      "Valentina's cultural role in Mexico is closer to ketchup than hot sauce — it's the default condiment, applied to chips, mangos, street corn, tacos, and everything else without ceremony. The black label (extra hot) is the grown-up version; the yellow label (regular) is the baseline. At under $3 for a large bottle, it's the best-value hot sauce in existence. American taco culture has slowly adopted it, and anyone who's eaten at a proper Mexican taqueria has encountered it.",
    signatureProducts: [
      { name: "Yellow Label", affiliateKey: "amazon-valentina-red-label", description: "The everyday version — thick, moderate heat." },
      { name: "Black Label Extra Hot", affiliateKey: "amazon-valentina-black-label", description: "More pepper, less filler — the enthusiast pick." }
    ],
    whyItMatters: "Valentina is proof that the most important hot sauce isn't the most expensive or most extreme — it's the one on every table.",
    bestFor: "Mexican food, snacks, street corn, mangos with chile, and anyone building a pantry that actually gets used.",
    featured: false,
    source: "editorial"
  }
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getBrandBySlug(slug: string): Brand | undefined {
  return BRANDS.find((b) => b.slug === slug);
}

export function getFeaturedBrands(): Brand[] {
  return BRANDS.filter((b) => b.featured);
}

export function getBrandsByTier(tier: BrandTier): Brand[] {
  return BRANDS.filter((b) => b.tier === tier);
}

export const TIER_LABELS: Record<BrandTier, string> = {
  iconic: "Iconic",
  craft: "Craft",
  premium: "Premium",
  regional: "Regional",
  subscription: "Subscription & Curation"
};

// ---------------------------------------------------------------------------
// DB layer
// ---------------------------------------------------------------------------

type BrandRow = {
  slug: string; name: string; tagline: string; founded: string;
  origin: string; city: string; tier: string; description: string;
  editorial_note: string; why_it_matters: string; best_for: string;
  pepper_slug: string | null; featured: boolean;
  signature_products: Array<{ name: string; affiliate_key?: string; description: string }>;
};

function rowToBrand(row: BrandRow): Brand {
  return {
    slug: row.slug, name: row.name, tagline: row.tagline, founded: row.founded,
    origin: row.origin as BrandOrigin, city: row.city, tier: row.tier as BrandTier,
    description: row.description, editorialNote: row.editorial_note,
    signatureProducts: (row.signature_products ?? []).map((p) => ({
      name: p.name, affiliateKey: p.affiliate_key, description: p.description
    })),
    whyItMatters: row.why_it_matters, bestFor: row.best_for,
    pepperSlug: row.pepper_slug ?? undefined,
    featured: row.featured, source: "editorial"
  };
}

export async function getBrandsFromDb(): Promise<Brand[]> {
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = createSupabaseServerClient();
    if (!supabase) return BRANDS;
    const { data, error } = await supabase
      .from("brands").select("*").eq("status", "published").order("name");
    if (error || !data || data.length === 0) return BRANDS;
    return (data as BrandRow[]).map(rowToBrand);
  } catch { return BRANDS; }
}

export async function getBrandFromDb(slug: string): Promise<Brand | undefined> {
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = createSupabaseServerClient();
    if (!supabase) return getBrandBySlug(slug);
    const { data, error } = await supabase
      .from("brands").select("*").eq("slug", slug).eq("status", "published").single();
    if (error || !data) return getBrandBySlug(slug);
    return rowToBrand(data as BrandRow);
  } catch { return getBrandBySlug(slug); }
}
