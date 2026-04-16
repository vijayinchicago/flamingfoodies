/**
 * Catalog auto-grow service.
 *
 * Watches the shop gap log for food/kitchen terms that appear in published
 * content but lack an affiliate catalog entry.  When a term crosses the
 * frequency threshold, it calls Claude Haiku to:
 *   1. Classify the term (ingredient / hot_sauce / gear / skip)
 *   2. Generate a product name, badge, and description
 *   3. Infer likely search terms for inline link matching
 *
 * New entries are stored in site_settings.affiliate_dynamic_catalog as a
 * JSON array.  They are merged into the inline link term list at render time
 * via getDynamicInlineTerms().
 *
 * The static AFFILIATE_LINKS catalog is never modified at runtime — dynamic
 * entries are additive and scoped to Amazon search URLs only.
 */

import Anthropic from "@anthropic-ai/sdk";

import type { AffiliateCategory } from "@/lib/affiliates";
import { buildAmazonSearchUrl } from "@/lib/affiliates";
import type { InlineCatalogTerm } from "@/lib/inline-affiliate-links";
import { env, flags } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { ShopGapEntry } from "@/lib/services/content-shop-signals";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DynamicCatalogEntry = {
  key: string;
  product: string;
  category: AffiliateCategory;
  badge: string;
  description: string;
  url: string;
  searchTerms: string[];
  createdAt: string;
  createdFromTerm: string;
};

// ---------------------------------------------------------------------------
// Claude classification
// ---------------------------------------------------------------------------

const AUTO_GROW_PROMPT = (term: string) => `
You are a product classifier for FlamingFoodies.com, a site about spicy food.

Given the food/kitchen term below, decide whether it maps to a sellable product:
- ingredient: a condiment, spice blend, paste, sauce, or pantry staple
- hot_sauce: a bottled hot sauce or chili sauce
- gear: a kitchen tool or cooking equipment
- skip: generic cooking term, technique, or non-product word

If category is NOT "skip", generate the Amazon listing details:
- product_name: short, natural product title (e.g. "Za'atar Spice Blend")
- badge: 2-4 word descriptor matching FlamingFoodies style (e.g. "Herb-citrus mix")
- description: 1-sentence product description in the FlamingFoodies voice — specific and useful, not salesy
- search_terms: 2-4 text patterns a writer would actually use (shortest to longest)

FlamingFoodies voice: warm, specific, confident, not snobbish or macho.

Term: "${term}"

Return ONLY valid JSON:
{
  "category": "ingredient|hot_sauce|gear|skip",
  "product_name": "...",
  "badge": "...",
  "description": "...",
  "search_terms": ["short form", "full product name"]
}
`.trim();

type ClassificationResult = {
  category: AffiliateCategory | "skip";
  product_name: string;
  badge: string;
  description: string;
  search_terms: string[];
};

async function classifyTerm(term: string): Promise<ClassificationResult | null> {
  if (!env.ANTHROPIC_API_KEY) return null;

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: AUTO_GROW_PROMPT(term) }]
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as ClassificationResult;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Dynamic catalog storage
// ---------------------------------------------------------------------------

const DYNAMIC_CATALOG_SETTING_KEY = "affiliate_dynamic_catalog";

async function loadDynamicCatalog(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>
): Promise<DynamicCatalogEntry[]> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", DYNAMIC_CATALOG_SETTING_KEY)
    .maybeSingle();

  if (!Array.isArray(data?.value)) return [];
  return data.value as DynamicCatalogEntry[];
}

async function saveDynamicCatalog(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  entries: DynamicCatalogEntry[]
) {
  await supabase.from("site_settings").upsert(
    { key: DYNAMIC_CATALOG_SETTING_KEY, value: entries },
    { onConflict: "key" }
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns dynamic catalog entries as inline link terms, ready to merge with
 * the static catalog terms in injectInlineAffiliateLinks().
 */
export async function getDynamicInlineTerms(): Promise<InlineCatalogTerm[]> {
  if (!flags.hasSupabaseAdmin) return [];

  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  const entries = await loadDynamicCatalog(supabase);
  return entries.flatMap((entry) =>
    entry.searchTerms.map((pattern) => ({ pattern, key: entry.key }))
  );
}

/**
 * Returns all dynamic catalog entries (for admin display).
 */
export async function getDynamicCatalogEntries(): Promise<DynamicCatalogEntry[]> {
  if (!flags.hasSupabaseAdmin) return [];

  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  return loadDynamicCatalog(supabase);
}

/**
 * Examines the provided gap entries and auto-creates catalog entries for any
 * term that:
 *   - has been seen at least `minOccurrences` times
 *   - is not already in the static or dynamic catalog
 *   - can be classified by Claude as a linkable product
 *
 * Returns the list of newly created entries.
 */
export async function autoExpandCatalog(
  gaps: ShopGapEntry[],
  options: { minOccurrences?: number } = {}
): Promise<DynamicCatalogEntry[]> {
  const { minOccurrences = 2 } = options;

  if (!flags.hasSupabaseAdmin || !env.ANTHROPIC_API_KEY) return [];

  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  // Tally gap term frequencies
  const termCounts = new Map<string, number>();
  for (const gap of gaps) {
    termCounts.set(gap.term, (termCounts.get(gap.term) ?? 0) + 1);
  }

  // Load existing dynamic catalog to avoid duplicates
  const existing = await loadDynamicCatalog(supabase);
  const existingKeys = new Set(existing.map((e) => e.key));
  const existingTerms = new Set(
    existing.flatMap((e) => e.searchTerms.map((t) => t.toLowerCase()))
  );

  const created: DynamicCatalogEntry[] = [];

  for (const [term, count] of termCounts) {
    if (count < minOccurrences) continue;
    if (existingTerms.has(term.toLowerCase())) continue;

    const classification = await classifyTerm(term);
    if (!classification || classification.category === "skip") continue;

    const slug = term
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const key = `dynamic-${slug}`;

    if (existingKeys.has(key)) continue;

    const entry: DynamicCatalogEntry = {
      key,
      product: classification.product_name,
      category: classification.category,
      badge: classification.badge,
      description: classification.description,
      url: buildAmazonSearchUrl(classification.product_name),
      searchTerms: classification.search_terms ?? [term],
      createdAt: new Date().toISOString(),
      createdFromTerm: term
    };

    existing.push(entry);
    existingKeys.add(key);
    for (const t of entry.searchTerms) existingTerms.add(t.toLowerCase());
    created.push(entry);
  }

  if (created.length > 0) {
    await saveDynamicCatalog(supabase, existing);
  }

  return created;
}
