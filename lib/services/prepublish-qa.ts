import { buildBlogQaReport } from "@/lib/blog-qa";
import { getBlogHeroFields } from "@/lib/blog-hero";
import { flags } from "@/lib/env";
import { buildRecipeQaReport } from "@/lib/recipe-qa";
import { getRecipeHeroFields } from "@/lib/recipe-hero";
import { buildReviewQaReport } from "@/lib/review-qa";
import { getReviewHeroFields } from "@/lib/review-hero";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  BlogPost,
  Recipe,
  RecipeQaIssue,
  RecipeQaReport,
  Review
} from "@/lib/types";

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;
type EditorialTable = "blog_posts" | "recipes" | "reviews";
type EditorialContentType = "blog_post" | "recipe" | "review";
type EditorialRow = Record<string, any>;
type PrepublishGateStatus = "ready" | "blocked";

type PrepublishQaEvaluation = {
  type: EditorialContentType;
  table: EditorialTable;
  id: number;
  slug: string;
  title: string;
  scheduledAt: string | null;
  status: PrepublishGateStatus;
  qaReport: RecipeQaReport;
  qaIssues: RecipeQaIssue[];
};

export type PrepublishQaItemResult = {
  id: number;
  type: EditorialContentType;
  table: EditorialTable;
  slug: string;
  title: string;
  scheduledAt: string | null;
  status: PrepublishGateStatus;
  qaStatus: RecipeQaReport["status"];
  qaScore: number;
  issueCount: number;
  issues: RecipeQaIssue[];
};

export type PrepublishQaRunResult = {
  reviewed: number;
  ready: number;
  blocked: number;
  items: PrepublishQaItemResult[];
};

function createIssue(
  severity: "blocker" | "warning",
  code: string,
  message: string
): RecipeQaIssue {
  return { severity, code, message };
}

function dedupeIssues(issues: RecipeQaIssue[]) {
  const byKey = new Map<string, RecipeQaIssue>();

  for (const issue of issues) {
    const key = `${issue.severity}:${issue.code}:${issue.message}`;
    if (!byKey.has(key)) {
      byKey.set(key, issue);
    }
  }

  return [...byKey.values()];
}

function mergeQaReport(baseReport: RecipeQaReport, extraIssues: RecipeQaIssue[]): RecipeQaReport {
  const blockers = dedupeIssues([
    ...baseReport.blockers,
    ...extraIssues.filter((issue) => issue.severity === "blocker")
  ]);
  const warnings = dedupeIssues([
    ...baseReport.warnings,
    ...extraIssues.filter((issue) => issue.severity === "warning")
  ]);
  const score = Math.max(0, 100 - blockers.length * 18 - warnings.length * 5);

  return {
    status: blockers.length ? "fail" : warnings.length ? "warn" : "pass",
    score,
    blockers,
    warnings
  };
}

function buildGenericPrepublishIssues(input: {
  type: EditorialContentType;
  row: EditorialRow;
  imageUrl?: string | null;
  imageAlt?: string | null;
}) {
  const issues: RecipeQaIssue[] = [];
  const title = typeof input.row.title === "string" ? input.row.title.trim() : "";
  const description =
    typeof input.row.description === "string" ? input.row.description.trim() : "";
  const slug = typeof input.row.slug === "string" ? input.row.slug.trim() : "";
  const seoDescription =
    typeof input.row.seo_description === "string" ? input.row.seo_description.trim() : "";

  if (!slug) {
    issues.push(
      createIssue("blocker", "missing-slug", "Scheduled content must have a slug before publishing.")
    );
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    issues.push(
      createIssue(
        "blocker",
        "invalid-slug",
        `Slug "${slug}" must use lowercase letters, numbers, and hyphens only.`
      )
    );
  }

  if (!title) {
    issues.push(
      createIssue("blocker", "missing-title", "Scheduled content must have a title before publishing.")
    );
  }

  if (!description) {
    issues.push(
      createIssue(
        "blocker",
        "missing-description",
        "Scheduled content must have a description before publishing."
      )
    );
  }

  if (input.type === "blog_post" && !input.imageUrl) {
    issues.push(
      createIssue(
        "blocker",
        "missing-cover-image",
        "Blog drafts need a real cover image or branded hero card before auto-publish."
      )
    );
  }

  if (input.type === "blog_post" && !input.imageAlt) {
    issues.push(
      createIssue(
        "blocker",
        "missing-cover-alt",
        "Blog drafts need descriptive cover alt text before auto-publish."
      )
    );
  }

  if (!input.row.published_at) {
    issues.push(
      createIssue(
        "blocker",
        "missing-schedule-time",
        "Scheduled content must keep a publish timestamp while it waits for auto-publish."
      )
    );
  }

  if (seoDescription && (seoDescription.length < 110 || seoDescription.length > 165)) {
    issues.push(
      createIssue(
        "warning",
        "seo-description-length",
        "SEO description should usually land in the 110-165 character range."
      )
    );
  }

  return issues;
}

function mapBlogRowToQaCandidate(row: EditorialRow): BlogPost {
  const hero = getBlogHeroFields({
    title: row.title,
    category: row.category,
    cuisineType: row.cuisine_type ?? undefined,
    heatLevel: row.heat_level ?? undefined,
    imageUrl: row.image_url ?? undefined,
    imageAlt: row.image_alt ?? undefined
  });

  return {
    id: row.id,
    type: "blog",
    slug: row.slug,
    title: row.title,
    description: row.description,
    authorName: row.author_name ?? "FlamingFoodies",
    authorId: row.author_id ?? undefined,
    category: row.category,
    content: row.content,
    tags: row.tags ?? [],
    imageUrl: hero.imageUrl,
    imageAlt: hero.imageAlt,
    featured: row.featured ?? false,
    source: row.source,
    status: row.status,
    createdAt: row.created_at ?? undefined,
    publishedAt: row.published_at ?? undefined,
    qaNotes: row.qa_notes ?? undefined,
    qaReport: row.qa_report ?? undefined,
    qaIssues: Array.isArray(row.qa_issues) ? row.qa_issues : undefined,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    cuisineType: row.cuisine_type ?? undefined,
    heatLevel: row.heat_level ?? undefined,
    scovilleRating: row.scoville_rating ?? undefined,
    readTimeMinutes: row.read_time_minutes ?? undefined,
    viewCount: row.view_count ?? 0,
    likeCount: row.like_count ?? 0
  };
}

function mapRecipeRowToQaCandidate(row: EditorialRow): Recipe {
  const hero = getRecipeHeroFields({
    title: row.title,
    cuisineType: row.cuisine_type,
    heatLevel: row.heat_level,
    description: row.description,
    heroSummary: row.hero_summary ?? undefined,
    imageUrl: row.image_url ?? undefined,
    imageAlt: row.image_alt ?? undefined
  });

  return {
    id: row.id,
    type: "recipe",
    slug: row.slug,
    title: row.title,
    description: row.description,
    intro: row.intro ?? undefined,
    heroSummary: row.hero_summary ?? undefined,
    authorName: row.author_name ?? "FlamingFoodies Test Kitchen",
    heatLevel: row.heat_level,
    cuisineType: row.cuisine_type,
    prepTimeMinutes: row.prep_time_minutes ?? 0,
    cookTimeMinutes: row.cook_time_minutes ?? 0,
    totalTimeMinutes: row.total_time_minutes ?? 0,
    activeTimeMinutes: row.active_time_minutes ?? undefined,
    servings: row.servings ?? 0,
    difficulty: row.difficulty ?? "beginner",
    ingredients: row.ingredients ?? [],
    ingredientSections: row.ingredient_sections ?? [],
    instructions: row.instructions ?? [],
    methodSteps: row.method_steps ?? [],
    tips: row.tips ?? [],
    variations: row.variations ?? [],
    makeAheadNotes: row.make_ahead_notes ?? undefined,
    storageNotes: row.storage_notes ?? undefined,
    reheatNotes: row.reheat_notes ?? undefined,
    servingSuggestions: row.serving_suggestions ?? [],
    substitutions: row.substitutions ?? [],
    faqs: row.faqs ?? [],
    equipment: row.equipment ?? [],
    tags: row.tags ?? [],
    imageUrl: hero.imageUrl,
    imageAlt: hero.imageAlt,
    heroImageReviewed: Boolean(row.hero_image_reviewed),
    cuisineQaReviewed: row.cuisine_qa_reviewed ?? false,
    qaNotes: row.qa_notes ?? undefined,
    qaReport: row.qa_report ?? undefined,
    qaIssues: Array.isArray(row.qa_issues) ? row.qa_issues : undefined,
    featured: row.featured ?? false,
    source: row.source,
    status: row.status,
    createdAt: row.created_at ?? undefined,
    publishedAt: row.published_at ?? undefined,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    viewCount: row.view_count ?? 0,
    likeCount: row.like_count ?? 0,
    ratingAvg: Number(row.rating_avg ?? 0) || undefined,
    ratingCount: row.rating_count ?? 0,
    saveCount: row.save_count ?? 0
  };
}

function mapReviewRowToQaCandidate(row: EditorialRow): Review {
  const hero = getReviewHeroFields({
    title: row.title,
    productName: row.product_name,
    brand: row.brand,
    category: row.category,
    heatLevel: row.heat_level ?? undefined,
    imageUrl: row.image_url ?? undefined,
    imageAlt: row.image_alt ?? undefined
  });

  return {
    id: row.id,
    type: "review",
    slug: row.slug,
    title: row.title,
    description: row.description,
    productName: row.product_name,
    brand: row.brand,
    rating: Number(row.rating ?? 0),
    priceUsd: Number(row.price_usd ?? 0) || undefined,
    affiliateUrl: row.affiliate_url,
    imageUrl: hero.imageUrl,
    imageAlt: hero.imageAlt,
    source: row.source,
    status: row.status,
    createdAt: row.created_at ?? undefined,
    publishedAt: row.published_at ?? undefined,
    tags: row.tags ?? [],
    viewCount: row.view_count ?? 0,
    likeCount: row.like_count ?? 0,
    content: row.content,
    heatLevel: row.heat_level ?? undefined,
    scovilleMin: row.scoville_min ?? undefined,
    scovilleMax: row.scoville_max ?? undefined,
    flavorNotes: row.flavor_notes ?? [],
    cuisineOrigin: row.cuisine_origin ?? undefined,
    category: row.category,
    pros: row.pros ?? [],
    cons: row.cons ?? [],
    imageReviewed: Boolean(row.image_reviewed),
    factQaReviewed: row.fact_qa_reviewed ?? false,
    qaNotes: row.qa_notes ?? undefined,
    qaReport: row.qa_report ?? undefined,
    qaIssues: Array.isArray(row.qa_issues) ? row.qa_issues : undefined,
    authorName: row.author_name ?? "FlamingFoodies Review Desk",
    recommended: row.recommended ?? false,
    featured: row.featured ?? false
  };
}

function evaluatePrepublishRow(table: EditorialTable, row: EditorialRow): PrepublishQaEvaluation {
  if (table === "blog_posts") {
    const candidate = mapBlogRowToQaCandidate(row);
    const qaReport = mergeQaReport(
      buildBlogQaReport(candidate),
      buildGenericPrepublishIssues({
        type: "blog_post",
        row,
        imageUrl: candidate.imageUrl,
        imageAlt: candidate.imageAlt
      })
    );
    const qaIssues = dedupeIssues([...qaReport.blockers, ...qaReport.warnings]);

    return {
      type: "blog_post",
      table,
      id: row.id,
      slug: row.slug,
      title: row.title,
      scheduledAt: row.published_at ?? null,
      status: qaReport.blockers.length ? "blocked" : "ready",
      qaReport,
      qaIssues
    };
  }

  if (table === "recipes") {
    const candidate = mapRecipeRowToQaCandidate(row);
    const qaReport = mergeQaReport(
      buildRecipeQaReport(candidate),
      buildGenericPrepublishIssues({
        type: "recipe",
        row,
        imageUrl: candidate.imageUrl,
        imageAlt: candidate.imageAlt
      })
    );
    const qaIssues = dedupeIssues([...qaReport.blockers, ...qaReport.warnings]);

    return {
      type: "recipe",
      table,
      id: row.id,
      slug: row.slug,
      title: row.title,
      scheduledAt: row.published_at ?? null,
      status: qaReport.blockers.length ? "blocked" : "ready",
      qaReport,
      qaIssues
    };
  }

  const candidate = mapReviewRowToQaCandidate(row);
  const qaReport = mergeQaReport(
    buildReviewQaReport(candidate),
    buildGenericPrepublishIssues({
      type: "review",
      row,
      imageUrl: candidate.imageUrl,
      imageAlt: candidate.imageAlt
    })
  );
  const qaIssues = dedupeIssues([...qaReport.blockers, ...qaReport.warnings]);

  return {
    type: "review",
    table,
    id: row.id,
    slug: row.slug,
    title: row.title,
    scheduledAt: row.published_at ?? null,
    status: qaReport.blockers.length ? "blocked" : "ready",
    qaReport,
    qaIssues
  };
}

async function holdScheduledSocialPosts(
  supabase: AdminClient,
  input: {
    contentType: EditorialContentType;
    contentId: number;
  }
) {
  await supabase
    .from("social_posts")
    .update({
      status: "pending",
      scheduled_at: null
    })
    .eq("content_type", input.contentType)
    .eq("content_id", input.contentId)
    .in("status", ["pending", "scheduled", "failed"]);
}

async function persistPrepublishQaResult(
  supabase: AdminClient,
  evaluation: PrepublishQaEvaluation
) {
  const baseUpdate = {
    qa_report: evaluation.qaReport,
    qa_checked_at: new Date().toISOString(),
    qa_issues: evaluation.status === "blocked" ? evaluation.qaIssues : []
  };

  if (evaluation.table === "blog_posts") {
    await supabase
      .from("blog_posts")
      .update({
        ...baseUpdate,
        ...(evaluation.status === "blocked" ? { status: "needs_review" } : {})
      })
      .eq("id", evaluation.id);
  } else if (evaluation.table === "recipes") {
    await supabase
      .from("recipes")
      .update({
        ...baseUpdate,
        ...(evaluation.status === "blocked" ? { status: "needs_review" } : {})
      })
      .eq("id", evaluation.id);
  } else {
    await supabase
      .from("reviews")
      .update({
        ...baseUpdate,
        ...(evaluation.status === "blocked" ? { status: "needs_review" } : {})
      })
      .eq("id", evaluation.id);
  }

  if (evaluation.status === "blocked") {
    await holdScheduledSocialPosts(supabase, {
      contentType: evaluation.type,
      contentId: evaluation.id
    });
  }
}

function toResultItem(evaluation: PrepublishQaEvaluation): PrepublishQaItemResult {
  return {
    id: evaluation.id,
    type: evaluation.type,
    table: evaluation.table,
    slug: evaluation.slug,
    title: evaluation.title,
    scheduledAt: evaluation.scheduledAt,
    status: evaluation.status,
    qaStatus: evaluation.qaReport.status,
    qaScore: evaluation.qaReport.score,
    issueCount: evaluation.qaIssues.length,
    issues: evaluation.qaIssues
  };
}

async function runPrepublishQaOnTable(
  supabase: AdminClient,
  table: EditorialTable,
  options?: {
    dueOnly?: boolean;
    limitPerTable?: number;
    now?: Date;
  }
) {
  let query = supabase
    .from(table)
    .select("*")
    .eq("status", "draft")
    .not("published_at", "is", null)
    .order("published_at", { ascending: true });

  if (options?.dueOnly) {
    query = query.lte("published_at", (options.now ?? new Date()).toISOString());
  }

  if (options?.limitPerTable) {
    query = query.limit(options.limitPerTable);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load scheduled ${table} rows for prepublish QA: ${error.message}`);
  }

  const items: PrepublishQaItemResult[] = [];

  for (const row of data ?? []) {
    const evaluation = evaluatePrepublishRow(table, row);
    await persistPrepublishQaResult(supabase, evaluation);
    items.push(toResultItem(evaluation));
  }

  return items;
}

export async function runPrepublishQaForScheduledContent(options?: {
  dueOnly?: boolean;
  limitPerTable?: number;
  now?: Date;
  supabase?: AdminClient;
}): Promise<PrepublishQaRunResult> {
  if (!flags.hasSupabaseAdmin) {
    return {
      reviewed: 0,
      ready: 0,
      blocked: 0,
      items: []
    };
  }

  const supabase = options?.supabase ?? createSupabaseAdminClient();
  if (!supabase) {
    return {
      reviewed: 0,
      ready: 0,
      blocked: 0,
      items: []
    };
  }

  const [recipes, blogPosts, reviews] = await Promise.all([
    runPrepublishQaOnTable(supabase, "recipes", options),
    runPrepublishQaOnTable(supabase, "blog_posts", options),
    runPrepublishQaOnTable(supabase, "reviews", options)
  ]);

  const items = [...recipes, ...blogPosts, ...reviews];

  return {
    reviewed: items.length,
    ready: items.filter((item) => item.status === "ready").length,
    blocked: items.filter((item) => item.status === "blocked").length,
    items
  };
}

export async function runInlinePrepublishQaForRow(
  supabase: AdminClient,
  input: {
    table: EditorialTable;
    row: EditorialRow;
  }
) {
  const evaluation = evaluatePrepublishRow(input.table, input.row);
  await persistPrepublishQaResult(supabase, evaluation);
  return toResultItem(evaluation);
}
