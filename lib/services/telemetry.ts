import { flags } from "@/lib/env";
import {
  buildPirateMetrics,
  type AffiliateClickRow,
  type PirateOperationalSignals,
  type TelemetryEventRow
} from "@/lib/pirate-metrics";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ANALYTICS_EVENTS } from "@/lib/telemetry-events";

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

  const mapRowsToEvents = (
    rows: any[] | null | undefined,
    config: {
      eventName: string;
      occurredAtField: string;
      userIdField?: string;
      metadata?: (row: any) => Record<string, unknown>;
    }
  ): TelemetryEventRow[] =>
    (rows ?? []).map((row) => ({
      eventName: config.eventName,
      userId: config.userIdField ? row[config.userIdField] ?? null : null,
      occurredAt: row[config.occurredAtField],
      metadata: config.metadata ? config.metadata(row) : {}
    })) as TelemetryEventRow[];

  const [
    eventsResult,
    affiliateClicksResult,
    subscribersResult,
    recipeSavesResult,
    recipeRatingsResult,
    commentsResult,
    communityPostsResult,
    followsResult,
    competitionEntriesResult,
    competitionVotesResult
  ] = await Promise.all([
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
      .order("clicked_at", { ascending: true }),
    supabase
      .from("newsletter_subscribers")
      .select("id, source, tags, subscribed_at")
      .gte("subscribed_at", cutoff)
      .order("subscribed_at", { ascending: true }),
    supabase
      .from("recipe_saves")
      .select("user_id, recipe_id, saved_at")
      .gte("saved_at", cutoff)
      .order("saved_at", { ascending: true }),
    supabase
      .from("recipe_ratings")
      .select("user_id, recipe_id, rating, created_at")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: true }),
    supabase
      .from("comments")
      .select("user_id, content_type, content_id, created_at")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: true }),
    supabase
      .from("community_posts")
      .select("user_id, id, type, status, created_at")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: true }),
    supabase
      .from("follows")
      .select("follower_id, following_id, created_at")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: true }),
    supabase
      .from("competition_entries")
      .select("user_id, competition_id, id, submitted_at")
      .gte("submitted_at", cutoff)
      .order("submitted_at", { ascending: true }),
    supabase
      .from("competition_votes")
      .select("user_id, entry_id, voted_at")
      .gte("voted_at", cutoff)
      .order("voted_at", { ascending: true })
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

  const operationalSignals: PirateOperationalSignals = {
    emailSignups: mapRowsToEvents(subscribersResult.data, {
      eventName: ANALYTICS_EVENTS.emailSignup,
      occurredAtField: "subscribed_at",
      metadata: (row) => ({
        source: row.source ?? null,
        tags: row.tags ?? []
      })
    }),
    recipeSaves: mapRowsToEvents(recipeSavesResult.data, {
      eventName: ANALYTICS_EVENTS.recipeSave,
      occurredAtField: "saved_at",
      userIdField: "user_id",
      metadata: (row) => ({
        contentType: "recipe",
        contentId: row.recipe_id
      })
    }),
    recipeRatings: mapRowsToEvents(recipeRatingsResult.data, {
      eventName: ANALYTICS_EVENTS.recipeRating,
      occurredAtField: "created_at",
      userIdField: "user_id",
      metadata: (row) => ({
        contentType: "recipe",
        contentId: row.recipe_id,
        rating: row.rating
      })
    }),
    comments: mapRowsToEvents(commentsResult.data, {
      eventName: ANALYTICS_EVENTS.commentPosted,
      occurredAtField: "created_at",
      userIdField: "user_id",
      metadata: (row) => ({
        contentType: row.content_type,
        contentId: row.content_id
      })
    }),
    communitySubmissions: mapRowsToEvents(communityPostsResult.data, {
      eventName: ANALYTICS_EVENTS.communitySubmit,
      occurredAtField: "created_at",
      userIdField: "user_id",
      metadata: (row) => ({
        contentType: "community_post",
        contentId: row.id,
        type: row.type,
        status: row.status
      })
    }),
    follows: mapRowsToEvents(followsResult.data, {
      eventName: ANALYTICS_EVENTS.userFollow,
      occurredAtField: "created_at",
      userIdField: "follower_id",
      metadata: (row) => ({
        followingId: row.following_id
      })
    }),
    competitionEntries: mapRowsToEvents(competitionEntriesResult.data, {
      eventName: ANALYTICS_EVENTS.competitionEnter,
      occurredAtField: "submitted_at",
      userIdField: "user_id",
      metadata: (row) => ({
        competitionId: row.competition_id,
        entryId: row.id
      })
    }),
    competitionVotes: mapRowsToEvents(competitionVotesResult.data, {
      eventName: ANALYTICS_EVENTS.voteCast,
      occurredAtField: "voted_at",
      userIdField: "user_id",
      metadata: (row) => ({
        entryId: row.entry_id
      })
    })
  };

  return buildPirateMetrics(events, affiliateClicks, windowDays, operationalSignals);
}
