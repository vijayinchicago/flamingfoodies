import { getAutomatedShopPickEntries } from "@/lib/affiliates";
import { flags } from "@/lib/env";
import { parseShopShelfSnapshot } from "@/lib/services/shop-automation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_SHOP_EVALUATION_WINDOW_DAYS = 14;
const DEFAULT_SHOP_EVALUATION_MAX_RUNS = 10;

type AutomationEvaluationLookupRow = {
  source_run_id: number;
  subject_key: string;
};

type ShopAutomationRunRow = {
  id: number;
  completed_at: string | null;
  result_payload: unknown;
  rows_created: number | null;
  rows_updated: number | null;
};

type ShopAutomationSnapshotRow = {
  run_id: number;
  scope: string;
  subject_key: string;
  after_payload: unknown;
};

type ShopRunCandidate = {
  slug: string;
  title: string;
  affiliateKey: string;
  partner: string;
  product: string;
  category: string;
  href: string;
  exactAmazonLink: boolean;
  sources: string[];
};

type ShopPerformanceMetrics = {
  totalClicks: number;
  shopPageClicks: number;
  sourcePageCount: number;
  shopPageViews: number;
  exactAmazonLink: boolean;
};

type ShopPerformanceVerdict = {
  verdict: "keep" | "revert" | "escalate";
  notes: string;
  observedPayload: Record<string, unknown>;
};

export type ShopPerformanceEvaluatorResult =
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

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function buildShopSubjectKey(slug: string) {
  return `shop_pick:${slug}`;
}

function buildAffiliateMetricKey(partner: string, product: string) {
  return `${partner}::${product}`;
}

function extractAffiliateKeyFromHref(href: string) {
  if (!href.startsWith("/go/")) {
    return null;
  }

  const candidate = href.slice("/go/".length).trim();
  return candidate.length ? candidate : null;
}

function buildCatalogCandidate(input: {
  affiliateKey: string;
  slug: string;
  title?: string;
  href?: string;
  category?: string;
  source: string;
}) {
  const catalogEntry = getAutomatedShopPickEntries().find((entry) => entry.key === input.affiliateKey);
  if (!catalogEntry) {
    return null;
  }

  return {
    slug: input.slug,
    title: input.title?.trim() || catalogEntry.product,
    affiliateKey: input.affiliateKey,
    partner: catalogEntry.partner,
    product: catalogEntry.product,
    category: input.category?.trim() || catalogEntry.category,
    href: input.href?.trim() || `/go/${catalogEntry.key}`,
    exactAmazonLink: Boolean(
      (catalogEntry.partner === "amazon" ? catalogEntry.url : catalogEntry.amazonOnlyUrl)?.includes("/dp/")
    ),
    sources: [input.source]
  } satisfies ShopRunCandidate;
}

function parseShopCreatedJobCandidate(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  const slug = String(value.slug ?? "").trim();
  const title = String(value.title ?? "").trim();
  const affiliateKey = String(value.affiliateKey ?? "").trim();
  const category = String(value.category ?? "").trim();

  if (!slug || !affiliateKey) {
    return null;
  }

  return buildCatalogCandidate({
    affiliateKey,
    slug,
    title,
    category,
    source: "created_job"
  });
}

function parseShopSnapshotCandidates(snapshotPayload: unknown) {
  const parsed = parseShopShelfSnapshot(snapshotPayload);
  if (!parsed) {
    return [] as ShopRunCandidate[];
  }

  return parsed.featuredEntries
    .map((entry) => {
      const affiliateKey = extractAffiliateKeyFromHref(entry.href);
      if (!affiliateKey) {
        return null;
      }

      return buildCatalogCandidate({
        affiliateKey,
        slug: entry.slug,
        title: entry.name,
        href: entry.href,
        category: entry.category,
        source: "featured_snapshot"
      });
    })
    .filter((candidate): candidate is ShopRunCandidate => Boolean(candidate));
}

function getShopRunCandidates(
  resultPayload: unknown,
  snapshots: ShopAutomationSnapshotRow[]
) {
  const createdJobCandidates: ShopRunCandidate[] =
    isRecord(resultPayload) && Array.isArray(resultPayload.createdJobs)
      ? resultPayload.createdJobs
          .map(parseShopCreatedJobCandidate)
          .filter((candidate): candidate is ShopRunCandidate => Boolean(candidate))
      : [];
  const snapshotCandidates: ShopRunCandidate[] = snapshots.flatMap((snapshot) =>
    parseShopSnapshotCandidates(snapshot.after_payload)
  );
  const merged = new Map<string, ShopRunCandidate>();

  for (const candidate of [...createdJobCandidates, ...snapshotCandidates]) {
    const subjectKey = buildShopSubjectKey(candidate.slug);
    const existing = merged.get(subjectKey);
    if (!existing) {
      merged.set(subjectKey, candidate);
      continue;
    }

    merged.set(subjectKey, {
      ...existing,
      sources: Array.from(new Set([...existing.sources, ...candidate.sources]))
    });
  }

  return [...merged.values()];
}

function buildShopPerformanceVerdict(input: {
  candidate: ShopRunCandidate;
  metrics: ShopPerformanceMetrics;
  evaluationWindowDays: number;
  windowStart: string;
  windowEnd: string;
}) {
  const { candidate, metrics } = input;

  if (
    metrics.totalClicks >= 3
    || metrics.shopPageClicks >= 2
    || (metrics.totalClicks >= 1 && metrics.exactAmazonLink)
  ) {
    return {
      verdict: "keep" as const,
      notes:
        `${candidate.title} showed healthy early commerce traction in the first ${input.evaluationWindowDays} day(s): ` +
        `${formatNumber(metrics.totalClicks)} affiliate click(s), ${formatNumber(metrics.shopPageClicks)} from "/shop", ` +
        `and ${formatNumber(metrics.shopPageViews)} shop page view(s).`,
      observedPayload: {
        slug: candidate.slug,
        affiliateKey: candidate.affiliateKey,
        category: candidate.category,
        evaluationWindowStart: input.windowStart,
        evaluationWindowEnd: input.windowEnd,
        metrics
      }
    } satisfies ShopPerformanceVerdict;
  }

  if (
    metrics.totalClicks === 0
    && metrics.shopPageClicks === 0
    && (
      metrics.shopPageViews >= 60
      || (!metrics.exactAmazonLink && metrics.shopPageViews >= 25)
    )
  ) {
    return {
      verdict: "revert" as const,
      notes:
        `${candidate.title} did not earn any affiliate click signal in the first ${input.evaluationWindowDays} day(s) ` +
        `despite ${formatNumber(metrics.shopPageViews)} shop page view(s). Review whether this slot should be replaced, ` +
        `demoted, or upgraded with a stronger exact product link.`,
      observedPayload: {
        slug: candidate.slug,
        affiliateKey: candidate.affiliateKey,
        category: candidate.category,
        evaluationWindowStart: input.windowStart,
        evaluationWindowEnd: input.windowEnd,
        metrics
      }
    } satisfies ShopPerformanceVerdict;
  }

  return {
    verdict: "escalate" as const,
    notes:
      `${candidate.title} has mixed or still-thin commerce signals after curation: ` +
      `${formatNumber(metrics.totalClicks)} affiliate click(s), ${formatNumber(metrics.shopPageClicks)} from "/shop", ` +
      `and ${formatNumber(metrics.shopPageViews)} shop page view(s). Keep watching before changing the shelf policy.`,
    observedPayload: {
      slug: candidate.slug,
      affiliateKey: candidate.affiliateKey,
      category: candidate.category,
      evaluationWindowStart: input.windowStart,
      evaluationWindowEnd: input.windowEnd,
      metrics
    }
  } satisfies ShopPerformanceVerdict;
}

export async function runShopPerformanceEvaluator(options?: {
  evaluationWindowDays?: number;
  maxRuns?: number;
  allowImmatureRuns?: boolean;
}): Promise<ShopPerformanceEvaluatorResult> {
  if (!flags.hasSupabaseAdmin) {
    return {
      ok: false,
      skippedReason: "Supabase admin access is required to evaluate shop curator performance."
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      ok: false,
      skippedReason: "Shop evaluator storage is not configured."
    };
  }

  const evaluationWindowDays = Math.max(
    0,
    Math.trunc(options?.evaluationWindowDays ?? DEFAULT_SHOP_EVALUATION_WINDOW_DAYS)
  );
  const maxRuns = Math.max(1, Math.trunc(options?.maxRuns ?? DEFAULT_SHOP_EVALUATION_MAX_RUNS));
  const allowImmatureRuns = options?.allowImmatureRuns === true;
  const now = new Date();

  const sourceRunsResult = await supabase
    .from("automation_runs")
    .select("id, completed_at, result_payload, rows_created, rows_updated")
    .eq("agent_id", "shop-shelf-curator")
    .eq("status", "succeeded")
    .order("completed_at", { ascending: false })
    .limit(maxRuns * 4);

  if (sourceRunsResult.error) {
    throw new Error(
      `Failed to read shop curator runs for evaluation: ${sourceRunsResult.error.message}`
    );
  }

  const candidateRuns = ((sourceRunsResult.data ?? []) as ShopAutomationRunRow[])
    .filter((row) => typeof row.id === "number" && typeof row.completed_at === "string")
    .filter((row) => (row.rows_created ?? 0) > 0 || (row.rows_updated ?? 0) > 0)
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
  const [{ data: existingRows, error: existingError }, { data: snapshotRows, error: snapshotError }] =
    await Promise.all([
      supabase
        .from("automation_evaluations")
        .select("source_run_id, subject_key")
        .in("source_run_id", candidateRunIds),
      supabase
        .from("automation_state_snapshots")
        .select("run_id, scope, subject_key, after_payload")
        .eq("agent_id", "shop-shelf-curator")
        .eq("scope", "merch_products.shop_shelf")
        .in("run_id", candidateRunIds)
    ]);

  if (existingError) {
    throw new Error(`Failed to read existing shop evaluations: ${existingError.message}`);
  }

  if (snapshotError) {
    throw new Error(`Failed to read shop shelf snapshots for evaluation: ${snapshotError.message}`);
  }

  const existingByRunId = new Map<number, Set<string>>();
  for (const row of (existingRows ?? []) as AutomationEvaluationLookupRow[]) {
    const existing = existingByRunId.get(row.source_run_id) ?? new Set<string>();
    existing.add(String(row.subject_key));
    existingByRunId.set(row.source_run_id, existing);
  }

  const snapshotsByRunId = new Map<number, ShopAutomationSnapshotRow[]>();
  for (const row of (snapshotRows ?? []) as ShopAutomationSnapshotRow[]) {
    const current = snapshotsByRunId.get(row.run_id) ?? [];
    current.push(row);
    snapshotsByRunId.set(row.run_id, current);
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
    const candidates = getShopRunCandidates(
      run.result_payload,
      snapshotsByRunId.get(run.id) ?? []
    );

    if (!candidates.length) {
      continue;
    }

    const metricKeys = [...new Set(candidates.map((candidate) => buildAffiliateMetricKey(candidate.partner, candidate.product)))];
    const partners = [...new Set(candidates.map((candidate) => candidate.partner))];
    const products = [...new Set(candidates.map((candidate) => candidate.product))];

    const [clickRowsResult, shopPageViewsResult] = await Promise.all([
      supabase
        .from("affiliate_clicks")
        .select("partner, product, source_page")
        .gte("clicked_at", completedAt.toISOString())
        .lt("clicked_at", windowEnd.toISOString())
        .in("partner", partners)
        .in("product", products),
      supabase
        .from("telemetry_events")
        .select("path", { count: "exact", head: true })
        .eq("event_name", "page_view")
        .eq("path", "/shop")
        .gte("occurred_at", completedAt.toISOString())
        .lt("occurred_at", windowEnd.toISOString())
    ]);

    const errors = [clickRowsResult.error, shopPageViewsResult.error].filter(Boolean);
    if (errors.length) {
      throw new Error(
        `Failed to read shop performance signals for run ${run.id}: ${errors[0]?.message}`
      );
    }

    const totalClickCounts = new Map<string, number>();
    const shopPageClickCounts = new Map<string, number>();
    const sourcePagesByMetricKey = new Map<string, Set<string>>();

    for (const row of clickRowsResult.data ?? []) {
      const metricKey = buildAffiliateMetricKey(String(row.partner ?? ""), String(row.product ?? ""));
      if (!metricKeys.includes(metricKey)) {
        continue;
      }

      totalClickCounts.set(metricKey, (totalClickCounts.get(metricKey) ?? 0) + 1);
      if (row.source_page === "/shop") {
        shopPageClickCounts.set(metricKey, (shopPageClickCounts.get(metricKey) ?? 0) + 1);
      }

      const sourcePages = sourcePagesByMetricKey.get(metricKey) ?? new Set<string>();
      if (typeof row.source_page === "string" && row.source_page.trim()) {
        sourcePages.add(row.source_page);
      }
      sourcePagesByMetricKey.set(metricKey, sourcePages);
    }

    const shopPageViews = shopPageViewsResult.count ?? 0;
    const existingSubjectKeys = existingByRunId.get(run.id) ?? new Set<string>();

    for (const candidate of candidates) {
      const subjectKey = buildShopSubjectKey(candidate.slug);
      if (existingSubjectKeys.has(subjectKey)) {
        skippedExistingCount += 1;
        continue;
      }

      const metricKey = buildAffiliateMetricKey(candidate.partner, candidate.product);
      const metrics: ShopPerformanceMetrics = {
        totalClicks: totalClickCounts.get(metricKey) ?? 0,
        shopPageClicks: shopPageClickCounts.get(metricKey) ?? 0,
        sourcePageCount: sourcePagesByMetricKey.get(metricKey)?.size ?? 0,
        shopPageViews,
        exactAmazonLink: candidate.exactAmazonLink
      };

      let verdict = buildShopPerformanceVerdict({
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
            `Seed evaluation only: this shop curator run is not yet ${evaluationWindowDays} day(s) old. ` +
            verdict.notes.replace(
              "Review whether this slot should be replaced, demoted, or upgraded with a stronger exact product link.",
              "Keep watching before making a stronger shelf decision."
            )
        };
      } else if (usedImmatureWindow) {
        verdict = {
          ...verdict,
          notes:
            `Seed evaluation only: this shop curator run is not yet ${evaluationWindowDays} day(s) old. ${verdict.notes}`
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
        agent_id: "shop-performance-evaluator",
        source_run_id: run.id,
        subject_type: "shop_pick",
        subject_key: subjectKey,
        evaluation_window_days: evaluationWindowDays,
        baseline_payload: {
          slug: candidate.slug,
          title: candidate.title,
          affiliateKey: candidate.affiliateKey,
          partner: candidate.partner,
          product: candidate.product,
          category: candidate.category,
          href: candidate.href,
          exactAmazonLink: candidate.exactAmazonLink,
          sources: candidate.sources,
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
      throw new Error(`Failed to write shop evaluator verdicts: ${error.message}`);
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
