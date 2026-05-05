import { flags } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type ReferralEvaluatorRunResult = {
  mode: "live" | "skipped";
  reason?: string;
  insightsWritten: number;
  evaluationWindowDays: number;
};

const DEFAULT_WINDOW_DAYS = 30;

type Insight = {
  insight_kind: string;
  insight_key: string;
  metric_value: number;
  metric_label: string | null;
  evaluation_window_days: number;
  payload: Record<string, unknown>;
};

export async function runReferralAttributionEvaluator(options?: {
  windowDays?: number;
}): Promise<ReferralEvaluatorRunResult> {
  const windowDays = options?.windowDays ?? DEFAULT_WINDOW_DAYS;

  if (!flags.hasSupabaseAdmin) {
    return {
      mode: "skipped",
      reason: "Supabase admin not configured.",
      insightsWritten: 0,
      evaluationWindowDays: windowDays
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      mode: "skipped",
      reason: "Supabase client unavailable.",
      insightsWritten: 0,
      evaluationWindowDays: windowDays
    };
  }

  const sinceIso = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: recentSubscribers },
    { data: recentReferrals },
    { data: tierBuckets }
  ] = await Promise.all([
    supabase
      .from("newsletter_subscribers")
      .select("id, source, subscribed_at")
      .gte("subscribed_at", sinceIso),
    supabase
      .from("newsletter_referrals")
      .select("referrer_email, source, created_at")
      .gte("created_at", sinceIso),
    supabase
      .from("newsletter_subscribers")
      .select("referral_tier")
      .eq("status", "active")
  ]);

  const insights: Insight[] = [];

  // Insight 1: top source pages by signups in window
  const sourceCounts = new Map<string, number>();
  for (const row of recentSubscribers ?? []) {
    const src = (row.source as string | null) ?? "unknown";
    sourceCounts.set(src, (sourceCounts.get(src) ?? 0) + 1);
  }
  const topSources = Array.from(sourceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [source, count] of topSources) {
    insights.push({
      insight_kind: "top_source_page",
      insight_key: source,
      metric_value: count,
      metric_label: `${count} signup(s) attributed to source: ${source}`,
      evaluation_window_days: windowDays,
      payload: { source }
    });
  }

  // Insight 2: top referrers by referrals delivered in window
  const referrerCounts = new Map<string, number>();
  for (const row of recentReferrals ?? []) {
    const email = (row.referrer_email as string | null) ?? "unknown";
    referrerCounts.set(email, (referrerCounts.get(email) ?? 0) + 1);
  }
  const topReferrers = Array.from(referrerCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [email, count] of topReferrers) {
    insights.push({
      insight_kind: "top_referrer",
      insight_key: email,
      metric_value: count,
      metric_label: `${count} referral(s) from ${email}`,
      evaluation_window_days: windowDays,
      payload: { email }
    });
  }

  // Insight 3: referral tier distribution
  const tierDistribution = new Map<number, number>();
  for (const row of tierBuckets ?? []) {
    const tier = Number(row.referral_tier ?? 0);
    tierDistribution.set(tier, (tierDistribution.get(tier) ?? 0) + 1);
  }
  for (const [tier, count] of tierDistribution.entries()) {
    insights.push({
      insight_kind: "tier_distribution",
      insight_key: String(tier),
      metric_value: count,
      metric_label: `${count} active subscriber(s) at tier ${tier}`,
      evaluation_window_days: windowDays,
      payload: { tier }
    });
  }

  // Insight 4: total signups + referrals in window (top-level summary)
  insights.push({
    insight_kind: "summary",
    insight_key: "signups",
    metric_value: recentSubscribers?.length ?? 0,
    metric_label: `${recentSubscribers?.length ?? 0} new signup(s) in last ${windowDays} days`,
    evaluation_window_days: windowDays,
    payload: {}
  });
  insights.push({
    insight_kind: "summary",
    insight_key: "referrals",
    metric_value: recentReferrals?.length ?? 0,
    metric_label: `${recentReferrals?.length ?? 0} successful referral(s) in last ${windowDays} days`,
    evaluation_window_days: windowDays,
    payload: {}
  });

  const evaluatedAt = new Date().toISOString();
  const rowsToInsert = insights.map((i) => ({ ...i, evaluated_at: evaluatedAt }));

  if (rowsToInsert.length === 0) {
    return {
      mode: "live",
      insightsWritten: 0,
      evaluationWindowDays: windowDays
    };
  }

  const { error } = await supabase.from("referral_insights").insert(rowsToInsert);
  if (error) {
    throw new Error(`Failed to write insights: ${error.message}`);
  }

  return {
    mode: "live",
    insightsWritten: rowsToInsert.length,
    evaluationWindowDays: windowDays
  };
}
