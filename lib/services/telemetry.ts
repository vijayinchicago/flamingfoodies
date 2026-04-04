import { flags } from "@/lib/env";
import {
  buildPirateMetrics,
  type AffiliateClickRow,
  type TelemetryEventRow
} from "@/lib/pirate-metrics";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type RecordTelemetryEventInput = {
  eventName: string;
  anonymousId?: string | null;
  sessionId?: string | null;
  userId?: string | null;
  path?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  contentType?: string | null;
  contentId?: number | null;
  contentSlug?: string | null;
  value?: number | null;
  metadata?: Record<string, unknown> | null;
};

export async function recordTelemetryEvent(input: RecordTelemetryEventInput) {
  if (!flags.hasSupabaseAdmin) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  try {
    await supabase.from("telemetry_events").insert({
      event_name: input.eventName,
      anonymous_id: input.anonymousId ?? null,
      session_id: input.sessionId ?? null,
      user_id: input.userId ?? null,
      path: input.path ?? null,
      referrer: input.referrer ?? null,
      utm_source: input.utmSource ?? null,
      utm_medium: input.utmMedium ?? null,
      utm_campaign: input.utmCampaign ?? null,
      content_type: input.contentType ?? null,
      content_id: input.contentId ?? null,
      content_slug: input.contentSlug ?? null,
      value: input.value ?? null,
      metadata: input.metadata ?? {}
    });
  } catch {
    return;
  }
}

export async function getPirateMetrics(windowDays = 30) {
  const fallback = buildPirateMetrics([], [], windowDays);

  if (!flags.hasSupabaseAdmin) {
    return fallback;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return fallback;
  }

  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const [eventsResult, affiliateClicksResult] = await Promise.all([
    supabase
      .from("telemetry_events")
      .select(
        "event_name, anonymous_id, session_id, user_id, path, referrer, utm_source, utm_medium, utm_campaign, occurred_at, metadata"
      )
      .gte("occurred_at", cutoff)
      .order("occurred_at", { ascending: true }),
    supabase
      .from("affiliate_clicks")
      .select("partner, clicked_at")
      .gte("clicked_at", cutoff)
      .order("clicked_at", { ascending: true })
  ]);

  const events: TelemetryEventRow[] = (eventsResult.data ?? []).map((row) => ({
    eventName: row.event_name,
    anonymousId: row.anonymous_id,
    sessionId: row.session_id,
    userId: row.user_id,
    path: row.path,
    referrer: row.referrer,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    occurredAt: row.occurred_at,
    metadata: row.metadata ?? {}
  }));

  const affiliateClicks: AffiliateClickRow[] = (affiliateClicksResult.data ?? []).map((row) => ({
    partner: row.partner,
    clickedAt: row.clicked_at
  }));

  return buildPirateMetrics(events, affiliateClicks, windowDays);
}
