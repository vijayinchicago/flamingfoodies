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
import { runEditorialPerformanceEvaluator } from "@/lib/services/editorial-performance-evaluator";
import { runPrepublishQaForScheduledContent } from "@/lib/services/prepublish-qa";
import {
  appendAutomationRunEvent,
  beginAutomationRun,
  completeAutomationRun,
  createAutomationEvaluation,
  failAutomationRun,
  getAutomationRun,
  getAutomationApproval,
  listAutomationStateSnapshots,
  markAutomationRunRolledBack,
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
import {
  applyNewsletterSendApproval,
  processScheduledNewsletterCampaigns,
  syncNewsletterCampaignApprovalStatus
} from "@/lib/services/newsletter";
import {
  parseSearchRuntimeOptimizationSnapshot,
  restoreSearchRuntimeOptimizationSnapshot,
  getSearchRuntimeOptimizationSnapshot,
  runSearchPerformanceEvaluator,
  runSearchInsightsAutomation,
  runSearchRecommendationExecutor,
  updateSearchRecommendationStatus
} from "@/lib/services/search-insights";
import {
  parseShopShelfSnapshot,
  restoreShopShelfSnapshot,
  getShopShelfSnapshot,
  runShopCatalogRefresh
} from "@/lib/services/shop-automation";
import { runSocialDistributionEvaluator } from "@/lib/services/social-distribution-evaluator";
import { runShopPerformanceEvaluator } from "@/lib/services/shop-performance-evaluator";
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
    "prepublish-qa",
    "editorial-performance-evaluator",
    "social-distribution-evaluator",
    "pinterest-distributor",
    "growth-loop-promoter",
    "shop-shelf-curator",
    "shop-performance-evaluator",
    "newsletter-digest-agent",
    "search-insights-analyst",
    "search-recommendation-executor",
    "search-performance-evaluator",
    "festival-discovery",
    "pepper-discovery",
    "brand-discovery",
    "release-monitor",
    "tutorial-generator",
    "content-shop-sync"
  ]),
  returnTo: z.string().optional()
});

const automationRunActionSchema = z.object({
  runId: z.coerce.number().int().positive(),
  returnTo: z.string().optional()
});

const SEARCH_CONSOLE_DASHBOARD_PATH = "/admin/analytics/search-console";
const AUTOMATION_AGENTS_PATH = "/admin/automation/agents";
const AUTOMATION_TRIGGER_PATH = "/admin/automation/trigger";
const AUTOMATION_APPROVALS_PATH = "/admin/automation/approvals";
const AUTOMATION_RUNS_PATH = "/admin/automation/runs";

function revalidateEditorialEvaluationSurfaces() {
  revalidatePath("/admin/automation/agents");
  revalidatePath("/admin/automation/runs");
  revalidatePath("/admin/automation/trigger");
}

function revalidateShopEvaluationSurfaces() {
  revalidatePath("/admin/automation/agents");
  revalidatePath("/admin/automation/runs");
  revalidatePath("/admin/automation/trigger");
}

function revalidateSocialEvaluationSurfaces() {
  revalidatePath("/admin/automation/agents");
  revalidatePath("/admin/automation/runs");
  revalidatePath("/admin/automation/trigger");
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

function redirectRunsError(message: string, returnTo?: string): never {
  const destination = getSafeReturnTo(returnTo, AUTOMATION_RUNS_PATH);
  redirect(withRedirectMessage(destination, "error", message));
}

function getSafeReturnTo(raw: string | undefined, fallback = AUTOMATION_AGENTS_PATH) {
  if (!raw?.startsWith("/admin/")) {
    return fallback;
  }

  return raw;
}

function withRedirectMessage(path: string, key: "notice" | "error", value: string) {
  const url = new URL(path, "https://flamingfoodies.local");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
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
      summary:
        `Published ${result.published.length} scheduled item(s) and blocked ` +
        `${result.blocked.length} failing prepublish QA.`,
      rowsPublished: result.published.length,
      rowsUpdated: result.blocked.length
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
      publishedCount: result.published.length,
      blockedCount: result.blocked.length
    }
  });

  redirect(
    `${AUTOMATION_TRIGGER_PATH}?published=${result.published.length}&publishBlocked=${result.blocked.length}`
  );
}

export async function runPrepublishQaAction() {
  const admin = await requireAdmin();
  const task = await runManualAutomationTask({
    agentId: "prepublish-qa",
    adminId: admin.id,
    triggerReference: "server_action:prepublish_qa",
    inputPayload: {
      dueOnly: false
    },
    execute: () =>
      runPrepublishQaForScheduledContent({
        dueOnly: false
      }),
    onSuccess: () => {
      revalidatePath("/admin/automation/jobs");
      revalidatePath(AUTOMATION_TRIGGER_PATH);
      revalidatePath("/admin/automation/agents");
      revalidatePath("/admin/automation/runs");
      revalidatePath("/admin/content/recipes");
      revalidatePath("/admin/content/blog");
      revalidatePath("/admin/content/reviews");
    },
    summarize: (result) => ({
      summary:
        `Prepublish QA reviewed ${result.reviewed} scheduled item(s), clearing ` +
        `${result.ready} and blocking ${result.blocked}.`,
      rowsUpdated: result.reviewed
    })
  });

  const result = task.ok ? task.result : redirectTriggerError(task.errorMessage);
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "run_prepublish_qa",
    targetType: "automation",
    targetId: "prepublish_qa",
    metadata: result
  });

  redirect(
    `${AUTOMATION_TRIGGER_PATH}?prepublishReviewed=${result.reviewed}&prepublishReady=${result.ready}&prepublishBlocked=${result.blocked}`
  );
}

export async function runEditorialPerformanceEvaluatorAction() {
  const admin = await requireAdmin();
  const task = await runManualAutomationTask({
    agentId: "editorial-performance-evaluator",
    adminId: admin.id,
    triggerReference: "server_action:editorial_performance_evaluator",
    inputPayload: {
      evaluationWindowDays: 14,
      allowImmatureRuns: true
    },
    execute: async () => {
      const result = await runEditorialPerformanceEvaluator({
        evaluationWindowDays: 14,
        allowImmatureRuns: true
      });
      if (!result.ok) {
        throw new Error(result.skippedReason);
      }

      return result;
    },
    onSuccess: () => {
      revalidateEditorialEvaluationSurfaces();
      revalidatePath(AUTOMATION_AGENTS_PATH);
      revalidatePath(AUTOMATION_TRIGGER_PATH);
      revalidatePath(AUTOMATION_RUNS_PATH);
    },
    summarize: (result) => ({
      summary:
        `Recorded ${result.evaluatedContentCount} editorial evaluation verdict(s): ` +
        `${result.keepCount} keep, ${result.escalateCount} escalate, ${result.revertCount} revert.`,
      rowsCreated: result.evaluatedContentCount,
      rowsUpdated: result.skippedExistingCount
    })
  });

  const result = task.ok
    ? task.result
    : redirect(`${AUTOMATION_TRIGGER_PATH}?error=${encodeURIComponent(task.errorMessage)}`);
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "run_editorial_performance_evaluator",
    targetType: "editorial",
    targetId: "manual_evaluator",
    metadata: result
  });

  redirect(
    `${AUTOMATION_TRIGGER_PATH}?editorialEvaluated=1&editorialKeep=${result.keepCount}&editorialEscalate=${result.escalateCount}&editorialRevert=${result.revertCount}&editorialSkipped=${result.skippedExistingCount}`
  );
}

export async function runShopPerformanceEvaluatorAction() {
  const admin = await requireAdmin();
  const task = await runManualAutomationTask({
    agentId: "shop-performance-evaluator",
    adminId: admin.id,
    triggerReference: "server_action:shop_performance_evaluator",
    inputPayload: {
      evaluationWindowDays: 14,
      allowImmatureRuns: true
    },
    execute: async () => {
      const result = await runShopPerformanceEvaluator({
        evaluationWindowDays: 14,
        allowImmatureRuns: true
      });
      if (!result.ok) {
        throw new Error(result.skippedReason);
      }

      return result;
    },
    onSuccess: () => {
      revalidateShopEvaluationSurfaces();
      revalidatePath(AUTOMATION_AGENTS_PATH);
      revalidatePath(AUTOMATION_TRIGGER_PATH);
      revalidatePath(AUTOMATION_RUNS_PATH);
    },
    summarize: (result) => ({
      summary:
        `Recorded ${result.evaluatedContentCount} shop evaluation verdict(s): ` +
        `${result.keepCount} keep, ${result.escalateCount} escalate, ${result.revertCount} revert.`,
      rowsCreated: result.evaluatedContentCount,
      rowsUpdated: result.skippedExistingCount
    })
  });

  const result = task.ok
    ? task.result
    : redirect(`${AUTOMATION_TRIGGER_PATH}?error=${encodeURIComponent(task.errorMessage)}`);
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "run_shop_performance_evaluator",
    targetType: "shop",
    targetId: "manual_evaluator",
    metadata: result
  });

  redirect(
    `${AUTOMATION_TRIGGER_PATH}?shopEvaluated=1&shopKeep=${result.keepCount}&shopEscalate=${result.escalateCount}&shopRevert=${result.revertCount}&shopSkipped=${result.skippedExistingCount}`
  );
}

export async function runSocialDistributionEvaluatorAction() {
  const admin = await requireAdmin();
  const task = await runManualAutomationTask({
    agentId: "social-distribution-evaluator",
    adminId: admin.id,
    triggerReference: "server_action:social_distribution_evaluator",
    inputPayload: {
      evaluationWindowDays: 7,
      allowImmatureRuns: true
    },
    execute: async () => {
      const result = await runSocialDistributionEvaluator({
        evaluationWindowDays: 7,
        allowImmatureRuns: true
      });
      if (!result.ok) {
        throw new Error(result.skippedReason);
      }

      return result;
    },
    onSuccess: () => {
      revalidateSocialEvaluationSurfaces();
      revalidatePath(AUTOMATION_AGENTS_PATH);
      revalidatePath(AUTOMATION_TRIGGER_PATH);
      revalidatePath(AUTOMATION_RUNS_PATH);
    },
    summarize: (result) => ({
      summary:
        `Recorded ${result.evaluatedPostCount} social evaluation verdict(s): ` +
        `${result.keepCount} keep, ${result.escalateCount} escalate, ${result.revertCount} revert.`,
      rowsCreated: result.evaluatedPostCount,
      rowsUpdated: result.skippedExistingCount
    })
  });

  const result = task.ok
    ? task.result
    : redirect(`${AUTOMATION_TRIGGER_PATH}?error=${encodeURIComponent(task.errorMessage)}`);
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "run_social_distribution_evaluator",
    targetType: "social_distribution",
    targetId: "manual_evaluator",
    metadata: result
  });

  redirect(
    `${AUTOMATION_TRIGGER_PATH}?socialEvaluated=1&socialKeep=${result.keepCount}&socialEscalate=${result.escalateCount}&socialRevert=${result.revertCount}&socialSkipped=${result.skippedExistingCount}`
  );
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
      revalidatePath(AUTOMATION_RUNS_PATH);
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
      revalidatePath("/admin/newsletter/new");
      revalidatePath(AUTOMATION_APPROVALS_PATH);
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

export async function runSearchPerformanceEvaluatorAction() {
  const admin = await requireAdmin();
  const task = await runManualAutomationTask({
    agentId: "search-performance-evaluator",
    adminId: admin.id,
    triggerReference: "server_action:search_performance_evaluator",
    inputPayload: {
      evaluationWindowDays: 0,
      includeExistingApplied: true,
      allowPendingSearchConsoleLag: true
    },
    execute: async () => {
      const result = await runSearchPerformanceEvaluator({
        evaluationWindowDays: 0,
        includeExistingApplied: true,
        allowPendingSearchConsoleLag: true
      });
      if (!result.ok) {
        throw new Error(result.skippedReason);
      }

      return result;
    },
    onSuccess: () => {
      revalidateSearchInsightSurfaces();
      revalidatePath(AUTOMATION_AGENTS_PATH);
      revalidatePath(AUTOMATION_TRIGGER_PATH);
      revalidatePath(AUTOMATION_RUNS_PATH);
    },
    summarize: (result) => ({
      summary:
        `Recorded ${result.evaluatedRecommendationCount} search evaluation verdict(s): ` +
        `${result.keepCount} keep, ${result.escalateCount} escalate, ${result.revertCount} revert.`,
      rowsCreated: result.evaluatedRecommendationCount,
      rowsUpdated: result.skippedExistingCount
    })
  });

  const result = task.ok
    ? task.result
    : redirect(`${SEARCH_CONSOLE_DASHBOARD_PATH}?error=${encodeURIComponent(task.errorMessage)}`);
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "run_search_performance_evaluator",
    targetType: "search_console",
    targetId: "manual_evaluator",
    metadata: result
  });

  redirect(
    `${SEARCH_CONSOLE_DASHBOARD_PATH}?evaluated=1&searchKeep=${result.keepCount}&searchEscalate=${result.escalateCount}&searchRevert=${result.revertCount}&searchEvaluated=${result.evaluatedRecommendationCount}&searchSkipped=${result.skippedExistingCount}&latest=${result.latestAvailableDate}`
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
  await syncNewsletterCampaignApprovalStatus({
    approvalId: approval.id,
    status: input.status
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
  revalidatePath("/admin/newsletter/campaigns");
  revalidatePath("/admin/newsletter/new");
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

  const approval = await getAutomationApproval(parsed.data.approvalId);
  if (!approval) {
    redirectApprovalsError("Automation approval not found");
  }

  const task = await runManualAutomationTask({
    agentId: approval.agentId,
    adminId: admin.id,
    triggerReference: "server_action:apply_automation_approval",
    inputPayload: {
      approvalId: parsed.data.approvalId
    },
    execute: async () => {
      if (
        approval.agentId === "release-monitor"
        && approval.subjectType === "release"
        && approval.proposedAction === "publish_release"
      ) {
        return applyReleaseApproval(parsed.data.approvalId);
      }

      if (
        approval.agentId === "newsletter-digest-agent"
        && approval.subjectType === "newsletter_campaign"
        && approval.proposedAction === "send_newsletter_campaign"
      ) {
        return applyNewsletterSendApproval(parsed.data.approvalId);
      }

      throw new Error("This automation approval does not support direct apply yet.");
    },
    onSuccess: () => {
      revalidatePath(AUTOMATION_APPROVALS_PATH);
      revalidatePath(AUTOMATION_AGENTS_PATH);
      revalidatePath(AUTOMATION_TRIGGER_PATH);
      if (approval.agentId === "release-monitor") {
        revalidatePath("/new-releases");
      }

      if (approval.agentId === "newsletter-digest-agent") {
        revalidatePath("/admin/newsletter/campaigns");
        revalidatePath("/admin/newsletter/new");
      }
    },
    summarize: (result) => {
      if (
        approval.agentId === "release-monitor"
        && "releaseSlug" in result
        && typeof result.releaseSlug === "string"
      ) {
        return {
          summary: `Applied automation approval ${result.approvalId} as release ${result.releaseSlug}.`,
          rowsPublished: 1
        };
      }

      if (
        approval.agentId === "newsletter-digest-agent"
        && "campaignId" in result
        && typeof result.campaignId === "number"
      ) {
        return {
          summary: `Applied newsletter send approval ${result.approvalId} for campaign ${result.campaignId}.`,
          rowsSent: 1,
          externalActionsCount: 1
        };
      }

      return {
        summary: `Applied automation approval ${parsed.data.approvalId}.`
      };
    }
  });

  const result = task.ok ? task.result : redirectApprovalsError(task.errorMessage);
  const supabase = createSupabaseAdminClient();

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "apply_automation_approval",
    targetType: "automation_approval",
    targetId: String(parsed.data.approvalId),
    metadata: result
  });

  let notice = "Automation approval applied.";
  if (
    approval.agentId === "release-monitor"
    && "releaseSlug" in result
    && typeof result.releaseSlug === "string"
  ) {
    const existed = "existed" in result && result.existed === true;
    notice = `Automation approval applied${existed ? ` using existing release ${result.releaseSlug}` : ` and published as ${result.releaseSlug}`}.`;
  } else if (
    approval.agentId === "newsletter-digest-agent"
    && "campaignId" in result
    && typeof result.campaignId === "number"
  ) {
    const alreadySent = "alreadySent" in result && result.alreadySent === true;
    notice = `Newsletter approval applied and campaign ${result.campaignId} was ${alreadySent ? "already sent" : "sent now"}.`;
  }

  redirect(
    `${AUTOMATION_APPROVALS_PATH}?notice=${encodeURIComponent(notice)}`
  );
}

function getAutomationRunEvaluationPayload(run: Awaited<ReturnType<typeof getAutomationRun>>) {
  if (!run) {
    return {};
  }

  return {
    status: run.status,
    triggerSource: run.triggerSource,
    summary: run.summary,
    errorMessage: run.errorMessage,
    rowsCreated: run.rowsCreated,
    rowsUpdated: run.rowsUpdated,
    rowsPublished: run.rowsPublished,
    rowsSent: run.rowsSent,
    inputPayload: run.inputPayload,
    resultPayload: run.resultPayload
  };
}

function getRollbackSnapshotScope(agentId: NonNullable<Awaited<ReturnType<typeof getAutomationRun>>>["agentId"]) {
  if (agentId === "search-recommendation-executor") {
    return "site_settings.search_runtime_optimizations";
  }

  if (agentId === "shop-shelf-curator") {
    return "merch_products.shop_shelf";
  }

  return null;
}

async function createAutomationRunEvaluationAction(input: {
  formData: FormData;
  verdict: "keep" | "escalate";
  notes: string;
  auditAction: string;
  notice: string;
}) {
  const admin = await requireAdmin();
  const parsed = automationRunActionSchema.safeParse({
    runId: input.formData.get("runId"),
    returnTo: input.formData.get("returnTo")
  });

  if (!parsed.success) {
    redirectRunsError(
      "Invalid automation run request",
      input.formData.get("returnTo")?.toString()
    );
  }

  const destination = getSafeReturnTo(
    parsed.data.returnTo,
    `${AUTOMATION_RUNS_PATH}?runId=${parsed.data.runId}`
  );
  const run = await getAutomationRun(parsed.data.runId);

  if (!run) {
    redirectRunsError("Automation run not found", destination);
  }

  const evaluation = await createAutomationEvaluation({
    agentId: run.agentId,
    sourceRunId: run.id,
    subjectType: "automation_run",
    subjectKey: `run:${run.id}`,
    evaluationWindowDays: 0,
    baselinePayload: getAutomationRunEvaluationPayload(run),
    observedPayload: {
      status: run.status,
      rollbackRunId: run.rollbackRunId
    },
    verdict: input.verdict,
    notes: input.notes
  });

  const supabase = createSupabaseAdminClient();
  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: input.auditAction,
    targetType: "automation_run",
    targetId: String(run.id),
    metadata: {
      verdict: evaluation.verdict,
      evaluationId: evaluation.id
    }
  });

  revalidatePath(AUTOMATION_RUNS_PATH);
  revalidatePath(AUTOMATION_AGENTS_PATH);
  redirect(withRedirectMessage(destination, "notice", input.notice));
}

export async function markAutomationRunKeepAction(formData: FormData) {
  return createAutomationRunEvaluationAction({
    formData,
    verdict: "keep",
    notes: "Reviewed by admin and kept as-is.",
    auditAction: "keep_automation_run",
    notice: "Automation run marked keep."
  });
}

export async function escalateAutomationRunAction(formData: FormData) {
  return createAutomationRunEvaluationAction({
    formData,
    verdict: "escalate",
    notes: "Reviewed by admin and escalated for follow-up.",
    auditAction: "escalate_automation_run",
    notice: "Automation run escalated for follow-up."
  });
}

export async function rollbackAutomationRunAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = automationRunActionSchema.safeParse({
    runId: formData.get("runId"),
    returnTo: formData.get("returnTo")
  });

  if (!parsed.success) {
    redirectRunsError("Invalid automation run request", formData.get("returnTo")?.toString());
  }

  const destination = getSafeReturnTo(
    parsed.data.returnTo,
    `${AUTOMATION_RUNS_PATH}?runId=${parsed.data.runId}`
  );
  const run = await getAutomationRun(parsed.data.runId);

  if (!run) {
    redirectRunsError("Automation run not found", destination);
  }

  if (run.status !== "succeeded") {
    redirectRunsError("Only successful runs with snapshots can be rolled back.", destination);
  }

  if (run.rollbackRunId) {
    redirectRunsError("This run has already been rolled back.", destination);
  }

  const snapshotScope = getRollbackSnapshotScope(run.agentId);
  if (!snapshotScope) {
    redirectRunsError("This automation lane does not support snapshot rollback yet.", destination);
  }

  const snapshots = await listAutomationStateSnapshots({
    runId: run.id,
    limit: 20
  });
  const snapshot = snapshots.find((entry) => entry.scope === snapshotScope);

  if (!snapshot) {
    redirectRunsError("No rollback snapshot is available for this run.", destination);
  }

  const rollbackRun = await beginAutomationRun({
    agentId: run.agentId,
    triggerSource: "admin_action",
    triggerReference: `server_action:rollback_run:${run.id}`,
    inputPayload: {
      sourceRunId: run.id,
      snapshotId: snapshot.id,
      snapshotScope: snapshot.scope
    },
    createdByAdminId: admin.id
  });

  if (!rollbackRun) {
    redirectRunsError("Failed to start rollback run.", destination);
  }

  await appendAutomationRunEvent(rollbackRun, {
    level: "info",
    code: "rollback_started",
    message: `Rollback for run #${run.id} started.`,
    payload: {
      sourceRunId: run.id,
      snapshotId: snapshot.id,
      snapshotScope: snapshot.scope
    }
  });

  try {
    let restoreResult: Record<string, unknown>;
    let beforeRollbackState: unknown;
    let afterRollbackState: unknown;

    if (run.agentId === "search-recommendation-executor") {
      const rollbackSnapshot = parseSearchRuntimeOptimizationSnapshot(snapshot.beforePayload);
      if (!rollbackSnapshot) {
        throw new Error("The stored search runtime snapshot could not be parsed.");
      }

      beforeRollbackState = await getSearchRuntimeOptimizationSnapshot();
      const restored = await restoreSearchRuntimeOptimizationSnapshot(rollbackSnapshot);
      afterRollbackState = await getSearchRuntimeOptimizationSnapshot();
      restoreResult = {
        scope: snapshot.scope,
        restoredTargetCount: restored.restoredTargetCount,
        restoredRecommendationCount: restored.restoredRecommendationCount
      };
    } else if (run.agentId === "shop-shelf-curator") {
      const rollbackSnapshot = parseShopShelfSnapshot(snapshot.beforePayload);
      if (!rollbackSnapshot) {
        throw new Error("The stored shop shelf snapshot could not be parsed.");
      }

      beforeRollbackState = await getShopShelfSnapshot();
      const restored = await restoreShopShelfSnapshot(rollbackSnapshot);
      afterRollbackState = await getShopShelfSnapshot();
      restoreResult = {
        scope: snapshot.scope,
        restoredEntries: restored.restoredEntries,
        clearedEntries: restored.clearedEntries,
        missingEntries: restored.missingEntries
      };
    } else {
      throw new Error("This automation lane does not support rollback yet.");
    }

    await recordAutomationSnapshot(rollbackRun, {
      scope: snapshot.scope,
      subjectKey: snapshot.subjectKey,
      beforePayload: beforeRollbackState,
      afterPayload: afterRollbackState
    });

    await createAutomationEvaluation({
      agentId: run.agentId,
      sourceRunId: run.id,
      subjectType: "automation_run",
      subjectKey: `run:${run.id}`,
      evaluationWindowDays: 0,
      baselinePayload: snapshot.afterPayload,
      observedPayload: {
        rollbackRunId: rollbackRun.id,
        restoredTo: snapshot.beforePayload,
        restoreResult
      },
      verdict: "revert",
      notes: "Rolled back by admin using the stored pre-run snapshot."
    });

    await completeAutomationRun(rollbackRun, {
      summary: `Rolled back run #${run.id} using the stored ${snapshot.scope} snapshot.`,
      resultPayload: {
        sourceRunId: run.id,
        snapshotId: snapshot.id,
        restoreResult
      },
      rowsUpdated:
        typeof restoreResult.restoredEntries === "number"
          ? restoreResult.restoredEntries + Number(restoreResult.clearedEntries ?? 0)
          : Number(restoreResult.restoredTargetCount ?? 0)
    });

    await appendAutomationRunEvent(rollbackRun, {
      level: "info",
      code: "rollback_succeeded",
      message: `Rollback for run #${run.id} completed successfully.`,
      payload: restoreResult
    });

    await markAutomationRunRolledBack({
      runId: run.id,
      rollbackRunId: rollbackRun.id
    });

    await appendAutomationRunEvent(
      {
        id: run.id,
        agentId: run.agentId,
        startedAt: run.startedAt
      },
      {
        level: "warning",
        code: "run_rolled_back",
        message: `Run #${run.id} was rolled back by admin.`,
        payload: {
          rollbackRunId: rollbackRun.id,
          snapshotId: snapshot.id
        }
      }
    );

    const supabase = createSupabaseAdminClient();
    await writeAuditLog(supabase, {
      adminId: admin.id,
      action: "rollback_automation_run",
      targetType: "automation_run",
      targetId: String(run.id),
      metadata: {
        rollbackRunId: rollbackRun.id,
        snapshotId: snapshot.id,
        snapshotScope: snapshot.scope
      }
    });

    revalidatePath(AUTOMATION_RUNS_PATH);
    revalidatePath(AUTOMATION_AGENTS_PATH);
    revalidatePath(AUTOMATION_TRIGGER_PATH);

    if (run.agentId === "search-recommendation-executor") {
      revalidateSearchInsightSurfaces();
    } else if (run.agentId === "shop-shelf-curator") {
      revalidatePath("/admin/content/merch");
      revalidatePath("/shop");
    }

    redirect(
      withRedirectMessage(
        destination,
        "notice",
        `Automation run #${run.id} rolled back successfully.`
      )
    );
  } catch (error) {
    await failAutomationRun(rollbackRun, error);
    await appendAutomationRunEvent(rollbackRun, {
      level: "error",
      code: "rollback_failed",
      message: `Rollback for run #${run.id} failed.`,
      payload: {
        message: error instanceof Error ? error.message : "Unknown rollback error"
      }
    });

    redirectRunsError(
      error instanceof Error ? error.message : "Rollback failed.",
      destination
    );
  }
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
