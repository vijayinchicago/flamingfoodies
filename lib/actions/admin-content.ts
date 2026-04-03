"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { flags } from "@/lib/env";
import { merchThemeOptions } from "@/lib/merch";
import {
  parseCsvList,
  parseLineList,
  parseRecipeIngredients,
  parseRecipeInstructions
} from "@/lib/parsers";
import {
  sampleMerchProducts,
  sampleRecipes,
  sampleReviews
} from "@/lib/sample-data";
import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { MerchProduct, Recipe, Review } from "@/lib/types";
import { calculateReadTime, slugify } from "@/lib/utils";

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

const heatLevels = ["mild", "medium", "hot", "inferno", "reaper"] as const;
const cuisineTypes = [
  "american",
  "mexican",
  "thai",
  "korean",
  "indian",
  "chinese",
  "japanese",
  "ethiopian",
  "peruvian",
  "jamaican",
  "cajun",
  "szechuan",
  "vietnamese",
  "west_african",
  "middle_eastern",
  "caribbean",
  "italian",
  "moroccan",
  "other"
] as const;
const difficulties = ["beginner", "intermediate", "advanced"] as const;
const merchAvailability = ["preview", "waitlist", "live"] as const;

const blogSchema = z.object({
  title: z.string().min(6).max(120),
  description: z.string().min(20).max(220),
  category: z.string().min(3).max(40),
  content: z.string().min(40),
  tags: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageAlt: z.string().max(180).optional(),
  status: z.enum(["draft", "published"]),
  featured: z.boolean().optional(),
  redirectTo: z.string().optional()
});

const recipeSchema = z.object({
  title: z.string().min(6).max(120),
  description: z.string().min(20).max(220),
  intro: z.string().min(20).max(600).optional(),
  heatLevel: z.enum(heatLevels),
  cuisineType: z.enum(cuisineTypes),
  prepTimeMinutes: z.coerce.number().int().min(0),
  cookTimeMinutes: z.coerce.number().int().min(0),
  servings: z.coerce.number().int().min(1),
  difficulty: z.enum(difficulties),
  ingredients: z.string().min(5),
  instructions: z.string().min(5),
  tips: z.string().optional(),
  variations: z.string().optional(),
  equipment: z.string().optional(),
  tags: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageAlt: z.string().max(180).optional(),
  status: z.enum(["draft", "published"]),
  featured: z.boolean().optional(),
  redirectTo: z.string().optional()
});

const reviewSchema = z.object({
  title: z.string().min(6).max(120),
  description: z.string().min(20).max(220),
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
  tags: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageAlt: z.string().max(180).optional(),
  status: z.enum(["draft", "published"]),
  featured: z.boolean().optional(),
  recommended: z.boolean().optional(),
  redirectTo: z.string().optional()
});

const merchSchema = z.object({
  name: z.string().min(3).max(120),
  category: z.string().min(2).max(60),
  badge: z.string().min(2).max(40),
  description: z.string().min(20).max(220),
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
  intent: z.enum(["publish", "archive", "feature", "unfeature"])
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
  ])
});

const importCatalogSchema = z.object({
  catalog: z.enum(["recipes", "reviews", "merch", "all"]),
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

function getPublishedAt(status: "draft" | "published", existingPublishedAt?: string | null) {
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
  revalidatePath("/recipes");
  revalidatePath("/reviews");
  revalidateMerchPaths();
}

function mapSampleRecipeForInsert(recipe: Recipe) {
  return {
    slug: recipe.slug,
    title: recipe.title,
    description: recipe.description,
    intro: recipe.intro ?? null,
    author_name: recipe.authorName,
    heat_level: recipe.heatLevel,
    cuisine_type: recipe.cuisineType,
    prep_time_minutes: recipe.prepTimeMinutes,
    cook_time_minutes: recipe.cookTimeMinutes,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    tips: recipe.tips,
    variations: recipe.variations,
    equipment: recipe.equipment,
    tags: recipe.tags,
    image_url: recipe.imageUrl ?? null,
    image_alt: recipe.imageAlt ?? null,
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
    image_url: review.imageUrl ?? null,
    image_alt: review.imageAlt ?? null,
    heat_level: review.heatLevel ?? null,
    scoville_min: review.scovilleMin ?? null,
    scoville_max: review.scovilleMax ?? null,
    flavor_notes: review.flavorNotes,
    cuisine_origin: review.cuisineOrigin ?? null,
    category: review.category,
    pros: review.pros,
    cons: review.cons,
    tags: review.tags,
    recommended: review.recommended,
    featured: review.featured ?? false,
    status: review.status,
    source: review.source,
    seo_title: review.title.slice(0, 60),
    seo_description: review.description.slice(0, 160),
    view_count: review.viewCount,
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
        parsed.error.issues[0]?.message || "Invalid blog post"
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
      image_url: image.imageUrl,
      image_alt: image.imageAlt ?? null,
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
        parsed.error.issues[0]?.message || "Invalid blog post"
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
      image_url: image.imageUrl,
      image_alt: image.imageAlt ?? null,
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
    intent: formData.get("intent")
  });

  if (!parsed.success) {
    redirect("/admin/content/blog?error=Invalid%20content%20action");
  }

  if (!flags.hasSupabaseAdmin) {
    redirect("/admin/content/blog?updated=mock");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect("/admin/content/blog?error=Supabase%20admin%20is%20not%20configured");
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.intent === "publish") {
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
    redirect(`/admin/content/blog?error=${encodeURIComponent(error.message)}`);
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

  revalidateBlogPaths(data.slug);
  redirect("/admin/content/blog?updated=1");
}

export async function createRecipeAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = recipeSchema.safeParse({
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    intro: getOptionalText(formData, "intro"),
    heatLevel: String(formData.get("heatLevel") || ""),
    cuisineType: String(formData.get("cuisineType") || ""),
    prepTimeMinutes: formData.get("prepTimeMinutes") || 0,
    cookTimeMinutes: formData.get("cookTimeMinutes") || 0,
    servings: formData.get("servings") || 1,
    difficulty: String(formData.get("difficulty") || "beginner"),
    ingredients: String(formData.get("ingredients") || "").trim(),
    instructions: String(formData.get("instructions") || "").trim(),
    tips: getOptionalText(formData, "tips"),
    variations: getOptionalText(formData, "variations"),
    equipment: getOptionalText(formData, "equipment"),
    tags: getOptionalText(formData, "tags"),
    imageUrl: getOptionalText(formData, "imageUrl"),
    imageAlt: getOptionalText(formData, "imageAlt"),
    status: String(formData.get("status") || "draft"),
    featured: formData.get("featured") === "on"
  });

  if (!parsed.success) {
    redirect(
      `/admin/content/recipes?error=${encodeURIComponent(
        parsed.error.issues[0]?.message || "Invalid recipe"
      )}`
    );
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
  const slug = await makeUniqueSlug(supabase, "recipes", parsed.data.title);

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      slug,
      title: parsed.data.title,
      description: parsed.data.description,
      intro: parsed.data.intro ?? null,
      author_name: admin.displayName,
      author_id: admin.id,
      heat_level: parsed.data.heatLevel,
      cuisine_type: parsed.data.cuisineType,
      prep_time_minutes: parsed.data.prepTimeMinutes,
      cook_time_minutes: parsed.data.cookTimeMinutes,
      servings: parsed.data.servings,
      difficulty: parsed.data.difficulty,
      ingredients: parseRecipeIngredients(parsed.data.ingredients),
      instructions: parseRecipeInstructions(parsed.data.instructions),
      tips: parseLineList(parsed.data.tips || ""),
      variations: parseLineList(parsed.data.variations || ""),
      equipment: parseLineList(parsed.data.equipment || ""),
      tags: parseCsvList(parsed.data.tags || ""),
      image_url: image.imageUrl,
      image_alt: image.imageAlt ?? null,
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
    heatLevel: String(formData.get("heatLevel") || ""),
    cuisineType: String(formData.get("cuisineType") || ""),
    prepTimeMinutes: formData.get("prepTimeMinutes") || 0,
    cookTimeMinutes: formData.get("cookTimeMinutes") || 0,
    servings: formData.get("servings") || 1,
    difficulty: String(formData.get("difficulty") || "beginner"),
    ingredients: String(formData.get("ingredients") || "").trim(),
    instructions: String(formData.get("instructions") || "").trim(),
    tips: getOptionalText(formData, "tips"),
    variations: getOptionalText(formData, "variations"),
    equipment: getOptionalText(formData, "equipment"),
    tags: getOptionalText(formData, "tags"),
    imageUrl: getOptionalText(formData, "imageUrl"),
    imageAlt: getOptionalText(formData, "imageAlt"),
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
        parsed.error.issues[0]?.message || "Invalid recipe"
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
    .from("recipes")
    .select("id, slug, title, image_url, published_at")
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
      heat_level: parsed.data.heatLevel,
      cuisine_type: parsed.data.cuisineType,
      prep_time_minutes: parsed.data.prepTimeMinutes,
      cook_time_minutes: parsed.data.cookTimeMinutes,
      servings: parsed.data.servings,
      difficulty: parsed.data.difficulty,
      ingredients: parseRecipeIngredients(parsed.data.ingredients),
      instructions: parseRecipeInstructions(parsed.data.instructions),
      tips: parseLineList(parsed.data.tips || ""),
      variations: parseLineList(parsed.data.variations || ""),
      equipment: parseLineList(parsed.data.equipment || ""),
      tags: parseCsvList(parsed.data.tags || ""),
      image_url: image.imageUrl,
      image_alt: image.imageAlt ?? null,
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

  revalidateRecipePaths(data.slug, existing.slug);
  redirect(`${redirectTo}?updated=1`);
}

export async function updateRecipeStateAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = contentStateSchema.safeParse({
    id: formData.get("id"),
    intent: formData.get("intent")
  });

  if (!parsed.success) {
    redirect("/admin/content/recipes?error=Invalid%20content%20action");
  }

  if (!flags.hasSupabaseAdmin) {
    redirect("/admin/content/recipes?updated=mock");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect("/admin/content/recipes?error=Supabase%20admin%20is%20not%20configured");
  }

  const { data, error } = await supabase
    .from("recipes")
    .update(buildStatusUpdates(parsed.data.intent))
    .eq("id", parsed.data.id)
    .select("id, slug")
    .single();

  if (error) {
    redirect(`/admin/content/recipes?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "update_recipe",
    targetType: "recipe",
    targetId: String(data.id),
    metadata: { intent: parsed.data.intent }
  });

  revalidateRecipePaths(data.slug);
  redirect("/admin/content/recipes?updated=1");
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
    tags: getOptionalText(formData, "tags"),
    imageUrl: getOptionalText(formData, "imageUrl"),
    imageAlt: getOptionalText(formData, "imageAlt"),
    status: String(formData.get("status") || "draft"),
    featured: formData.get("featured") === "on",
    recommended: formData.get("recommended") === "on"
  });

  if (!parsed.success) {
    redirect(
      `/admin/content/reviews?error=${encodeURIComponent(
        parsed.error.issues[0]?.message || "Invalid review"
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
      image_url: image.imageUrl,
      image_alt: image.imageAlt ?? null,
      heat_level: parsed.data.heatLevel ?? null,
      scoville_min: parsed.data.scovilleMin ?? null,
      scoville_max: parsed.data.scovilleMax ?? null,
      flavor_notes: parseCsvList(parsed.data.flavorNotes || ""),
      cuisine_origin: parsed.data.cuisineOrigin ?? null,
      category: parsed.data.category,
      pros: parseLineList(parsed.data.pros || ""),
      cons: parseLineList(parsed.data.cons || ""),
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
    tags: getOptionalText(formData, "tags"),
    imageUrl: getOptionalText(formData, "imageUrl"),
    imageAlt: getOptionalText(formData, "imageAlt"),
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
        parsed.error.issues[0]?.message || "Invalid review"
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
    .select("id, slug, title, image_url, published_at")
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
      image_url: image.imageUrl,
      image_alt: image.imageAlt ?? null,
      heat_level: parsed.data.heatLevel ?? null,
      scoville_min: parsed.data.scovilleMin ?? null,
      scoville_max: parsed.data.scovilleMax ?? null,
      flavor_notes: parseCsvList(parsed.data.flavorNotes || ""),
      cuisine_origin: parsed.data.cuisineOrigin ?? null,
      category: parsed.data.category,
      pros: parseLineList(parsed.data.pros || ""),
      cons: parseLineList(parsed.data.cons || ""),
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

  revalidateReviewPaths(data.slug, existing.slug);
  redirect(`${redirectTo}?updated=1`);
}

export async function updateReviewStateAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = contentStateSchema.safeParse({
    id: formData.get("id"),
    intent: formData.get("intent")
  });

  if (!parsed.success) {
    redirect("/admin/content/reviews?error=Invalid%20content%20action");
  }

  if (!flags.hasSupabaseAdmin) {
    redirect("/admin/content/reviews?updated=mock");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect("/admin/content/reviews?error=Supabase%20admin%20is%20not%20configured");
  }

  const { data, error } = await supabase
    .from("reviews")
    .update(buildStatusUpdates(parsed.data.intent))
    .eq("id", parsed.data.id)
    .select("id, slug")
    .single();

  if (error) {
    redirect(`/admin/content/reviews?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "update_review",
    targetType: "review",
    targetId: String(data.id),
    metadata: { intent: parsed.data.intent }
  });

  revalidateReviewPaths(data.slug);
  redirect("/admin/content/reviews?updated=1");
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
        parsed.error.issues[0]?.message || "Invalid merch product"
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
        parsed.error.issues[0]?.message || "Invalid merch product"
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
    recipes: 0,
    reviews: 0,
    merch: 0
  };

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
    const { error } = await supabase.from("merch_products").upsert(
      sampleMerchProducts.map(mapSampleMerchForInsert),
      { onConflict: "slug" }
    );

    if (error) {
      redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
    }

    counts.merch = sampleMerchProducts.length;
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
    `${redirectTo}?imported=${parsed.data.catalog}&recipes=${counts.recipes}&reviews=${counts.reviews}&merch=${counts.merch}`
  );
}
