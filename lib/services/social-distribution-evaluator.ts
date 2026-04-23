import { classifyAcquisitionSource, isSocialSource } from "@/lib/pirate-metrics";
import { flags } from "@/lib/env";
import {
  extractInternalPathFromUrl,
  parseSocialAutomationContext,
  type SocialAutomationContext
} from "@/lib/services/social";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_SOCIAL_EVALUATION_WINDOW_DAYS = 7;
const DEFAULT_SOCIAL_EVALUATION_MAX_RUNS = 10;

type AutomationEvaluationLookupRow = {
  source_run_id: number;
  subject_key: string;
};

type SocialDistributorRunRow = {
  id: number;
  completed_at: string | null;
  result_payload: unknown;
};

type SocialPostRow = {
  id: number;
  status: string | null;
  published_at: string | null;
  engagement: unknown;
  platform: string | null;
  content_type: string | null;
  content_id: number | null;
  link_url: string | null;
  platform_post_id: string | null;
  automation_context: unknown;
};

type SocialRunCandidate = {
  id: number;
  platform: string;
  contentType: string;
  contentId: number;
  linkUrl: string | null;
  path: string | null;
  publishedAt: string | null;
  platformPostId: string | null;
  automationContext: SocialAutomationContext | null;
};

type SocialTelemetryRow = {
  path: string | null;
  utm_source: string | null;
  referrer: string | null;
};

type SocialAffiliateRow = {
  source_page: string | null;
};

type SocialContentTitleRow = {
  id: number;
  title: string;
};

type SocialEngagementMetrics = {
  likes: number;
  shares: number;
  comments: number;
  impressions: number;
};

type SocialPerformanceMetrics = {
  totalViews: number;
  socialViews: number;
  platformViews: number;
  affiliateClicks: number;
  engagementLikes: number;
  engagementShares: number;
  engagementComments: number;
  engagementImpressions: number;
  currentStatus: string;
  publishedAt: string | null;
};

type SocialDistributionVerdict = {
  verdict: "keep" | "revert" | "escalate";
  notes: string;
  observedPayload: Record<string, unknown>;
};

export type SocialDistributionEvaluatorResult =
  | {
      ok: false;
      skippedReason: string;
    }
  | {
      ok: true;
      evaluationWindowDays: number;
      candidateRunCount: number;
      evaluatedRunIds: number[];
      evaluatedPostCount: number;
      keepCount: number;
      revertCount: number;
      escalateCount: number;
      skippedExistingCount: number;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizePositiveNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function buildSocialSubjectKey(postId: number) {
  return `social_post:${postId}`;
}

function parseSocialRunCandidate(value: unknown): SocialRunCandidate | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = normalizePositiveNumber(value.id);
  const platform = normalizeString(value.platform);
  const contentType =
    normalizeString(value.contentType ?? value.content_type) ?? "custom";
  const contentId = Number(value.contentId ?? value.content_id ?? 0);
  const linkUrl = normalizeString(value.linkUrl ?? value.link_url);

  if (!id || !platform) {
    return null;
  }

  return {
    id,
    platform,
    contentType,
    contentId: Number.isFinite(contentId) ? contentId : 0,
    linkUrl,
    path: extractInternalPathFromUrl(linkUrl),
    publishedAt: normalizeString(value.publishedAt ?? value.published_at),
    platformPostId: normalizeString(value.platformPostId ?? value.platform_post_id),
    automationContext: parseSocialAutomationContext(
      value.automationContext ?? value.automation_context ?? null
    )
  };
}

function getSocialRunCandidates(resultPayload: unknown) {
  if (!isRecord(resultPayload) || !Array.isArray(resultPayload.publishedPosts)) {
    return [] as SocialRunCandidate[];
  }

  const candidates = resultPayload.publishedPosts
    .map(parseSocialRunCandidate)
    .filter((candidate): candidate is SocialRunCandidate => Boolean(candidate));
  const uniqueById = new Map<number, SocialRunCandidate>();

  for (const candidate of candidates) {
    uniqueById.set(candidate.id, candidate);
  }

  return [...uniqueById.values()];
}

function parseEngagementMetrics(value: unknown): SocialEngagementMetrics {
  if (!isRecord(value)) {
    return {
      likes: 0,
      shares: 0,
      comments: 0,
      impressions: 0
    };
  }

  return {
    likes: Number.isFinite(Number(value.likes)) ? Number(value.likes) : 0,
    shares: Number.isFinite(Number(value.shares)) ? Number(value.shares) : 0,
    comments: Number.isFinite(Number(value.comments)) ? Number(value.comments) : 0,
    impressions: Number.isFinite(Number(value.impressions)) ? Number(value.impressions) : 0
  };
}

async function loadSocialContentTitles(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  candidates: SocialRunCandidate[]
) {
  const recipeIds = [...new Set(
    candidates
      .filter((candidate) => candidate.contentType === "recipe" && candidate.contentId > 0)
      .map((candidate) => candidate.contentId)
  )];
  const blogIds = [...new Set(
    candidates
      .filter((candidate) => candidate.contentType === "blog_post" && candidate.contentId > 0)
      .map((candidate) => candidate.contentId)
  )];
  const reviewIds = [...new Set(
    candidates
      .filter((candidate) => candidate.contentType === "review" && candidate.contentId > 0)
      .map((candidate) => candidate.contentId)
  )];

  const [recipeResult, blogResult, reviewResult] = await Promise.all([
    recipeIds.length
      ? supabase.from("recipes").select("id, title").in("id", recipeIds)
      : Promise.resolve({ data: [] as SocialContentTitleRow[], error: null }),
    blogIds.length
      ? supabase.from("blog_posts").select("id, title").in("id", blogIds)
      : Promise.resolve({ data: [] as SocialContentTitleRow[], error: null }),
    reviewIds.length
      ? supabase.from("reviews").select("id, title").in("id", reviewIds)
      : Promise.resolve({ data: [] as SocialContentTitleRow[], error: null })
  ]);

  const errors = [recipeResult.error, blogResult.error, reviewResult.error].filter(Boolean);
  if (errors.length) {
    throw new Error(`Failed to load social content titles: ${errors[0]?.message}`);
  }

  const titles = new Map<string, string>();

  for (const row of recipeResult.data ?? []) {
    titles.set(`recipe:${row.id}`, row.title);
  }

  for (const row of blogResult.data ?? []) {
    titles.set(`blog_post:${row.id}`, row.title);
  }

  for (const row of reviewResult.data ?? []) {
    titles.set(`review:${row.id}`, row.title);
  }

  return titles;
}

function describeCandidate(candidate: SocialRunCandidate & { title?: string | null }) {
  if (candidate.title?.trim()) {
    return candidate.title.trim();
  }

  if (candidate.path) {
    return `${candidate.platform} post for ${candidate.path}`;
  }

  return `${candidate.platform} social post #${candidate.id}`;
}

function buildSocialDistributionVerdict(input: {
  candidate: SocialRunCandidate & { title?: string | null };
  metrics: SocialPerformanceMetrics;
  evaluationWindowDays: number;
  windowStart: string;
  windowEnd: string;
}) {
  const { candidate, metrics } = input;
  const totalEngagement =
    metrics.engagementLikes + metrics.engagementShares + metrics.engagementComments;
  const label = describeCandidate(candidate);

  if (
    metrics.platformViews >= 2 ||
    metrics.socialViews >= 4 ||
    metrics.affiliateClicks >= 1 ||
    metrics.engagementShares >= 1 ||
    totalEngagement >= 3 ||
    metrics.engagementImpressions >= 100
  ) {
    return {
      verdict: "keep" as const,
      notes:
        `${label} showed healthy early distribution signal in the first ${input.evaluationWindowDays} day(s): ` +
        `${formatNumber(metrics.platformViews)} platform-attributed view(s), ` +
        `${formatNumber(metrics.socialViews)} total social-attributed view(s), ` +
        `${formatNumber(metrics.affiliateClicks)} affiliate click(s), and ` +
        `${formatNumber(metrics.engagementImpressions)} impression(s).`,
      observedPayload: {
        path: candidate.path,
        platform: candidate.platform,
        contentType: candidate.contentType,
        contentId: candidate.contentId,
        evaluationWindowStart: input.windowStart,
        evaluationWindowEnd: input.windowEnd,
        metrics: {
          ...metrics,
          totalEngagement
        }
      }
    } satisfies SocialDistributionVerdict;
  }

  if (
    metrics.currentStatus === "published" &&
    metrics.platformViews === 0 &&
    metrics.socialViews === 0 &&
    metrics.affiliateClicks === 0 &&
    totalEngagement === 0 &&
    metrics.engagementImpressions === 0 &&
    metrics.totalViews <= 3
  ) {
    return {
      verdict: "revert" as const,
      notes:
        `${label} has not shown meaningful early distribution signal in the first ${input.evaluationWindowDays} day(s): ` +
        `${formatNumber(metrics.totalViews)} total page view(s), no attributable social sessions, no affiliate clicks, and no recorded engagement. ` +
        "Review whether this social angle should be retired, rewritten, or reserved for stronger winner content.",
      observedPayload: {
        path: candidate.path,
        platform: candidate.platform,
        contentType: candidate.contentType,
        contentId: candidate.contentId,
        evaluationWindowStart: input.windowStart,
        evaluationWindowEnd: input.windowEnd,
        metrics: {
          ...metrics,
          totalEngagement
        }
      }
    } satisfies SocialDistributionVerdict;
  }

  return {
    verdict: "escalate" as const,
    notes:
      `${label} has mixed or still-thin early signal after distribution: ` +
      `${formatNumber(metrics.platformViews)} platform-attributed view(s), ` +
      `${formatNumber(metrics.socialViews)} total social-attributed view(s), ` +
      `${formatNumber(metrics.affiliateClicks)} affiliate click(s), and ` +
      `${formatNumber(metrics.engagementImpressions)} impression(s). Keep watching before changing the social lane policy.`,
    observedPayload: {
      path: candidate.path,
      platform: candidate.platform,
      contentType: candidate.contentType,
      contentId: candidate.contentId,
      evaluationWindowStart: input.windowStart,
      evaluationWindowEnd: input.windowEnd,
      metrics: {
        ...metrics,
        totalEngagement
      }
    }
  } satisfies SocialDistributionVerdict;
}

export async function runSocialDistributionEvaluator(options?: {
  evaluationWindowDays?: number;
  maxRuns?: number;
  allowImmatureRuns?: boolean;
}): Promise<SocialDistributionEvaluatorResult> {
  if (!flags.hasSupabaseAdmin) {
    return {
      ok: false,
      skippedReason: "Supabase admin access is required to evaluate social distribution performance."
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      ok: false,
      skippedReason: "Social evaluator storage is not configured."
    };
  }

  const evaluationWindowDays = Math.max(
    0,
    Math.trunc(options?.evaluationWindowDays ?? DEFAULT_SOCIAL_EVALUATION_WINDOW_DAYS)
  );
  const maxRuns = Math.max(
    1,
    Math.trunc(options?.maxRuns ?? DEFAULT_SOCIAL_EVALUATION_MAX_RUNS)
  );
  const allowImmatureRuns = options?.allowImmatureRuns === true;
  const now = new Date();

  const sourceRunsResult = await supabase
    .from("automation_runs")
    .select("id, completed_at, result_payload")
    .eq("agent_id", "pinterest-distributor")
    .eq("status", "succeeded")
    .gt("rows_published", 0)
    .order("completed_at", { ascending: false })
    .limit(maxRuns * 4);

  if (sourceRunsResult.error) {
    throw new Error(
      `Failed to read social distributor runs for evaluation: ${sourceRunsResult.error.message}`
    );
  }

  const candidateRuns = ((sourceRunsResult.data ?? []) as SocialDistributorRunRow[])
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
      evaluatedPostCount: 0,
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
    throw new Error(`Failed to read existing social evaluations: ${existingError.message}`);
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
    const candidates = getSocialRunCandidates(run.result_payload);

    if (!candidates.length) {
      continue;
    }

    const candidateIds = candidates.map((candidate) => candidate.id);
    const candidatePaths = [...new Set(
      candidates
        .map((candidate) => candidate.path)
        .filter((path): path is string => Boolean(path))
    )];

    const [currentRowsResult, telemetryResult, affiliateResult, contentTitles] = await Promise.all([
      supabase
        .from("social_posts")
        .select(
          "id, status, published_at, engagement, platform, content_type, content_id, link_url, platform_post_id, automation_context"
        )
        .in("id", candidateIds),
      candidatePaths.length
        ? supabase
            .from("telemetry_events")
            .select("path, utm_source, referrer")
            .eq("event_name", "page_view")
            .gte("occurred_at", completedAt.toISOString())
            .lt("occurred_at", windowEnd.toISOString())
            .in("path", candidatePaths)
        : Promise.resolve({ data: [] as SocialTelemetryRow[], error: null }),
      candidatePaths.length
        ? supabase
            .from("affiliate_clicks")
            .select("source_page")
            .gte("clicked_at", completedAt.toISOString())
            .lt("clicked_at", windowEnd.toISOString())
            .in("source_page", candidatePaths)
        : Promise.resolve({ data: [] as SocialAffiliateRow[], error: null }),
      loadSocialContentTitles(supabase, candidates)
    ]);

    const errors = [currentRowsResult.error, telemetryResult.error, affiliateResult.error].filter(Boolean);
    if (errors.length) {
      throw new Error(
        `Failed to read social performance signals for run ${run.id}: ${errors[0]?.message}`
      );
    }

    const currentById = new Map<number, SocialPostRow>();
    for (const row of (currentRowsResult.data ?? []) as SocialPostRow[]) {
      currentById.set(row.id, row);
    }

    const totalViewsByPath = new Map<string, number>();
    const socialViewsByPath = new Map<string, number>();
    const platformViewsByPath = new Map<string, number>();
    const affiliateClicksByPath = new Map<string, number>();

    for (const row of telemetryResult.data ?? []) {
      const path = normalizeString(row.path);
      if (!path) {
        continue;
      }

      totalViewsByPath.set(path, (totalViewsByPath.get(path) ?? 0) + 1);
      const source = classifyAcquisitionSource({
        utmSource: row.utm_source ?? null,
        referrer: row.referrer ?? null
      });

      if (isSocialSource(source)) {
        socialViewsByPath.set(path, (socialViewsByPath.get(path) ?? 0) + 1);
        platformViewsByPath.set(
          `${path}::${source}`,
          (platformViewsByPath.get(`${path}::${source}`) ?? 0) + 1
        );
      }
    }

    for (const row of affiliateResult.data ?? []) {
      const sourcePage = normalizeString(row.source_page);
      if (!sourcePage) {
        continue;
      }

      affiliateClicksByPath.set(sourcePage, (affiliateClicksByPath.get(sourcePage) ?? 0) + 1);
    }

    const existingSubjectKeys = existingByRunId.get(run.id) ?? new Set<string>();

    for (const candidate of candidates) {
      const subjectKey = buildSocialSubjectKey(candidate.id);
      if (existingSubjectKeys.has(subjectKey)) {
        skippedExistingCount += 1;
        continue;
      }

      const currentRow = currentById.get(candidate.id);
      const currentPath =
        candidate.path ??
        extractInternalPathFromUrl(normalizeString(currentRow?.link_url) ?? null);
      const automationContext =
        parseSocialAutomationContext(currentRow?.automation_context) ?? candidate.automationContext;
      const engagement = parseEngagementMetrics(currentRow?.engagement);
      const metrics: SocialPerformanceMetrics = {
        totalViews: currentPath ? totalViewsByPath.get(currentPath) ?? 0 : 0,
        socialViews: currentPath ? socialViewsByPath.get(currentPath) ?? 0 : 0,
        platformViews: currentPath
          ? platformViewsByPath.get(`${currentPath}::${candidate.platform}`) ?? 0
          : 0,
        affiliateClicks: currentPath ? affiliateClicksByPath.get(currentPath) ?? 0 : 0,
        engagementLikes: engagement.likes,
        engagementShares: engagement.shares,
        engagementComments: engagement.comments,
        engagementImpressions: engagement.impressions,
        currentStatus: normalizeString(currentRow?.status) ?? "unknown",
        publishedAt:
          normalizeString(currentRow?.published_at) ??
          candidate.publishedAt ??
          null
      };
      const title =
        currentRow && currentRow.content_type && currentRow.content_id
          ? contentTitles.get(`${currentRow.content_type}:${currentRow.content_id}`) ?? null
          : candidate.contentId > 0
            ? contentTitles.get(`${candidate.contentType}:${candidate.contentId}`) ?? null
            : null;
      let verdict = buildSocialDistributionVerdict({
        candidate: {
          ...candidate,
          title
        },
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
            `Seed evaluation only: this social distribution run is not yet ${evaluationWindowDays} day(s) old. ` +
            verdict.notes.replace(
              "Review whether this social angle should be retired, rewritten, or reserved for stronger winner content.",
              "Keep watching before making a stronger social distribution decision."
            )
        };
      } else if (usedImmatureWindow) {
        verdict = {
          ...verdict,
          notes:
            `Seed evaluation only: this social distribution run is not yet ${evaluationWindowDays} day(s) old. ${verdict.notes}`
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
        agent_id: "social-distribution-evaluator",
        source_run_id: run.id,
        subject_type: "social_post",
        subject_key: subjectKey,
        evaluation_window_days: evaluationWindowDays,
        baseline_payload: {
          id: candidate.id,
          platform: candidate.platform,
          contentType: candidate.contentType,
          contentId: candidate.contentId,
          title,
          linkUrl: currentRow?.link_url ?? candidate.linkUrl,
          path: currentPath,
          publishedAt: metrics.publishedAt,
          platformPostId:
            normalizeString(currentRow?.platform_post_id) ?? candidate.platformPostId,
          automationContext,
          sourceRunCompletedAt: run.completed_at
        },
        observed_payload: {
          ...verdict.observedPayload,
          automationContext,
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
      throw new Error(`Failed to write social evaluator verdicts: ${error.message}`);
    }
  }

  return {
    ok: true,
    evaluationWindowDays,
    candidateRunCount: candidateRuns.length,
    evaluatedRunIds: [...evaluatedRunIds].sort((left, right) => right - left),
    evaluatedPostCount: inserts.length,
    keepCount,
    revertCount,
    escalateCount,
    skippedExistingCount
  };
}
