"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  createWeeklyDigest,
  publishScheduledContent,
  reevaluatePendingAiDraftsForAutopublish,
  queueSocialScheduler,
  runGenerationPipeline
} from "@/lib/services/automation";
import {
  recordAutomationSnapshot,
  updateAutomationApproval,
  pauseAutomationAgent,
  resumeAutomationAgent,
  runManualAutomationTask
} from "@/lib/services/automation-control";
import {
  applyReleaseApproval,
  runBrandDiscovery,
  runReleaseMonitor
} from "@/lib/services/brand-monitor";
import { processScheduledNewsletterCampaigns } from "@/lib/services/newsletter";
import {
  getSearchRuntimeOptimizationSnapshot,
  runSearchInsightsAutomation,
  runSearchRecommendationExecutor,
  updateSearchRecommendationStatus
} from "@/lib/services/search-insights";
import {
  getShopShelfSnapshot,
  runShopCatalogRefresh
} from "@/lib/services/shop-automation";
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

const recommendationActionSchema = z.object({
  recommendationKey: z.string().min(1)
});

const automationApprovalActionSchema = z.object({
  approvalId: z.coerce.number().int().positive()
});

const automationAgentActionSchema = z.object({
  agentId: z.enum([
    "editorial-autopublisher",
    "pinterest-distributor",
    "growth-loop-promoter",
    "shop-shelf-curator",
    "newsletter-digest-agent",
    "search-insights-analyst",
    "search-recommendation-executor",
    "festival-discovery",
    "pepper-discovery",
    "brand-discovery",
    "release-monitor",
    "tutorial-generator",
    "content-shop-sync"
  ]),
  returnTo: z.string().optional()
});

const SEARCH_CONSOLE_DASHBOARD_PATH = "/admin/analytics/search-console";
const AUTOMATION_AGENTS_PATH = "/admin/automation/agents";
const AUTOMATION_TRIGGER_PATH = "/admin/automation/trigger";
const AUTOMATION_APPROVALS_PATH = "/admin/automation/approvals";

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

function redirectTriggerError(message: string): never {
  redirect(`${AUTOMATION_TRIGGER_PATH}?error=${encodeURIComponent(message)}`);
}

function redirectApprovalsError(message: string): never {
  redirect(`${AUTOMATION_APPROVALS_PATH}?error=${encodeURIComponent(message)}`);
}

function getSafeReturnTo(raw: string | undefined, fallback = AUTOMATION_AGENTS_PATH) {
  if (!raw?.startsWith("/admin/")) {
    return fallback;
  }

  return raw;
}

function revalidateSearchInsightSurfaces() {
  revalidatePath("/admin/automation/agents");
  revalidatePath("/admin/automation/trigger");
  revalidatePath("/admin/analytics/search-console");
  revalidatePath("/blog");
  revalidatePath("/recipes");
  revalidatePath("/hot-sauces");
  revalidatePath("/hot-sauces/best-for-wings");
  revalidatePath("/hot-sauces/best-for-seafood");
  revalidatePath("/hot-sauces/best-for-fried-chicken");
  revalidatePath("/blog/how-to-choose-a-hot-sauce-for-seafood");
  revalidatePath("/recipes/nashville-hot-chicken-sandwiches");
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

  const task = await runManualAutomationTask({
    agentId: "editorial-autopublisher",
    adminId: admin.id,
    triggerReference: "server_action:trigger_generation",
    inputPayload: {
      type: parsed.data.type,
      qty: parsed.data.qty
    },
    execute: async () => {
      const result = await runGenerationPipeline(parsed.data.type, parsed.data.qty);
      if ("skippedReason" in result && result.skippedReason) {
        throw new Error(result.skippedReason);
      }

      return result;
    },
    summarize: (result) => ({
      summary: `Queued ${result.createdJobs.length} ${parsed.data.type} job(s).`,
      rowsCreated: result.createdJobs.length
    })
  });

  const result = task.ok ? task.result : redirectTriggerError(task.errorMessage);
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
  revalidatePath(AUTOMATION_TRIGGER_PATH);
  revalidatePath("/admin");
  redirect(`${AUTOMATION_TRIGGER_PATH}?created=${result.createdJobs.length}`);
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
  const task = await runManualAutomationTask({
    agentId: "editorial-autopublisher",
    adminId: admin.id,
    triggerReference: "server_action:publish_scheduled",
    execute: publishScheduledContent,
    onSuccess: (result) => {
      revalidatePath("/admin/automation/jobs");
      revalidatePath("/blog");
      revalidatePath("/recipes");
      revalidatePath("/reviews");

      for (const item of result.published) {
        if (item.type === "blog_post") revalidatePath(`/blog/${item.slug}`);
        if (item.type === "recipe") revalidatePath(`/recipes/${item.slug}`);
        if (item.type === "review") revalidatePath(`/reviews/${item.slug}`);
      }
    },
    summarize: (result) => ({
      summary: `Published ${result.published.length} scheduled item(s).`,
      rowsPublished: result.published.length
    })
  });

  const result = task.ok ? task.result : redirectTriggerError(task.errorMessage);
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

  redirect(`${AUTOMATION_TRIGGER_PATH}?published=${result.published.length}`);
}

export async function runReevaluatePendingAiDraftsAction() {
  const admin = await requireAdmin();
  const task = await runManualAutomationTask({
    agentId: "editorial-autopublisher",
    adminId: admin.id,
    triggerReference: "server_action:reevaluate_ai_drafts",
    inputPayload: {
      publishDueAfterReevaluation: true
    },
    execute: async () => {
      const result = await reevaluatePendingAiDraftsForAutopublish({
        publishDueAfterReevaluation: true
      });

      if ("skippedReason" in result && result.skippedReason) {
        throw new Error(result.skippedReason);
      }

      return result;
    },
    onSuccess: (result) => {
      revalidatePath("/admin/automation/jobs");
      revalidatePath(AUTOMATION_TRIGGER_PATH);
      revalidatePath("/admin/automation/agents");
      revalidatePath("/admin/content/recipes");
      revalidatePath("/admin/content/blog");
      revalidatePath("/admin/content/reviews");
      revalidatePath("/blog");
      revalidatePath("/recipes");
      revalidatePath("/reviews");

      for (const item of result.items) {
        if (item.type === "blog_post") revalidatePath(`/blog/${item.slug}`);
        if (item.type === "recipe") revalidatePath(`/recipes/${item.slug}`);
        if (item.type === "review") revalidatePath(`/reviews/${item.slug}`);
      }
    },
    summarize: (result) => ({
      summary: `Reevaluated ${result.reviewed} AI draft(s), promoting ${result.promoted} and publishing ${result.published}.`,
      rowsUpdated: result.reviewed,
      rowsPublished: result.published
    })
  });

  const result = task.ok ? task.result : redirectTriggerError(task.errorMessage);
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "reevaluate_pending_ai_drafts",
    targetType: "automation",
    targetId: "autonomous_publish_backfill",
    metadata: result
  });

  redirect(
    `${AUTOMATION_TRIGGER_PATH}?reevaluated=${result.reviewed}&promoted=${result.promoted}&backfillPublished=${result.published}`
  );
}

export async function runSocialSchedulerAction() {
  const admin = await requireAdmin();
  const task = await runManualAutomationTask({
    agentId: "pinterest-distributor",
    adminId: admin.id,
    triggerReference: "server_action:social_scheduler",
    execute: queueSocialScheduler,
    onSuccess: () => {
      revalidatePath("/admin/social/queue");
      revalidatePath("/admin/social/history");
      revalidatePath(AUTOMATION_TRIGGER_PATH);
      revalidatePath("/admin/automation/agents");
    },
    summarize: (result) => ({
      summary: `Queued ${result.queued} social post(s) and published ${result.published}.`,
      rowsUpdated: result.queued,
      rowsPublished: result.published
    })
  });

  const result = task.ok ? task.result : redirectTriggerError(task.errorMessage);
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "queue_social_posts",
    targetType: "social_posts",
    targetId: "scheduler",
    metadata: result
  });

  redirect(
    `${AUTOMATION_TRIGGER_PATH}?queued=${result.queued}&publishedSocial=${result.published ?? 0}`
  );
}

export async function runNewsletterDigestAction() {
  const admin = await requireAdmin();
  const task = await runManualAutomationTask({
    agentId: "newsletter-digest-agent",
    adminId: admin.id,
    triggerReference: "server_action:newsletter_digest",
    execute: createWeeklyDigest,
    onSuccess: () => {
      revalidatePath("/admin/newsletter/campaigns");
      revalidatePath("/admin/newsletter/new");
      revalidatePath(AUTOMATION_TRIGGER_PATH);
      revalidatePath("/admin/automation/agents");
    },
    summarize: (result) => ({
      summary: `Drafted ${result.draftCount} newsletter digest(s).`,
      rowsCreated: result.draftCount
    })
  });

  const result = task.ok ? task.result : redirectTriggerError(task.errorMessage);
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "generate_newsletter_digest",
    targetType: "newsletter_campaign",
    targetId: result.subject,
    metadata: result
  });

  redirect(`${AUTOMATION_TRIGGER_PATH}?digest=${encodeURIComponent(result.subject)}`);
}

export async function runDueNewsletterSendsAction() {
  const admin = await requireAdmin();
  const task = await runManualAutomationTask({
    agentId: "newsletter-digest-agent",
    adminId: admin.id,
    triggerReference: "server_action:newsletter_send_due",
    inputPayload: {
      mode: "send_due"
    },
    execute: processScheduledNewsletterCampaigns,
    onSuccess: () => {
      revalidatePath("/admin/newsletter/campaigns");
      revalidatePath(AUTOMATION_TRIGGER_PATH);
      revalidatePath("/admin/automation/agents");
    },
    summarize: (result) => ({
      summary: `Processed ${result.processed} due newsletter campaign(s) and sent ${result.sent}.`,
      rowsUpdated: result.processed,
      rowsSent: result.sent
    })
  });

  const result = task.ok ? task.result : redirectTriggerError(task.errorMessage);
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "send_due_newsletters",
    targetType: "newsletter_campaign",
    targetId: "scheduler",
    metadata: result
  });

  redirect(
    `${AUTOMATION_TRIGGER_PATH}?processedNewsletters=${result.processed}&sentNewsletters=${result.sent}&failedNewsletters=${result.failures}`
  );
}

export async function runShopCatalogRefreshAction() {
  const admin = await requireAdmin();
  let beforeShelfSnapshot: Awaited<ReturnType<typeof getShopShelfSnapshot>> | null = null;
  const task = await runManualAutomationTask({
    agentId: "shop-shelf-curator",
    adminId: admin.id,
    triggerReference: "server_action:shop_catalog_refresh",
    inputPayload: {
      source: "manual"
    },
    execute: async () => {
      beforeShelfSnapshot = await getShopShelfSnapshot();
      return runShopCatalogRefresh({
        source: "manual"
      });
    },
    onSuccess: async (_result, context) => {
      const afterShelfSnapshot = await getShopShelfSnapshot();
      await recordAutomationSnapshot(context?.run ?? null, {
        scope: "merch_products.shop_shelf",
        subjectKey: "shop-picks",
        beforePayload: beforeShelfSnapshot,
        afterPayload: afterShelfSnapshot
      });

      revalidatePath("/admin/content/merch");
      revalidatePath(AUTOMATION_TRIGGER_PATH);
      revalidatePath("/admin/automation/agents");
      revalidatePath("/shop");
    },
    summarize: (result) => ({
      summary: `Refreshed ${result.reviewed} shop pick(s), creating ${result.created} and updating ${result.updated}.`,
      rowsCreated: result.created,
      rowsUpdated: result.updated
    })
  });

  const result = task.ok ? task.result : redirectTriggerError(task.errorMessage);
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "refresh_shop_catalog",
    targetType: "merch_product",
    targetId: "shop_catalog",
    metadata: result
  });

  redirect(
    `${AUTOMATION_TRIGGER_PATH}?shopRefreshReviewed=${result.reviewed}&shopRefreshCreated=${result.created}&shopRefreshUpdated=${result.updated}`
  );
}

export async function runBrandDiscoveryAction() {
  const admin = await requireAdmin();
  const task = await runManualAutomationTask({
    agentId: "brand-discovery",
    adminId: admin.id,
    triggerReference: "server_action:brand_discovery",
    execute: runBrandDiscovery,
    onSuccess: () => {
      revalidatePath(AUTOMATION_AGENTS_PATH);
      revalidatePath(AUTOMATION_TRIGGER_PATH);
    },
    summarize: (result) => ({
      summary: `Inserted ${result.brandsInserted} discovered brand draft(s).`,
      rowsCreated: result.brandsInserted
    })
  });

  const result = task.ok ? task.result : redirectTriggerError(task.errorMessage);
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "run_brand_discovery",
    targetType: "brand_discovery",
    targetId: "manual_run",
    metadata: result
  });

  redirect(
    `${AUTOMATION_TRIGGER_PATH}?notice=${encodeURIComponent(
      `Brand discovery finished with ${result.brandsInserted} new draft brand(s).`
    )}`
  );
}

export async function runReleaseMonitorAction() {
  const admin = await requireAdmin();
  const task = await runManualAutomationTask({
    agentId: "release-monitor",
    adminId: admin.id,
    triggerReference: "server_action:release_monitor",
    execute: (context) =>
      runReleaseMonitor({
        sourceRunId: context?.run?.id ?? null
      }),
    onSuccess: () => {
      revalidatePath(AUTOMATION_APPROVALS_PATH);
      revalidatePath(AUTOMATION_AGENTS_PATH);
      revalidatePath(AUTOMATION_TRIGGER_PATH);
    },
    summarize: (result) => ({
      summary: `Queued ${result.approvalsCreated} release approval(s) and refreshed ${result.approvalsUpdated}.`,
      rowsCreated: result.approvalsCreated,
      rowsUpdated: result.approvalsUpdated
    })
  });

  const result = task.ok ? task.result : redirectTriggerError(task.errorMessage);
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "run_release_monitor",
    targetType: "release_monitor",
    targetId: "manual_run",
    metadata: result
  });

  redirect(
    `${AUTOMATION_TRIGGER_PATH}?notice=${encodeURIComponent(
      `Release monitor queued ${result.approvalsCreated} approval(s) and refreshed ${result.approvalsUpdated}.`
    )}`
  );
}

export async function runSearchInsightsSyncAction() {
  const admin = await requireAdmin();
  const task = await runManualAutomationTask({
    agentId: "search-insights-analyst",
    adminId: admin.id,
    triggerReference: "server_action:search_insights_sync",
    execute: async () => {
      const result = await runSearchInsightsAutomation();
      if (!result.ok) {
        throw new Error(result.skippedReason);
      }

      return result;
    },
    onSuccess: () => {
      revalidateSearchInsightSurfaces();
      revalidatePath(AUTOMATION_AGENTS_PATH);
      revalidatePath(AUTOMATION_TRIGGER_PATH);
    },
    summarize: (result) => ({
      summary: `Synced Search Console recommendations for ${result.property}.`,
      rowsCreated: result.newRecommendationCount
    })
  });

  const result = task.ok
    ? task.result
    : redirect(`${SEARCH_CONSOLE_DASHBOARD_PATH}?error=${encodeURIComponent(task.errorMessage)}`);
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "run_search_insights_sync",
    targetType: "search_console",
    targetId: "manual_sync",
    metadata: result
  });

  redirect(
    `${SEARCH_CONSOLE_DASHBOARD_PATH}?synced=1&recommendations=${result.recommendationIds.length}&new=${result.newRecommendationCount}&approved=${result.approvedRecommendationCount}&applied=${result.appliedRecommendationCount}&latest=${result.window.latestAvailableDate}`
  );
}

export async function runSearchInsightsExecutorAction() {
  const admin = await requireAdmin();
  let beforeRuntimeSnapshot: Awaited<ReturnType<typeof getSearchRuntimeOptimizationSnapshot>> | null =
    null;
  const task = await runManualAutomationTask({
    agentId: "search-recommendation-executor",
    adminId: admin.id,
    triggerReference: "server_action:search_insights_executor",
    execute: async () => {
      beforeRuntimeSnapshot = await getSearchRuntimeOptimizationSnapshot();
      const result = await runSearchRecommendationExecutor();
      if (!result.ok) {
        throw new Error(result.skippedReason);
      }

      return result;
    },
    onSuccess: async (result, context) => {
      const afterRuntimeSnapshot = await getSearchRuntimeOptimizationSnapshot();
      await recordAutomationSnapshot(context?.run ?? null, {
        scope: "site_settings.search_runtime_optimizations",
        subjectKey: result.property,
        beforePayload: beforeRuntimeSnapshot,
        afterPayload: afterRuntimeSnapshot
      });

      revalidateSearchInsightSurfaces();
      revalidatePath(AUTOMATION_AGENTS_PATH);
      revalidatePath(AUTOMATION_TRIGGER_PATH);
    },
    summarize: (result) => ({
      summary: `Applied ${result.appliedRecommendationCount} approved search recommendation(s).`,
      rowsPublished: result.appliedRecommendationCount,
      rowsUpdated: result.manualReviewRecommendationKeys.length
    })
  });

  const result = task.ok
    ? task.result
    : redirect(`${SEARCH_CONSOLE_DASHBOARD_PATH}?error=${encodeURIComponent(task.errorMessage)}`);
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "run_search_recommendation_executor",
    targetType: "search_console",
    targetId: "manual_executor",
    metadata: result
  });

  redirect(
    `${SEARCH_CONSOLE_DASHBOARD_PATH}?executed=1&executorApplied=${result.appliedRecommendationKeys.length}&executorManual=${result.manualReviewRecommendationKeys.length}&runtimeTargets=${result.runtimeTargetCount}`
  );
}

async function updateSearchRecommendationStatusAction(input: {
  formData: FormData;
  status: "approved" | "dismissed" | "manual_review";
  auditAction: string;
  decisionReason: string | null;
  notice: string;
}) {
  const admin = await requireAdmin();
  const parsed = recommendationActionSchema.safeParse({
    recommendationKey: input.formData.get("recommendationKey")
  });

  if (!parsed.success) {
    redirect(`${SEARCH_CONSOLE_DASHBOARD_PATH}?error=Invalid%20search%20recommendation%20request`);
  }

  await updateSearchRecommendationStatus({
    recommendationKey: parsed.data.recommendationKey,
    status: input.status,
    decisionReason: input.decisionReason
  });

  const supabase = createSupabaseAdminClient();
  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: input.auditAction,
    targetType: "search_recommendation",
    targetId: parsed.data.recommendationKey,
    metadata: {
      status: input.status,
      decisionReason: input.decisionReason
    }
  });

  revalidateSearchInsightSurfaces();
  redirect(`${SEARCH_CONSOLE_DASHBOARD_PATH}?updated=1&notice=${encodeURIComponent(input.notice)}`);
}

export async function approveSearchRecommendationAction(formData: FormData) {
  return updateSearchRecommendationStatusAction({
    formData,
    status: "approved",
    auditAction: "approve_search_recommendation",
    decisionReason: "Approved by admin for executor review.",
    notice: "Search recommendation approved. Run the executor to rebuild live overlays."
  });
}

export async function dismissSearchRecommendationAction(formData: FormData) {
  return updateSearchRecommendationStatusAction({
    formData,
    status: "dismissed",
    auditAction: "dismiss_search_recommendation",
    decisionReason: "Dismissed by admin.",
    notice: "Search recommendation dismissed."
  });
}

export async function markSearchRecommendationManualAction(formData: FormData) {
  return updateSearchRecommendationStatusAction({
    formData,
    status: "manual_review",
    auditAction: "mark_search_recommendation_manual",
    decisionReason: "Marked for manual review by admin.",
    notice: "Search recommendation moved to manual review."
  });
}

async function updateAutomationApprovalStatusAction(input: {
  formData: FormData;
  status: "approved" | "rejected";
  auditAction: string;
  decisionReason: string;
  notice: string;
}) {
  const admin = await requireAdmin();
  const parsed = automationApprovalActionSchema.safeParse({
    approvalId: input.formData.get("approvalId")
  });

  if (!parsed.success) {
    redirectApprovalsError("Invalid automation approval request");
  }

  const approval = await updateAutomationApproval({
    approvalId: parsed.data.approvalId,
    status: input.status,
    decisionReason: input.decisionReason,
    approvedByAdminId: input.status === "approved" ? admin.id : undefined,
    rejectedByAdminId: input.status === "rejected" ? admin.id : undefined
  });

  const supabase = createSupabaseAdminClient();
  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: input.auditAction,
    targetType: "automation_approval",
    targetId: String(approval.id),
    metadata: {
      status: approval.status,
      agentId: approval.agentId,
      subjectType: approval.subjectType,
      subjectKey: approval.subjectKey
    }
  });

  revalidatePath(AUTOMATION_APPROVALS_PATH);
  revalidatePath(AUTOMATION_AGENTS_PATH);
  revalidatePath(AUTOMATION_TRIGGER_PATH);
  redirect(`${AUTOMATION_APPROVALS_PATH}?notice=${encodeURIComponent(input.notice)}`);
}

export async function approveAutomationApprovalAction(formData: FormData) {
  return updateAutomationApprovalStatusAction({
    formData,
    status: "approved",
    auditAction: "approve_automation_approval",
    decisionReason: "Approved by admin.",
    notice: "Automation approval approved. Apply it when you are ready."
  });
}

export async function rejectAutomationApprovalAction(formData: FormData) {
  return updateAutomationApprovalStatusAction({
    formData,
    status: "rejected",
    auditAction: "reject_automation_approval",
    decisionReason: "Rejected by admin.",
    notice: "Automation approval rejected."
  });
}

export async function applyAutomationApprovalAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = automationApprovalActionSchema.safeParse({
    approvalId: formData.get("approvalId")
  });

  if (!parsed.success) {
    redirectApprovalsError("Invalid automation approval request");
  }

  const task = await runManualAutomationTask({
    agentId: "release-monitor",
    adminId: admin.id,
    triggerReference: "server_action:apply_automation_approval",
    inputPayload: {
      approvalId: parsed.data.approvalId
    },
    execute: async () => applyReleaseApproval(parsed.data.approvalId),
    onSuccess: () => {
      revalidatePath(AUTOMATION_APPROVALS_PATH);
      revalidatePath(AUTOMATION_AGENTS_PATH);
      revalidatePath(AUTOMATION_TRIGGER_PATH);
      revalidatePath("/new-releases");
    },
    summarize: (result) => ({
      summary: `Applied automation approval ${result.approvalId} as release ${result.releaseSlug}.`,
      rowsPublished: 1
    })
  });

  const result = task.ok ? task.result : redirectApprovalsError(task.errorMessage);
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "apply_automation_approval",
    targetType: "automation_approval",
    targetId: String(result.approvalId),
    metadata: result
  });

  redirect(
    `${AUTOMATION_APPROVALS_PATH}?notice=${encodeURIComponent(
      `Automation approval applied${result.existed ? ` using existing release ${result.releaseSlug}` : ` and published as ${result.releaseSlug}`}.`
    )}`
  );
}

async function updateAutomationAgentEnabledAction(formData: FormData, isEnabled: boolean) {
  const admin = await requireAdmin();
  const parsed = automationAgentActionSchema.safeParse({
    agentId: formData.get("agentId"),
    returnTo: formData.get("returnTo")
  });

  if (!parsed.success) {
    redirect(`${AUTOMATION_AGENTS_PATH}?error=Invalid%20automation%20agent%20request`);
  }

  const destination = getSafeReturnTo(parsed.data.returnTo);
  const result = isEnabled
    ? await resumeAutomationAgent(parsed.data.agentId)
    : await pauseAutomationAgent(parsed.data.agentId);

  if (!result.ok) {
    redirect(`${destination}?error=${encodeURIComponent(result.errorMessage)}`);
  }

  const supabase = createSupabaseAdminClient();
  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: isEnabled ? "resume_automation_agent" : "pause_automation_agent",
    targetType: "automation_agent",
    targetId: parsed.data.agentId,
    metadata: {
      isEnabled,
      riskClass: result.agent.riskClass,
      autonomyMode: result.agent.autonomyMode
    }
  });

  revalidatePath(AUTOMATION_AGENTS_PATH);
  revalidatePath(AUTOMATION_TRIGGER_PATH);
  revalidatePath(SEARCH_CONSOLE_DASHBOARD_PATH);
  revalidatePath(AUTOMATION_APPROVALS_PATH);
  redirect(
    `${destination}?notice=${encodeURIComponent(
      `${result.agent.name} ${isEnabled ? "resumed" : "paused"}.`
    )}`
  );
}

export async function pauseAutomationAgentAction(formData: FormData) {
  return updateAutomationAgentEnabledAction(formData, false);
}

export async function resumeAutomationAgentAction(formData: FormData) {
  return updateAutomationAgentEnabledAction(formData, true);
}
