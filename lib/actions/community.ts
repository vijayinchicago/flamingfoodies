"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { flags } from "@/lib/env";
import {
  parseLineList,
  parseRecipeIngredients,
  parseRecipeInstructions
} from "@/lib/parsers";
import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const cuisineTypeSchema = z.enum([
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
]);

function parseOptionalInt(value: FormDataEntryValue | null) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : normalized;
}

const submitSchema = z
  .object({
    title: z.string().max(120).optional(),
    caption: z.string().min(10).max(500),
    type: z.enum(["photo", "recipe", "video_url"]),
    heatLevel: z.enum(["mild", "medium", "hot", "inferno", "reaper"]).optional(),
    cuisineType: cuisineTypeSchema.optional(),
  mediaUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => !value || /^https?:\/\//.test(value), {
      message: "Media URL must start with http:// or https://"
    }),
  videoUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => !value || /^https?:\/\//.test(value), {
      message: "Video URL must start with http:// or https://"
    }),
    tags: z.string().optional(),
    recipeDescription: z.string().max(320).optional(),
    prepTimeMinutes: z.coerce.number().int().min(1).max(1440).optional(),
    cookTimeMinutes: z.coerce.number().int().min(1).max(1440).optional(),
    servings: z.coerce.number().int().min(1).max(24).optional(),
    ingredients: z.string().optional(),
    instructions: z.string().optional(),
    tips: z.string().optional()
  })
  .superRefine((value, ctx) => {
    if (value.type !== "recipe") {
      return;
    }

    if (!value.heatLevel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["heatLevel"],
        message: "Heat level is required for recipe submissions."
      });
    }

    if (!value.cuisineType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cuisineType"],
        message: "Cuisine type is required for recipe submissions."
      });
    }

    if (!value.ingredients?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ingredients"],
        message: "Add at least one ingredient for recipe submissions."
      });
    }

    if (!value.instructions?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["instructions"],
        message: "Add at least one instruction for recipe submissions."
      });
    }
  });

function getOptionalFile(formData: FormData, key: string) {
  const file = formData.get(key);
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }
  return file;
}

async function uploadCommunityMedia(
  supabase: NonNullable<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  file: File
) {
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "bin";
  const basename =
    file.name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "upload";
  const path = `${userId}/community/${Date.now()}-${basename}.${extension || "bin"}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from("community-media").upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: true
  });

  if (error) {
    throw new Error(error.message);
  }

  return supabase.storage.from("community-media").getPublicUrl(path).data.publicUrl;
}

export async function submitCommunityPostAction(formData: FormData) {
  const profile = await requireUser();

  const parsed = submitSchema.safeParse({
    title: String(formData.get("title") || "").trim() || undefined,
    caption: String(formData.get("caption") || "").trim(),
    type: String(formData.get("type") || "photo"),
    heatLevel: String(formData.get("heatLevel") || "") || undefined,
    cuisineType: String(formData.get("cuisineType") || "") || undefined,
    mediaUrl: String(formData.get("mediaUrl") || ""),
    videoUrl: String(formData.get("videoUrl") || ""),
    tags: String(formData.get("tags") || "").trim(),
    recipeDescription: String(formData.get("recipeDescription") || "").trim() || undefined,
    prepTimeMinutes: parseOptionalInt(formData.get("prepTimeMinutes")),
    cookTimeMinutes: parseOptionalInt(formData.get("cookTimeMinutes")),
    servings: parseOptionalInt(formData.get("servings")),
    ingredients: String(formData.get("ingredients") || "").trim() || undefined,
    instructions: String(formData.get("instructions") || "").trim() || undefined,
    tips: String(formData.get("tips") || "").trim() || undefined
  });

  if (!parsed.success) {
    redirect(
      `/community/submit?error=${encodeURIComponent(
        parsed.error.issues[0]?.message || "Invalid submission"
      )}`
    );
  }

  if (!flags.hasSupabase) {
    redirect("/community?submitted=1");
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    redirect("/community/submit?error=Supabase%20is%20not%20configured");
  }

  const tags = (parsed.data.tags || "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  const mediaFile = getOptionalFile(formData, "mediaFile");
  let mediaUrl = parsed.data.mediaUrl ?? null;

  if (mediaFile) {
    try {
      mediaUrl = await uploadCommunityMedia(supabase, profile.id, mediaFile);
    } catch (error) {
      redirect(
        `/community/submit?error=${encodeURIComponent(
          error instanceof Error ? error.message : "Media upload failed"
        )}`
      );
    }
  }

  const { data: post, error } = await supabase
    .from("community_posts")
    .insert({
    user_id: profile.id,
    type: parsed.data.type,
    title: parsed.data.title ?? null,
    caption: parsed.data.caption,
    media_url: mediaUrl,
    video_url: parsed.data.videoUrl ?? null,
    tags,
    heat_level: parsed.data.heatLevel ?? null,
    cuisine_type: parsed.data.cuisineType ?? null,
    status: "pending_review"
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/community/submit?error=${encodeURIComponent(error.message)}`);
  }

  if (parsed.data.type === "recipe") {
    const ingredients = parseRecipeIngredients(parsed.data.ingredients || "");
    const instructions = parseRecipeInstructions(parsed.data.instructions || "");
    const tips = parseLineList(parsed.data.tips || "");

    const { error: recipeError } = await supabase.from("community_recipes").insert({
      community_post_id: post.id,
      user_id: profile.id,
      title: parsed.data.title || "Community recipe submission",
      description: parsed.data.recipeDescription ?? parsed.data.caption,
      heat_level: parsed.data.heatLevel,
      cuisine_type: parsed.data.cuisineType,
      prep_time_minutes: parsed.data.prepTimeMinutes ?? null,
      cook_time_minutes: parsed.data.cookTimeMinutes ?? null,
      servings: parsed.data.servings ?? null,
      ingredients,
      instructions,
      tips,
      status: "pending_review"
    });

    if (recipeError) {
      await supabase.from("community_posts").delete().eq("id", post.id);
      redirect(`/community/submit?error=${encodeURIComponent(recipeError.message)}`);
    }
  }

  revalidatePath("/community");
  redirect("/community?submitted=1");
}
