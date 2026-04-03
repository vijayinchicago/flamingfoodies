"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { publishSocialPost } from "@/lib/services/social";
import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const socialPostSchema = z.object({
  platform: z.enum(["twitter", "instagram", "pinterest", "facebook", "tiktok"]),
  caption: z.string().min(10).max(400),
  hashtags: z.string().optional(),
  imageUrl: z.string().optional(),
  linkUrl: z.string().optional(),
  status: z.enum(["pending", "scheduled", "published"]),
  scheduledAt: z.string().optional()
});

const socialStateSchema = z.object({
  id: z.coerce.number().int().positive(),
  intent: z.enum(["pending", "schedule", "publish", "fail"]),
  scheduledAt: z.string().optional()
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

function parseHashtags(value?: string) {
  return (value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
}

function normalizeDateTime(value?: string) {
  return value?.trim()
    ? new Date(value).toISOString()
    : new Date(Date.now() + 60 * 60 * 1000).toISOString();
}

export async function createCustomSocialPostAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = socialPostSchema.safeParse({
    platform: formData.get("platform"),
    caption: String(formData.get("caption") || "").trim(),
    hashtags: String(formData.get("hashtags") || "").trim() || undefined,
    imageUrl: String(formData.get("imageUrl") || "").trim() || undefined,
    linkUrl: String(formData.get("linkUrl") || "").trim() || undefined,
    status: formData.get("status"),
    scheduledAt: String(formData.get("scheduledAt") || "").trim() || undefined
  });

  if (!parsed.success) {
    redirect("/admin/social/queue?error=Invalid%20social%20post");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect("/admin/social/queue?created=mock");
  }

  const scheduledAt =
    parsed.data.status === "scheduled" ? normalizeDateTime(parsed.data.scheduledAt) : null;
  const publishedAt =
    parsed.data.status === "published" ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from("social_posts")
    .insert({
      platform: parsed.data.platform,
      content_type: "custom",
      caption: parsed.data.caption,
      hashtags: parseHashtags(parsed.data.hashtags),
      image_url: parsed.data.imageUrl ?? null,
      link_url: parsed.data.linkUrl ?? null,
      status: parsed.data.status,
      scheduled_at: scheduledAt,
      published_at: publishedAt
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/admin/social/queue?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "create_social_post",
    targetType: "social_post",
    targetId: String(data.id),
    metadata: {
      platform: parsed.data.platform,
      status: parsed.data.status
    }
  });

  revalidatePath("/admin/social/queue");
  revalidatePath("/admin/social/history");
  redirect("/admin/social/queue?created=1");
}

export async function updateSocialPostStateAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = socialStateSchema.safeParse({
    id: formData.get("id"),
    intent: formData.get("intent"),
    scheduledAt: String(formData.get("scheduledAt") || "").trim() || undefined
  });

  if (!parsed.success) {
    redirect("/admin/social/queue?error=Invalid%20social%20update");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect("/admin/social/queue?updated=mock");
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.intent === "pending") {
    updates.status = "pending";
    updates.scheduled_at = null;
    updates.published_at = null;
  }
  if (parsed.data.intent === "schedule") {
    updates.status = "scheduled";
    updates.scheduled_at = normalizeDateTime(parsed.data.scheduledAt);
  }
  if (parsed.data.intent === "publish") {
    try {
      await publishSocialPost(parsed.data.id);
    } catch (publishError) {
      redirect(
        `/admin/social/queue?error=${encodeURIComponent(
          publishError instanceof Error ? publishError.message : "Social publish failed"
        )}`
      );
    }
  }
  if (parsed.data.intent === "fail") {
    updates.status = "failed";
  }

  if (Object.keys(updates).length) {
    const { error } = await supabase
      .from("social_posts")
      .update(updates)
      .eq("id", parsed.data.id);

    if (error) {
      redirect(`/admin/social/queue?error=${encodeURIComponent(error.message)}`);
    }
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "update_social_post",
    targetType: "social_post",
    targetId: String(parsed.data.id),
    metadata: {
      intent: parsed.data.intent
    }
  });

  revalidatePath("/admin/social/queue");
  revalidatePath("/admin/social/history");
  redirect("/admin/social/queue?updated=1");
}
