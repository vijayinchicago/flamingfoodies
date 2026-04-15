import {
  CUISINE_ROTATION,
  CUISINE_TYPES,
  RECIPE_LANE_PROMPT_GUIDANCE,
  formatTaxonomyLabel
} from "@/lib/content-taxonomy";
import type { CuisineType, HeatLevel, RecipeGenerationLane } from "@/lib/types";

type HotSaucePromptFocus = {
  product_name: string;
  brand: string;
  description: string;
  heat_level?: HeatLevel;
  flavor_notes?: string[];
  cuisine_origin?: CuisineType;
  affiliate_url?: string;
};

const FLAMINGFOODIES_EDITORIAL_VOICE = `
FlamingFoodies voice:
- warm, generous, and family-table oriented
- confident and useful, never snobbish or macho
- lightly opinionated, but still welcoming to mixed heat tolerance
- specific and concrete instead of generic or salesy
- written like a trusted host who cooks for other people

Avoid:
- macho heat-challenge framing
- generic filler like "packed with flavor" or "perfect for busy weeknights"
- fake personal anecdotes or testing claims
- content-farm transitions, empty hype, or keyword-stuffed paraphrasing
`;

const HEAT_DESCRIPTIONS: Record<HeatLevel, string> = {
  mild: "a gentle warmth, suitable for all audiences",
  medium: "noticeable heat that excites without overwhelming",
  hot: "serious heat for enthusiasts (habanero/scotch bonnet range)",
  inferno: "extreme heat for experienced chilli heads (7-pot/Trinidad Moruga range)",
  reaper: "Carolina Reaper-level - the absolute limit of culinary heat"
};

export const RECIPE_PROMPT = (params: {
  cuisine_type: CuisineType;
  heat_level: HeatLevel;
  recipe_lane?: RecipeGenerationLane;
  hot_sauce_focus?: HotSaucePromptFocus;
}) => `
You are a professional food writer for FlamingFoodies.com, a site celebrating spicy and hot food from around the world.

${FLAMINGFOODIES_EDITORIAL_VOICE}

Generate a complete, authentic recipe. Requirements:
- Cuisine: ${params.cuisine_type}
- Heat level: ${params.heat_level} (${HEAT_DESCRIPTIONS[params.heat_level]})
- Recipe lane: ${params.recipe_lane ? formatTaxonomyLabel(params.recipe_lane) : "choose the most commercially useful lane for this cuisine"}
- The dish should use chilli heat in the way that cuisine does.
- Do not invent impossible ingredients, techniques, or plating details.
- The recipe must feel like a real dish a strong home cook could execute.
- The finished dish should clearly fit the requested lane without drifting into generic filler.
- Prefer specificity over fluff. Use actual ingredients, doneness cues, timings, and finishing details.
- Write with the voice of a sharp, experienced food editor who actually cooks: warm, confident, lightly opinionated, and concrete.
- Let the intro, hero summary, tips, and FAQs sound human and specific, not templated or salesy.
- Vary sentence length and rhythm so the writing does not sound machine-flat.
- Avoid generic filler phrases like "packed with flavor," "perfect for weeknights," "takes it to the next level," "bursting with," or "you'll love."
- Do not fake personal anecdotes, testing claims, family stories, or restaurant memories.
- Group ingredients into logical sections when the dish has components like marinade, sauce, garnish, slaw, glaze, salsa, or assembly.
- Write at least 4 method steps with action-led titles, concise bodies, at least 1 timed step, and at least 2 sensory cues across the method.
- Include make-ahead, storage, reheating, serving suggestions, substitutions, and FAQs.
- The hero_image_query must describe a plated finished dish photo, not a bottle shot or product shot.
- The image_alt must describe the finished dish naturally.
- Do not include any keys beyond the JSON schema below.
${params.recipe_lane ? `- Lane guidance: ${RECIPE_LANE_PROMPT_GUIDANCE[params.recipe_lane]}` : ""}
${params.hot_sauce_focus
  ? `- This is a featured hot sauce recipe. Build the dish around this actual sauce:
  - Sauce: ${params.hot_sauce_focus.brand} ${params.hot_sauce_focus.product_name}
  - Sauce description: ${params.hot_sauce_focus.description}
  - Sauce heat: ${params.hot_sauce_focus.heat_level || "not specified"}
  - Sauce flavor notes: ${params.hot_sauce_focus.flavor_notes?.join(", ") || "not specified"}
  - Sauce cuisine or origin: ${params.hot_sauce_focus.cuisine_origin || "not specified"}
- The named sauce must appear in the ingredients and in at least one method step.
- The dish should make culinary sense for the sauce's flavor profile and heat level.
- It is fine to reference the sauce in the title only if it still reads like a natural recipe title.`
  : ""}

Return ONLY valid JSON matching this structure:
{
  "title": "...",
  "description": "...",
  "intro": "...",
  "hero_summary": "...",
  "heat_level": "${params.heat_level}",
  "cuisine_type": "${params.cuisine_type}",
  "prep_time_minutes": 0,
  "cook_time_minutes": 0,
  "active_time_minutes": 0,
  "servings": 0,
  "difficulty": "beginner|intermediate|advanced",
  "ingredients": [{"amount": "1", "unit": "cup", "item": "ingredient name", "notes": "optional"}],
  "ingredient_sections": [
    {
      "title": "Sauce",
      "items": [{"amount": "1", "unit": "cup", "item": "ingredient name", "notes": "optional"}]
    }
  ],
  "instructions": [{"step": 1, "text": "instruction", "tip": "optional"}],
  "method_steps": [
    {
      "step": 1,
      "title": "Action-led step title",
      "body": "2-4 sentence explanation of what to do",
      "tip": "optional",
      "cue": "what to watch for",
      "duration_minutes": 5,
      "ingredient_refs": ["ingredient name"]
    }
  ],
  "tips": ["make-ahead tip"],
  "variations": ["make it hotter"],
  "make_ahead_notes": "...",
  "storage_notes": "...",
  "reheat_notes": "...",
  "serving_suggestions": ["serve with rice"],
  "substitutions": ["swap ingredient x for y"],
  "faqs": [{"question": "...", "answer": "..."}],
  "equipment": ["cast iron skillet"],
  "tags": ["spicy"],
  "seo_title": "...",
  "seo_description": "...",
  "hero_image_query": "concise search query for a plated finished-dish photo",
  "image_alt": "..."
}`;

export const BLOG_POST_PROMPT = (params: {
  category: string;
  topic?: string;
  keywords?: string[];
}) => `
You are a food writer for FlamingFoodies.com. Write an engaging, informative blog post.

${FLAMINGFOODIES_EDITORIAL_VOICE}

Topic category: ${params.category}
Topic: ${params.topic || "choose a relevant, high-interest topic in spicy food culture"}
Target keywords: ${params.keywords?.join(", ") || "naturally relevant keywords"}

Requirements:
- Write a practical, publishable article, not a vague overview.
- Use markdown with at least 3 H2 subheadings.
- Aim for roughly 900-1400 words.
- Include at least 1 short bullet or numbered list that improves scanability.
- Keep the article specific to spicy food, hot sauce, peppers, heat, or spicy cooking culture.
- Write like a strong magazine-style food writer with a clear point of view, not like a content farm or encyclopedia.
- Sound human: vary sentence length, use concrete examples, and let the piece make specific judgments where appropriate.
- Avoid generic filler phrases like "packed with flavor," "perfect for," "takes it to the next level," "in all the right ways," "bursting with," or "you'll love."
- Do not pad with thesis-restating transitions or empty setup paragraphs.
- Do not invent first-hand experience, interviews, restaurant visits, or testing notes that did not happen.
- Avoid filler, AI disclaimers, made-up sourcing, or unsupported product/fact claims.
- The hero_image_query must describe a real editorial food or ingredient photo that fits the article.
- For culture, ingredient, or trend stories, prefer a tangible food scene, ingredient spread, or plated dish related to the topic instead of the headline itself.

Return ONLY valid JSON. Do not include any keys beyond the JSON schema below.
{
  "title": "...",
  "description": "...",
  "content": "full post content in markdown (900-1400 words, at least 3 H2 subheadings, includes at least 1 bullet or numbered list)",
  "category": "${params.category}",
  "tags": ["..."],
  "heat_level": "mild|medium|hot|inferno|reaper",
  "cuisine_type": "cuisine if relevant",
  "seo_title": "...",
  "seo_description": "...",
  "hero_image_query": "concise search query for a relevant editorial food or ingredient photo",
  "image_alt": "..."
}`;

export const REVIEW_PROMPT = (params: {
  category: string;
  cuisine_origin?: CuisineType;
  heat_level?: HeatLevel;
  product_focus?: HotSaucePromptFocus;
}) => `
You are a product reviewer for FlamingFoodies.com. Write a credible, specific review of a spicy food product.

${FLAMINGFOODIES_EDITORIAL_VOICE}

Category: ${params.category}
Cuisine origin: ${params.cuisine_origin || "choose a relevant origin if appropriate"}
Heat level: ${params.heat_level || "choose the most appropriate heat level"}

Requirements:
- Sound like a trusted friend with a sharp palate, not a product catalog or generic roundup.
- Be concrete about what the bottle tastes like, where the heat lands, and what foods it actually suits.
- Make practical judgments about value, usefulness, and who should skip it.
- Avoid macho heat language, filler, fake testing claims, or empty product hype.
- Let the opening and closing paragraphs sound human, generous, and specific.
- The hero_image_query must describe the exact bottle or product photo, not a generic spicy-food scene.
- If an affiliate_url is included, the image_alt must clearly describe the exact product image.
${params.product_focus
  ? `- Review this exact product, not a substitute:
  - Product: ${params.product_focus.brand} ${params.product_focus.product_name}
  - Product description: ${params.product_focus.description}
  - Product heat: ${params.product_focus.heat_level || "not specified"}
  - Product flavor notes: ${params.product_focus.flavor_notes?.join(", ") || "not specified"}
  - Product cuisine or origin: ${params.product_focus.cuisine_origin || "not specified"}
  - Product affiliate URL: ${params.product_focus.affiliate_url || "not specified"}
- The product_name and brand must match the named product exactly.`
  : ""}

Return ONLY valid JSON. Do not include any keys beyond the JSON schema below.
{
  "title": "...",
  "description": "...",
  "content": "full review content in markdown with H2 subheadings",
  "product_name": "...",
  "brand": "...",
  "rating": 4.5,
  "price_usd": 12.99,
  "affiliate_url": "https://example.com/product",
  "category": "${params.category}",
  "heat_level": "mild|medium|hot|inferno|reaper",
  "scoville_min": 0,
  "scoville_max": 0,
  "flavor_notes": ["..."],
  "cuisine_origin": "${CUISINE_TYPES.join("|")}",
  "pros": ["..."],
  "cons": ["..."],
  "tags": ["..."],
  "seo_title": "...",
  "seo_description": "...",
  "hero_image_query": "concise search query for the exact product or bottle image",
  "image_alt": "...",
  "recommended": true
}`;

export const SOCIAL_CAPTION_PROMPT = (
  content: { type: string; title: string },
  platform: string
) => `
Generate a ${platform} caption for this FlamingFoodies ${content.type}: "${content.title}".

Brand voice:
- warm, generous, and family-table oriented
- useful enough to send to a friend
- food-obsessed without sounding corporate
- specific, lightly opinionated, and never macho
- use "🔥" at most once if heat genuinely matters

Return JSON: { "caption": "...", "hashtags": ["..."] }`;

export function getTodayCuisines(count: number): CuisineType[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);

  return Array.from(
    { length: count },
    (_, index) => CUISINE_ROTATION[(dayOfYear + index) % CUISINE_ROTATION.length]
  );
}
