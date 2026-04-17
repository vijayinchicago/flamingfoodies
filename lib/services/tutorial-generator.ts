/**
 * Tutorial generator agent.
 * Weekly: searches for trending spicy food how-to topics, generates
 * full tutorial content with Claude, saves as draft for review.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export type TutorialGeneratorResult = {
  found: number; inserted: number; error?: string;
};

function toSlug(title: string): string {
  return title.toLowerCase()
    .replace(/^how to\s+/i, "how-to-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SYSTEM = `You are a content writer for FlamingFoodies.com, a hot sauce and spicy food site.

Based on trending search topics and gaps in existing guides, write a complete how-to tutorial.

Return a SINGLE JSON object (not an array) with EXACTLY these fields:
{
  "title": string,               // starts with "How to..."
  "category": string,            // making-sauce|fermentation|growing|cooking-technique|pairing|heat-culture
  "difficulty": string,          // beginner|intermediate|advanced
  "time_estimate": string,       // e.g. "45 minutes" or "2 hours + overnight rest"
  "description": string,         // 1-2 sentences
  "intro": string,               // 2-3 paragraph intro
  "steps": [{ "heading": string, "body": string }],  // 4-6 steps
  "pro_tips": string[],          // 3-5 tips
  "recipe_tag_match": string[]   // cuisine tags for recipe cross-linking
}

Return ONLY valid JSON. No markdown.`;

export async function runTutorialGenerator(): Promise<TutorialGeneratorResult> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { found: 0, inserted: 0, error: "No DB" };

  const { data: existing } = await supabase.from("tutorials").select("title");
  const existingTitles = (existing ?? []).map((r: { title: string }) => r.title);

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
        content: `Search for trending "how to" searches related to hot sauce, spicy food, pepper growing, fermentation, and chili cooking. These guides already exist, don't duplicate them: ${existingTitles.join(", ")}. Pick the single highest-value topic not yet covered and write a complete tutorial for it. Return a single JSON object.`
      }]
    });
    for (const block of response.content) {
      if (block.type === "text") rawJson += block.text;
    }
  } catch (err) {
    return { found: 0, inserted: 0, error: String(err) };
  }

  let tutorial: Record<string, unknown> | null = null;
  try {
    const cleaned = rawJson.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    tutorial = typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return { found: 0, inserted: 0, error: `Parse failed: ${rawJson.slice(0, 200)}` };
  }

  if (!tutorial?.title) return { found: 1, inserted: 0 };

  const slug = toSlug(String(tutorial.title));
  const row = {
    slug, title: tutorial.title,
    category: tutorial.category ?? "cooking-technique",
    difficulty: tutorial.difficulty ?? "beginner",
    time_estimate: tutorial.time_estimate ?? "",
    description: tutorial.description ?? "",
    intro: tutorial.intro ?? "",
    steps: tutorial.steps ?? [],
    pro_tips: tutorial.pro_tips ?? [],
    affiliate_keys: [], recipe_tag_match: tutorial.recipe_tag_match ?? [],
    featured: false, source: "ai_generated", status: "draft"
  };

  const { error } = await supabase.from("tutorials").insert(row);
  if (error) return { found: 1, inserted: 0, error: error.message };
  return { found: 1, inserted: 1 };
}
