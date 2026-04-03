import Anthropic from "@anthropic-ai/sdk";

import { env, flags } from "@/lib/env";
import {
  BLOG_POST_PROMPT,
  CUISINE_ROTATION,
  getTodayCuisines,
  RECIPE_PROMPT,
  REVIEW_PROMPT
} from "@/lib/generation/prompts";
import {
  sampleBlogPosts,
  sampleGenerationJobs,
  sampleRecipes,
  sampleReviews
} from "@/lib/sample-data";
import {
  createSocialPostsForContent,
  publishDueScheduledSocialPosts
} from "@/lib/services/social";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { CuisineType, HeatLevel } from "@/lib/types";
import { calculateReadTime, slugify } from "@/lib/utils";

type GenerationType = "recipe" | "blog_post" | "review";
type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

function stripCodeFence(value: string) {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function parseJsonResponse<T>(value: string): T | null {
  try {
    return JSON.parse(stripCodeFence(value)) as T;
  } catch {
    return null;
  }
}

function getHeatLevel(index: number): HeatLevel {
  const heatLevels: HeatLevel[] = ["mild", "medium", "hot", "inferno", "reaper"];
  return heatLevels[index % heatLevels.length];
}

function buildPrompt(type: GenerationType, cuisine: CuisineType, index: number) {
  if (type === "recipe") {
    return RECIPE_PROMPT({
      cuisine_type: cuisine,
      heat_level: getHeatLevel(index)
    });
  }

  if (type === "blog_post") {
    return BLOG_POST_PROMPT({
      category: ["culture", "science", "guides", "gear"][index % 4],
      topic: `The most craveable spicy ${cuisine.replace(/_/g, " ")} dish styles right now`
    });
  }

  return REVIEW_PROMPT({
    category: "hot-sauce",
    cuisine_origin: cuisine,
    heat_level: getHeatLevel(index)
  });
}

async function fetchImageForQuery(query: string) {
  if (env.UNSPLASH_ACCESS_KEY) {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`
          }
        }
      );

      if (response.ok) {
        const json = await response.json();
        const imageUrl = json.results?.[0]?.urls?.regular;
        if (imageUrl) return imageUrl;
      }
    } catch {
      // Fall through to Pexels and then undefined.
    }
  }

  if (env.PEXELS_API_KEY) {
    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
        {
          headers: {
            Authorization: env.PEXELS_API_KEY
          }
        }
      );

      if (response.ok) {
        const json = await response.json();
        const imageUrl = json.photos?.[0]?.src?.large2x;
        if (imageUrl) return imageUrl;
      }
    } catch {
      return undefined;
    }
  }

  return undefined;
}

async function makeUniqueSlug(
  supabase: AdminClient,
  table: "blog_posts" | "recipes" | "reviews",
  title: string
) {
  const base = slugify(title);
  let candidate = base;
  let suffix = 1;

  while (true) {
    const { data } = await supabase
      .from(table)
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function buildRecipeDraft(
  cuisine: CuisineType,
  index: number,
  generated?: Record<string, any>,
  imageUrl?: string,
  publishAt?: string | null
) {
  const fallbackTitle = `${cuisine.replace(/_/g, " ")} fire recipe ${index + 1}`;
  const title = generated?.title || fallbackTitle;
  const description =
    generated?.description ||
    `A bold ${cuisine.replace(/_/g, " ")} recipe built for people who want real heat and actual flavor.`;
  const intro =
    generated?.intro ||
    `This draft leans into ${cuisine.replace(/_/g, " ")} heat traditions while keeping the recipe practical for home cooks.`;

  return {
    title,
    description,
    intro,
    author_name: "FlamingFoodies AI Test Kitchen",
    heat_level: generated?.heat_level || getHeatLevel(index),
    cuisine_type: generated?.cuisine_type || cuisine,
    prep_time_minutes: Number(generated?.prep_time_minutes ?? 20),
    cook_time_minutes: Number(generated?.cook_time_minutes ?? 25),
    servings: Number(generated?.servings ?? 4),
    difficulty: generated?.difficulty || "intermediate",
    ingredients:
      generated?.ingredients ?? [
        { amount: "2", unit: "tbsp", item: "chili paste", notes: "adjust to taste" },
        { amount: "1", unit: "lb", item: "main ingredient" }
      ],
    instructions:
      generated?.instructions ?? [
        { step: 1, text: "Build the aromatic base and season aggressively." },
        { step: 2, text: "Cook until the sauce turns glossy and the heat blooms." },
        { step: 3, text: "Serve hot and finish with a bright counterpoint." }
      ],
    tips: generated?.tips ?? ["Taste for balance before adding more heat."],
    variations: generated?.variations ?? ["Add a fermented pepper element for more depth."],
    equipment: generated?.equipment ?? ["large skillet", "mixing bowl"],
    tags: generated?.tags ?? [cuisine, "ai-generated", "spicy"],
    image_url: imageUrl ?? null,
    image_alt: generated?.image_alt || `${title} plated for FlamingFoodies`,
    featured: false,
    status: "draft",
    source: "ai_generated",
    seo_title: generated?.seo_title || `${title} Recipe | FlamingFoodies`,
    seo_description: generated?.seo_description || description.slice(0, 160),
    affiliate_disclosure: true,
    published_at: publishAt ?? null
  };
}

function buildBlogDraft(
  cuisine: CuisineType,
  index: number,
  generated?: Record<string, any>,
  imageUrl?: string,
  publishAt?: string | null
) {
  const title =
    generated?.title ||
    `What ${cuisine.replace(/_/g, " ")} cooking teaches us about layered heat`;
  const description =
    generated?.description ||
    `A culture-first look at how ${cuisine.replace(/_/g, " ")} dishes build spicy depth without flattening flavor.`;
  const content =
    generated?.content ||
    `## The draw\n\n${title} is not about brute force. It is about pacing, contrast, and dishes that stay craveable.\n\n## Why it works\n\nThe best spicy food balances heat with acid, texture, and aroma.\n\n## What to cook next\n\nUse this post as a draft starting point for a stronger editorial take.\n`;

  return {
    title,
    description,
    content,
    author_name: "FlamingFoodies AI Desk",
    category: generated?.category || ["culture", "science", "guides", "gear"][index % 4],
    tags: generated?.tags ?? [cuisine, "spicy-food", "ai-generated"],
    image_url: imageUrl ?? null,
    image_alt: generated?.image_alt || `${title} feature image`,
    heat_level: generated?.heat_level || getHeatLevel(index),
    cuisine_type: generated?.cuisine_type || cuisine,
    scoville_rating: 7 + (index % 3),
    featured: false,
    affiliate_disclosure: true,
    status: "draft",
    source: "ai_generated",
    seo_title: generated?.seo_title || `${title} | FlamingFoodies`,
    seo_description: generated?.seo_description || description.slice(0, 160),
    read_time_minutes: calculateReadTime(content),
    published_at: publishAt ?? null
  };
}

function buildReviewDraft(
  cuisine: CuisineType,
  index: number,
  generated?: Record<string, any>,
  imageUrl?: string,
  publishAt?: string | null
) {
  const productName =
    generated?.product_name || `${cuisine.replace(/_/g, " ")} pepper sauce reserve`;
  const title = generated?.title || `${productName} review`;
  const description =
    generated?.description ||
    `A tasting-focused review of ${productName}, including heat curve, flavor notes, and who it actually suits.`;
  const content =
    generated?.content ||
    `## First taste\n\n${productName} opens with personality and finishes with enough heat to matter.\n\n## Where it lands\n\nThis draft is ready for a human editor to sharpen with real-world testing notes.\n`;

  return {
    title,
    description,
    content,
    product_name: productName,
    brand: generated?.brand || "FlamingFoodies Test Kitchen",
    rating: Number(generated?.rating ?? 4.2),
    price_usd: Number(generated?.price_usd ?? 12.99),
    affiliate_url:
      generated?.affiliate_url || "https://fuegobox.com/products/monthly-subscription",
    image_url: imageUrl ?? null,
    image_alt: generated?.image_alt || `${productName} bottle`,
    heat_level: generated?.heat_level || getHeatLevel(index),
    scoville_min: Number(generated?.scoville_min ?? 1500),
    scoville_max: Number(generated?.scoville_max ?? 4500),
    flavor_notes: generated?.flavor_notes ?? ["bright", "smoky", "fruity"],
    cuisine_origin: generated?.cuisine_origin || cuisine,
    category: generated?.category || "hot-sauce",
    pros: generated?.pros ?? ["Balanced heat", "Useful on multiple foods"],
    cons: generated?.cons ?? ["Needs hands-on tasting before publish"],
    tags: generated?.tags ?? [cuisine, "review", "ai-generated"],
    recommended: Boolean(generated?.recommended ?? true),
    featured: false,
    status: "draft",
    source: "ai_generated",
    seo_title: generated?.seo_title || `${title} | FlamingFoodies`,
    seo_description: generated?.seo_description || description.slice(0, 160),
    published_at: publishAt ?? null
  };
}

async function generateStructuredDraft(
  anthropic: Anthropic | null,
  type: GenerationType,
  cuisine: CuisineType,
  index: number
) {
  if (!anthropic) {
    return {
      payload: null as Record<string, any> | null,
      output: "",
      tokensUsed: 0
    };
  }

  const response = await anthropic.messages.create({
    model: "claude-3-7-sonnet-latest",
    max_tokens: 1800,
    messages: [
      {
        role: "user",
        content: buildPrompt(type, cuisine, index)
      }
    ]
  });

  const output = response.content
    .map((item) => (item.type === "text" ? item.text : ""))
    .join("\n")
    .trim();

  return {
    payload: parseJsonResponse<Record<string, any>>(output),
    output,
    tokensUsed:
      Number(response.usage?.input_tokens ?? 0) + Number(response.usage?.output_tokens ?? 0)
  };
}

async function getSettingMap(supabase: AdminClient) {
  const { data } = await supabase.from("site_settings").select("key, value");
  return new Map((data ?? []).map((row) => [row.key, row.value]));
}

async function insertGeneratedContent(
  supabase: AdminClient,
  type: GenerationType,
  index: number,
  settings: Map<string, any>,
  generated: Record<string, any> | null,
  cuisine: CuisineType
) {
  const autoPublish = Boolean(settings.get("auto_publish_ai_content") ?? false);
  const delayHours = Number(settings.get("auto_publish_delay_hours") ?? 4);
  const publishAt = autoPublish
    ? new Date(Date.now() + delayHours * 60 * 60 * 1000).toISOString()
    : null;

  const imageQuery =
    generated?.image_search_query ||
    `${cuisine.replace(/_/g, " ")} spicy food`;
  const imageUrl = await fetchImageForQuery(imageQuery);

  if (type === "recipe") {
    const payload = buildRecipeDraft(
      cuisine,
      index,
      generated ?? undefined,
      imageUrl,
      publishAt
    );
    const slug = await makeUniqueSlug(supabase, "recipes", payload.title);
    const { data, error } = await supabase
      .from("recipes")
      .insert({ ...payload, slug })
      .select("id, slug, title, image_url")
      .single();

    if (error) throw new Error(error.message);

    await createSocialPostsForContent({
      contentType: "recipe",
      contentId: data.id,
      title: data.title,
      slug: data.slug,
      imageUrl: data.image_url ?? undefined,
      scheduledAt: publishAt
    });

    return {
      resultId: data.id,
      resultType: "recipe",
      slug: data.slug,
      title: data.title,
      publishAt
    };
  }

  if (type === "blog_post") {
    const payload = buildBlogDraft(
      cuisine,
      index,
      generated ?? undefined,
      imageUrl,
      publishAt
    );
    const slug = await makeUniqueSlug(supabase, "blog_posts", payload.title);
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({ ...payload, slug })
      .select("id, slug, title, image_url")
      .single();

    if (error) throw new Error(error.message);

    await createSocialPostsForContent({
      contentType: "blog_post",
      contentId: data.id,
      title: data.title,
      slug: data.slug,
      imageUrl: data.image_url ?? undefined,
      scheduledAt: publishAt
    });

    return {
      resultId: data.id,
      resultType: "blog_post",
      slug: data.slug,
      title: data.title,
      publishAt
    };
  }

  const payload = buildReviewDraft(
    cuisine,
    index,
    generated ?? undefined,
    imageUrl,
    publishAt
  );
  const slug = await makeUniqueSlug(supabase, "reviews", payload.title);
  const { data, error } = await supabase
    .from("reviews")
    .insert({ ...payload, slug })
    .select("id, slug, title, image_url")
    .single();

  if (error) throw new Error(error.message);

  await createSocialPostsForContent({
    contentType: "review",
    contentId: data.id,
    title: data.title,
    slug: data.slug,
    imageUrl: data.image_url ?? undefined,
    scheduledAt: publishAt
  });

  return {
    resultId: data.id,
    resultType: "review",
    slug: data.slug,
    title: data.title,
    publishAt
  };
}

export async function runGenerationPipeline(type: string, qty: number) {
  const generationType = (type === "recipe" || type === "blog_post" || type === "review"
    ? type
    : "recipe") as GenerationType;
  const safeQty = Math.min(Math.max(qty, 1), 20);
  const scheduledCuisines = getTodayCuisines(safeQty);

  if (!flags.hasSupabaseAdmin) {
    return {
      mode: "mock",
      createdJobs: Array.from({ length: safeQty }, (_, index) => ({
        id: sampleGenerationJobs.length + index + 1,
        type: generationType,
        slug: slugify(
          `${generationType}-${scheduledCuisines[index] || "flamingfoodies"}-${Date.now()}-${index}`
        ),
        scheduledCuisine: scheduledCuisines[index] || null
      }))
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      mode: "mock",
      createdJobs: Array.from({ length: safeQty }, (_, index) => ({
        id: sampleGenerationJobs.length + index + 1,
        type: generationType,
        slug: slugify(
          `${generationType}-${scheduledCuisines[index] || "flamingfoodies"}-${Date.now()}-${index}`
        ),
        scheduledCuisine: scheduledCuisines[index] || null
      }))
    };
  }

  const settings = await getSettingMap(supabase);
  const anthropic = flags.hasAnthropic
    ? new Anthropic({
        apiKey: env.ANTHROPIC_API_KEY
      })
    : null;

  const createdJobs: Array<Record<string, unknown>> = [];

  for (let index = 0; index < safeQty; index += 1) {
    const cuisine = scheduledCuisines[index] ?? CUISINE_ROTATION[index % CUISINE_ROTATION.length];
    const { data: job, error: jobError } = await supabase
      .from("content_generation_jobs")
      .insert({
        job_type: generationType,
        prompt_template:
          generationType === "recipe"
            ? "RECIPE_PROMPT"
            : generationType === "blog_post"
              ? "BLOG_POST_PROMPT"
              : "REVIEW_PROMPT",
        parameters: {
          cuisine_type: cuisine,
          heat_level: getHeatLevel(index)
        },
        status: "queued"
      })
      .select("id, attempts")
      .single();

    if (jobError) {
      throw new Error(jobError.message);
    }

    try {
      await supabase
        .from("content_generation_jobs")
        .update({
          status: "generating",
          started_at: new Date().toISOString(),
          attempts: (job.attempts ?? 0) + 1
        })
        .eq("id", job.id);

      const generated = await generateStructuredDraft(
        anthropic,
        generationType,
        cuisine,
        index
      );

      const inserted = await insertGeneratedContent(
        supabase,
        generationType,
        index,
        settings,
        generated.payload,
        cuisine
      );

      await supabase
        .from("content_generation_jobs")
        .update({
          status: "completed",
          result_id: inserted.resultId,
          result_type: inserted.resultType,
          tokens_used: generated.tokensUsed,
          completed_at: new Date().toISOString()
        })
        .eq("id", job.id);

      createdJobs.push({
        id: job.id,
        type: generationType,
        slug: inserted.slug,
        title: inserted.title,
        scheduledCuisine: cuisine,
        publishAt: inserted.publishAt
      });
    } catch (error) {
      await supabase
        .from("content_generation_jobs")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Generation failed",
          completed_at: new Date().toISOString()
        })
        .eq("id", job.id);

      createdJobs.push({
        id: job.id,
        type: generationType,
        scheduledCuisine: cuisine,
        error: error instanceof Error ? error.message : "Generation failed"
      });
    }
  }

  return {
    mode: anthropic ? "live" : "mock",
    createdJobs
  };
}

async function publishFromTable(
  supabase: AdminClient,
  table: "blog_posts" | "recipes" | "reviews"
) {
  const { data: rows } = await supabase
    .from(table)
    .select("id, slug, title, published_at, status, source")
    .eq("source", "ai_generated")
    .neq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString());

  const published: Array<{ id: number; slug: string; title: string; type: string }> = [];

  for (const row of rows ?? []) {
    const { data, error } = await supabase
      .from(table)
      .update({
        status: "published"
      })
      .eq("id", row.id)
      .select("id, slug, title")
      .single();

    if (!error && data) {
      published.push({
        id: data.id,
        slug: data.slug,
        title: data.title,
        type: table === "blog_posts" ? "blog_post" : table === "recipes" ? "recipe" : "review"
      });
    }
  }

  return published;
}

export async function publishScheduledContent() {
  if (!flags.hasSupabaseAdmin) {
    return {
      published: sampleRecipes.filter((recipe) => recipe.status === "published").slice(0, 2)
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      published: sampleRecipes.filter((recipe) => recipe.status === "published").slice(0, 2)
    };
  }

  const [blogPosts, recipes, reviews] = await Promise.all([
    publishFromTable(supabase, "blog_posts"),
    publishFromTable(supabase, "recipes"),
    publishFromTable(supabase, "reviews")
  ]);

  return {
    published: [...blogPosts, ...recipes, ...reviews]
  };
}

export async function queueSocialScheduler() {
  if (!flags.hasSupabaseAdmin) {
    return {
      queued: 2,
      published: 0,
      platforms: ["instagram", "pinterest", "facebook"]
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      queued: 2,
      published: 0,
      platforms: ["instagram", "pinterest", "facebook"]
    };
  }

  const { data: pendingPosts } = await supabase
    .from("social_posts")
    .select("id, platform")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(12);

  let queued = 0;

  for (const [index, post] of (pendingPosts ?? []).entries()) {
    const scheduledAt = new Date(Date.now() + (index + 1) * 45 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("social_posts")
      .update({
        status: "scheduled",
        scheduled_at: scheduledAt
      })
      .eq("id", post.id);

    if (!error) {
      queued += 1;
    }
  }

  const publishedNow = await publishDueScheduledSocialPosts();

  return {
    queued,
    published: publishedNow.published,
    platforms: Array.from(new Set((pendingPosts ?? []).map((post) => post.platform)))
  };
}

export async function createWeeklyDigest() {
  if (!flags.hasSupabaseAdmin) {
    return {
      mode: flags.hasAnthropic ? "live" : "mock",
      subject: "This Week’s Hottest Recipes and Sauce Finds",
      draftCount: 1
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      mode: flags.hasAnthropic ? "live" : "mock",
      subject: "This Week’s Hottest Recipes and Sauce Finds",
      draftCount: 1
    };
  }

  const [recipes, blogPosts, reviews, subscribers] = await Promise.all([
    supabase
      .from("recipes")
      .select("title, slug")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(2),
    supabase
      .from("blog_posts")
      .select("title, slug")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(2),
    supabase
      .from("reviews")
      .select("title, slug")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(2),
    supabase
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
  ]);

  const subject = "This Week’s Hottest Recipes and Sauce Finds";
  const previewText = "Fresh recipes, smart reviews, and a few spicy rabbit holes worth opening.";
  const htmlContent = `
    <h1>${subject}</h1>
    <p>${previewText}</p>
    <h2>Recipes</h2>
    <ul>${(recipes.data ?? [])
      .map((item) => `<li>${item.title}</li>`)
      .join("")}</ul>
    <h2>Stories</h2>
    <ul>${(blogPosts.data ?? [])
      .map((item) => `<li>${item.title}</li>`)
      .join("")}</ul>
    <h2>Reviews</h2>
    <ul>${(reviews.data ?? [])
      .map((item) => `<li>${item.title}</li>`)
      .join("")}</ul>
  `;
  const textContent = [
    subject,
    previewText,
    "",
    "Recipes:",
    ...(recipes.data ?? []).map((item) => `- ${item.title}`),
    "",
    "Stories:",
    ...(blogPosts.data ?? []).map((item) => `- ${item.title}`),
    "",
    "Reviews:",
    ...(reviews.data ?? []).map((item) => `- ${item.title}`)
  ].join("\n");

  const { error } = await supabase.from("newsletter_campaigns").insert({
    subject,
    preview_text: previewText,
    html_content: htmlContent,
    text_content: textContent,
    status: "draft",
    recipient_count: subscribers.count ?? 0
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    mode: flags.hasAnthropic ? "live" : "mock",
    subject,
    draftCount: 1
  };
}
