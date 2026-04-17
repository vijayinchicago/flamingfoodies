/**
 * Pepper discovery agent.
 * Nightly cron searches for newly documented pepper varieties, new
 * Guinness record holders, and regional cultivars not yet in the DB.
 * Discovered peppers land as draft status for editorial review.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export type PepperDiscoveryResult = {
  found: number; inserted: number; skipped: number;
  newSlugs: string[]; error?: string;
};

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const SYSTEM = `You are a botanical and culinary researcher for FlamingFoodies.com, a hot pepper and hot sauce site.

Search for hot pepper varieties that are noteworthy but not widely documented online — new cultivars, regional varieties, record-holders, and recently developed hybrids.

For each pepper found, return a JSON array of objects with EXACTLY these fields:
{
  "name": string,
  "aliases": string[],
  "origin": string,       // one of: mexico, central-america, caribbean, south-america, north-america, africa, southeast-asia, south-asia, europe, middle-east
  "scoville_min": number,
  "scoville_max": number,
  "heat_tier": string,    // mild|medium|hot|very-hot|extreme|superhot
  "color": string,
  "flavor_profile": string,
  "description": string,  // 2-3 sentences
  "culinary_uses": string[],
  "pairs_with": string[],
  "fun_fact": string
}

Return ONLY a valid JSON array. No markdown. Return [] if you find nothing new.`;

export async function runPepperDiscovery(): Promise<PepperDiscoveryResult> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { found: 0, inserted: 0, skipped: 0, newSlugs: [], error: "No Supabase admin client" };

  const { data: existing } = await supabase.from("peppers").select("name");
  const existingNames = (existing ?? []).map((r: { name: string }) => r.name);

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  let rawJson = "";

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: SYSTEM,
      // @ts-ignore
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{
        role: "user",
        content: `Search for hot pepper varieties not in this list: ${existingNames.join(", ")}.\n\nLook for: newly documented superhot cultivars, regional peppers from underrepresented cuisines (West African, Central Asian, Middle Eastern), new Guinness record holders, and any 2025-2026 newly named varieties. Return up to 8 new peppers as JSON.`
      }]
    });
    for (const block of response.content) {
      if (block.type === "text") rawJson += block.text;
    }
  } catch (err) {
    return { found: 0, inserted: 0, skipped: 0, newSlugs: [], error: String(err) };
  }

  let discovered: Record<string, unknown>[] = [];
  try {
    const cleaned = rawJson.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    discovered = Array.isArray(parsed) ? parsed : [];
  } catch {
    return { found: 0, inserted: 0, skipped: 0, newSlugs: [], error: `Parse failed: ${rawJson.slice(0, 200)}` };
  }

  let inserted = 0; let skipped = 0; const newSlugs: string[] = [];

  for (const p of discovered) {
    if (!p.name) { skipped++; continue; }
    const slug = toSlug(String(p.name));
    const row = {
      slug, name: p.name, aliases: p.aliases ?? [],
      origin: p.origin ?? "north-america",
      scoville_min: Number(p.scoville_min) || 0,
      scoville_max: Number(p.scoville_max) || 0,
      heat_tier: p.heat_tier ?? "medium",
      color: p.color ?? "", flavor_profile: p.flavor_profile ?? "",
      description: p.description ?? "", editorial_note: "",
      culinary_uses: p.culinary_uses ?? [], pairs_with: p.pairs_with ?? [],
      fun_fact: p.fun_fact ?? "", affiliate_keys: [], recipe_tag_match: [],
      featured: false, source: "ai_discovered", status: "draft"
    };
    const { error } = await supabase.from("peppers").insert(row);
    if (!error) { inserted++; newSlugs.push(slug); }
    else skipped++;
  }

  return { found: discovered.length, inserted, skipped, newSlugs };
}
