"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AFFILIATE_REVIEW_AGENT, AFFILIATE_REVIEW_PATH } from "@/lib/affiliate-review";
import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { runManualAutomationTask } from "@/lib/services/automation-control";
import { runAffiliateProductReviewer, summarizeAffiliateReview } from "@/lib/services/affiliate-reviews";

export async function triggerAffiliateReviewAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = z.object({ requestId: z.string().uuid(), retryId: z.string().uuid().optional() }).safeParse({
    requestId: formData.get("requestId") || randomUUID(), retryId: formData.get("retryId") || undefined
  });
  if (!parsed.success) redirect(`${AFFILIATE_REVIEW_PATH}?error=Invalid%20review%20request`);
  const task = await runManualAutomationTask({
    agentId: AFFILIATE_REVIEW_AGENT, adminId: admin.id, triggerReference: "server_action:affiliate_review",
    inputPayload: { ...parsed.data, quantity: 1, draftOnly: true },
    execute: (context) => runAffiliateProductReviewer({
      invocationKey: `manual:${parsed.data.requestId}`, retryId: parsed.data.retryId, run: context?.run
    }), summarize: summarizeAffiliateReview
  });
  revalidatePath(AFFILIATE_REVIEW_PATH);
  revalidatePath("/admin/automation/agents");
  if (!task.ok) redirect(`${AFFILIATE_REVIEW_PATH}?error=${encodeURIComponent(task.errorMessage)}`);
  if (task.result.jobId) redirect(`${AFFILIATE_REVIEW_PATH}/${task.result.jobId}`);
  redirect(`${AFFILIATE_REVIEW_PATH}?notice=${encodeURIComponent(task.result.skipped || "Run completed")}`);
}

export async function updateAffiliateReviewerSettingsAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = z.object({ dailyRunCap: z.coerce.number().int().min(1).max(6), dailyDraftCap: z.coerce.number().int().min(1).max(3) }).safeParse({
    dailyRunCap: formData.get("dailyRunCap"), dailyDraftCap: formData.get("dailyDraftCap")
  });
  if (!parsed.success) redirect(`${AFFILIATE_REVIEW_PATH}?error=Invalid%20reviewer%20limits`);
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase admin access is required.");
  const { data, error } = await supabase.from("automation_agents").update({
    is_enabled: formData.get("isEnabled") === "on", daily_run_cap: parsed.data.dailyRunCap,
    daily_mutation_cap: parsed.data.dailyDraftCap, risk_class: "draft_only", autonomy_mode: "draft_only",
    requires_manual_approval: true, updated_at: new Date().toISOString()
  }).eq("agent_id", AFFILIATE_REVIEW_AGENT).select("agent_id");
  if (error || !data?.length) redirect(`${AFFILIATE_REVIEW_PATH}?error=${encodeURIComponent(error?.message || "Reviewer migration has not been applied")}`);
  const audit = await supabase.from("admin_audit_log").insert({ admin_id: admin.id, action: "configure_affiliate_reviewer", target_type: "automation_agent", target_id: AFFILIATE_REVIEW_AGENT, metadata: parsed.data });
  if (audit.error) throw new Error(`Settings saved but audit logging failed: ${audit.error.message}`);
  revalidatePath(AFFILIATE_REVIEW_PATH);
  revalidatePath("/admin/automation/agents");
  redirect(`${AFFILIATE_REVIEW_PATH}?notice=Reviewer%20settings%20saved`);
}

export async function saveAffiliateReviewNoteAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = z.object({ id: z.string().uuid(), note: z.string().max(5000), dismiss: z.boolean() }).safeParse({
    id: formData.get("id"), note: formData.get("note") || "", dismiss: formData.get("dismiss") === "on"
  });
  if (!parsed.success) redirect(`${AFFILIATE_REVIEW_PATH}?error=Invalid%20review%20note`);
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase admin access is required.");
  const { data, error } = await supabase.from("affiliate_review_jobs").update({
    review_note: parsed.data.note, reviewed_by: admin.id, reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(), ...(parsed.data.dismiss ? { status: "dismissed" } : {})
  }).eq("id", parsed.data.id).in("status", ["awaiting_review", "blocked", "failed", "timed_out", "dismissed"]).select("id");
  if (error || !data?.length) redirect(`${AFFILIATE_REVIEW_PATH}?error=${encodeURIComponent(error?.message || "Wait for the running job to finish")}`);
  revalidatePath(AFFILIATE_REVIEW_PATH);
  revalidatePath(`${AFFILIATE_REVIEW_PATH}/${parsed.data.id}`);
  redirect(`${AFFILIATE_REVIEW_PATH}/${parsed.data.id}?saved=1`);
}
