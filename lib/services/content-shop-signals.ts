/**
 * Content→Shop signal pipeline.
 *
 * When a recipe, blog post, or review is published it scans the actual text
 * (title, description, ingredients, body tags) and maps product/tool/sauce
 * mentions to entries in the AFFILIATE_LINKS catalog. Unmatched mentions are
 * logged as "shop gaps" so the catalog can be expanded over time.
 *
 * Two entry points:
 *   triggerContentShopSync(id, type) — call on publish, non-blocking
 *   runContentShopSyncBatch()        — cron that sweeps recent content
 */

import {
  AFFILIATE_LINKS,
  buildAffiliateDestinationUrl,
  type AffiliateLinkEntry
} from "@/lib/affiliates";
import { autoExpandCatalog } from "@/lib/services/catalog-auto-grow";
import { flags } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ContentType = "recipe" | "blog_post" | "review";

export type ContentShopMatch = {
  affiliateKey: string;
  product: string;
  score: number;
  matchedTerms: string[];
  category: string;
};

export type ShopGapEntry = {
  term: string;
  contentType: ContentType;
  contentId: number;
  contentTitle: string;
  seenAt: string;
};

export type ContentShopSyncResult = {
  contentId: number;
  contentType: ContentType;
  contentTitle: string;
  matches: ContentShopMatch[];
  gaps: ShopGapEntry[];
  mode: "live" | "dry_run";
};

// ---------------------------------------------------------------------------
// Keyword dictionary
//
// Each entry maps a list of text patterns (lower-cased, trimmed) to one or
// more affiliate catalog keys.  A pattern matches when it appears as a
// substring of a whitespace-normalised content token.
// ---------------------------------------------------------------------------

const KEYWORD_TO_KEYS: Array<{ patterns: string[]; keys: string[] }> = [
  // Hot sauces — exact brand/product mentions
  { patterns: ["tabasco", "tabasco original"], keys: ["amazon-tabasco-original"] },
  { patterns: ["tabasco green", "green tabasco", "jalapeño tabasco"], keys: ["amazon-tabasco-green"] },
  { patterns: ["tabasco chipotle", "chipotle tabasco"], keys: ["amazon-tabasco-chipotle"] },
  { patterns: ["frank's redhot", "franks redhot", "frank's red hot", "franks red hot", "franks"], keys: ["amazon-franks-redhot"] },
  { patterns: ["buffalo wing sauce", "buffalo sauce", "wing sauce"], keys: ["amazon-franks-buffalo-wing", "amazon-franks-redhot"] },
  { patterns: ["cholula"], keys: ["amazon-cholula-original"] },
  { patterns: ["cholula green", "green tomatillo", "tomatillo sauce"], keys: ["amazon-cholula-green-tomatillo"] },
  { patterns: ["cholula chili garlic", "chili garlic cholula"], keys: ["amazon-cholula-chili-garlic"] },
  { patterns: ["tapatio", "tapatío"], keys: ["amazon-tapatio"] },
  { patterns: ["valentina", "valentina black", "valentina red"], keys: ["amazon-valentina-black-label", "amazon-valentina-red-label"] },
  { patterns: ["crystal hot sauce", "crystal sauce"], keys: ["amazon-crystal-hot-sauce"] },
  { patterns: ["texas pete"], keys: ["amazon-texas-pete"] },
  { patterns: ["yellowbird habanero", "yellowbird"], keys: ["amazon-yellowbird-habanero"] },
  { patterns: ["yellowbird serrano"], keys: ["amazon-yellowbird-serrano"] },
  { patterns: ["yellowbird ghost"], keys: ["amazon-yellowbird-ghost-pepper"] },
  { patterns: ["secret aardvark", "aardvark habanero"], keys: ["amazon-secret-aardvark-habanero"] },
  { patterns: ["los calientes", "heatonist los calientes"], keys: ["heatonist-los-calientes-rojo"] },
  { patterns: ["fly by jing", "sichuan gold"], keys: ["amazon-fly-by-jing-sichuan-gold"] },
  { patterns: ["queen majesty", "scotch bonnet ginger"], keys: ["amazon-queen-majesty-scotch-bonnet-ginger"] },
  { patterns: ["marie sharp", "belizean heat"], keys: ["amazon-marie-sharps-belizean-heat"] },
  { patterns: ["el yucateco green", "green habanero"], keys: ["amazon-el-yucateco-green-habanero"] },
  { patterns: ["el yucateco red", "red habanero"], keys: ["amazon-el-yucateco-red-habanero"] },
  { patterns: ["bravado black garlic", "bravado reaper"], keys: ["amazon-bravado-black-garlic-reaper"] },
  { patterns: ["torchbearer garlic reaper", "garlic reaper"], keys: ["amazon-torchbearer-garlic-reaper"] },
  { patterns: ["truff", "truffle hot sauce", "black truffle sauce"], keys: ["amazon-truff-original"] },
  { patterns: ["dave's ghost", "daves ghost pepper"], keys: ["amazon-daves-ghost-pepper"] },
  { patterns: ["mad dog 357", "mad dog"], keys: ["amazon-mad-dog-357"] },
  { patterns: ["mango habanero", "mango hot sauce"], keys: ["amazon-mango-habanero-sauce"] },
  { patterns: ["walkerswood", "scotch bonnet sauce"], keys: ["amazon-walkerswood-scotch-bonnet"] },
  { patterns: ["encona"], keys: ["amazon-encona-original"] },
  { patterns: ["nando's", "nandos peri peri", "peri-peri sauce"], keys: ["amazon-nandos-peri-peri-hot"] },
  { patterns: ["sriracha", "huy fong"], keys: ["amazon-huy-fong-sriracha"] },
  { patterns: ["siete jalapeño", "siete jalapeno"], keys: ["amazon-siete-jalapeño-sauce"] },
  { patterns: ["gringo bandito"], keys: ["amazon-gringo-bandito"] },

  // Pantry & ingredients
  { patterns: ["gochujang", "gochujang paste", "korean chili paste"], keys: ["amazon-gochujang-paste"] },
  { patterns: ["calabrian chili", "calabrian paste"], keys: ["amazon-calabrian-chili-paste"] },
  { patterns: ["berbere", "berbere spice"], keys: ["amazon-berbere-blend"] },
  { patterns: ["chili crisp", "chile crisp", "chili oil", "crispy chili"], keys: ["amazon-chili-crisp"] },
  { patterns: ["harissa"], keys: ["amazon-harissa-paste"] },
  { patterns: ["ras el hanout"], keys: ["amazon-ras-el-hanout"] },
  { patterns: ["chermoula"], keys: ["amazon-chermoula-paste"] },
  { patterns: ["jerk seasoning", "jerk marinade", "jamaican jerk"], keys: ["amazon-jerk-seasoning"] },
  { patterns: ["chipotle in adobo", "chipotle peppers adobo", "adobo sauce"], keys: ["amazon-chipotle-in-adobo"] },
  { patterns: ["cajun seasoning", "cajun spice", "cajun blend"], keys: ["amazon-cajun-seasoning"] },
  { patterns: ["peri peri", "piri piri marinade"], keys: ["amazon-peri-peri-sauce"] },
  { patterns: ["sambal oelek", "sambal"], keys: ["amazon-sambal-oelek"] },
  { patterns: ["tajin", "tajín"], keys: ["amazon-tajin-clasico"] },
  { patterns: ["kewpie", "kewpie mayo", "japanese mayo"], keys: ["amazon-kewpie-mayo"] },
  { patterns: ["hot honey", "mike's hot honey", "mikes hot honey", "spicy honey"], keys: ["mike-hot-honey-original"] },

  // Gear — by tool name
  { patterns: ["cast iron", "cast iron skillet", "cast iron pan"], keys: ["amazon-cast-iron-skillet"] },
  { patterns: ["carbon steel wok", "wok", "stir fry pan"], keys: ["amazon-carbon-steel-wok"] },
  { patterns: ["molcajete", "mortar and pestle", "mortar & pestle", "stone mortar"], keys: ["amazon-molcajete"] },
  { patterns: ["fermentation jar", "fermentation kit", "ferment hot sauce", "fermenting"], keys: ["amazon-fermentation-jar-kit"] },
  { patterns: ["meat thermometer", "instant read thermometer", "digital thermometer"], keys: ["amazon-digital-meat-thermometer"] },
  { patterns: ["grill basket", "grilling basket", "veggie basket"], keys: ["amazon-grill-basket"] },
  { patterns: ["sheet pan", "half sheet pan", "baking sheet"], keys: ["amazon-half-sheet-pan-set"] },
  { patterns: ["rice cooker", "rice maker"], keys: ["amazon-rice-cooker"] },
  { patterns: ["tortilla press", "masa press"], keys: ["amazon-tortilla-press"] },
  { patterns: ["immersion blender", "stick blender", "hand blender"], keys: ["amazon-immersion-blender"] },

  // Subscriptions / gift sets
  { patterns: ["hot sauce gift", "gift set", "hot sauce set", "spicy gift"], keys: ["amazon-hot-sauce-gift-box"] },
  { patterns: ["bbq rub", "grilling rub", "bbq rub set"], keys: ["amazon-bbq-rub-gift-set"] },
  { patterns: ["spicy ramen", "ramen gift"], keys: ["amazon-spicy-ramen-gift-box"] },
  { patterns: ["heatonist", "hot ones lineup", "hot ones season"], keys: ["heatonist-hot-ones-season-22"] },
  { patterns: ["fuego box", "hot sauce subscription", "hot sauce box", "spice subscription"], keys: ["fuego-box-monthly-subscription"] },
  { patterns: ["pepper seeds", "grow peppers", "superhot seeds"], keys: ["pepper-joe-superhot-seed-pack"] }
];

// ---------------------------------------------------------------------------
// Gap dictionary
//
// Terms that commonly appear in food content and SHOULD be in the catalog
// but might not be yet. Used to log gaps for admin review.
// ---------------------------------------------------------------------------

const GAP_TERMS: string[] = [
  "air fryer", "instant pot", "pressure cooker", "slow cooker", "dutch oven",
  "stand mixer", "food processor", "mandoline", "microplane", "zester",
  "spider strainer", "wok spatula", "carbon steel pan", "tagine",
  "dehydrator", "smoker", "offset smoker", "pellet grill", "kamado",
  "pizza stone", "cast iron griddle", "carbon steel griddle",
  "achiote", "aji amarillo", "ghost pepper", "carolina reaper",
  "scotch bonnet", "bird's eye chili", "thai chili",
  "masa harina", "nixtamal", "lard", "annatto",
  "miso paste", "white miso", "red miso",
  "fish sauce", "oyster sauce", "black bean sauce",
  "togarashi", "shichimi", "yuzu kosho",
  "za'atar", "sumac", "urfa biber", "aleppo pepper",
  "szechuan peppercorn", "sichuan pepper"
];

// ---------------------------------------------------------------------------
// Tokenisation helpers
// ---------------------------------------------------------------------------

function normaliseText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s'-]/g, " ").replace(/\s+/g, " ").trim();
}

function extractNgrams(text: string, maxN = 4): string[] {
  const tokens = normaliseText(text).split(" ").filter(Boolean);
  const ngrams: string[] = [];

  for (let n = 1; n <= maxN; n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join(" "));
    }
  }

  return ngrams;
}

function textContainsPattern(tokens: Set<string>, pattern: string): boolean {
  // Check exact token match or substring match within longer ngrams
  if (tokens.has(pattern)) return true;
  for (const token of tokens) {
    if (token.includes(pattern)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Core matching
// ---------------------------------------------------------------------------

export function matchContentToAffiliateCatalog(
  contentText: string,
  contentType: ContentType
): { matches: ContentShopMatch[]; gapTerms: string[] } {
  const ngrams = extractNgrams(contentText);
  const tokenSet = new Set(ngrams);
  const matchMap = new Map<string, { score: number; terms: string[] }>();

  // Match against keyword dictionary
  for (const { patterns, keys } of KEYWORD_TO_KEYS) {
    for (const pattern of patterns) {
      if (textContainsPattern(tokenSet, pattern)) {
        for (const key of keys) {
          const existing = matchMap.get(key) ?? { score: 0, terms: [] };
          // Score by specificity — longer pattern = more specific = higher score
          existing.score += pattern.split(" ").length * 10;
          if (!existing.terms.includes(pattern)) {
            existing.terms.push(pattern);
          }
          matchMap.set(key, existing);
        }
      }
    }
  }

  // Also match using auto-generated terms from affiliate entry descriptions
  for (const [key, entry] of Object.entries(AFFILIATE_LINKS)) {
    const searchableText = [entry.product, entry.bestFor, entry.description]
      .join(" ")
      .toLowerCase();
    const entryNgrams = extractNgrams(searchableText, 3);

    for (const ngram of entryNgrams) {
      if (ngram.length < 6) continue; // skip very short ngrams
      if (textContainsPattern(tokenSet, ngram)) {
        const existing = matchMap.get(key) ?? { score: 0, terms: [] };
        existing.score += 5; // auto-match gets lower base score
        if (!existing.terms.includes(ngram)) {
          existing.terms.push(ngram);
        }
        matchMap.set(key, existing);
      }
    }
  }

  // Apply content-type boosts
  const typeBoosts: Record<ContentType, Record<string, number>> = {
    recipe: { gear: 8, ingredient: 6 },
    blog_post: { hot_sauce: 6, subscription: 4 },
    review: { hot_sauce: 10, subscription: 5 }
  };

  const matches: ContentShopMatch[] = [];

  for (const [key, { score, terms }] of matchMap) {
    const entry = AFFILIATE_LINKS[key];
    if (!entry) continue;

    const boost = typeBoosts[contentType][entry.category] ?? 0;

    matches.push({
      affiliateKey: key,
      product: entry.product,
      score: score + boost,
      matchedTerms: terms,
      category: entry.category
    });
  }

  matches.sort((a, b) => b.score - a.score);

  // Detect gaps — terms in text not covered by catalog
  const gapTerms: string[] = [];
  for (const term of GAP_TERMS) {
    if (textContainsPattern(tokenSet, term)) {
      const alreadyCovered = matches.some((m) =>
        m.matchedTerms.some((t) => t.includes(term) || term.includes(t))
      );
      if (!alreadyCovered) {
        gapTerms.push(term);
      }
    }
  }

  return { matches, gapTerms };
}

// ---------------------------------------------------------------------------
// Content fetching
// ---------------------------------------------------------------------------

async function fetchContentText(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  contentId: number,
  contentType: ContentType
): Promise<{ text: string; title: string } | null> {
  if (!supabase) return null;

  if (contentType === "recipe") {
    const { data } = await supabase
      .from("recipes")
      .select("title, description, cuisine_type, heat_level, tags, ingredients, ingredient_sections, equipment, method_steps")
      .eq("id", contentId)
      .single();

    if (!data) return null;

    // Flatten all ingredient items across flat list and section-grouped list
    const flatIngredients = Array.isArray(data.ingredients)
      ? (data.ingredients as Array<{ item?: string; notes?: string }>)
          .map((i) => [i.item, i.notes].filter(Boolean).join(" "))
          .join(" ")
      : "";

    const sectionIngredients = Array.isArray(data.ingredient_sections)
      ? (data.ingredient_sections as Array<{ items?: Array<{ item?: string; notes?: string }> }>)
          .flatMap((s) => s.items ?? [])
          .map((i) => [i.item, i.notes].filter(Boolean).join(" "))
          .join(" ")
      : "";

    // Equipment items are product names — high signal for catalog matching
    const equipmentText = Array.isArray(data.equipment)
      ? (data.equipment as string[]).join(" ")
      : "";

    // Method step ingredient refs
    const methodText = Array.isArray(data.method_steps)
      ? (data.method_steps as Array<{ ingredient_refs?: string[] }>)
          .flatMap((s) => s.ingredient_refs ?? [])
          .join(" ")
      : "";

    const tags = Array.isArray(data.tags) ? data.tags.join(" ") : "";

    return {
      title: data.title ?? "",
      text: [
        data.title, data.description, data.cuisine_type, data.heat_level,
        tags, flatIngredients, sectionIngredients, equipmentText, methodText
      ].filter(Boolean).join(" ")
    };
  }

  if (contentType === "blog_post") {
    const { data } = await supabase
      .from("blog_posts")
      .select("title, description, category, tags, content")
      .eq("id", contentId)
      .single();

    if (!data) return null;

    const tags = Array.isArray(data.tags) ? data.tags.join(" ") : "";
    // Strip HTML from content for text analysis
    const bodyText = typeof data.content === "string"
      ? data.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      : "";

    return {
      title: data.title ?? "",
      text: [data.title, data.description, data.category, tags, bodyText.slice(0, 3000)]
        .filter(Boolean)
        .join(" ")
    };
  }

  if (contentType === "review") {
    const { data } = await supabase
      .from("reviews")
      .select("title, description, brand, category, heat_level, cuisine_origin, flavor_notes, tags, content")
      .eq("id", contentId)
      .single();

    if (!data) return null;

    const tags = Array.isArray(data.tags) ? data.tags.join(" ") : "";
    const flavorNotes = Array.isArray(data.flavor_notes) ? data.flavor_notes.join(" ") : "";
    const bodyText = typeof data.content === "string"
      ? data.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      : "";

    return {
      title: data.title ?? "",
      text: [
        data.title, data.description, data.brand, data.category,
        data.heat_level, data.cuisine_origin, flavorNotes, tags,
        bodyText.slice(0, 2000)
      ].filter(Boolean).join(" ")
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Gap logging
// ---------------------------------------------------------------------------

async function logShopGaps(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  gaps: ShopGapEntry[]
) {
  if (!supabase || !gaps.length) return;

  // Store gaps in site_settings as a rolling JSON log
  const { data: existing } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "shop_gap_log")
    .maybeSingle();

  const existingGaps: ShopGapEntry[] = Array.isArray(existing?.value)
    ? (existing.value as ShopGapEntry[])
    : [];

  // Deduplicate by term+contentId, keep last 200 entries
  const existingKeys = new Set(existingGaps.map((g) => `${g.term}:${g.contentId}`));
  const newGaps = gaps.filter((g) => !existingKeys.has(`${g.term}:${g.contentId}`));

  if (!newGaps.length) return;

  const merged = [...newGaps, ...existingGaps].slice(0, 200);

  await supabase
    .from("site_settings")
    .upsert({ key: "shop_gap_log", value: merged as unknown as Record<string, unknown> });
}

// ---------------------------------------------------------------------------
// Shop pick promotion
// ---------------------------------------------------------------------------

async function promoteMatchedShopPicks(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  matches: ContentShopMatch[],
  contentType: ContentType
) {
  if (!supabase || !matches.length) return;

  // Only promote the top 3 matches with score >= 10
  const topMatches = matches.filter((m) => m.score >= 10).slice(0, 3);
  if (!topMatches.length) return;

  for (const match of topMatches) {
    const entry = AFFILIATE_LINKS[match.affiliateKey];
    if (!entry) continue;

    const slug = `shop-pick-${match.affiliateKey}`;
    const href = `/go/${match.affiliateKey}`;

    // Upsert the pick — if it already exists just bump its sort order and ensure it's featured
    const { data: existing } = await supabase
      .from("merch_products")
      .select("id")
      .or(`slug.eq.${slug},href.eq.${href}`)
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from("merch_products")
        .update({ featured: true, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("merch_products").insert({
        slug,
        name: entry.product,
        category: categoryLabel(entry.category),
        badge: entry.badge,
        description: `${entry.description} Best for ${entry.bestFor.toLowerCase()}.`,
        price_label: entry.priceLabel || "Check Amazon",
        availability: "live",
        theme_key: themeForCategory(entry.category),
        href,
        cta_label: "View on Amazon",
        image_url: null,
        image_alt: `${entry.product} product pick`,
        featured: true,
        status: "published",
        sort_order: 0
      });
    }
  }
}

function categoryLabel(cat: string) {
  const map: Record<string, string> = {
    hot_sauce: "Hot sauces",
    gear: "Kitchen gear",
    ingredient: "Pantry heat",
    subscription: "Subscriptions"
  };
  return map[cat] ?? "Shop picks";
}

function themeForCategory(cat: string) {
  const map: Record<string, string> = {
    hot_sauce: "flame",
    gear: "charcoal",
    ingredient: "ember",
    subscription: "gold"
  };
  return map[cat] ?? "smoke";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Call this immediately when content is published (non-blocking via void).
 * Scans the content text, maps to affiliate catalog, promotes top matches
 * as featured shop picks, and logs any unmatched product mentions as gaps.
 */
export async function triggerContentShopSync(
  contentId: number,
  contentType: ContentType
): Promise<ContentShopSyncResult> {
  const dryRun = !flags.hasSupabaseAdmin;

  if (dryRun) {
    return {
      contentId,
      contentType,
      contentTitle: "(dry run)",
      matches: [],
      gaps: [],
      mode: "dry_run"
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { contentId, contentType, contentTitle: "", matches: [], gaps: [], mode: "dry_run" };
  }

  const content = await fetchContentText(supabase, contentId, contentType);
  if (!content) {
    return { contentId, contentType, contentTitle: "", matches: [], gaps: [], mode: "live" };
  }

  const { matches, gapTerms } = matchContentToAffiliateCatalog(content.text, contentType);

  const gaps: ShopGapEntry[] = gapTerms.map((term) => ({
    term,
    contentType,
    contentId,
    contentTitle: content.title,
    seenAt: new Date().toISOString()
  }));

  await Promise.all([
    promoteMatchedShopPicks(supabase, matches, contentType),
    logShopGaps(supabase, gaps)
  ]);

  return {
    contentId,
    contentType,
    contentTitle: content.title,
    matches,
    gaps,
    mode: "live"
  };
}

/**
 * Batch version — sweeps all content published in the last N days.
 * Run as a daily cron at /api/admin/content-shop-sync.
 */
export async function runContentShopSyncBatch(windowDays = 7): Promise<{
  processed: number;
  totalMatches: number;
  totalGaps: number;
  results: ContentShopSyncResult[];
}> {
  if (!flags.hasSupabaseAdmin) {
    return { processed: 0, totalMatches: 0, totalGaps: 0, results: [] };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { processed: 0, totalMatches: 0, totalGaps: 0, results: [] };
  }

  const since = new Date(Date.now() - windowDays * 86400000).toISOString();
  const results: ContentShopSyncResult[] = [];

  const [{ data: recipes }, { data: blogPosts }, { data: reviews }] = await Promise.all([
    supabase
      .from("recipes")
      .select("id")
      .eq("status", "published")
      .gte("published_at", since)
      .order("published_at", { ascending: false })
      .limit(30),
    supabase
      .from("blog_posts")
      .select("id")
      .eq("status", "published")
      .gte("published_at", since)
      .order("published_at", { ascending: false })
      .limit(15),
    supabase
      .from("reviews")
      .select("id")
      .eq("status", "published")
      .gte("published_at", since)
      .order("published_at", { ascending: false })
      .limit(15)
  ]);

  const tasks: Array<{ id: number; type: ContentType }> = [
    ...(recipes ?? []).map((r) => ({ id: r.id, type: "recipe" as const })),
    ...(blogPosts ?? []).map((p) => ({ id: p.id, type: "blog_post" as const })),
    ...(reviews ?? []).map((r) => ({ id: r.id, type: "review" as const }))
  ];

  for (const task of tasks) {
    const result = await triggerContentShopSync(task.id, task.type);
    results.push(result);
  }

  // After processing, auto-expand catalog for any high-frequency gap terms
  const allGaps = results.flatMap((r) => r.gaps);
  if (allGaps.length > 0) {
    // Fire-and-forget — failure here shouldn't surface as a batch error
    void autoExpandCatalog(allGaps, { minOccurrences: 2 });
  }

  return {
    processed: results.length,
    totalMatches: results.reduce((sum, r) => sum + r.matches.length, 0),
    totalGaps: results.reduce((sum, r) => sum + r.gaps.length, 0),
    results
  };
}

/**
 * Returns the current gap log for admin display.
 */
export async function getShopGapLog(): Promise<ShopGapEntry[]> {
  if (!flags.hasSupabaseAdmin) return [];

  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "shop_gap_log")
    .maybeSingle();

  if (!Array.isArray(data?.value)) return [];
  return data.value as ShopGapEntry[];
}

/**
 * Returns a frequency-ranked summary of gap terms for admin display.
 */
export function summariseGapLog(
  gaps: ShopGapEntry[]
): Array<{ term: string; count: number; lastSeen: string; examples: string[] }> {
  const map = new Map<string, { count: number; lastSeen: string; examples: string[] }>();

  for (const gap of gaps) {
    const existing = map.get(gap.term) ?? { count: 0, lastSeen: gap.seenAt, examples: [] };
    existing.count += 1;
    if (gap.seenAt > existing.lastSeen) existing.lastSeen = gap.seenAt;
    if (existing.examples.length < 3 && !existing.examples.includes(gap.contentTitle)) {
      existing.examples.push(gap.contentTitle);
    }
    map.set(gap.term, existing);
  }

  return [...map.entries()]
    .map(([term, stats]) => ({ term, ...stats }))
    .sort((a, b) => b.count - a.count || b.lastSeen.localeCompare(a.lastSeen));
}
