"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { buildBlogQaReport, getBlogQaPublishError } from "@/lib/blog-qa";
import { CUISINE_TYPES, HEAT_LEVELS } from "@/lib/content-taxonomy";
import { getBlogHeroFields } from "@/lib/blog-hero";
import { flags } from "@/lib/env";
import { merchThemeOptions } from "@/lib/merch";
import { getRecipeHeroFields } from "@/lib/recipe-hero";
import { getReviewHeroFields } from "@/lib/review-hero";
import {
  buildRecipeQaReport,
  getRecipeManualReviewState,
  getRecipeQaPublishError
} from "@/lib/recipe-qa";
import {
  buildReviewQaReport,
  getReviewManualReviewState,
  getReviewQaPublishError
} from "@/lib/review-qa";
import {
  getRecipeFaqs,
  getRecipeHeroSummary,
  getRecipeIngredientSections,
  getRecipeMethodSteps,
  getRecipeSupportList
} from "@/lib/recipes";
import {
  parseCsvList,
  parseLineList,
  parseRecipeFaqs,
  parseRecipeIngredientSections,
  parseRecipeMethodSteps,
  parseStringListJson
} from "@/lib/parsers";
import {
  sampleBlogPosts,
  sampleMerchProducts,
  sampleRecipes,
  sampleReviews
} from "@/lib/sample-data";
import { getSeasonalShopSeedProducts } from "@/lib/services/shop-automation";
import { triggerContentShopSync } from "@/lib/services/content-shop-signals";
import { createSocialPostsForContent } from "@/lib/services/social";
import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  BlogPost,
  MerchProduct,
  Recipe,
  RecipeFaq,
  RecipeIngredient,
  RecipeIngredientSection,
  RecipeInstruction,
  RecipeMethodStep,
  Review
} from "@/lib/types";
import { calculateReadTime, slugify } from "@/lib/utils";

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

const heatLevels = HEAT_LEVELS;
const cuisineTypes = CUISINE_TYPES;
const difficulties = ["beginner", "intermediate", "advanced"] as const;
const merchAvailability = ["preview", "waitlist", "live"] as const;
const editorialStatuses = ["draft", "pending_review", "published"] as const;
const QA_NOTES_MAX_LENGTH = 4000;

const blogSchema = z.object({
  title: z.string().min(6).max(120),
  description: z.string().min(20).max(420),
  category: z.string().min(3).max(40),
  content: z.string().min(40),
  tags: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageAlt: z.string().max(180).optional(),
  status: z.enum(editorialStatuses),
  featured: z.boolean().optional(),
  redirectTo: z.string().optional()
});

const recipeSchema = z.object({
  title: z.string().min(6).max(120),
  description: z.string().min(20).max(420),
  intro: z.string().min(20).max(1200).optional(),
  heroSummary: z.string().min(20).max(260).optional(),
  heatLevel: z.enum(heatLevels),
  cuisineType: z.enum(cuisineTypes),
  prepTimeMinutes: z.coerce.number().int().min(0),
  cookTimeMinutes: z.coerce.number().int().min(0),
  activeTimeMinutes: z.coerce.number().int().min(0).optional(),
  servings: z.coerce.number().int().min(1),
  difficulty: z.enum(difficulties),
  ingredientSectionsJson: z.string().min(2),
  methodStepsJson: z.string().min(2),
  tipsJson: z.string().optional(),
  variationsJson: z.string().optional(),
  substitutionsJson: z.string().optional(),
  servingSuggestionsJson: z.string().optional(),
  equipmentJson: z.string().optional(),
  faqsJson: z.string().optional(),
  makeAheadNotes: z.string().max(600).optional(),
  storageNotes: z.string().max(600).optional(),
  reheatNotes: z.string().max(600).optional(),
  qaNotes: z.string().max(QA_NOTES_MAX_LENGTH).optional(),
  tags: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageAlt: z.string().max(180).optional(),
  heroImageReviewed: z.boolean().optional(),
  cuisineQaReviewed: z.boolean().optional(),
  status: z.enum(editorialStatuses),
  featured: z.boolean().optional(),
  redirectTo: z.string().optional()
});

const reviewSchema = z.object({
  title: z.string().min(6).max(120),
  description: z.string().min(20).max(420),
  productName: z.string().min(2).max(120),
  brand: z.string().min(2).max(80),
  rating: z.coerce.number().min(1).max(5),
  priceUsd: z.coerce.number().min(0).optional(),
  affiliateUrl: z.string().url(),
  content: z.string().min(40),
  category: z.string().min(2).max(60),
  heatLevel: z.enum(heatLevels).optional(),
  scovilleMin: z.coerce.number().int().min(0).optional(),
  scovilleMax: z.coerce.number().int().min(0).optional(),
  flavorNotes: z.string().optional(),
  cuisineOrigin: z.enum(cuisineTypes).optional(),
  pros: z.string().optional(),
  cons: z.string().optional(),
  qaNotes: z.string().max(QA_NOTES_MAX_LENGTH).optional(),
  tags: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageAlt: z.string().max(180).optional(),
  imageReviewed: z.boolean().optional(),
  factQaReviewed: z.boolean().optional(),
  status: z.enum(editorialStatuses),
  featured: z.boolean().optional(),
  recommended: z.boolean().optional(),
  redirectTo: z.string().optional()
});

const merchSchema = z.object({
  name: z.string().min(3).max(120),
  category: z.string().min(2).max(60),
  badge: z.string().min(2).max(40),
  description: z.string().min(20).max(420),
  priceLabel: z.string().min(1).max(40),
  availability: z.enum(merchAvailability),
  themeKey: z.enum(merchThemeOptions),
  href: z
    .string()
    .min(1)
    .refine(
      (value) =>
        value.startsWith("/") ||
        value.startsWith("http://") ||
        value.startsWith("https://"),
      "CTA URL must start with / or http(s)://"
    ),
  ctaLabel: z.string().min(2).max(40),
  sortOrder: z.coerce.number().int().min(0).default(0),
  imageUrl: z.string().url().optional(),
  imageAlt: z.string().max(180).optional(),
  status: z.enum(["draft", "published"]),
  featured: z.boolean().optional(),
  redirectTo: z.string().optional()
});

const blogStateSchema = z.object({
  id: z.coerce.number(),
  intent: z.enum(["publish", "archive", "feature", "unfeature"]),
  redirectTo: z.string().optional()
});

const contentStateSchema = z.object({
  id: z.coerce.number(),
  intent: z.enum([
    "publish",
    "archive",
    "feature",
    "unfeature",
    "recommend",
    "unrecommend"
  ]),
  redirectTo: z.string().optional()
});

const importCatalogSchema = z.object({
  catalog: z.enum(["blogs", "recipes", "reviews", "merch", "all"]),
  redirectTo: z.string().optional()
});

function getOptionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  return value || undefined;
}

function getOptionalNumberText(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  return value || undefined;
}

function formatValidationIssue(
  issue: z.ZodIssue | undefined,
  fallback: string
) {
  if (!issue) {
    return fallback;
  }

  const pathLabel = issue.path.length
    ? String(issue.path[0])
        .replace(/Json$/, "")
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (character) => character.toUpperCase())
    : null;

  return pathLabel ? `${pathLabel}: ${issue.message}` : issue.message;
}

function getJsonPayload(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "[]";
}

function getOptionalFile(formData: FormData, key: string) {
  const file = formData.get(key);
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }
  return file;
}

function getRedirectPath(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith("/admin/")) {
    return fallback;
  }

  return value;
}

function getPublishedAt(
  status: (typeof editorialStatuses)[number],
  existingPublishedAt?: string | null
) {
  if (status !== "published") {
    return null;
  }

  return existingPublishedAt ?? new Date().toISOString();
}

async function writeAuditLog(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  payload: {
    adminId: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: Record<string, unknown>;
  }
) {
  await supabase?.from("admin_audit_log").insert({
    admin_id: payload.adminId,
    action: payload.action,
    target_type: payload.targetType,
    target_id: payload.targetId,
    metadata: payload.metadata ?? {}
  });
}

async function makeUniqueSlug(
  supabase: AdminClient,
  table: "blog_posts" | "recipes" | "reviews" | "competitions" | "merch_products",
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

function buildStatusUpdates(intent: z.infer<typeof contentStateSchema>["intent"]) {
  const updates: Record<string, unknown> = {};
  if (intent === "publish") {
    updates.status = "published";
    updates.published_at = new Date().toISOString();
  }
  if (intent === "archive") {
    updates.status = "archived";
  }
  if (intent === "feature") {
    updates.featured = true;
  }
  if (intent === "unfeature") {
    updates.featured = false;
  }
  if (intent === "recommend") {
    updates.recommended = true;
  }
  if (intent === "unrecommend") {
    updates.recommended = false;
  }
  return updates;
}

async function uploadAdminImage(supabase: AdminClient, file: File, folder: string) {
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "bin";
  const basename = slugify(file.name.replace(/\.[^.]+$/, "")) || "upload";
  const path = `${folder}/${Date.now()}-${basename}.${extension || "bin"}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from("admin-media").upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: true
  });

  if (error) {
    throw new Error(error.message);
  }

  return supabase.storage.from("admin-media").getPublicUrl(path).data.publicUrl;
}

async function resolveImageFields({
  formData,
  supabase,
  folder,
  existingImageUrl
}: {
  formData: FormData;
  supabase: AdminClient;
  folder: string;
  existingImageUrl?: string | null;
}) {
  const uploadedFile = getOptionalFile(formData, "imageFile");
  const manualUrl = getOptionalText(formData, "imageUrl");
  const imageAlt = getOptionalText(formData, "imageAlt");

  let imageUrl = existingImageUrl ?? null;

  if (uploadedFile) {
    imageUrl = await uploadAdminImage(supabase, uploadedFile, folder);
  } else if (manualUrl) {
    imageUrl = manualUrl;
  }

  return {
    imageUrl,
    imageAlt
  };
}

function flattenIngredientSections(sections: RecipeIngredientSection[]) {
  return sections.flatMap((section) => section.items);
}

function buildLegacyInstructionsFromMethodSteps(methodSteps: RecipeMethodStep[]): RecipeInstruction[] {
  return methodSteps.map((step, index) => ({
    step: index + 1,
    text: step.body ? `${step.title}. ${step.body}` : step.title,
    tip: step.cue || step.tip || undefined
  }));
}

function parseStructuredRecipeContent(formData: FormData) {
  const ingredientSections = parseRecipeIngredientSections(
    getJsonPayload(formData, "ingredientSectionsJson")
  );
  const methodSteps = parseRecipeMethodSteps(getJsonPayload(formData, "methodStepsJson"));
  const tips = parseStringListJson(getJsonPayload(formData, "tipsJson"));
  const variations = parseStringListJson(getJsonPayload(formData, "variationsJson"));
  const substitutions = parseStringListJson(getJsonPayload(formData, "substitutionsJson"));
  const servingSuggestions = parseStringListJson(
    getJsonPayload(formData, "servingSuggestionsJson")
  );
  const equipment = parseStringListJson(getJsonPayload(formData, "equipmentJson"));
  const faqs = parseRecipeFaqs(getJsonPayload(formData, "faqsJson"));

  if (!ingredientSections.length) {
    throw new Error("Add at least one ingredient section with one ingredient.");
  }

  if (!methodSteps.length) {
    throw new Error("Add at least one method step.");
  }

  return {
    ingredientSections,
    ingredients: flattenIngredientSections(ingredientSections),
    methodSteps,
    instructions: buildLegacyInstructionsFromMethodSteps(methodSteps),
    tips,
    variations,
    substitutions,
    servingSuggestions,
    equipment,
    faqs
  };
}

function buildRecipeQaPayload({
  parsed,
  structuredContent,
  methodSteps,
  image
}: {
  parsed: z.infer<typeof recipeSchema>;
  structuredContent: ReturnType<typeof parseStructuredRecipeContent>;
  methodSteps: RecipeMethodStep[];
  image: { imageUrl: string | null; imageAlt?: string };
}) {
  const hero = getRecipeHeroFields({
    title: parsed.title,
    cuisineType: parsed.cuisineType,
    heatLevel: parsed.heatLevel,
    description: parsed.description,
    heroSummary: parsed.heroSummary,
    imageUrl: image.imageUrl ?? undefined,
    imageAlt: image.imageAlt ?? undefined
  });
  const qaCandidate: Recipe = {
    id: 0,
    type: "recipe",
    slug: "draft",
    title: parsed.title,
    description: parsed.description,
    intro: parsed.intro,
    heroSummary: parsed.heroSummary,
    authorName: "QA",
    heatLevel: parsed.heatLevel,
    cuisineType: parsed.cuisineType,
    prepTimeMinutes: parsed.prepTimeMinutes,
    cookTimeMinutes: parsed.cookTimeMinutes,
    totalTimeMinutes: parsed.prepTimeMinutes + parsed.cookTimeMinutes,
    activeTimeMinutes: parsed.activeTimeMinutes,
    servings: parsed.servings,
    difficulty: parsed.difficulty,
    ingredients: structuredContent.ingredients,
    ingredientSections: structuredContent.ingredientSections,
    instructions: structuredContent.instructions,
    methodSteps,
    tips: structuredContent.tips,
    variations: structuredContent.variations,
    makeAheadNotes: parsed.makeAheadNotes,
    storageNotes: parsed.storageNotes,
    reheatNotes: parsed.reheatNotes,
    servingSuggestions: structuredContent.servingSuggestions,
    substitutions: structuredContent.substitutions,
    faqs: structuredContent.faqs,
    equipment: structuredContent.equipment,
    tags: parseCsvList(parsed.tags || ""),
    imageUrl: hero.imageUrl,
    imageAlt: hero.imageAlt,
    heroImageReviewed: Boolean(parsed.heroImageReviewed),
    cuisineQaReviewed: parsed.cuisineQaReviewed ?? false,
    featured: parsed.featured ?? false,
    source: "editorial",
    status: parsed.status,
    viewCount: 0,
    likeCount: 0,
    ratingCount: 0,
    saveCount: 0
  };
  const qaReport = buildRecipeQaReport(qaCandidate);

  return {
    imageUrl: hero.imageUrl,
    imageAlt: hero.imageAlt,
    heroImageReviewed: qaCandidate.heroImageReviewed ?? false,
    cuisineQaReviewed: qaCandidate.cuisineQaReviewed ?? false,
    qaNotes: parsed.qaNotes ?? null,
    qaReport
  };
}

function buildReviewQaPayload({
  parsed,
  image
}: {
  parsed: z.infer<typeof reviewSchema>;
  image: { imageUrl: string | null; imageAlt?: string };
}) {
  const hero = getReviewHeroFields({
    title: parsed.title,
    productName: parsed.productName,
    brand: parsed.brand,
    category: parsed.category,
    heatLevel: parsed.heatLevel,
    imageUrl: image.imageUrl ?? undefined,
    imageAlt: image.imageAlt ?? undefined
  });
  const qaCandidate: Review = {
    id: 0,
    type: "review",
    slug: "draft",
    title: parsed.title,
    description: parsed.description,
    productName: parsed.productName,
    brand: parsed.brand,
    rating: parsed.rating,
    priceUsd: parsed.priceUsd,
    affiliateUrl: parsed.affiliateUrl,
    content: parsed.content,
    heatLevel: parsed.heatLevel,
    scovilleMin: parsed.scovilleMin,
    scovilleMax: parsed.scovilleMax,
    flavorNotes: parseCsvList(parsed.flavorNotes || ""),
    cuisineOrigin: parsed.cuisineOrigin,
    category: parsed.category,
    pros: parseLineList(parsed.pros || ""),
    cons: parseLineList(parsed.cons || ""),
    imageUrl: hero.imageUrl,
    imageAlt: hero.imageAlt,
    imageReviewed: Boolean(parsed.imageReviewed),
    factQaReviewed: parsed.factQaReviewed ?? false,
    qaNotes: parsed.qaNotes ?? undefined,
    qaReport: undefined,
    recommended: parsed.recommended ?? false,
    featured: parsed.featured ?? false,
    source: "editorial",
    status: parsed.status,
    tags: parseCsvList(parsed.tags || ""),
    viewCount: 0,
    likeCount: 0
  };
  const qaReport = buildReviewQaReport(qaCandidate);

  return {
    imageUrl: hero.imageUrl,
    imageAlt: hero.imageAlt,
    imageReviewed: qaCandidate.imageReviewed ?? false,
    factQaReviewed: qaCandidate.factQaReviewed ?? false,
    qaNotes: parsed.qaNotes ?? null,
    qaReport
  };
}

function buildBlogQaPayload({
  parsed,
  image
}: {
  parsed: z.infer<typeof blogSchema>;
  image: { imageUrl: string | null; imageAlt?: string };
}) {
  const qaCandidate: BlogPost = {
    id: 0,
    type: "blog",
    slug: "draft",
    title: parsed.title,
    description: parsed.description,
    authorName: "FlamingFoodies",
    category: parsed.category,
    content: parsed.content,
    tags: parseCsvList(parsed.tags || ""),
    imageUrl: image.imageUrl ?? undefined,
    imageAlt: image.imageAlt ?? undefined,
    featured: parsed.featured ?? false,
    source: "editorial",
    status: parsed.status,
    publishedAt: undefined,
    viewCount: 0,
    likeCount: 0,
    seoTitle: parsed.title.slice(0, 60),
    seoDescription: parsed.description.slice(0, 160),
    readTimeMinutes: calculateReadTime(parsed.content)
  };
  const qaReport = buildBlogQaReport(qaCandidate);

  return {
    imageUrl: qaCandidate.imageUrl ?? null,
    imageAlt: qaCandidate.imageAlt ?? null,
    qaReport
  };
}

function mapBlogRowToQaCandidate(row: any): BlogPost {
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
    category: row.category,
    content: row.content,
    tags: row.tags ?? [],
    imageUrl: hero.imageUrl,
    imageAlt: hero.imageAlt,
    featured: row.featured ?? false,
    source: row.source,
    status: row.status,
    publishedAt: row.published_at ?? undefined,
    viewCount: row.view_count ?? 0,
    likeCount: row.like_count ?? 0,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    cuisineType: row.cuisine_type ?? undefined,
    heatLevel: row.heat_level ?? undefined,
    scovilleRating: row.scoville_rating ?? undefined,
    readTimeMinutes: row.read_time_minutes ?? calculateReadTime(row.content ?? "")
  };
}

function mapRecipeRowToQaCandidate(row: any): Recipe {
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
    authorName: row.author_name,
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
    featured: row.featured ?? false,
    source: row.source,
    status: row.status,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    viewCount: row.view_count ?? 0,
    likeCount: row.like_count ?? 0,
    ratingAvg: Number(row.rating_avg ?? 0) || undefined,
    ratingCount: row.rating_count ?? 0,
    saveCount: row.save_count ?? 0,
    publishedAt: row.published_at ?? undefined
  };
}

function mapReviewRowToQaCandidate(row: any): Review {
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
    rating: Number(row.rating),
    priceUsd: Number(row.price_usd ?? 0) || undefined,
    affiliateUrl: row.affiliate_url,
    imageUrl: hero.imageUrl,
    imageAlt: hero.imageAlt,
    source: row.source,
    status: row.status,
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
    recommended: row.recommended ?? false,
    featured: row.featured ?? false
  };
}

async function resolveMethodStepImages({
  formData,
  supabase,
  methodSteps
}: {
  formData: FormData;
  supabase: AdminClient;
  methodSteps: RecipeMethodStep[];
}) {
  const resolvedSteps: RecipeMethodStep[] = [];

  for (const [index, step] of methodSteps.entries()) {
    const uploadedFile = getOptionalFile(formData, `methodStepImageFile-${index}`);
    let imageUrl = step.imageUrl;

    if (uploadedFile) {
      imageUrl = await uploadAdminImage(supabase, uploadedFile, "recipes/steps");
    }

    resolvedSteps.push({
      ...step,
      step: index + 1,
      imageUrl: imageUrl || undefined,
      imageAlt: step.imageAlt || undefined
    });
  }

  return resolvedSteps;
}

function revalidateBlogPaths(slug: string, previousSlug?: string | null) {
  revalidatePath("/admin/content/blog");
  revalidatePath("/blog");
  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/blog/${previousSlug}`);
  }
  revalidatePath(`/blog/${slug}`);
}

function revalidateRecipePaths(slug: string, previousSlug?: string | null) {
  revalidatePath("/admin/content/recipes");
  revalidatePath("/recipes");
  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/recipes/${previousSlug}`);
  }
  revalidatePath(`/recipes/${slug}`);
}

function revalidateReviewPaths(slug: string, previousSlug?: string | null) {
  revalidatePath("/admin/content/reviews");
  revalidatePath("/reviews");
  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/reviews/${previousSlug}`);
  }
  revalidatePath(`/reviews/${slug}`);
}

function revalidateMerchPaths() {
  revalidatePath("/admin/content/merch");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/subscriptions");
}

function revalidateCatalogBootstrapPaths() {
  revalidatePath("/admin");
  revalidatePath("/blog");
  revalidatePath("/recipes");
  revalidatePath("/reviews");
  revalidateMerchPaths();
}

function mapSampleBlogForInsert(post: BlogPost) {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    content: post.content,
    author_name: post.authorName,
    category: post.category,
    tags: post.tags,
    image_url: post.imageUrl ?? null,
    image_alt: post.imageAlt ?? null,
    featured: post.featured ?? false,
    source: post.source,
    status: post.status,
    seo_title: post.seoTitle ?? post.title.slice(0, 60),
    seo_description: post.seoDescription ?? post.description.slice(0, 160),
    cuisine_type: post.cuisineType ?? null,
    heat_level: post.heatLevel ?? null,
    scoville_rating: post.scovilleRating ?? null,
    read_time_minutes: post.readTimeMinutes ?? calculateReadTime(post.content),
    view_count: post.viewCount,
    like_count: post.likeCount,
    published_at: post.publishedAt ?? null
  };
}

async function ensureSocialPostsForPublishedContent({
  supabase,
  contentType,
  contentId,
  title,
  slug,
  imageUrl
}: {
  supabase: AdminClient;
  contentType: "recipe" | "review";
  contentId: number;
  title: string;
  slug: string;
  imageUrl?: string | null;
}) {
  const { data } = await supabase
    .from("social_posts")
    .select("id")
    .eq("content_type", contentType)
    .eq("content_id", contentId)
    .limit(1)
    .maybeSingle();

  if (data) {
    return;
  }

  await createSocialPostsForContent({
    contentType,
    contentId,
    title,
    slug,
    imageUrl: imageUrl ?? undefined
  });
}

function mapSampleRecipeForInsert(recipe: Recipe) {
  const manualReview = getRecipeManualReviewState(recipe);
  const qaReport = buildRecipeQaReport({
    ...recipe,
    heroImageReviewed: manualReview.heroImageReviewed,
    cuisineQaReviewed: manualReview.cuisineQaReviewed
  });

  return {
    slug: recipe.slug,
    title: recipe.title,
    description: recipe.description,
    intro: recipe.intro ?? null,
    hero_summary: getRecipeHeroSummary(recipe),
    author_name: recipe.authorName,
    heat_level: recipe.heatLevel,
    cuisine_type: recipe.cuisineType,
    prep_time_minutes: recipe.prepTimeMinutes,
    cook_time_minutes: recipe.cookTimeMinutes,
    active_time_minutes: recipe.activeTimeMinutes ?? recipe.prepTimeMinutes,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    ingredients: recipe.ingredients,
    ingredient_sections: getRecipeIngredientSections(recipe),
    instructions: recipe.instructions,
    method_steps: getRecipeMethodSteps(recipe),
    tips: recipe.tips,
    variations: recipe.variations,
    make_ahead_notes: recipe.makeAheadNotes ?? null,
    storage_notes: recipe.storageNotes ?? null,
    reheat_notes: recipe.reheatNotes ?? null,
    serving_suggestions: getRecipeSupportList(recipe.servingSuggestions),
    substitutions: getRecipeSupportList(recipe.substitutions).length
      ? getRecipeSupportList(recipe.substitutions)
      : recipe.variations,
    faqs: getRecipeFaqs(recipe),
    equipment: recipe.equipment,
    tags: recipe.tags,
    image_url: recipe.imageUrl ?? null,
    image_alt: recipe.imageAlt ?? null,
    hero_image_reviewed: manualReview.heroImageReviewed,
    cuisine_qa_reviewed: manualReview.cuisineQaReviewed,
    qa_notes: manualReview.qaNotes ?? null,
    qa_report: qaReport,
    featured: recipe.featured ?? false,
    status: recipe.status,
    source: recipe.source,
    affiliate_disclosure: true,
    seo_title: recipe.seoTitle ?? recipe.title.slice(0, 60),
    seo_description: recipe.seoDescription ?? recipe.description.slice(0, 160),
    view_count: recipe.viewCount,
    like_count: recipe.likeCount,
    save_count: recipe.saveCount,
    rating_avg: recipe.ratingAvg ?? null,
    rating_count: recipe.ratingCount,
    published_at: recipe.publishedAt ?? null
  };
}

function mapSampleReviewForInsert(review: Review) {
  const manualReview = getReviewManualReviewState(review);
  const hero = getReviewHeroFields({
    title: review.title,
    productName: review.productName,
    brand: review.brand,
    category: review.category,
    heatLevel: review.heatLevel,
    imageUrl: review.imageUrl ?? undefined,
    imageAlt: review.imageAlt ?? undefined
  });
  const qaReport = buildReviewQaReport({
    ...review,
    imageUrl: hero.imageUrl,
    imageAlt: hero.imageAlt,
    imageReviewed: manualReview.imageReviewed || hero.usesGeneratedHeroCard,
    factQaReviewed: manualReview.factQaReviewed
  });

  return {
    slug: review.slug,
    title: review.title,
    description: review.description,
    content: review.content,
    product_name: review.productName,
    brand: review.brand,
    rating: review.rating,
    price_usd: review.priceUsd ?? null,
    affiliate_url: review.affiliateUrl,
    image_url: hero.imageUrl,
    image_alt: hero.imageAlt ?? null,
    heat_level: review.heatLevel ?? null,
    scoville_min: review.scovilleMin ?? null,
    scoville_max: review.scovilleMax ?? null,
    flavor_notes: review.flavorNotes,
    cuisine_origin: review.cuisineOrigin ?? null,
    category: review.category,
    pros: review.pros,
    cons: review.cons,
    image_reviewed: manualReview.imageReviewed || hero.usesGeneratedHeroCard,
    fact_qa_reviewed: manualReview.factQaReviewed,
    qa_notes: manualReview.qaNotes ?? null,
    qa_report: qaReport,
    tags: review.tags,
    recommended: review.recommended,
    featured: review.featured ?? false,
    status: review.status,
    source: review.source,
    seo_title: review.title.slice(0, 60),
    seo_description: review.description.slice(0, 160),
    view_count: review.viewCount,
    qa_checked_at:
      manualReview.imageReviewed || manualReview.factQaReviewed
        ? new Date().toISOString()
        : null,
    published_at: review.publishedAt ?? null
  };
}

function mapSampleMerchForInsert(product: MerchProduct) {
  return {
    slug: product.slug,
    name: product.name,
    category: product.category,
    badge: product.badge,
    description: product.description,
    price_label: product.priceLabel,
    availability: product.availability,
    theme_key: product.themeKey,
    href: product.href,
    cta_label: product.ctaLabel,
    image_url: product.imageUrl ?? null,
    image_alt: product.imageAlt ?? null,
    featured: product.featured,
    status: product.status,
    sort_order: product.sortOrder,
    created_at: product.createdAt ?? null
  };
}

function getCatalogBootstrapMerchProducts(date = new Date()) {
  const seasonalSeedProducts = getSeasonalShopSeedProducts(date);
  const brandedSeedProducts = sampleMerchProducts.map((product, index) => ({
    ...product,
    sortOrder: seasonalSeedProducts.length + index + 100
  }));

  return [...seasonalSeedProducts, ...brandedSeedProducts];
}

export async function createBlogPostAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = blogSchema.safeParse({
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    content: String(formData.get("content") || "").trim(),
    tags: getOptionalText(formData, "tags"),
    imageUrl: getOptionalText(formData, "imageUrl"),
    imageAlt: getOptionalText(formData, "imageAlt"),
    status: String(formData.get("status") || "draft"),
    featured: formData.get("featured") === "on"
  });

  if (!parsed.success) {
    redirect(
      `/admin/content/blog?error=${encodeURIComponent(
        formatValidationIssue(parsed.error.issues[0], "Invalid blog post")
      )}`
    );
  }

  if (!flags.hasSupabaseAdmin) {
    redirect("/admin/content/blog?created=mock");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect("/admin/content/blog?error=Supabase%20admin%20is%20not%20configured");
  }

  const image = await resolveImageFields({
    formData,
    supabase,
    folder: "blog"
  });
  const qa = buildBlogQaPayload({
    parsed: parsed.data,
    image
  });

  if (parsed.data.status === "published") {
    const qaError = getBlogQaPublishError(qa.qaReport);
    if (qaError) {
      redirect(`/admin/content/blog?error=${encodeURIComponent(qaError)}`);
    }
  }
  const slug = await makeUniqueSlug(supabase, "blog_posts", parsed.data.title);

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      slug,
      title: parsed.data.title,
      description: parsed.data.description,
      content: parsed.data.content,
      author_name: admin.displayName,
      author_id: admin.id,
      category: parsed.data.category,
      tags: parseCsvList(parsed.data.tags || ""),
      image_url: qa.imageUrl,
      image_alt: qa.imageAlt,
      featured: parsed.data.featured ?? false,
      affiliate_disclosure: true,
      status: parsed.data.status,
      source: "editorial",
      seo_title: parsed.data.title.slice(0, 60),
      seo_description: parsed.data.description.slice(0, 160),
      read_time_minutes: calculateReadTime(parsed.data.content),
      published_at: getPublishedAt(parsed.data.status)
    })
    .select("id, slug")
    .single();

  if (error) {
    redirect(`/admin/content/blog?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "create_blog_post",
    targetType: "blog_post",
    targetId: String(data.id),
    metadata: {
      slug: data.slug,
      status: parsed.data.status
    }
  });

  revalidateBlogPaths(data.slug);
  redirect("/admin/content/blog?created=1");
}

export async function updateBlogPostAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = blogSchema.extend({ id: z.coerce.number().int().positive() }).safeParse({
    id: formData.get("id"),
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    content: String(formData.get("content") || "").trim(),
    tags: getOptionalText(formData, "tags"),
    imageUrl: getOptionalText(formData, "imageUrl"),
    imageAlt: getOptionalText(formData, "imageAlt"),
    status: String(formData.get("status") || "draft"),
    featured: formData.get("featured") === "on",
    redirectTo: getOptionalText(formData, "redirectTo")
  });

  const redirectTo = getRedirectPath(getOptionalText(formData, "redirectTo"), "/admin/content/blog");

  if (!parsed.success) {
    redirect(
      `${redirectTo}?error=${encodeURIComponent(
        formatValidationIssue(parsed.error.issues[0], "Invalid blog post")
      )}`
    );
  }

  if (!flags.hasSupabaseAdmin) {
    redirect(`${redirectTo}?updated=mock`);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect(`${redirectTo}?error=Supabase%20admin%20is%20not%20configured`);
  }

  const { data: existing, error: existingError } = await supabase
    .from("blog_posts")
    .select("id, slug, title, image_url, published_at")
    .eq("id", parsed.data.id)
    .single();

  if (existingError) {
    redirect(`${redirectTo}?error=${encodeURIComponent(existingError.message)}`);
  }

  const image = await resolveImageFields({
    formData,
    supabase,
    folder: "blog",
    existingImageUrl: existing.image_url
  });
  const qa = buildBlogQaPayload({
    parsed: parsed.data,
    image
  });

  if (parsed.data.status === "published") {
    const qaError = getBlogQaPublishError(qa.qaReport);
    if (qaError) {
      redirect(`${redirectTo}?error=${encodeURIComponent(qaError)}`);
    }
  }
  const slug =
    existing.title === parsed.data.title
      ? existing.slug
      : await makeUniqueSlug(supabase, "blog_posts", parsed.data.title);

  const { data, error } = await supabase
    .from("blog_posts")
    .update({
      slug,
      title: parsed.data.title,
      description: parsed.data.description,
      content: parsed.data.content,
      category: parsed.data.category,
      tags: parseCsvList(parsed.data.tags || ""),
      image_url: qa.imageUrl,
      image_alt: qa.imageAlt,
      featured: parsed.data.featured ?? false,
      status: parsed.data.status,
      seo_title: parsed.data.title.slice(0, 60),
      seo_description: parsed.data.description.slice(0, 160),
      read_time_minutes: calculateReadTime(parsed.data.content),
      published_at: getPublishedAt(parsed.data.status, existing.published_at)
    })
    .eq("id", parsed.data.id)
    .select("id, slug")
    .single();

  if (error) {
    redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "edit_blog_post",
    targetType: "blog_post",
    targetId: String(data.id),
    metadata: {
      slug: data.slug,
      previousSlug: existing.slug
    }
  });

  revalidateBlogPaths(data.slug, existing.slug);
  redirect(`${redirectTo}?updated=1`);
}

export async function updateBlogPostStateAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = blogStateSchema.safeParse({
    id: formData.get("id"),
    intent: formData.get("intent"),
    redirectTo: getOptionalText(formData, "redirectTo")
  });

  if (!parsed.success) {
    redirect("/admin/content/blog?error=Invalid%20content%20action");
  }

  const redirectTo = getRedirectPath(parsed.data.redirectTo, "/admin/content/blog");

  if (!flags.hasSupabaseAdmin) {
    redirect(`${redirectTo}?updated=mock`);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect(`${redirectTo}?error=Supabase%20admin%20is%20not%20configured`);
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.intent === "publish") {
    const { data: blogRow, error: blogError } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", parsed.data.id)
      .single();

    if (blogError) {
      redirect(`${redirectTo}?error=${encodeURIComponent(blogError.message)}`);
    }

    const qaReportForPublish = buildBlogQaReport(mapBlogRowToQaCandidate(blogRow));
    const qaError = getBlogQaPublishError(qaReportForPublish);

    if (qaError) {
      redirect(`${redirectTo}?error=${encodeURIComponent(qaError)}`);
    }

    updates.status = "published";
    updates.published_at = new Date().toISOString();
  }
  if (parsed.data.intent === "archive") {
    updates.status = "archived";
  }
  if (parsed.data.intent === "feature") {
    updates.featured = true;
  }
  if (parsed.data.intent === "unfeature") {
    updates.featured = false;
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .update(updates)
    .eq("id", parsed.data.id)
    .select("id, slug")
    .single();

  if (error) {
    redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "update_blog_post",
    targetType: "blog_post",
    targetId: String(data.id),
    metadata: {
      intent: parsed.data.intent
    }
  });

  if (parsed.data.intent === "publish") {
    void triggerContentShopSync(data.id, "blog_post");
  }

  revalidateBlogPaths(data.slug);
  redirect(`${redirectTo}?updated=1`);
}

export async function createRecipeAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = recipeSchema.safeParse({
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    intro: getOptionalText(formData, "intro"),
    heroSummary: getOptionalText(formData, "heroSummary"),
    heatLevel: String(formData.get("heatLevel") || ""),
    cuisineType: String(formData.get("cuisineType") || ""),
    prepTimeMinutes: formData.get("prepTimeMinutes") || 0,
    cookTimeMinutes: formData.get("cookTimeMinutes") || 0,
    activeTimeMinutes: getOptionalNumberText(formData, "activeTimeMinutes"),
    servings: formData.get("servings") || 1,
    difficulty: String(formData.get("difficulty") || "beginner"),
    ingredientSectionsJson: getJsonPayload(formData, "ingredientSectionsJson"),
    methodStepsJson: getJsonPayload(formData, "methodStepsJson"),
    tipsJson: getJsonPayload(formData, "tipsJson"),
    variationsJson: getJsonPayload(formData, "variationsJson"),
    substitutionsJson: getJsonPayload(formData, "substitutionsJson"),
    servingSuggestionsJson: getJsonPayload(formData, "servingSuggestionsJson"),
    equipmentJson: getJsonPayload(formData, "equipmentJson"),
    faqsJson: getJsonPayload(formData, "faqsJson"),
    makeAheadNotes: getOptionalText(formData, "makeAheadNotes"),
    storageNotes: getOptionalText(formData, "storageNotes"),
    reheatNotes: getOptionalText(formData, "reheatNotes"),
    qaNotes: getOptionalText(formData, "qaNotes"),
    tags: getOptionalText(formData, "tags"),
    imageUrl: getOptionalText(formData, "imageUrl"),
    imageAlt: getOptionalText(formData, "imageAlt"),
    heroImageReviewed: formData.get("heroImageReviewed") === "on",
    cuisineQaReviewed: formData.get("cuisineQaReviewed") === "on",
    status: String(formData.get("status") || "draft"),
    featured: formData.get("featured") === "on"
  });

  if (!parsed.success) {
    redirect(
      `/admin/content/recipes?error=${encodeURIComponent(
        formatValidationIssue(parsed.error.issues[0], "Invalid recipe")
      )}`
    );
  }

  let structuredContent: ReturnType<typeof parseStructuredRecipeContent>;
  try {
    structuredContent = parseStructuredRecipeContent(formData);
  } catch (error) {
    redirect(`/admin/content/recipes?error=${encodeURIComponent((error as Error).message)}`);
  }

  if (!flags.hasSupabaseAdmin) {
    redirect("/admin/content/recipes?created=mock");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect("/admin/content/recipes?error=Supabase%20admin%20is%20not%20configured");
  }

  const image = await resolveImageFields({
    formData,
    supabase,
    folder: "recipes"
  });
  const methodSteps = await resolveMethodStepImages({
    formData,
    supabase,
    methodSteps: structuredContent.methodSteps
  });
  const qa = buildRecipeQaPayload({
    parsed: parsed.data,
    structuredContent,
    methodSteps,
    image
  });

  if (parsed.data.status === "published") {
    const qaError = getRecipeQaPublishError(qa.qaReport);
    if (qaError) {
      redirect(`/admin/content/recipes?error=${encodeURIComponent(qaError)}`);
    }
  }
  const slug = await makeUniqueSlug(supabase, "recipes", parsed.data.title);

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      slug,
      title: parsed.data.title,
      description: parsed.data.description,
      intro: parsed.data.intro ?? null,
      hero_summary: parsed.data.heroSummary ?? null,
      author_name: admin.displayName,
      author_id: admin.id,
      heat_level: parsed.data.heatLevel,
      cuisine_type: parsed.data.cuisineType,
      prep_time_minutes: parsed.data.prepTimeMinutes,
      cook_time_minutes: parsed.data.cookTimeMinutes,
      active_time_minutes: parsed.data.activeTimeMinutes ?? null,
      servings: parsed.data.servings,
      difficulty: parsed.data.difficulty,
      ingredients: structuredContent.ingredients,
      ingredient_sections: structuredContent.ingredientSections,
      instructions: structuredContent.instructions,
      method_steps: methodSteps,
      tips: structuredContent.tips,
      variations: structuredContent.variations,
      make_ahead_notes: parsed.data.makeAheadNotes ?? null,
      storage_notes: parsed.data.storageNotes ?? null,
      reheat_notes: parsed.data.reheatNotes ?? null,
      substitutions: structuredContent.substitutions,
      serving_suggestions: structuredContent.servingSuggestions,
      faqs: structuredContent.faqs,
      equipment: structuredContent.equipment,
      tags: parseCsvList(parsed.data.tags || ""),
      image_url: qa.imageUrl,
      image_alt: qa.imageAlt ?? null,
      hero_image_reviewed: qa.heroImageReviewed,
      cuisine_qa_reviewed: qa.cuisineQaReviewed,
      qa_notes: qa.qaNotes,
      qa_report: qa.qaReport,
      qa_checked_at:
        qa.heroImageReviewed || qa.cuisineQaReviewed ? new Date().toISOString() : null,
      featured: parsed.data.featured ?? false,
      status: parsed.data.status,
      source: "editorial",
      affiliate_disclosure: true,
      seo_title: parsed.data.title.slice(0, 60),
      seo_description: parsed.data.description.slice(0, 160),
      published_at: getPublishedAt(parsed.data.status)
    })
    .select("id, slug")
    .single();

  if (error) {
    redirect(`/admin/content/recipes?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "create_recipe",
    targetType: "recipe",
    targetId: String(data.id),
    metadata: { slug: data.slug, status: parsed.data.status }
  });

  revalidateRecipePaths(data.slug);
  redirect("/admin/content/recipes?created=1");
}

export async function updateRecipeAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = recipeSchema.extend({ id: z.coerce.number().int().positive() }).safeParse({
    id: formData.get("id"),
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    intro: getOptionalText(formData, "intro"),
    heroSummary: getOptionalText(formData, "heroSummary"),
    heatLevel: String(formData.get("heatLevel") || ""),
    cuisineType: String(formData.get("cuisineType") || ""),
    prepTimeMinutes: formData.get("prepTimeMinutes") || 0,
    cookTimeMinutes: formData.get("cookTimeMinutes") || 0,
    activeTimeMinutes: getOptionalNumberText(formData, "activeTimeMinutes"),
    servings: formData.get("servings") || 1,
    difficulty: String(formData.get("difficulty") || "beginner"),
    ingredientSectionsJson: getJsonPayload(formData, "ingredientSectionsJson"),
    methodStepsJson: getJsonPayload(formData, "methodStepsJson"),
    tipsJson: getJsonPayload(formData, "tipsJson"),
    variationsJson: getJsonPayload(formData, "variationsJson"),
    substitutionsJson: getJsonPayload(formData, "substitutionsJson"),
    servingSuggestionsJson: getJsonPayload(formData, "servingSuggestionsJson"),
    equipmentJson: getJsonPayload(formData, "equipmentJson"),
    faqsJson: getJsonPayload(formData, "faqsJson"),
    makeAheadNotes: getOptionalText(formData, "makeAheadNotes"),
    storageNotes: getOptionalText(formData, "storageNotes"),
    reheatNotes: getOptionalText(formData, "reheatNotes"),
    qaNotes: getOptionalText(formData, "qaNotes"),
    tags: getOptionalText(formData, "tags"),
    imageUrl: getOptionalText(formData, "imageUrl"),
    imageAlt: getOptionalText(formData, "imageAlt"),
    heroImageReviewed: formData.get("heroImageReviewed") === "on",
    cuisineQaReviewed: formData.get("cuisineQaReviewed") === "on",
    status: String(formData.get("status") || "draft"),
    featured: formData.get("featured") === "on",
    redirectTo: getOptionalText(formData, "redirectTo")
  });

  const redirectTo = getRedirectPath(
    getOptionalText(formData, "redirectTo"),
    "/admin/content/recipes"
  );

  if (!parsed.success) {
    redirect(
      `${redirectTo}?error=${encodeURIComponent(
        formatValidationIssue(parsed.error.issues[0], "Invalid recipe")
      )}`
    );
  }

  let structuredContent: ReturnType<typeof parseStructuredRecipeContent>;
  try {
    structuredContent = parseStructuredRecipeContent(formData);
  } catch (error) {
    redirect(`${redirectTo}?error=${encodeURIComponent((error as Error).message)}`);
  }

  if (!flags.hasSupabaseAdmin) {
    redirect(`${redirectTo}?updated=mock`);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect(`${redirectTo}?error=Supabase%20admin%20is%20not%20configured`);
  }

  const { data: existing, error: existingError } = await supabase
    .from("recipes")
    .select("id, slug, title, image_url, published_at, source")
    .eq("id", parsed.data.id)
    .single();

  if (existingError) {
    redirect(`${redirectTo}?error=${encodeURIComponent(existingError.message)}`);
  }

  const image = await resolveImageFields({
    formData,
    supabase,
    folder: "recipes",
    existingImageUrl: existing.image_url
  });
  const methodSteps = await resolveMethodStepImages({
    formData,
    supabase,
    methodSteps: structuredContent.methodSteps
  });
  const qa = buildRecipeQaPayload({
    parsed: parsed.data,
    structuredContent,
    methodSteps,
    image
  });

  if (parsed.data.status === "published") {
    const qaError = getRecipeQaPublishError(qa.qaReport);
    if (qaError) {
      redirect(`${redirectTo}?error=${encodeURIComponent(qaError)}`);
    }
  }
  const slug =
    existing.title === parsed.data.title
      ? existing.slug
      : await makeUniqueSlug(supabase, "recipes", parsed.data.title);

  const { data, error } = await supabase
    .from("recipes")
    .update({
      slug,
      title: parsed.data.title,
      description: parsed.data.description,
      intro: parsed.data.intro ?? null,
      hero_summary: parsed.data.heroSummary ?? null,
      heat_level: parsed.data.heatLevel,
      cuisine_type: parsed.data.cuisineType,
      prep_time_minutes: parsed.data.prepTimeMinutes,
      cook_time_minutes: parsed.data.cookTimeMinutes,
      active_time_minutes: parsed.data.activeTimeMinutes ?? null,
      servings: parsed.data.servings,
      difficulty: parsed.data.difficulty,
      ingredients: structuredContent.ingredients,
      ingredient_sections: structuredContent.ingredientSections,
      instructions: structuredContent.instructions,
      method_steps: methodSteps,
      tips: structuredContent.tips,
      variations: structuredContent.variations,
      make_ahead_notes: parsed.data.makeAheadNotes ?? null,
      storage_notes: parsed.data.storageNotes ?? null,
      reheat_notes: parsed.data.reheatNotes ?? null,
      substitutions: structuredContent.substitutions,
      serving_suggestions: structuredContent.servingSuggestions,
      faqs: structuredContent.faqs,
      equipment: structuredContent.equipment,
      tags: parseCsvList(parsed.data.tags || ""),
      image_url: qa.imageUrl,
      image_alt: qa.imageAlt ?? null,
      hero_image_reviewed: qa.heroImageReviewed,
      cuisine_qa_reviewed: qa.cuisineQaReviewed,
      qa_notes: qa.qaNotes,
      qa_report: qa.qaReport,
      qa_checked_at:
        qa.heroImageReviewed || qa.cuisineQaReviewed ? new Date().toISOString() : null,
      featured: parsed.data.featured ?? false,
      status: parsed.data.status,
      seo_title: parsed.data.title.slice(0, 60),
      seo_description: parsed.data.description.slice(0, 160),
      published_at: getPublishedAt(parsed.data.status, existing.published_at)
    })
    .eq("id", parsed.data.id)
    .select("id, slug")
    .single();

  if (error) {
    redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "edit_recipe",
    targetType: "recipe",
    targetId: String(data.id),
    metadata: { slug: data.slug, previousSlug: existing.slug }
  });

  if (parsed.data.status === "published" && existing.source === "ai_generated") {
    await ensureSocialPostsForPublishedContent({
      supabase,
      contentType: "recipe",
      contentId: data.id,
      title: parsed.data.title,
      slug: data.slug,
      imageUrl: qa.imageUrl
    });
  }

  revalidateRecipePaths(data.slug, existing.slug);
  redirect(`${redirectTo}?updated=1`);
}

export async function updateRecipeStateAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = contentStateSchema.safeParse({
    id: formData.get("id"),
    intent: formData.get("intent"),
    redirectTo: getOptionalText(formData, "redirectTo")
  });

  if (!parsed.success) {
    redirect("/admin/content/recipes?error=Invalid%20content%20action");
  }

  const redirectTo = getRedirectPath(parsed.data.redirectTo, "/admin/content/recipes");

  if (!flags.hasSupabaseAdmin) {
    redirect(`${redirectTo}?updated=mock`);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect(`${redirectTo}?error=Supabase%20admin%20is%20not%20configured`);
  }

  let qaReportForPublish: ReturnType<typeof buildRecipeQaReport> | undefined;
  let recipeRowForPublish: any | undefined;
  let publishHeroFields:
    | ReturnType<typeof getRecipeHeroFields>
    | undefined;

  if (parsed.data.intent === "publish") {
    const { data: recipeRow, error: recipeError } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", parsed.data.id)
      .single();

    if (recipeError) {
      redirect(`${redirectTo}?error=${encodeURIComponent(recipeError.message)}`);
    }

    recipeRowForPublish = recipeRow;
    publishHeroFields = getRecipeHeroFields({
      title: recipeRow.title,
      cuisineType: recipeRow.cuisine_type,
      heatLevel: recipeRow.heat_level,
      description: recipeRow.description,
      heroSummary: recipeRow.hero_summary ?? undefined,
      imageUrl: recipeRow.image_url ?? undefined,
      imageAlt: recipeRow.image_alt ?? undefined
    });
    qaReportForPublish = buildRecipeQaReport(
      mapRecipeRowToQaCandidate({
        ...recipeRow,
        image_url: publishHeroFields.imageUrl,
        image_alt: publishHeroFields.imageAlt,
        hero_image_reviewed: Boolean(recipeRow.hero_image_reviewed)
      })
    );
    const qaError = getRecipeQaPublishError(qaReportForPublish);

    if (qaError) {
      redirect(`${redirectTo}?error=${encodeURIComponent(qaError)}`);
    }
  }

  const { data, error } = await supabase
    .from("recipes")
    .update({
      ...buildStatusUpdates(parsed.data.intent),
      ...(parsed.data.intent === "publish"
        ? {
            image_url: publishHeroFields?.imageUrl ?? recipeRowForPublish?.image_url ?? null,
            image_alt: publishHeroFields?.imageAlt ?? recipeRowForPublish?.image_alt ?? null,
            hero_image_reviewed: Boolean(recipeRowForPublish?.hero_image_reviewed),
            qa_checked_at: new Date().toISOString(),
            qa_report: qaReportForPublish
          }
        : {})
    })
    .eq("id", parsed.data.id)
    .select("id, slug, title")
    .single();

  if (error) {
    redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
  }

  if (parsed.data.intent === "publish" && recipeRowForPublish?.source === "ai_generated") {
    await ensureSocialPostsForPublishedContent({
      supabase,
      contentType: "recipe",
      contentId: data.id,
      title: data.title,
      slug: data.slug,
      imageUrl: recipeRowForPublish.image_url
    });
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "update_recipe",
    targetType: "recipe",
    targetId: String(data.id),
    metadata: { intent: parsed.data.intent }
  });

  if (parsed.data.intent === "publish") {
    void triggerContentShopSync(data.id, "recipe");
  }

  revalidateRecipePaths(data.slug);
  redirect(`${redirectTo}?updated=1`);
}

export async function deletePendingReviewRecipesAction(formData: FormData) {
  const admin = await requireAdmin();
  const redirectTo = getRedirectPath(
    getOptionalText(formData, "redirectTo"),
    "/admin/content/recipes"
  );

  if (!flags.hasSupabaseAdmin) {
    redirect(`${redirectTo}?clearedReviewQueue=mock`);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect(`${redirectTo}?error=Supabase%20admin%20is%20not%20configured`);
  }

  const { data: pendingRows, error: pendingError } = await supabase
    .from("recipes")
    .select("id, slug")
    .eq("status", "pending_review");

  if (pendingError) {
    redirect(`${redirectTo}?error=${encodeURIComponent(pendingError.message)}`);
  }

  const pendingIds = (pendingRows ?? []).map((row) => row.id);
  const deletedCount = pendingIds.length;

  if (pendingIds.length) {
    const { error: deleteError } = await supabase
      .from("recipes")
      .delete()
      .in("id", pendingIds);

    if (deleteError) {
      redirect(`${redirectTo}?error=${encodeURIComponent(deleteError.message)}`);
    }
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "delete_pending_review_recipes",
    targetType: "recipe",
    targetId: "pending_review",
    metadata: {
      deletedCount,
      slugs: (pendingRows ?? []).map((row) => row.slug).slice(0, 25)
    }
  });

  revalidatePath("/admin/content/recipes");
  revalidatePath("/recipes");

  for (const row of pendingRows ?? []) {
    revalidatePath(`/recipes/${row.slug}`);
  }

  redirect(`${redirectTo}?clearedReviewQueue=${deletedCount}`);
}

export async function createReviewAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = reviewSchema.safeParse({
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    productName: String(formData.get("productName") || "").trim(),
    brand: String(formData.get("brand") || "").trim(),
    rating: formData.get("rating") || 1,
    priceUsd: getOptionalNumberText(formData, "priceUsd"),
    affiliateUrl: String(formData.get("affiliateUrl") || "").trim(),
    content: String(formData.get("content") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    heatLevel: getOptionalText(formData, "heatLevel"),
    scovilleMin: getOptionalNumberText(formData, "scovilleMin"),
    scovilleMax: getOptionalNumberText(formData, "scovilleMax"),
    flavorNotes: getOptionalText(formData, "flavorNotes"),
    cuisineOrigin: getOptionalText(formData, "cuisineOrigin"),
    pros: getOptionalText(formData, "pros"),
    cons: getOptionalText(formData, "cons"),
    qaNotes: getOptionalText(formData, "qaNotes"),
    tags: getOptionalText(formData, "tags"),
    imageUrl: getOptionalText(formData, "imageUrl"),
    imageAlt: getOptionalText(formData, "imageAlt"),
    imageReviewed: formData.get("imageReviewed") === "on",
    factQaReviewed: formData.get("factQaReviewed") === "on",
    status: String(formData.get("status") || "draft"),
    featured: formData.get("featured") === "on",
    recommended: formData.get("recommended") === "on"
  });

  if (!parsed.success) {
    redirect(
      `/admin/content/reviews?error=${encodeURIComponent(
        formatValidationIssue(parsed.error.issues[0], "Invalid review")
      )}`
    );
  }

  if (!flags.hasSupabaseAdmin) {
    redirect("/admin/content/reviews?created=mock");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect("/admin/content/reviews?error=Supabase%20admin%20is%20not%20configured");
  }

  const image = await resolveImageFields({
    formData,
    supabase,
    folder: "reviews"
  });
  const qa = buildReviewQaPayload({
    parsed: parsed.data,
    image
  });

  if (parsed.data.status === "published") {
    const qaError = getReviewQaPublishError(qa.qaReport);
    if (qaError) {
      redirect(`/admin/content/reviews?error=${encodeURIComponent(qaError)}`);
    }
  }
  const slug = await makeUniqueSlug(supabase, "reviews", parsed.data.title);

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      slug,
      title: parsed.data.title,
      description: parsed.data.description,
      content: parsed.data.content,
      product_name: parsed.data.productName,
      brand: parsed.data.brand,
      rating: parsed.data.rating,
      price_usd: parsed.data.priceUsd ?? null,
      affiliate_url: parsed.data.affiliateUrl,
      image_url: qa.imageUrl,
      image_alt: qa.imageAlt ?? null,
      heat_level: parsed.data.heatLevel ?? null,
      scoville_min: parsed.data.scovilleMin ?? null,
      scoville_max: parsed.data.scovilleMax ?? null,
      flavor_notes: parseCsvList(parsed.data.flavorNotes || ""),
      cuisine_origin: parsed.data.cuisineOrigin ?? null,
      category: parsed.data.category,
      pros: parseLineList(parsed.data.pros || ""),
      cons: parseLineList(parsed.data.cons || ""),
      image_reviewed: qa.imageReviewed,
      fact_qa_reviewed: qa.factQaReviewed,
      qa_notes: qa.qaNotes,
      qa_report: qa.qaReport,
      qa_checked_at:
        qa.imageReviewed || qa.factQaReviewed ? new Date().toISOString() : null,
      tags: parseCsvList(parsed.data.tags || ""),
      recommended: parsed.data.recommended ?? false,
      featured: parsed.data.featured ?? false,
      status: parsed.data.status,
      source: "editorial",
      seo_title: parsed.data.title.slice(0, 60),
      seo_description: parsed.data.description.slice(0, 160),
      published_at: getPublishedAt(parsed.data.status)
    })
    .select("id, slug")
    .single();

  if (error) {
    redirect(`/admin/content/reviews?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "create_review",
    targetType: "review",
    targetId: String(data.id),
    metadata: { slug: data.slug, status: parsed.data.status }
  });

  revalidateReviewPaths(data.slug);
  redirect("/admin/content/reviews?created=1");
}

export async function updateReviewAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = reviewSchema.extend({ id: z.coerce.number().int().positive() }).safeParse({
    id: formData.get("id"),
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    productName: String(formData.get("productName") || "").trim(),
    brand: String(formData.get("brand") || "").trim(),
    rating: formData.get("rating") || 1,
    priceUsd: getOptionalNumberText(formData, "priceUsd"),
    affiliateUrl: String(formData.get("affiliateUrl") || "").trim(),
    content: String(formData.get("content") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    heatLevel: getOptionalText(formData, "heatLevel"),
    scovilleMin: getOptionalNumberText(formData, "scovilleMin"),
    scovilleMax: getOptionalNumberText(formData, "scovilleMax"),
    flavorNotes: getOptionalText(formData, "flavorNotes"),
    cuisineOrigin: getOptionalText(formData, "cuisineOrigin"),
    pros: getOptionalText(formData, "pros"),
    cons: getOptionalText(formData, "cons"),
    qaNotes: getOptionalText(formData, "qaNotes"),
    tags: getOptionalText(formData, "tags"),
    imageUrl: getOptionalText(formData, "imageUrl"),
    imageAlt: getOptionalText(formData, "imageAlt"),
    imageReviewed: formData.get("imageReviewed") === "on",
    factQaReviewed: formData.get("factQaReviewed") === "on",
    status: String(formData.get("status") || "draft"),
    featured: formData.get("featured") === "on",
    recommended: formData.get("recommended") === "on",
    redirectTo: getOptionalText(formData, "redirectTo")
  });

  const redirectTo = getRedirectPath(
    getOptionalText(formData, "redirectTo"),
    "/admin/content/reviews"
  );

  if (!parsed.success) {
    redirect(
      `${redirectTo}?error=${encodeURIComponent(
        formatValidationIssue(parsed.error.issues[0], "Invalid review")
      )}`
    );
  }

  if (!flags.hasSupabaseAdmin) {
    redirect(`${redirectTo}?updated=mock`);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect(`${redirectTo}?error=Supabase%20admin%20is%20not%20configured`);
  }

  const { data: existing, error: existingError } = await supabase
    .from("reviews")
    .select("id, slug, title, image_url, published_at, source")
    .eq("id", parsed.data.id)
    .single();

  if (existingError) {
    redirect(`${redirectTo}?error=${encodeURIComponent(existingError.message)}`);
  }

  const image = await resolveImageFields({
    formData,
    supabase,
    folder: "reviews",
    existingImageUrl: existing.image_url
  });
  const qa = buildReviewQaPayload({
    parsed: parsed.data,
    image
  });

  if (parsed.data.status === "published") {
    const qaError = getReviewQaPublishError(qa.qaReport);
    if (qaError) {
      redirect(`${redirectTo}?error=${encodeURIComponent(qaError)}`);
    }
  }
  const slug =
    existing.title === parsed.data.title
      ? existing.slug
      : await makeUniqueSlug(supabase, "reviews", parsed.data.title);

  const { data, error } = await supabase
    .from("reviews")
    .update({
      slug,
      title: parsed.data.title,
      description: parsed.data.description,
      content: parsed.data.content,
      product_name: parsed.data.productName,
      brand: parsed.data.brand,
      rating: parsed.data.rating,
      price_usd: parsed.data.priceUsd ?? null,
      affiliate_url: parsed.data.affiliateUrl,
      image_url: qa.imageUrl,
      image_alt: qa.imageAlt ?? null,
      heat_level: parsed.data.heatLevel ?? null,
      scoville_min: parsed.data.scovilleMin ?? null,
      scoville_max: parsed.data.scovilleMax ?? null,
      flavor_notes: parseCsvList(parsed.data.flavorNotes || ""),
      cuisine_origin: parsed.data.cuisineOrigin ?? null,
      category: parsed.data.category,
      pros: parseLineList(parsed.data.pros || ""),
      cons: parseLineList(parsed.data.cons || ""),
      image_reviewed: qa.imageReviewed,
      fact_qa_reviewed: qa.factQaReviewed,
      qa_notes: qa.qaNotes,
      qa_report: qa.qaReport,
      qa_checked_at:
        qa.imageReviewed || qa.factQaReviewed ? new Date().toISOString() : null,
      tags: parseCsvList(parsed.data.tags || ""),
      recommended: parsed.data.recommended ?? false,
      featured: parsed.data.featured ?? false,
      status: parsed.data.status,
      seo_title: parsed.data.title.slice(0, 60),
      seo_description: parsed.data.description.slice(0, 160),
      published_at: getPublishedAt(parsed.data.status, existing.published_at)
    })
    .eq("id", parsed.data.id)
    .select("id, slug")
    .single();

  if (error) {
    redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "edit_review",
    targetType: "review",
    targetId: String(data.id),
    metadata: { slug: data.slug, previousSlug: existing.slug }
  });

  if (parsed.data.status === "published" && existing.source === "ai_generated") {
    await ensureSocialPostsForPublishedContent({
      supabase,
      contentType: "review",
      contentId: data.id,
      title: parsed.data.title,
      slug: data.slug,
      imageUrl: qa.imageUrl
    });
  }

  revalidateReviewPaths(data.slug, existing.slug);
  redirect(`${redirectTo}?updated=1`);
}

export async function updateReviewStateAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = contentStateSchema.safeParse({
    id: formData.get("id"),
    intent: formData.get("intent"),
    redirectTo: getOptionalText(formData, "redirectTo")
  });

  if (!parsed.success) {
    redirect("/admin/content/reviews?error=Invalid%20content%20action");
  }

  const redirectTo = getRedirectPath(parsed.data.redirectTo, "/admin/content/reviews");

  if (!flags.hasSupabaseAdmin) {
    redirect(`${redirectTo}?updated=mock`);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect(`${redirectTo}?error=Supabase%20admin%20is%20not%20configured`);
  }

  let qaReportForPublish: ReturnType<typeof buildReviewQaReport> | undefined;
  let reviewRowForPublish: any | undefined;
  let publishHeroFields:
    | ReturnType<typeof getReviewHeroFields>
    | undefined;

  if (parsed.data.intent === "publish") {
    const { data: reviewRow, error: reviewError } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", parsed.data.id)
      .single();

    if (reviewError) {
      redirect(`${redirectTo}?error=${encodeURIComponent(reviewError.message)}`);
    }

    reviewRowForPublish = reviewRow;
    publishHeroFields = getReviewHeroFields({
      title: reviewRow.title,
      productName: reviewRow.product_name,
      brand: reviewRow.brand,
      category: reviewRow.category,
      heatLevel: reviewRow.heat_level ?? undefined,
      imageUrl: reviewRow.image_url ?? undefined,
      imageAlt: reviewRow.image_alt ?? undefined
    });
    qaReportForPublish = buildReviewQaReport(mapReviewRowToQaCandidate(reviewRow));
    const qaError = getReviewQaPublishError(qaReportForPublish);

    if (qaError) {
      redirect(`${redirectTo}?error=${encodeURIComponent(qaError)}`);
    }
  }

  const { data, error } = await supabase
    .from("reviews")
    .update({
      ...buildStatusUpdates(parsed.data.intent),
      ...(parsed.data.intent === "publish"
        ? {
            image_url: publishHeroFields?.imageUrl ?? reviewRowForPublish?.image_url ?? null,
            image_alt: publishHeroFields?.imageAlt ?? reviewRowForPublish?.image_alt ?? null,
            image_reviewed: Boolean(reviewRowForPublish?.image_reviewed),
            qa_checked_at: new Date().toISOString(),
            qa_report: qaReportForPublish
          }
        : {})
    })
    .eq("id", parsed.data.id)
    .select("id, slug, title, image_url")
    .single();

  if (error) {
    redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
  }

  if (parsed.data.intent === "publish" && reviewRowForPublish?.source === "ai_generated") {
    await ensureSocialPostsForPublishedContent({
      supabase,
      contentType: "review",
      contentId: data.id,
      title: data.title,
      slug: data.slug,
      imageUrl: data.image_url
    });
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "update_review",
    targetType: "review",
    targetId: String(data.id),
    metadata: { intent: parsed.data.intent }
  });

  if (parsed.data.intent === "publish") {
    void triggerContentShopSync(data.id, "review");
  }

  revalidateReviewPaths(data.slug);
  redirect(`${redirectTo}?updated=1`);
}

export async function createMerchProductAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = merchSchema.safeParse({
    name: String(formData.get("name") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    badge: String(formData.get("badge") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    priceLabel: String(formData.get("priceLabel") || "").trim(),
    availability: String(formData.get("availability") || "preview"),
    themeKey: String(formData.get("themeKey") || "flame"),
    href: String(formData.get("href") || "").trim(),
    ctaLabel: String(formData.get("ctaLabel") || "").trim(),
    sortOrder: formData.get("sortOrder") || 0,
    imageUrl: getOptionalText(formData, "imageUrl"),
    imageAlt: getOptionalText(formData, "imageAlt"),
    status: String(formData.get("status") || "draft"),
    featured: formData.get("featured") === "on"
  });

  if (!parsed.success) {
    redirect(
      `/admin/content/merch?error=${encodeURIComponent(
        formatValidationIssue(parsed.error.issues[0], "Invalid merch product")
      )}`
    );
  }

  if (!flags.hasSupabaseAdmin) {
    redirect("/admin/content/merch?created=mock");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect("/admin/content/merch?error=Supabase%20admin%20is%20not%20configured");
  }

  const image = await resolveImageFields({
    formData,
    supabase,
    folder: "merch"
  });
  const slug = await makeUniqueSlug(supabase, "merch_products", parsed.data.name);

  const { data, error } = await supabase
    .from("merch_products")
    .insert({
      slug,
      name: parsed.data.name,
      category: parsed.data.category,
      badge: parsed.data.badge,
      description: parsed.data.description,
      price_label: parsed.data.priceLabel,
      availability: parsed.data.availability,
      theme_key: parsed.data.themeKey,
      href: parsed.data.href,
      cta_label: parsed.data.ctaLabel,
      sort_order: parsed.data.sortOrder,
      image_url: image.imageUrl,
      image_alt: image.imageAlt ?? null,
      featured: parsed.data.featured ?? false,
      status: parsed.data.status
    })
    .select("id, slug")
    .single();

  if (error) {
    redirect(`/admin/content/merch?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "create_merch_product",
    targetType: "merch_product",
    targetId: String(data.id),
    metadata: { slug: data.slug, status: parsed.data.status }
  });

  revalidateMerchPaths();
  redirect("/admin/content/merch?created=1");
}

export async function updateMerchProductAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = merchSchema.extend({ id: z.coerce.number().int().positive() }).safeParse({
    id: formData.get("id"),
    name: String(formData.get("name") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    badge: String(formData.get("badge") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    priceLabel: String(formData.get("priceLabel") || "").trim(),
    availability: String(formData.get("availability") || "preview"),
    themeKey: String(formData.get("themeKey") || "flame"),
    href: String(formData.get("href") || "").trim(),
    ctaLabel: String(formData.get("ctaLabel") || "").trim(),
    sortOrder: formData.get("sortOrder") || 0,
    imageUrl: getOptionalText(formData, "imageUrl"),
    imageAlt: getOptionalText(formData, "imageAlt"),
    status: String(formData.get("status") || "draft"),
    featured: formData.get("featured") === "on",
    redirectTo: getOptionalText(formData, "redirectTo")
  });

  const redirectTo = getRedirectPath(
    getOptionalText(formData, "redirectTo"),
    "/admin/content/merch"
  );

  if (!parsed.success) {
    redirect(
      `${redirectTo}?error=${encodeURIComponent(
        formatValidationIssue(parsed.error.issues[0], "Invalid merch product")
      )}`
    );
  }

  if (!flags.hasSupabaseAdmin) {
    redirect(`${redirectTo}?updated=mock`);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect(`${redirectTo}?error=Supabase%20admin%20is%20not%20configured`);
  }

  const { data: existing, error: existingError } = await supabase
    .from("merch_products")
    .select("id, slug, name, image_url")
    .eq("id", parsed.data.id)
    .single();

  if (existingError) {
    redirect(`${redirectTo}?error=${encodeURIComponent(existingError.message)}`);
  }

  const image = await resolveImageFields({
    formData,
    supabase,
    folder: "merch",
    existingImageUrl: existing.image_url
  });
  const slug =
    existing.name === parsed.data.name
      ? existing.slug
      : await makeUniqueSlug(supabase, "merch_products", parsed.data.name);

  const { data, error } = await supabase
    .from("merch_products")
    .update({
      slug,
      name: parsed.data.name,
      category: parsed.data.category,
      badge: parsed.data.badge,
      description: parsed.data.description,
      price_label: parsed.data.priceLabel,
      availability: parsed.data.availability,
      theme_key: parsed.data.themeKey,
      href: parsed.data.href,
      cta_label: parsed.data.ctaLabel,
      sort_order: parsed.data.sortOrder,
      image_url: image.imageUrl,
      image_alt: image.imageAlt ?? null,
      featured: parsed.data.featured ?? false,
      status: parsed.data.status
    })
    .eq("id", parsed.data.id)
    .select("id, slug")
    .single();

  if (error) {
    redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "edit_merch_product",
    targetType: "merch_product",
    targetId: String(data.id),
    metadata: { slug: data.slug, previousSlug: existing.slug }
  });

  revalidateMerchPaths();
  redirect(`${redirectTo}?updated=1`);
}

export async function updateMerchProductStateAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = contentStateSchema.safeParse({
    id: formData.get("id"),
    intent: formData.get("intent")
  });

  if (!parsed.success) {
    redirect("/admin/content/merch?error=Invalid%20content%20action");
  }

  if (!flags.hasSupabaseAdmin) {
    redirect("/admin/content/merch?updated=mock");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect("/admin/content/merch?error=Supabase%20admin%20is%20not%20configured");
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.intent === "publish") {
    updates.status = "published";
  }
  if (parsed.data.intent === "archive") {
    updates.status = "archived";
  }
  if (parsed.data.intent === "feature") {
    updates.featured = true;
  }
  if (parsed.data.intent === "unfeature") {
    updates.featured = false;
  }

  const { data, error } = await supabase
    .from("merch_products")
    .update(updates)
    .eq("id", parsed.data.id)
    .select("id, slug")
    .single();

  if (error) {
    redirect(`/admin/content/merch?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "update_merch_product",
    targetType: "merch_product",
    targetId: String(data.id),
    metadata: { intent: parsed.data.intent }
  });

  revalidateMerchPaths();
  redirect("/admin/content/merch?updated=1");
}

export async function importSampleCatalogAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = importCatalogSchema.safeParse({
    catalog: formData.get("catalog"),
    redirectTo: getOptionalText(formData, "redirectTo")
  });

  const redirectTo = getRedirectPath(getOptionalText(formData, "redirectTo"), "/admin");

  if (!parsed.success) {
    redirect(`${redirectTo}?error=Invalid%20catalog%20import%20request`);
  }

  if (!flags.hasSupabaseAdmin) {
    redirect(`${redirectTo}?imported=mock`);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect(`${redirectTo}?error=Supabase%20admin%20is%20not%20configured`);
  }

  const counts = {
    blogs: 0,
    recipes: 0,
    reviews: 0,
    merch: 0
  };

  if (parsed.data.catalog === "blogs" || parsed.data.catalog === "all") {
    const { error } = await supabase.from("blog_posts").upsert(
      sampleBlogPosts.map(mapSampleBlogForInsert),
      { onConflict: "slug" }
    );

    if (error) {
      redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
    }

    counts.blogs = sampleBlogPosts.length;
  }

  if (parsed.data.catalog === "recipes" || parsed.data.catalog === "all") {
    const { error } = await supabase.from("recipes").upsert(
      sampleRecipes.map(mapSampleRecipeForInsert),
      { onConflict: "slug" }
    );

    if (error) {
      redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
    }

    counts.recipes = sampleRecipes.length;
  }

  if (parsed.data.catalog === "reviews" || parsed.data.catalog === "all") {
    const { error } = await supabase.from("reviews").upsert(
      sampleReviews.map(mapSampleReviewForInsert),
      { onConflict: "slug" }
    );

    if (error) {
      redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
    }

    counts.reviews = sampleReviews.length;
  }

  if (parsed.data.catalog === "merch" || parsed.data.catalog === "all") {
    const merchBootstrapProducts = getCatalogBootstrapMerchProducts();
    const { error } = await supabase.from("merch_products").upsert(
      merchBootstrapProducts.map(mapSampleMerchForInsert),
      { onConflict: "slug" }
    );

    if (error) {
      redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
    }

    counts.merch = merchBootstrapProducts.length;
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "import_sample_catalog",
    targetType: "catalog",
    targetId: parsed.data.catalog,
    metadata: counts
  });

  revalidateCatalogBootstrapPaths();
  redirect(
    `${redirectTo}?imported=${parsed.data.catalog}&blogs=${counts.blogs}&recipes=${counts.recipes}&reviews=${counts.reviews}&merch=${counts.merch}`
  );
}
