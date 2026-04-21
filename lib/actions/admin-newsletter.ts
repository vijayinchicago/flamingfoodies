"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { normalizeNewsletterSegmentTags } from "@/lib/newsletter-segments";
import {
  scheduleNewsletterCampaign,
  resetNewsletterCampaignApproval
} from "@/lib/services/newsletter";
import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const campaignSchema = z.object({
  subject: z.string().min(6).max(140),
  previewText: z.string().max(220).optional(),
  htmlContent: z.string().min(20),
  textContent: z.string().optional(),
  status: z.enum(["draft", "scheduled"]),
  sendAt: z.string().optional(),
  audienceTags: z.array(z.string()).optional()
});

const campaignStateSchema = z.object({
  id: z.coerce.number().int().positive(),
  intent: z.enum(["draft", "schedule"]),
  sendAt: z.string().optional()
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

function normalizeSendAt(value?: string) {
  if (!value?.trim()) {
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }

  return new Date(value).toISOString();
}

export async function createNewsletterCampaignAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = campaignSchema.safeParse({
    subject: String(formData.get("subject") || "").trim(),
    previewText: String(formData.get("previewText") || "").trim() || undefined,
    htmlContent: String(formData.get("htmlContent") || "").trim(),
    textContent: String(formData.get("textContent") || "").trim() || undefined,
    status: String(formData.get("status") || "draft"),
    sendAt: String(formData.get("sendAt") || "").trim() || undefined,
    audienceTags: formData.getAll("audienceTags").map((value) => String(value))
  });

  if (!parsed.success) {
    redirect("/admin/newsletter/new?error=Invalid%20campaign");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect("/admin/newsletter/new?created=mock");
  }

  const sendAt =
    parsed.data.status === "scheduled" ? normalizeSendAt(parsed.data.sendAt) : null;
  const audienceTags = normalizeNewsletterSegmentTags(parsed.data.audienceTags);

  let recipientQuery = supabase
    .from("newsletter_subscribers")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  if (audienceTags.length) {
    recipientQuery = recipientQuery.overlaps("tags", audienceTags);
  }

  const { count: recipientCount } = await recipientQuery;

  const { data, error } = await supabase
    .from("newsletter_campaigns")
    .insert({
      subject: parsed.data.subject,
      preview_text: parsed.data.previewText ?? null,
      html_content: parsed.data.htmlContent,
      text_content: parsed.data.textContent ?? null,
      audience_tags: audienceTags,
      status: parsed.data.status,
      send_at: sendAt,
      recipient_count: recipientCount ?? 0,
      provider: null,
      provider_broadcast_id: null
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/admin/newsletter/new?error=${encodeURIComponent(error.message)}`);
  }

  if (parsed.data.status === "scheduled" && sendAt) {
    try {
      await scheduleNewsletterCampaign(data.id, sendAt);
    } catch (scheduleError) {
      redirect(
        `/admin/newsletter/new?error=${encodeURIComponent(
          scheduleError instanceof Error
            ? scheduleError.message
            : "Newsletter scheduling failed"
        )}`
      );
    }
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "create_newsletter_campaign",
    targetType: "newsletter_campaign",
    targetId: String(data.id),
    metadata: {
      status: parsed.data.status,
      audienceTags
    }
  });

  revalidatePath("/admin/newsletter/new");
  revalidatePath("/admin/newsletter/campaigns");
  revalidatePath("/admin/automation/approvals");
  revalidatePath("/admin/automation/agents");
  revalidatePath("/admin/automation/trigger");
  redirect("/admin/newsletter/new?created=1");
}

export async function updateNewsletterCampaignStateAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = campaignStateSchema.safeParse({
    id: formData.get("id"),
    intent: formData.get("intent"),
    sendAt: String(formData.get("sendAt") || "").trim() || undefined
  });

  if (!parsed.success) {
    redirect("/admin/newsletter/campaigns?error=Invalid%20campaign%20update");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect("/admin/newsletter/campaigns?updated=mock");
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.intent === "draft") {
    updates.status = "draft";
    updates.send_at = null;
    updates.sent_at = null;
  }
  if (parsed.data.intent === "schedule") {
    try {
      await scheduleNewsletterCampaign(parsed.data.id, normalizeSendAt(parsed.data.sendAt));
    } catch (scheduleError) {
      redirect(
        `/admin/newsletter/campaigns?error=${encodeURIComponent(
          scheduleError instanceof Error
            ? scheduleError.message
            : "Newsletter scheduling failed"
        )}`
      );
    }
  }
  if (Object.keys(updates).length) {
    const { error } = await supabase
      .from("newsletter_campaigns")
      .update(updates)
      .eq("id", parsed.data.id);

    if (error) {
      redirect(`/admin/newsletter/campaigns?error=${encodeURIComponent(error.message)}`);
    }
  }

  if (parsed.data.intent === "draft") {
    try {
      await resetNewsletterCampaignApproval(parsed.data.id);
    } catch (resetError) {
      redirect(
        `/admin/newsletter/campaigns?error=${encodeURIComponent(
          resetError instanceof Error
            ? resetError.message
            : "Newsletter approval reset failed"
        )}`
      );
    }
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "update_newsletter_campaign",
    targetType: "newsletter_campaign",
    targetId: String(parsed.data.id),
    metadata: {
      intent: parsed.data.intent
    }
  });

  revalidatePath("/admin/newsletter/campaigns");
  revalidatePath("/admin/automation/approvals");
  revalidatePath("/admin/automation/agents");
  revalidatePath("/admin/automation/trigger");
  redirect("/admin/newsletter/campaigns?updated=1");
}
