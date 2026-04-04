"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { flags } from "@/lib/env";
import { recordTelemetryEvent } from "@/lib/services/telemetry";
import { requireAdmin, requireUser } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ANALYTICS_EVENTS } from "@/lib/telemetry-events";

const commentSchema = z.object({
  contentType: z.string().min(1),
  contentId: z.coerce.number(),
  contentPath: z.string().min(1),
  body: z.string().min(2).max(600)
});

const recipeSaveSchema = z.object({
  recipeId: z.coerce.number(),
  recipeSlug: z.string().min(1)
});

const recipeRatingSchema = z.object({
  recipeId: z.coerce.number(),
  recipeSlug: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  reviewText: z.string().max(500).optional()
});

const followSchema = z.object({
  targetUserId: z.string().min(1),
  targetUsername: z.string().min(1)
});

const commentModerationSchema = z.object({
  commentId: z.coerce.number(),
  intent: z.enum(["approve", "hide", "flag", "unflag"])
});

export async function submitCommentAction(formData: FormData) {
  const profile = await requireUser();

  const parsed = commentSchema.safeParse({
    contentType: String(formData.get("contentType") || ""),
    contentId: formData.get("contentId"),
    contentPath: String(formData.get("contentPath") || ""),
    body: String(formData.get("body") || "").trim()
  });

  if (!parsed.success) {
    redirect(
      `${String(formData.get("contentPath") || "/")}?error=${encodeURIComponent(
        parsed.error.issues[0]?.message || "Invalid comment"
      )}`
    );
  }

  if (!flags.hasSupabaseAdmin) {
    redirect(`${parsed.data.contentPath}?commented=mock#comments`);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect(
      `${parsed.data.contentPath}?error=Supabase%20admin%20is%20not%20configured#comments`
    );
  }

  const { error } = await supabase.from("comments").insert({
    user_id: profile.id,
    content_type: parsed.data.contentType,
    content_id: parsed.data.contentId,
    body: parsed.data.body,
    is_approved: true
  });

  if (error) {
    redirect(`${parsed.data.contentPath}?error=${encodeURIComponent(error.message)}#comments`);
  }

  if (parsed.data.contentType === "community_post") {
    const { data: post } = await supabase
      .from("community_posts")
      .select("comment_count")
      .eq("id", parsed.data.contentId)
      .maybeSingle();

    await supabase
      .from("community_posts")
      .update({ comment_count: (post?.comment_count ?? 0) + 1 })
      .eq("id", parsed.data.contentId);
  }

  await recordTelemetryEvent({
    eventName: ANALYTICS_EVENTS.commentPosted,
    userId: profile.id,
    path: parsed.data.contentPath,
    contentType: parsed.data.contentType,
    contentId: parsed.data.contentId
  });

  revalidatePath(parsed.data.contentPath);
  redirect(`${parsed.data.contentPath}?commented=1#comments`);
}

export async function toggleRecipeSaveAction(formData: FormData) {
  const profile = await requireUser();

  const parsed = recipeSaveSchema.safeParse({
    recipeId: formData.get("recipeId"),
    recipeSlug: String(formData.get("recipeSlug") || "")
  });

  if (!parsed.success) {
    redirect("/recipes?error=Invalid%20save%20request");
  }

  if (!flags.hasSupabaseAdmin) {
    redirect(`/recipes/${parsed.data.recipeSlug}?saved=mock`);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect(`/recipes/${parsed.data.recipeSlug}?error=Supabase%20admin%20is%20not%20configured`);
  }

  const { data: existing } = await supabase
    .from("recipe_saves")
    .select("recipe_id")
    .eq("user_id", profile.id)
    .eq("recipe_id", parsed.data.recipeId)
    .maybeSingle();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("save_count")
    .eq("id", parsed.data.recipeId)
    .single();

  if (existing) {
    await supabase
      .from("recipe_saves")
      .delete()
      .eq("user_id", profile.id)
      .eq("recipe_id", parsed.data.recipeId);

    await supabase
      .from("recipes")
      .update({ save_count: Math.max(0, (recipe?.save_count ?? 0) - 1) })
      .eq("id", parsed.data.recipeId);
  } else {
    await supabase.from("recipe_saves").insert({
      user_id: profile.id,
      recipe_id: parsed.data.recipeId
    });

    await supabase
      .from("recipes")
      .update({ save_count: (recipe?.save_count ?? 0) + 1 })
      .eq("id", parsed.data.recipeId);

    await recordTelemetryEvent({
      eventName: ANALYTICS_EVENTS.recipeSave,
      userId: profile.id,
      path: `/recipes/${parsed.data.recipeSlug}`,
      contentType: "recipe",
      contentId: parsed.data.recipeId,
      contentSlug: parsed.data.recipeSlug
    });
  }

  revalidatePath(`/recipes/${parsed.data.recipeSlug}`);
  redirect(`/recipes/${parsed.data.recipeSlug}?saved=1`);
}

export async function rateRecipeAction(formData: FormData) {
  const profile = await requireUser();

  const parsed = recipeRatingSchema.safeParse({
    recipeId: formData.get("recipeId"),
    recipeSlug: String(formData.get("recipeSlug") || ""),
    rating: formData.get("rating"),
    reviewText: String(formData.get("reviewText") || "").trim() || undefined
  });

  if (!parsed.success) {
    redirect(
      `/recipes/${String(formData.get("recipeSlug") || "")}?error=${encodeURIComponent(
        parsed.error.issues[0]?.message || "Invalid rating"
      )}`
    );
  }

  if (!flags.hasSupabaseAdmin) {
    redirect(`/recipes/${parsed.data.recipeSlug}?rated=mock`);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect(`/recipes/${parsed.data.recipeSlug}?error=Supabase%20admin%20is%20not%20configured`);
  }

  const { error } = await supabase.from("recipe_ratings").upsert(
    {
      recipe_id: parsed.data.recipeId,
      user_id: profile.id,
      rating: parsed.data.rating,
      review_text: parsed.data.reviewText ?? null
    },
    {
      onConflict: "recipe_id,user_id"
    }
  );

  if (error) {
    redirect(`/recipes/${parsed.data.recipeSlug}?error=${encodeURIComponent(error.message)}`);
  }

  await recordTelemetryEvent({
    eventName: ANALYTICS_EVENTS.recipeRating,
    userId: profile.id,
    path: `/recipes/${parsed.data.recipeSlug}`,
    contentType: "recipe",
    contentId: parsed.data.recipeId,
    contentSlug: parsed.data.recipeSlug,
    value: parsed.data.rating
  });

  revalidatePath(`/recipes/${parsed.data.recipeSlug}`);
  redirect(`/recipes/${parsed.data.recipeSlug}?rated=1`);
}

export async function toggleFollowAction(formData: FormData) {
  const profile = await requireUser();

  const parsed = followSchema.safeParse({
    targetUserId: String(formData.get("targetUserId") || ""),
    targetUsername: String(formData.get("targetUsername") || "")
  });

  if (!parsed.success) {
    redirect("/leaderboard?error=Invalid%20follow%20request");
  }

  if (profile.id === parsed.data.targetUserId) {
    redirect(`/profile/${parsed.data.targetUsername}`);
  }

  if (!flags.hasSupabaseAdmin) {
    redirect(`/profile/${parsed.data.targetUsername}?followed=mock`);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect(`/profile/${parsed.data.targetUsername}?error=Supabase%20admin%20is%20not%20configured`);
  }

  const { data: existing } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", profile.id)
    .eq("following_id", parsed.data.targetUserId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", profile.id)
      .eq("following_id", parsed.data.targetUserId);
  } else {
    await supabase.from("follows").insert({
      follower_id: profile.id,
      following_id: parsed.data.targetUserId
    });

    await recordTelemetryEvent({
      eventName: ANALYTICS_EVENTS.userFollow,
      userId: profile.id,
      path: `/profile/${parsed.data.targetUsername}`,
      metadata: {
        targetUserId: parsed.data.targetUserId,
        targetUsername: parsed.data.targetUsername
      }
    });
  }

  revalidatePath(`/profile/${parsed.data.targetUsername}`);
  redirect(`/profile/${parsed.data.targetUsername}?followed=1`);
}

export async function moderateCommentAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = commentModerationSchema.safeParse({
    commentId: formData.get("commentId"),
    intent: formData.get("intent")
  });

  if (!parsed.success) {
    redirect("/admin/community/comments?error=Invalid%20comment%20action");
  }

  if (!flags.hasSupabaseAdmin) {
    redirect("/admin/community/comments?updated=mock");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect("/admin/community/comments?error=Supabase%20admin%20is%20not%20configured");
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.intent === "approve") updates.is_approved = true;
  if (parsed.data.intent === "hide") updates.is_approved = false;
  if (parsed.data.intent === "flag") updates.is_flagged = true;
  if (parsed.data.intent === "unflag") updates.is_flagged = false;

  const { data, error } = await supabase
    .from("comments")
    .update(updates)
    .eq("id", parsed.data.commentId)
    .select("id")
    .single();

  if (error) {
    redirect(`/admin/community/comments?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("admin_audit_log").insert({
    admin_id: admin.id,
    action: "moderate_comment",
    target_type: "comment",
    target_id: String(data.id),
    metadata: { intent: parsed.data.intent }
  });

  revalidatePath("/admin/community/comments");
  redirect("/admin/community/comments?updated=1");
}
