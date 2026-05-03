import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { env, flags } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const ANTHROPIC_MODEL = env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
const FRIDAY_GROUP_KEY = "weekly-roundup";
const RECIPE_CANDIDATE_LIMIT = 6;
const REVIEW_CANDIDATE_LIMIT = 6;
const MAILERLITE_API_BASE = "https://connect.mailerlite.com/api";

const fridayDigestSchema = z.object({
  subject: z.string().min(8).max(120),
  preview_text: z.string().min(8).max(160),
  recipe_slug: z.string().min(1),
  recipe_title: z.string().min(1),
  recipe_intro: z.string().min(20),
  recipe_pro_tip: z.string().min(10),
  review_slug: z.string().min(1),
  review_title: z.string().min(1),
  review_intro: z.string().min(20),
  one_thing_worth_knowing: z.string().min(40)
});

type FridayDigest = z.infer<typeof fridayDigestSchema>;

type CandidateRecipe = {
  slug: string;
  title: string;
  description: string | null;
  heat_level: string | null;
};

type CandidateReview = {
  slug: string;
  title: string;
  description: string | null;
  product_name: string | null;
  brand: string | null;
  affiliate_url: string | null;
};

export type FridayDigestRunResult = {
  mode: "live" | "mock" | "skipped";
  reason?: string;
  campaignId?: number;
  subject?: string;
  recipientCount?: number;
  mailerLiteCampaignId?: string;
};

function pickAnthropicText(content: Anthropic.ContentBlock[]): string {
  return content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");
}

function tryParseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    // Try to extract a JSON object from the response if Claude wrapped it
    const match = value.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

function buildPrompt(input: {
  recipes: CandidateRecipe[];
  reviews: CandidateReview[];
}) {
  const recipesBlock = input.recipes
    .map(
      (r, i) =>
        `${i + 1}. slug=${r.slug} | title=${r.title} | heat=${r.heat_level ?? "?"} | description=${r.description ?? ""}`
    )
    .join("\n");
  const reviewsBlock = input.reviews
    .map(
      (r, i) =>
        `${i + 1}. slug=${r.slug} | title=${r.title} | brand=${r.brand ?? "?"} | product=${r.product_name ?? "?"} | description=${r.description ?? ""}`
    )
    .join("\n");

  return `You are writing the weekly Friday "Flame Club" newsletter for FlamingFoodies.com.

BRAND VOICE
- Warm, conversational, practical, flavor-first.
- Like a friend texting you a recipe and a hot sauce pick. Not corporate. Not hype.
- Specific, opinionated, useful. Short sentences. Signed by Vijay.
- Never use exclamation points more than once. Avoid em-dashes back to back. No "in a world where" cliches.

EMAIL STRUCTURE (strict — three sections, in this order)
1. ONE RECIPE WORTH COOKING (2-3 sentences on why this one + a one-line "PRO TIP")
2. ONE BOTTLE WORTH OPENING (2-3 sentences: what it's good on, what to skip it for)
3. ONE THING WORTH KNOWING (60-80 word kitchen-spice fact, tip, or myth-buster)

SUBJECT LINE
- Format: "Flame Club Friday — [hook]"
- Examples: "Flame Club Friday — the dinner that almost didn't ship", "Flame Club Friday — the bottle I was wrong about"
- Hook should be specific and curiosity-driven, not a topic label.

PREVIEW TEXT
- ~80 chars max. Builds on the subject. Hints at value, doesn't restate it.

CANDIDATES — pick the strongest of each (your judgment). Prefer specificity, contrast, and recipes/bottles you can write opinionated copy about.

RECIPES:
${recipesBlock}

REVIEWS:
${reviewsBlock}

Output only a single JSON object with these exact keys (no markdown fences, no commentary):
{
  "subject": "Flame Club Friday — ...",
  "preview_text": "...",
  "recipe_slug": "<slug from candidates>",
  "recipe_title": "<title from candidates>",
  "recipe_intro": "2-3 sentences",
  "recipe_pro_tip": "One specific, useful tip",
  "review_slug": "<slug from candidates>",
  "review_title": "<title from candidates>",
  "review_intro": "2-3 sentences",
  "one_thing_worth_knowing": "60-80 words"
}`;
}

async function generateFridayDigestContent(input: {
  recipes: CandidateRecipe[];
  reviews: CandidateReview[];
}): Promise<FridayDigest | null> {
  if (!flags.hasAnthropic) return null;

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1500,
    messages: [
      { role: "user", content: buildPrompt(input) },
      { role: "assistant", content: "{" }
    ]
  });

  const raw = "{" + pickAnthropicText(response.content);
  const parsed = tryParseJson<Record<string, unknown>>(raw);
  if (!parsed) return null;

  const validated = fridayDigestSchema.safeParse(parsed);
  return validated.success ? validated.data : null;
}

function renderEmailHtml(input: {
  digest: FridayDigest;
  recipeUrl: string;
  reviewUrl: string;
  affiliateUrl: string | null;
}) {
  const { digest, recipeUrl, reviewUrl, affiliateUrl } = input;
  const buyLine = affiliateUrl
    ? `<p style="margin:0.5em 0;"><a href="${affiliateUrl}">Buy the bottle</a></p>`
    : "";
  return `<div style="max-width:560px;font-family:Georgia,serif;line-height:1.55;color:#1f1410;">
<p>Hey {$name|default:"friend"},</p>
<p>Welcome to your Flame Club Friday. The format is always the same: one recipe, one bottle, one thing worth knowing. Three minutes, three picks, then we're out of your inbox.</p>
<hr style="border:none;border-top:1px solid #e7d4c5;margin:1.5em 0;" />
<h2 style="font-family:Georgia,serif;font-size:1.05em;letter-spacing:0.18em;text-transform:uppercase;color:#c0411f;margin:0 0 0.6em;">One recipe worth cooking</h2>
<p style="font-size:1.25em;font-weight:bold;margin:0 0 0.4em;">${digest.recipe_title}</p>
<p>${digest.recipe_intro}</p>
<p style="margin:0.5em 0;"><a href="${recipeUrl}">Get the recipe →</a></p>
<p style="font-size:0.95em;color:#5a4a3f;"><strong>Pro tip:</strong> ${digest.recipe_pro_tip}</p>
<hr style="border:none;border-top:1px solid #e7d4c5;margin:1.5em 0;" />
<h2 style="font-family:Georgia,serif;font-size:1.05em;letter-spacing:0.18em;text-transform:uppercase;color:#c0411f;margin:0 0 0.6em;">One bottle worth opening</h2>
<p style="font-size:1.25em;font-weight:bold;margin:0 0 0.4em;">${digest.review_title}</p>
<p>${digest.review_intro}</p>
<p style="margin:0.5em 0;"><a href="${reviewUrl}">Read the full review →</a></p>
${buyLine}
<hr style="border:none;border-top:1px solid #e7d4c5;margin:1.5em 0;" />
<h2 style="font-family:Georgia,serif;font-size:1.05em;letter-spacing:0.18em;text-transform:uppercase;color:#c0411f;margin:0 0 0.6em;">One thing worth knowing</h2>
<p>${digest.one_thing_worth_knowing}</p>
<hr style="border:none;border-top:1px solid #e7d4c5;margin:1.5em 0;" />
<p>That's the whole thing. See you next Friday.</p>
<p>— Vijay</p>
<p style="font-size:0.9em;color:#5a4a3f;margin-top:2em;">P.S. — One ask: if you know one person who'd love Flame Club, send them this:<br /><a href="https://flamingfoodies.com/flame-club?ref={$referral_token}">https://flamingfoodies.com/flame-club?ref={$referral_token}</a><br />After 3 friends sign up, I send you our printable Pepper Dossier — 40 pages, free, no catch.</p>
</div>`;
}

function renderEmailText(input: {
  digest: FridayDigest;
  recipeUrl: string;
  reviewUrl: string;
  affiliateUrl: string | null;
}) {
  const { digest, recipeUrl, reviewUrl, affiliateUrl } = input;
  return [
    `Hey {$name|default:"friend"},`,
    "",
    "Welcome to your Flame Club Friday. The format is always the same: one recipe, one bottle, one thing worth knowing. Three minutes, three picks, then we're out of your inbox.",
    "",
    "═══════════════════════════════════════════",
    "🌶️ ONE RECIPE WORTH COOKING",
    "═══════════════════════════════════════════",
    "",
    digest.recipe_title,
    "",
    digest.recipe_intro,
    "",
    `→ Get the recipe: ${recipeUrl}`,
    "",
    `PRO TIP: ${digest.recipe_pro_tip}`,
    "",
    "═══════════════════════════════════════════",
    "🔥 ONE BOTTLE WORTH OPENING",
    "═══════════════════════════════════════════",
    "",
    digest.review_title,
    "",
    digest.review_intro,
    "",
    `→ Read the full review: ${reviewUrl}`,
    affiliateUrl ? `→ Buy the bottle: ${affiliateUrl}` : "",
    "",
    "═══════════════════════════════════════════",
    "💡 ONE THING WORTH KNOWING",
    "═══════════════════════════════════════════",
    "",
    digest.one_thing_worth_knowing,
    "",
    "═══════════════════════════════════════════",
    "",
    "That's the whole thing. See you next Friday.",
    "",
    "— Vijay",
    "",
    "P.S. — One ask: if you know one person who'd love Flame Club, send them this:",
    "https://flamingfoodies.com/flame-club?ref={$referral_token}",
    "After 3 friends sign up, I send you our printable Pepper Dossier — 40 pages, free, no catch."
  ]
    .filter(Boolean)
    .join("\n");
}

let cachedMailerLiteGroupMap: Record<string, string> | null = null;
function getMailerLiteGroupMap(): Record<string, string> {
  if (cachedMailerLiteGroupMap) return cachedMailerLiteGroupMap;
  const raw = env.MAILERLITE_GROUPS?.trim();
  if (!raw) {
    cachedMailerLiteGroupMap = {};
    return cachedMailerLiteGroupMap;
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      cachedMailerLiteGroupMap = Object.fromEntries(
        Object.entries(parsed)
          .filter(([, value]) => typeof value === "string" && value.length > 0)
          .map(([key, value]) => [key, value as string])
      );
      return cachedMailerLiteGroupMap;
    }
  } catch {
    // fall through
  }
  cachedMailerLiteGroupMap = {};
  return cachedMailerLiteGroupMap;
}

async function sendMailerLiteCampaign(input: {
  subject: string;
  previewText: string;
  htmlContent: string;
  textContent: string;
  groupId: string;
  fromName: string;
  fromEmail: string;
}): Promise<{ campaignId: string }> {
  const createResp = await fetch(`${MAILERLITE_API_BASE}/campaigns`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${env.MAILERLITE_API_KEY}`
    },
    body: JSON.stringify({
      name: input.subject,
      type: "regular",
      emails: [
        {
          subject: input.subject,
          from_name: input.fromName,
          from: input.fromEmail,
          content: input.htmlContent,
          plain_text: input.textContent,
          preheader: input.previewText
        }
      ],
      groups: [input.groupId]
    })
  });

  if (!createResp.ok) {
    const detail = await createResp.text().catch(() => "");
    throw new Error(`MailerLite campaign create failed (${createResp.status}): ${detail}`);
  }

  const createdRaw = (await createResp.json().catch(() => ({}))) as Record<string, unknown>;
  const created = (createdRaw?.data as Record<string, unknown> | undefined) ?? createdRaw;
  const campaignId = String(created?.id ?? "");
  if (!campaignId) {
    throw new Error("MailerLite campaign create returned no campaign id.");
  }

  const scheduleResp = await fetch(
    `${MAILERLITE_API_BASE}/campaigns/${campaignId}/schedule`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${env.MAILERLITE_API_KEY}`
      },
      body: JSON.stringify({ delivery: "instant" })
    }
  );

  if (!scheduleResp.ok) {
    const detail = await scheduleResp.text().catch(() => "");
    throw new Error(
      `MailerLite campaign schedule failed (${scheduleResp.status}): ${detail}`
    );
  }

  return { campaignId };
}

export async function runAutonomousFridayDigest(input?: {
  fromName?: string;
  fromEmail?: string;
}): Promise<FridayDigestRunResult> {
  if (!flags.hasSupabaseAdmin) {
    return { mode: "skipped", reason: "Supabase admin not configured." };
  }
  if (!flags.hasAnthropic) {
    return { mode: "skipped", reason: "Anthropic API key not configured." };
  }
  if (!flags.hasMailerLite) {
    return { mode: "skipped", reason: "MailerLite API key not configured." };
  }

  const groupMap = getMailerLiteGroupMap();
  const groupId = groupMap[FRIDAY_GROUP_KEY];
  if (!groupId) {
    return {
      mode: "skipped",
      reason: `MAILERLITE_GROUPS missing key '${FRIDAY_GROUP_KEY}'.`
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { mode: "skipped", reason: "Supabase client unavailable." };
  }

  const [recipesResp, reviewsResp, subscriberCountResp] = await Promise.all([
    supabase
      .from("recipes")
      .select("slug, title, description, heat_level")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(RECIPE_CANDIDATE_LIMIT),
    supabase
      .from("reviews")
      .select("slug, title, description, product_name, brand, affiliate_url")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(REVIEW_CANDIDATE_LIMIT),
    supabase
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
  ]);

  const recipes = (recipesResp.data ?? []) as CandidateRecipe[];
  const reviews = (reviewsResp.data ?? []) as CandidateReview[];

  if (recipes.length === 0 || reviews.length === 0) {
    return {
      mode: "skipped",
      reason: "Not enough published content to assemble a digest."
    };
  }

  const digest = await generateFridayDigestContent({ recipes, reviews });
  if (!digest) {
    return { mode: "skipped", reason: "Claude returned no usable digest content." };
  }

  const recipe = recipes.find((r) => r.slug === digest.recipe_slug) ?? recipes[0];
  const review = reviews.find((r) => r.slug === digest.review_slug) ?? reviews[0];
  const recipeUrl = `https://flamingfoodies.com/recipes/${recipe.slug}`;
  const reviewUrl = `https://flamingfoodies.com/reviews/${review.slug}`;
  const affiliateUrl = review.affiliate_url ?? null;

  const htmlContent = renderEmailHtml({ digest, recipeUrl, reviewUrl, affiliateUrl });
  const textContent = renderEmailText({ digest, recipeUrl, reviewUrl, affiliateUrl });

  const fromName = input?.fromName ?? "Vijay at FlamingFoodies";
  const fromEmail = input?.fromEmail ?? "vijay@flamingfoodies.com";

  const sentAt = new Date().toISOString();
  const recipientCount = subscriberCountResp.count ?? 0;

  const { data: campaignRow, error: insertError } = await supabase
    .from("newsletter_campaigns")
    .insert({
      subject: digest.subject,
      preview_text: digest.preview_text,
      html_content: htmlContent,
      text_content: textContent,
      status: "sent",
      send_at: sentAt,
      sent_at: sentAt,
      recipient_count: recipientCount,
      audience_tags: [FRIDAY_GROUP_KEY],
      provider: "mailerlite"
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(`Failed to record campaign: ${insertError.message}`);
  }

  const { campaignId: mailerLiteCampaignId } = await sendMailerLiteCampaign({
    subject: digest.subject,
    previewText: digest.preview_text,
    htmlContent,
    textContent,
    groupId,
    fromName,
    fromEmail
  });

  await supabase
    .from("newsletter_campaigns")
    .update({ provider_broadcast_id: mailerLiteCampaignId })
    .eq("id", campaignRow.id);

  return {
    mode: "live",
    campaignId: campaignRow.id as number,
    subject: digest.subject,
    recipientCount,
    mailerLiteCampaignId
  };
}
