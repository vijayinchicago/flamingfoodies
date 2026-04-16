/**
 * Festival discovery agent.
 *
 * Runs nightly via the /api/admin/festival-discovery cron route.
 *
 * Uses Claude with the built-in web_search tool to find US hot sauce and
 * spicy food festivals that are not yet in the database.  Each discovered
 * festival is normalised into the festivals table schema and upserted with
 * source = 'ai_discovered' and status = 'draft' for admin review before
 * it goes live.
 *
 * Flow:
 *   1. Load existing festival slugs from DB so we don't re-add known events.
 *   2. Run two Claude web-search passes: one for the current year, one for
 *      "upcoming" to catch anything just announced.
 *   3. Claude returns structured JSON for each new festival it finds.
 *   4. Validate, slugify, and upsert with ON CONFLICT DO NOTHING.
 *   5. Return a summary { found, inserted, skipped }.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DiscoveredFestival = {
  name: string;
  city: string;
  state: string;
  state_code: string;
  region: string;
  month: number;
  date_range: string;
  annual: boolean;
  website: string;
  description: string;
  tagline: string;
  what_to_expect: string[];
  best_for: string;
  tags: string[];
};

export type FestivalDiscoveryResult = {
  found: number;
  inserted: number;
  skipped: number;
  newSlugs: string[];
  error?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSlug(name: string, city: string, stateCode: string): string {
  return [name, city, stateCode]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validateRegion(region: string): string {
  const valid = ["northeast", "southeast", "south", "midwest", "southwest", "west"];
  const lower = region.toLowerCase();
  return valid.includes(lower) ? lower : "south";
}

function validateMonth(month: unknown): number {
  const n = Number(month);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : 6;
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const DISCOVERY_SYSTEM = `You are a research assistant for FlamingFoodies.com, a US spicy food and hot sauce media site.

Your job is to search the web for hot sauce festivals, spicy food festivals, chile pepper festivals, and BBQ festivals happening in the United States.

For each festival you find, return a JSON array of festival objects. Each object MUST have exactly these fields:
{
  "name": string,           // Official festival name
  "city": string,           // City
  "state": string,          // Full state name
  "state_code": string,     // 2-letter state abbreviation
  "region": string,         // One of: northeast, southeast, south, midwest, southwest, west
  "month": number,          // Primary month as integer 1-12
  "date_range": string,     // Human-readable range e.g. "Late April" or "August 8-9"
  "annual": boolean,        // true if recurring annually
  "website": string,        // Official website URL or empty string
  "description": string,    // 2-3 sentence editorial description of the festival
  "tagline": string,        // Short punchy tagline under 12 words
  "what_to_expect": string[], // Array of 3-5 bullet strings describing the experience
  "best_for": string,       // 1-2 sentences on who should attend
  "tags": string[]          // Array of descriptive tags e.g. ["outdoor","competition","family friendly"]
}

Return ONLY a valid JSON array. No markdown, no prose, no explanation. If you find no new festivals, return [].`;

const discoveryQuery = (year: number, existingNames: string[]) =>
  `Search for US hot sauce festivals, spicy food festivals, and chile pepper festivals happening in ${year} or announced for upcoming months.

Known festivals I already have (skip these):
${existingNames.slice(0, 30).join(", ")}

Find festivals I DON'T have yet. Search for things like:
- "hot sauce festival 2026 united states"
- "spicy food festival 2026 USA"
- "chile pepper festival annual"
- "fiery food expo"
- regional searches like "southeast hot sauce festival" or "midwest spicy food"

Return a JSON array of new festivals you find. Maximum 10 results.`;

// ---------------------------------------------------------------------------
// Main discovery function
// ---------------------------------------------------------------------------

export async function runFestivalDiscovery(): Promise<FestivalDiscoveryResult> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { found: 0, inserted: 0, skipped: 0, newSlugs: [], error: "No Supabase admin client" };
  }

  // 1. Load existing slugs + names from DB
  const { data: existing } = await supabase
    .from("festivals")
    .select("slug, name");

  const existingSlugs = new Set((existing ?? []).map((r: { slug: string }) => r.slug));
  const existingNames = (existing ?? []).map((r: { name: string }) => r.name);

  // 2. Run Claude with web_search
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const year = new Date().getFullYear();

  let rawJson = "";
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: DISCOVERY_SYSTEM,
      // web_search_20250305 is a built-in tool; cast needed until SDK types catch up
      // @ts-ignore
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [
        {
          role: "user",
          content: discoveryQuery(year, existingNames)
        }
      ]
    });

    // Extract text content from the final assistant message
    for (const block of response.content) {
      if (block.type === "text") {
        rawJson += block.text;
      }
    }
  } catch (err) {
    return {
      found: 0,
      inserted: 0,
      skipped: 0,
      newSlugs: [],
      error: `Claude call failed: ${err instanceof Error ? err.message : String(err)}`
    };
  }

  // 3. Parse JSON
  let discovered: DiscoveredFestival[] = [];
  try {
    // Strip any accidental markdown fences
    const cleaned = rawJson.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    discovered = Array.isArray(parsed) ? parsed : [];
  } catch {
    return {
      found: 0,
      inserted: 0,
      skipped: 0,
      newSlugs: [],
      error: `JSON parse failed. Raw: ${rawJson.slice(0, 300)}`
    };
  }

  if (discovered.length === 0) {
    return { found: 0, inserted: 0, skipped: 0, newSlugs: [] };
  }

  // 4. Upsert new festivals
  let inserted = 0;
  let skipped = 0;
  const newSlugs: string[] = [];

  for (const fest of discovered) {
    if (!fest.name || !fest.city || !fest.state_code) {
      skipped++;
      continue;
    }

    const slug = toSlug(fest.name, fest.city, fest.state_code);

    if (existingSlugs.has(slug)) {
      skipped++;
      continue;
    }

    const row = {
      slug,
      name: fest.name,
      short_name: fest.name,
      city: fest.city,
      state: fest.state ?? "",
      state_code: fest.state_code.toUpperCase().slice(0, 2),
      region: validateRegion(fest.region ?? "south"),
      month: validateMonth(fest.month),
      date_range: fest.date_range ?? "",
      annual: Boolean(fest.annual),
      website: fest.website ?? "",
      description: fest.description ?? "",
      tagline: fest.tagline ?? "",
      editorial_note: "",
      what_to_expect: Array.isArray(fest.what_to_expect) ? fest.what_to_expect : [],
      best_for: fest.best_for ?? "",
      pack_intro: "",
      pack_affiliate: [],
      cuisine_tags: [],
      tags: Array.isArray(fest.tags) ? fest.tags : [],
      featured: false,
      source: "ai_discovered",
      status: "draft" // admin must review before going live
    };

    const { error } = await supabase
      .from("festivals")
      .insert(row)
      .select("slug")
      .single();

    if (!error) {
      inserted++;
      newSlugs.push(slug);
      existingSlugs.add(slug);
    } else if (error.code === "23505") {
      // duplicate slug race — harmless
      skipped++;
    } else {
      skipped++;
    }
  }

  return { found: discovered.length, inserted, skipped, newSlugs };
}
