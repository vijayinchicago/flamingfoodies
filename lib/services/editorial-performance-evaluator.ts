import { flags } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_EDITORIAL_EVALUATION_WINDOW_DAYS = 14;
const DEFAULT_EDITORIAL_EVALUATION_MAX_RUNS = 10;

type EditorialPublishedContentType = "recipe" | "blog_post" | "review";

type AutomationEvaluationLookupRow = {
  source_run_id: number;
  subject_key: string;
};

type EditorialAutomationRunRow = {
  id: number;
  completed_at: string | null;
  result_payload: unknown;
};

type EditorialRunCandidate = {
  id: number;
  type: EditorialPublishedContentType;
  slug: string;
  title: string;
  path: string;
  publishedAt?: string | null;
};

type EditorialPerformanceMetrics = {
  views: number;
  shareEvents: number;
  saves: number;
  ratings: number;
  comments: number;
  affiliateClicks: number;
  // Site-wide newsletter signups during this evaluation window, attributed
  // to the candidate's content TYPE (not specific path). Coarse signal — see
  // attribution mapping below for source-string conventions. Useful as
  // contextual data; not a primary scoring driver until per-page attribution
  // is wired through the email-capture component.
  newsletterSignupsForType: number;
};

// Maps newsletter_subscribers.source values to editorial content types.
// Update if EmailCapture's `source` prop conventions change.
const NEWSLETTER_SOURCE_TO_CONTENT_TYPE: Record<string, EditorialPublishedContentType> = {
  "recipe-page": "recipe",
  "recipe_page": "recipe",
  "review-page": "review",
  "review_page": "review",
  "blog-page": "blog_post",
  "blog_page": "blog_post"
};

type EditorialPerformanceVerdict = {
  verdict: "keep" | "revert" | "escalate";
  notes: string;
  observedPayload: Record<string, unknown>;
};

export type EditorialPerformanceEvaluatorResult =
  | {
      ok: false;
      skippedReason: string;
    }
  | {
      ok: true;
      evaluationWindowDays: number;
      candidateRunCount: number;
      evaluatedRunIds: number[];
      evaluatedContentCount: number;
      keepCount: number;
      revertCount: number;
      escalateCount: number;
      skippedExistingCount: number;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeEditorialContentType(value: unknown): EditorialPublishedContentType | null {
  if (value === "recipe" || value === "blog_post" || value === "review") {
    return value;
  }

  return null;
}

function buildEditorialPath(type: EditorialPublishedContentType, slug: string) {
  if (type === "recipe") {
    return `/recipes/${slug}`;
  }

  if (type === "blog_post") {
    return `/blog/${slug}`;
  }

  return `/reviews/${slug}`;
}

function buildEditorialSubjectKey(type: EditorialPublishedContentType, slug: string) {
  return `${type}:${slug}`;
}

function parseEditorialCandidate(value: unknown): EditorialRunCandidate | null {
  if (!isRecord(value)) {
    return null;
  }

  const type = normalizeEditorialContentType(value.type);
  const slug = String(value.slug ?? "").trim();
  const title = String(value.title ?? "").trim();
  const id = Number(value.id);
  const publishedAt = typeof value.publishAt === "string"
    ? value.publishAt
    : typeof value.publishedAt === "string"
      ? value.publishedAt
      : null;

  if (!type || !slug || !title || !Number.isFinite(id)) {
    return null;
  }

  return {
    id,
    type,
    slug,
    title,
    path: buildEditorialPath(type, slug),
    publishedAt
  };
}

function getEditorialRunCandidates(resultPayload: unknown) {
  if (!isRecord(resultPayload)) {
    return [] as EditorialRunCandidate[];
  }

  const publishedCandidates = Array.isArray(resultPayload.published)
    ? resultPayload.published.map(parseEditorialCandidate).filter(Boolean)
    : [];
  const reevaluatedCandidates = Array.isArray(resultPayload.items)
    ? resultPayload.items
        .filter(
          (item) =>
            isRecord(item) &&
            item.status === "published"
        )
        .map(parseEditorialCandidate)
        .filter(Boolean)
    : [];

  const allCandidates = [...publishedCandidates, ...reevaluatedCandidates].filter(
    (candidate): candidate is EditorialRunCandidate => Boolean(candidate)
  );

  return allCandidates.filter(
    (candidate, index, all) =>
      index === all.findIndex(
        (entry) => entry.type === candidate.type && entry.slug === candidate.slug
      )
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function buildEditorialPerformanceVerdict(input: {
  candidate: EditorialRunCandidate;
  metrics: EditorialPerformanceMetrics;
  evaluationWindowDays: number;
  windowStart: string;
  windowEnd: string;
}) {
  const { candidate, metrics } = input;
  const interactions = metrics.saves + metrics.ratings + metrics.comments;

  // Soft nudge: a healthy site-wide signup volume in the same window for this
  // content type suggests the lane is still earning audience attention, even
  // when individual interaction signals are mixed.
  const signupContext = metrics.newsletterSignupsForType >= 5
    ? ` Site-wide ${candidate.type.replace("_", " ")} pages drove ${formatNumber(metrics.newsletterSignupsForType)} newsletter signup(s) in the same window.`
    : "";

  if (
    metrics.affiliateClicks >= 2
    || metrics.views >= 80
    || interactions >= 4
    || metrics.shareEvents >= 2
    || (metrics.views >= 35 && (interactions >= 1 || metrics.shareEvents >= 1))
  ) {
    return {
      verdict: "keep" as const,
      notes:
        `${candidate.title} showed healthy early traction in the first ${input.evaluationWindowDays} day(s): ` +
        `${formatNumber(metrics.views)} views, ${formatNumber(interactions)} interactions, ` +
        `${formatNumber(metrics.shareEvents)} share event(s), and ${formatNumber(metrics.affiliateClicks)} affiliate click(s).${signupContext}`,
      observedPayload: {
        path: candidate.path,
        contentType: candidate.type,
        evaluationWindowStart: input.windowStart,
        evaluationWindowEnd: input.windowEnd,
        metrics: {
          ...metrics,
          interactions
        }
      }
    } satisfies EditorialPerformanceVerdict;
  }

  if (
    metrics.views < 15
    && interactions === 0
    && metrics.shareEvents === 0
    && metrics.affiliateClicks === 0
  ) {
    return {
      verdict: "revert" as const,
      notes:
        `${candidate.title} showed almost no early traction in the first ${input.evaluationWindowDays} day(s): ` +
        `${formatNumber(metrics.views)} views and no meaningful engagement or affiliate signal. ` +
        "Review whether this page should be rewritten, de-prioritized, or kept out of autopromote flows.",
      observedPayload: {
        path: candidate.path,
        contentType: candidate.type,
        evaluationWindowStart: input.windowStart,
        evaluationWindowEnd: input.windowEnd,
        metrics: {
          ...metrics,
          interactions
        }
      }
    } satisfies EditorialPerformanceVerdict;
  }

  return {
    verdict: "escalate" as const,
    notes:
      `${candidate.title} has mixed early signals after publication: ${formatNumber(metrics.views)} views, ` +
      `${formatNumber(interactions)} interactions, ${formatNumber(metrics.shareEvents)} share event(s), and ` +
      `${formatNumber(metrics.affiliateClicks)} affiliate click(s). Keep watching before changing the lane policy.${signupContext}`,
    observedPayload: {
      path: candidate.path,
      contentType: candidate.type,
      evaluationWindowStart: input.windowStart,
      evaluationWindowEnd: input.windowEnd,
      metrics: {
        ...metrics,
        interactions
      }
    }
  } satisfies EditorialPerformanceVerdict;
}

export async function runEditorialPerformanceEvaluator(options?: {
  evaluationWindowDays?: number;
  maxRuns?: number;
  allowImmatureRuns?: boolean;
}): Promise<EditorialPerformanceEvaluatorResult> {
  if (!flags.hasSupabaseAdmin) {
    return {
      ok: false,
      skippedReason: "Supabase admin access is required to evaluate editorial publish performance."
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      ok: false,
      skippedReason: "Editorial evaluator storage is not configured."
    };
  }

  const evaluationWindowDays = Math.max(
    0,
    Math.trunc(options?.evaluationWindowDays ?? DEFAULT_EDITORIAL_EVALUATION_WINDOW_DAYS)
  );
  const maxRuns = Math.max(1, Math.trunc(options?.maxRuns ?? DEFAULT_EDITORIAL_EVALUATION_MAX_RUNS));
  const allowImmatureRuns = options?.allowImmatureRuns === true;
  const now = new Date();

  const executorRunsResult = await supabase
    .from("automation_runs")
    .select("id, completed_at, result_payload")
    .eq("agent_id", "editorial-autopublisher")
    .eq("status", "succeeded")
    .gt("rows_published", 0)
    .order("completed_at", { ascending: false })
    .limit(maxRuns * 3);

  if (executorRunsResult.error) {
    throw new Error(
      `Failed to read editorial runs for evaluation: ${executorRunsResult.error.message}`
    );
  }

  const candidateRuns = ((executorRunsResult.data ?? []) as EditorialAutomationRunRow[])
    .filter((row) => typeof row.id === "number" && typeof row.completed_at === "string")
    .filter((row) => {
      if (allowImmatureRuns) {
        return true;
      }

      const ageMs = now.getTime() - new Date(String(row.completed_at)).getTime();
      return ageMs >= evaluationWindowDays * DAY_IN_MS;
    })
    .slice(0, maxRuns);

  if (!candidateRuns.length) {
    return {
      ok: true,
      evaluationWindowDays,
      candidateRunCount: 0,
      evaluatedRunIds: [],
      evaluatedContentCount: 0,
      keepCount: 0,
      revertCount: 0,
      escalateCount: 0,
      skippedExistingCount: 0
    };
  }

  const candidateRunIds = candidateRuns.map((run) => run.id);
  const { data: existingRows, error: existingError } = await supabase
    .from("automation_evaluations")
    .select("source_run_id, subject_key")
    .in("source_run_id", candidateRunIds);

  if (existingError) {
    throw new Error(`Failed to read existing editorial evaluations: ${existingError.message}`);
  }

  const existingByRunId = new Map<number, Set<string>>();
  for (const row of (existingRows ?? []) as AutomationEvaluationLookupRow[]) {
    const existing = existingByRunId.get(row.source_run_id) ?? new Set<string>();
    existing.add(String(row.subject_key));
    existingByRunId.set(row.source_run_id, existing);
  }

  const inserts: Array<Record<string, unknown>> = [];
  const evaluatedRunIds = new Set<number>();
  let keepCount = 0;
  let revertCount = 0;
  let escalateCount = 0;
  let skippedExistingCount = 0;

  for (const run of candidateRuns) {
    const completedAt = new Date(String(run.completed_at));
    const ageMs = now.getTime() - completedAt.getTime();
    const usedImmatureWindow = allowImmatureRuns && ageMs < evaluationWindowDays * DAY_IN_MS;
    const windowEnd = evaluationWindowDays > 0
      ? new Date(
          Math.min(now.getTime(), completedAt.getTime() + evaluationWindowDays * DAY_IN_MS)
        )
      : now;
    const candidates = getEditorialRunCandidates(run.result_payload);

    if (!candidates.length) {
      continue;
    }

    const candidatePaths = candidates.map((candidate) => candidate.path);
    const recipeIds = candidates
      .filter((candidate) => candidate.type === "recipe")
      .map((candidate) => candidate.id);
    const candidateTypes = [...new Set(candidates.map((candidate) => candidate.type))];
    const candidateIds = [...new Set(candidates.map((candidate) => candidate.id))];
    const candidateKeys = new Set(candidates.map((candidate) => `${candidate.type}:${candidate.id}`));
    const candidateRecipeSlugs = new Set(
      candidates
        .filter((candidate) => candidate.type === "recipe")
        .map((candidate) => candidate.slug)
    );

    const [pageViewRows, shareRows, saveRows, ratingRows, commentRows, affiliateRows, signupRows] = await Promise.all([
      supabase
        .from("telemetry_events")
        .select("path")
        .eq("event_name", "page_view")
        .gte("occurred_at", completedAt.toISOString())
        .lt("occurred_at", windowEnd.toISOString())
        .in("path", candidatePaths),
      supabase
        .from("telemetry_events")
        .select("path, content_type, content_slug")
        .eq("event_name", "recipe_share")
        .gte("occurred_at", completedAt.toISOString())
        .lt("occurred_at", windowEnd.toISOString()),
      recipeIds.length
        ? supabase
            .from("recipe_saves")
            .select("recipe_id")
            .gte("saved_at", completedAt.toISOString())
            .lt("saved_at", windowEnd.toISOString())
            .in("recipe_id", recipeIds)
        : Promise.resolve({ data: [], error: null }),
      recipeIds.length
        ? supabase
            .from("recipe_ratings")
            .select("recipe_id")
            .gte("created_at", completedAt.toISOString())
            .lt("created_at", windowEnd.toISOString())
            .in("recipe_id", recipeIds)
        : Promise.resolve({ data: [], error: null }),
      candidateIds.length
        ? supabase
            .from("comments")
            .select("content_type, content_id")
            .gte("created_at", completedAt.toISOString())
            .lt("created_at", windowEnd.toISOString())
            .in("content_type", candidateTypes)
            .in("content_id", candidateIds)
        : Promise.resolve({ data: [], error: null }),
      candidatePaths.length
        ? supabase
            .from("affiliate_clicks")
            .select("source_page")
            .gte("clicked_at", completedAt.toISOString())
            .lt("clicked_at", windowEnd.toISOString())
            .in("source_page", candidatePaths)
        : Promise.resolve({ data: [], error: null }),
      // Coarse-grained newsletter signal: count signups in window grouped by
      // source. Mapped to content type for per-candidate enrichment. See
      // NEWSLETTER_SOURCE_TO_CONTENT_TYPE for the mapping conventions.
      supabase
        .from("newsletter_subscribers")
        .select("source")
        .gte("subscribed_at", completedAt.toISOString())
        .lt("subscribed_at", windowEnd.toISOString())
    ]);

    const errors = [
      pageViewRows.error,
      shareRows.error,
      saveRows.error,
      ratingRows.error,
      commentRows.error,
      affiliateRows.error,
      signupRows.error
    ].filter(Boolean);
    if (errors.length) {
      throw new Error(
        `Failed to read editorial performance signals for run ${run.id}: ${errors[0]?.message}`
      );
    }

    const viewCounts = new Map<string, number>();
    const shareCounts = new Map<string, number>();
    const saveCounts = new Map<number, number>();
    const ratingCounts = new Map<number, number>();
    const commentCounts = new Map<string, number>();
    const affiliateCounts = new Map<string, number>();
    const signupsByContentType = new Map<EditorialPublishedContentType, number>();

    for (const row of signupRows.data ?? []) {
      const source = typeof row.source === "string" ? row.source : null;
      if (!source) continue;
      const contentType = NEWSLETTER_SOURCE_TO_CONTENT_TYPE[source];
      if (!contentType) continue;
      signupsByContentType.set(contentType, (signupsByContentType.get(contentType) ?? 0) + 1);
    }

    for (const row of pageViewRows.data ?? []) {
      const path = String(row.path ?? "");
      if (!path) {
        continue;
      }

      viewCounts.set(path, (viewCounts.get(path) ?? 0) + 1);
    }

    for (const row of shareRows.data ?? []) {
      const path = typeof row.path === "string" ? row.path : null;
      const contentType = normalizeEditorialContentType(row.content_type);
      const contentSlug = typeof row.content_slug === "string" ? row.content_slug : null;
      if (path && candidatePaths.includes(path)) {
        shareCounts.set(path, (shareCounts.get(path) ?? 0) + 1);
        continue;
      }

      if (contentType === "recipe" && contentSlug && candidateRecipeSlugs.has(contentSlug)) {
        const recipePath = buildEditorialPath("recipe", contentSlug);
        shareCounts.set(recipePath, (shareCounts.get(recipePath) ?? 0) + 1);
      }
    }

    for (const row of saveRows.data ?? []) {
      const recipeId = Number(row.recipe_id);
      if (!Number.isFinite(recipeId)) {
        continue;
      }

      saveCounts.set(recipeId, (saveCounts.get(recipeId) ?? 0) + 1);
    }

    for (const row of ratingRows.data ?? []) {
      const recipeId = Number(row.recipe_id);
      if (!Number.isFinite(recipeId)) {
        continue;
      }

      ratingCounts.set(recipeId, (ratingCounts.get(recipeId) ?? 0) + 1);
    }

    for (const row of commentRows.data ?? []) {
      const contentType = normalizeEditorialContentType(row.content_type);
      const contentId = Number(row.content_id);
      if (!contentType || !Number.isFinite(contentId)) {
        continue;
      }

      const commentKey = `${contentType}:${contentId}`;
      if (!candidateKeys.has(commentKey)) {
        continue;
      }

      commentCounts.set(commentKey, (commentCounts.get(commentKey) ?? 0) + 1);
    }

    for (const row of affiliateRows.data ?? []) {
      const sourcePage = String(row.source_page ?? "");
      if (!sourcePage) {
        continue;
      }

      affiliateCounts.set(sourcePage, (affiliateCounts.get(sourcePage) ?? 0) + 1);
    }

    const existingSubjectKeys = existingByRunId.get(run.id) ?? new Set<string>();

    for (const candidate of candidates) {
      const subjectKey = buildEditorialSubjectKey(candidate.type, candidate.slug);
      if (existingSubjectKeys.has(subjectKey)) {
        skippedExistingCount += 1;
        continue;
      }

      const metrics: EditorialPerformanceMetrics = {
        views: viewCounts.get(candidate.path) ?? 0,
        shareEvents: shareCounts.get(candidate.path) ?? 0,
        saves: candidate.type === "recipe" ? saveCounts.get(candidate.id) ?? 0 : 0,
        ratings: candidate.type === "recipe" ? ratingCounts.get(candidate.id) ?? 0 : 0,
        comments: commentCounts.get(`${candidate.type}:${candidate.id}`) ?? 0,
        affiliateClicks: affiliateCounts.get(candidate.path) ?? 0,
        newsletterSignupsForType: signupsByContentType.get(candidate.type) ?? 0
      };

      let verdict = buildEditorialPerformanceVerdict({
        candidate,
        metrics,
        evaluationWindowDays,
        windowStart: completedAt.toISOString(),
        windowEnd: windowEnd.toISOString()
      });

      if (usedImmatureWindow && verdict.verdict === "revert") {
        verdict = {
          ...verdict,
          verdict: "escalate",
          notes:
            `Seed evaluation only: this editorial run is not yet ${evaluationWindowDays} day(s) old. ` +
            verdict.notes.replace("Review whether this page should be rewritten, de-prioritized, or kept out of autopromote flows.", "Keep watching before making a stronger editorial decision.")
        };
      } else if (usedImmatureWindow) {
        verdict = {
          ...verdict,
          notes:
            `Seed evaluation only: this editorial run is not yet ${evaluationWindowDays} day(s) old. ${verdict.notes}`
        };
      }

      if (verdict.verdict === "keep") {
        keepCount += 1;
      } else if (verdict.verdict === "revert") {
        revertCount += 1;
      } else {
        escalateCount += 1;
      }

      inserts.push({
        agent_id: "editorial-performance-evaluator",
        source_run_id: run.id,
        subject_type: "editorial_content",
        subject_key: subjectKey,
        evaluation_window_days: evaluationWindowDays,
        baseline_payload: {
          id: candidate.id,
          type: candidate.type,
          slug: candidate.slug,
          title: candidate.title,
          path: candidate.path,
          publishedAt: candidate.publishedAt ?? null,
          sourceRunCompletedAt: run.completed_at
        },
        observed_payload: {
          ...verdict.observedPayload,
          sourceRunCompletedAt: run.completed_at,
          usedImmatureWindow
        },
        verdict: verdict.verdict,
        notes: verdict.notes
      });
      evaluatedRunIds.add(run.id);
      existingSubjectKeys.add(subjectKey);
    }
  }

  if (inserts.length) {
    const { error } = await supabase.from("automation_evaluations").insert(inserts);
    if (error) {
      throw new Error(`Failed to write editorial evaluator verdicts: ${error.message}`);
    }
  }

  return {
    ok: true,
    evaluationWindowDays,
    candidateRunCount: candidateRuns.length,
    evaluatedRunIds: [...evaluatedRunIds].sort((left, right) => right - left),
    evaluatedContentCount: inserts.length,
    keepCount,
    revertCount,
    escalateCount,
    skippedExistingCount
  };
}
