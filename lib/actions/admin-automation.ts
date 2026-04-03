"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  createWeeklyDigest,
  publishScheduledContent,
  queueSocialScheduler,
  runGenerationPipeline
} from "@/lib/services/automation";
import { processScheduledNewsletterCampaigns } from "@/lib/services/newsletter";
import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const triggerSchema = z.object({
  type: z.enum(["recipe", "blog_post", "review"]),
  qty: z.coerce.number().int().min(1).max(20)
});

const scheduleSchema = z.object({
  id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(20),
  cronExpr: z.string().min(5),
  parameters: z.string().optional(),
  isActive: z.boolean().optional()
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

function parseParameters(raw: string | undefined) {
  if (!raw?.trim()) return {};

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("Parameters must be valid JSON.");
  }
}

export async function triggerGenerationAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = triggerSchema.safeParse({
    type: formData.get("type"),
    qty: formData.get("qty")
  });

  if (!parsed.success) {
    redirect("/admin/automation/trigger?error=Invalid%20generation%20request");
  }

  const result = await runGenerationPipeline(parsed.data.type, parsed.data.qty);
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "generate_content",
    targetType: parsed.data.type,
    targetId: String(parsed.data.qty),
    metadata: {
      qty: parsed.data.qty,
      mode: result.mode,
      createdJobs: result.createdJobs.length
    }
  });

  revalidatePath("/admin/automation/jobs");
  revalidatePath("/admin/automation/trigger");
  revalidatePath("/admin");
  redirect(`/admin/automation/trigger?created=${result.createdJobs.length}`);
}

export async function updateGenerationScheduleAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = scheduleSchema.safeParse({
    id: formData.get("id"),
    quantity: formData.get("quantity"),
    cronExpr: String(formData.get("cronExpr") || ""),
    parameters: String(formData.get("parameters") || ""),
    isActive: formData.get("isActive") === "on"
  });

  if (!parsed.success) {
    redirect("/admin/automation/schedule?error=Invalid%20schedule%20update");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect("/admin/automation/schedule?updated=mock");
  }

  let parameters: Record<string, unknown>;
  try {
    parameters = parseParameters(parsed.data.parameters);
  } catch (error) {
    redirect(
      `/admin/automation/schedule?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Invalid schedule parameters"
      )}`
    );
  }

  const { error } = await supabase
    .from("generation_schedule")
    .update({
      quantity: parsed.data.quantity,
      cron_expr: parsed.data.cronExpr,
      parameters,
      is_active: parsed.data.isActive ?? false
    })
    .eq("id", parsed.data.id);

  if (error) {
    redirect(`/admin/automation/schedule?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "update_generation_schedule",
    targetType: "generation_schedule",
    targetId: String(parsed.data.id),
    metadata: {
      quantity: parsed.data.quantity,
      cronExpr: parsed.data.cronExpr,
      isActive: parsed.data.isActive ?? false
    }
  });

  revalidatePath("/admin/automation/schedule");
  redirect("/admin/automation/schedule?updated=1");
}

export async function runPublishScheduledAction() {
  const admin = await requireAdmin();
  const result = await publishScheduledContent();
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "publish_scheduled_content",
    targetType: "cron",
    targetId: "publish_scheduled",
    metadata: {
      publishedCount: result.published.length
    }
  });

  revalidatePath("/admin/automation/jobs");
  revalidatePath("/blog");
  revalidatePath("/recipes");
  revalidatePath("/reviews");

  for (const item of result.published) {
    if (item.type === "blog_post") revalidatePath(`/blog/${item.slug}`);
    if (item.type === "recipe") revalidatePath(`/recipes/${item.slug}`);
    if (item.type === "review") revalidatePath(`/reviews/${item.slug}`);
  }

  redirect(`/admin/automation/trigger?published=${result.published.length}`);
}

export async function runSocialSchedulerAction() {
  const admin = await requireAdmin();
  const result = await queueSocialScheduler();
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "queue_social_posts",
    targetType: "social_posts",
    targetId: "scheduler",
    metadata: result
  });

  revalidatePath("/admin/social/queue");
  revalidatePath("/admin/social/history");
  redirect(
    `/admin/automation/trigger?queued=${result.queued}&publishedSocial=${result.published ?? 0}`
  );
}

export async function runNewsletterDigestAction() {
  const admin = await requireAdmin();
  const result = await createWeeklyDigest();
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "generate_newsletter_digest",
    targetType: "newsletter_campaign",
    targetId: result.subject,
    metadata: result
  });

  revalidatePath("/admin/newsletter/campaigns");
  revalidatePath("/admin/newsletter/new");
  redirect(`/admin/automation/trigger?digest=${encodeURIComponent(result.subject)}`);
}

export async function runDueNewsletterSendsAction() {
  const admin = await requireAdmin();
  const result = await processScheduledNewsletterCampaigns();
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "send_due_newsletters",
    targetType: "newsletter_campaign",
    targetId: "scheduler",
    metadata: result
  });

  revalidatePath("/admin/newsletter/campaigns");
  revalidatePath("/admin/automation/trigger");
  redirect(
    `/admin/automation/trigger?processedNewsletters=${result.processed}&sentNewsletters=${result.sent}&failedNewsletters=${result.failures}`
  );
}
