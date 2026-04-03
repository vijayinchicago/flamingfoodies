"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { flags } from "@/lib/env";
import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const communityModerationSchema = z.object({
  postId: z.coerce.number(),
  intent: z.enum(["approve", "reject", "pin", "unpin"])
});

const userRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["user", "contributor", "moderator", "admin"])
});

const userBanSchema = z.object({
  userId: z.string().min(1),
  username: z.string().min(1),
  intent: z.enum(["ban", "unban"])
});

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

export async function moderateCommunityPostAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = communityModerationSchema.safeParse({
    postId: formData.get("postId"),
    intent: formData.get("intent")
  });

  if (!parsed.success) {
    redirect("/admin/community/moderation?error=Invalid%20moderation%20request");
  }

  if (!flags.hasSupabaseAdmin) {
    redirect("/admin/community/moderation?updated=mock");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect(
      "/admin/community/moderation?error=Supabase%20admin%20is%20not%20configured"
    );
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.intent === "approve") updates.status = "published";
  if (parsed.data.intent === "reject") updates.status = "archived";
  if (parsed.data.intent === "pin") updates.is_pinned = true;
  if (parsed.data.intent === "unpin") updates.is_pinned = false;

  const { data: existingPost } = await supabase
    .from("community_posts")
    .select("id, type")
    .eq("id", parsed.data.postId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("community_posts")
    .update(updates)
    .eq("id", parsed.data.postId)
    .select("id")
    .single();

  if (error) {
    redirect(
      `/admin/community/moderation?error=${encodeURIComponent(error.message)}`
    );
  }

  if (
    existingPost?.type === "recipe" &&
    (parsed.data.intent === "approve" || parsed.data.intent === "reject")
  ) {
    await supabase
      .from("community_recipes")
      .update({
        status: parsed.data.intent === "approve" ? "published" : "archived"
      })
      .eq("community_post_id", parsed.data.postId);
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "moderate_community_post",
    targetType: "community_post",
    targetId: String(data.id),
    metadata: { intent: parsed.data.intent }
  });

  revalidatePath("/community");
  revalidatePath("/admin/community/moderation");
  redirect("/admin/community/moderation?updated=1");
}

export async function updateUserRoleAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = userRoleSchema.safeParse({
    userId: String(formData.get("userId") || ""),
    role: String(formData.get("role") || "")
  });

  if (!parsed.success) {
    redirect("/admin/community/users?error=Invalid%20role%20update");
  }

  if (!flags.hasSupabaseAdmin) {
    redirect("/admin/community/users?updated=mock");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect("/admin/community/users?error=Supabase%20admin%20is%20not%20configured");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.userId);

  if (error) {
    redirect(`/admin/community/users?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "update_user_role",
    targetType: "profile",
    targetId: parsed.data.userId,
    metadata: { role: parsed.data.role }
  });

  revalidatePath("/admin/community/users");
  redirect("/admin/community/users?updated=1");
}

export async function toggleUserBanAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = userBanSchema.safeParse({
    userId: String(formData.get("userId") || ""),
    username: String(formData.get("username") || ""),
    intent: String(formData.get("intent") || "")
  });

  if (!parsed.success) {
    redirect("/admin/community/users?error=Invalid%20ban%20request");
  }

  if (!flags.hasSupabaseAdmin) {
    redirect("/admin/community/users?updated=mock");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect("/admin/community/users?error=Supabase%20admin%20is%20not%20configured");
  }

  const isBanned = parsed.data.intent === "ban";
  const { error } = await supabase
    .from("profiles")
    .update({
      is_banned: isBanned,
      ban_reason: isBanned ? "Banned from admin console" : null
    })
    .eq("id", parsed.data.userId);

  if (error) {
    redirect(`/admin/community/users?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: isBanned ? "ban_user" : "unban_user",
    targetType: "profile",
    targetId: parsed.data.userId,
    metadata: { username: parsed.data.username }
  });

  revalidatePath("/admin/community/users");
  revalidatePath(`/profile/${parsed.data.username}`);
  redirect("/admin/community/users?updated=1");
}
