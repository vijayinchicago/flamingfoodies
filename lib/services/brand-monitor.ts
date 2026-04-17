/**
 * Brand monitor agent.
 * Weekly scan for new hot sauce brands, major product launches from tracked brands,
 * brand acquisitions, and notable news. New brands land as draft; news items
 * go into the releases table.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export type BrandMonitorResult = {
  brandsFound: number; brandsInserted: number;
  releasesFound: number; releasesInserted: number;
  error?: string;
};

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const BRAND_SYSTEM = `You are a brand researcher for FlamingFoodies.com.

Search for hot sauce and spicy food brands that are NOT in this list. Focus on:
- Craft brands with cult followings not yet mainstream
- Recently launched brands gaining traction
- International brands entering the US market

Return a JSON array of brand objects with EXACTLY these fields:
{
  "name": string,
  "tagline": string,
  "founded": string,
  "origin": string,        // usa|mexico|caribbean|uk|belize|canada|australia
  "city": string,
  "tier": string,          // iconic|craft|premium|regional|subscription
  "description": string,   // 2-3 sentences
  "why_it_matters": string,
  "best_for": string,
  "signature_products": [{ "name": string, "description": string }]
}

Return ONLY valid JSON array. Return [] if nothing new found.`;

const RELEASE_SYSTEM = `You are a product news researcher for FlamingFoodies.com.

Search for recent (last 7 days) hot sauce product launches, limited editions, brand collaborations, and notable industry news.

Return a JSON array with EXACTLY these fields:
{
  "title": string,
  "brand": string,
  "type": string,       // new-product|limited-edition|collab|restock|brand-news
  "description": string, // 1-2 sentences
  "body": string,        // 2-3 sentence editorial take
  "source_url": string   // URL of the news source or empty string
}

Return ONLY valid JSON array. Return [] if nothing found.`;

export async function runBrandMonitor(): Promise<BrandMonitorResult> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { brandsFound: 0, brandsInserted: 0, releasesFound: 0, releasesInserted: 0, error: "No DB" };

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  // Load existing brand names
  const { data: existingBrands } = await supabase.from("brands").select("name");
  const existingNames = (existingBrands ?? []).map((r: { name: string }) => r.name);

  let brandsInserted = 0; let brandsFound = 0;
  let releasesInserted = 0; let releasesFound = 0;

  // --- Brand discovery ---
  try {
    let rawBrands = "";
    const brandResp = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      system: BRAND_SYSTEM,
      // @ts-ignore
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{
        role: "user",
        content: `Find hot sauce brands NOT in this list: ${existingNames.join(", ")}. Return up to 5 new brands as JSON.`
      }]
    });
    for (const block of brandResp.content) {
      if (block.type === "text") rawBrands += block.text;
    }
    const cleanedBrands = rawBrands.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsedBrands = JSON.parse(cleanedBrands);
    const discoveredBrands = Array.isArray(parsedBrands) ? parsedBrands : [];
    brandsFound = discoveredBrands.length;

    for (const b of discoveredBrands) {
      if (!b.name) continue;
      const slug = toSlug(String(b.name));
      const row = {
        slug, name: b.name, tagline: b.tagline ?? "",
        founded: b.founded ?? "Unknown", origin: b.origin ?? "usa",
        city: b.city ?? "", tier: b.tier ?? "craft",
        description: b.description ?? "", editorial_note: "",
        why_it_matters: b.why_it_matters ?? "", best_for: b.best_for ?? "",
        pepper_slug: null,
        signature_products: Array.isArray(b.signature_products) ? b.signature_products : [],
        featured: false, source: "ai_discovered", status: "draft"
      };
      const { error } = await supabase.from("brands").insert(row);
      if (!error) brandsInserted++;
    }
  } catch { /* non-fatal */ }

  // --- Release tracking ---
  try {
    let rawReleases = "";
    const releaseResp = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      system: RELEASE_SYSTEM,
      // @ts-ignore
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{
        role: "user",
        content: "Search for new hot sauce product launches, limited editions, and brand news from the past 7 days. Return as JSON array."
      }]
    });
    for (const block of releaseResp.content) {
      if (block.type === "text") rawReleases += block.text;
    }
    const cleanedReleases = rawReleases.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsedReleases = JSON.parse(cleanedReleases);
    const discoveredReleases = Array.isArray(parsedReleases) ? parsedReleases : [];
    releasesFound = discoveredReleases.length;

    for (const r of discoveredReleases) {
      if (!r.title || !r.brand) continue;
      const slug = toSlug(`${r.brand}-${r.title}-${Date.now()}`).slice(0, 80);
      const row = {
        slug, title: r.title, brand: r.brand,
        type: r.type ?? "new-product",
        description: r.description ?? "", body: r.body ?? "",
        affiliate_key: null, source_url: r.source_url || null,
        featured: false, source: "ai_discovered",
        status: "published", // releases go live automatically
        published_at: new Date().toISOString()
      };
      const { error } = await supabase.from("releases").insert(row);
      if (!error) releasesInserted++;
    }
  } catch { /* non-fatal */ }

  return { brandsFound, brandsInserted, releasesFound, releasesInserted };
}
