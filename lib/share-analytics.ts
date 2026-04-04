import { ANALYTICS_EVENTS } from "@/lib/telemetry-events";

export type ShareTelemetryRow = {
  eventName: string;
  path?: string | null;
  contentType?: string | null;
  contentSlug?: string | null;
  sessionId?: string | null;
  anonymousId?: string | null;
  userId?: string | null;
  occurredAt: string;
  utmSource?: string | null;
  utmCampaign?: string | null;
  metadata?: Record<string, unknown> | null;
};

function getSessionKey(row: ShareTelemetryRow, index: number) {
  if (row.sessionId) return `session:${row.sessionId}`;
  if (row.userId) return `user:${row.userId}`;
  if (row.anonymousId) return `anon:${row.anonymousId}`;
  return `row:${index}:${row.occurredAt}`;
}

function getMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
  fallback = "unknown"
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function sortCountEntries(map: Map<string, number>, labelKey: string) {
  return Array.from(map.entries())
    .map(([label, count]) => ({ [labelKey]: label, count }))
    .sort((left, right) => right.count - left.count);
}

export function buildShareAnalytics(rows: ShareTelemetryRow[], windowDays = 30) {
  const orderedRows = [...rows].sort((left, right) =>
    left.occurredAt.localeCompare(right.occurredAt)
  );
  const shareEvents = orderedRows.filter((row) => row.eventName === ANALYTICS_EVENTS.recipeShare);
  const sharedTrafficPageViews = orderedRows.filter(
    (row) =>
      row.eventName === ANALYTICS_EVENTS.pageView &&
      row.utmCampaign === "organic_share"
  );

  const platformCounts = new Map<string, number>();
  const actionCounts = new Map<string, number>();
  const contentCounts = new Map<
    string,
    { label: string; path: string; contentType: string; shares: number }
  >();
  const sourceSessions = new Map<string, Set<string>>();
  const landingPageSessions = new Map<string, Set<string>>();
  const attributedSessions = new Set<string>();

  shareEvents.forEach((row) => {
    const platform = getMetadataString(row.metadata, "platform");
    const action = getMetadataString(row.metadata, "shareAction");
    const path = row.path || "/";
    const contentType = row.contentType || "unknown";
    const label = row.contentSlug || path;
    const key = `${contentType}:${label}:${path}`;

    platformCounts.set(platform, (platformCounts.get(platform) ?? 0) + 1);
    actionCounts.set(action, (actionCounts.get(action) ?? 0) + 1);

    const existing = contentCounts.get(key) ?? {
      label,
      path,
      contentType,
      shares: 0
    };
    existing.shares += 1;
    contentCounts.set(key, existing);
  });

  sharedTrafficPageViews.forEach((row, index) => {
    const source = row.utmSource?.trim() || "share";
    const sessionKey = getSessionKey(row, index);
    attributedSessions.add(sessionKey);

    const sourceSet = sourceSessions.get(source) ?? new Set<string>();
    sourceSet.add(sessionKey);
    sourceSessions.set(source, sourceSet);

    const landingSet = landingPageSessions.get(row.path || "/") ?? new Set<string>();
    landingSet.add(sessionKey);
    landingPageSessions.set(row.path || "/", landingSet);
  });

  const sourceCounts = new Map(
    Array.from(sourceSessions.entries()).map(([source, sessions]) => [source, sessions.size])
  );
  const landingPageCounts = new Map(
    Array.from(landingPageSessions.entries()).map(([path, sessions]) => [path, sessions.size])
  );

  return {
    windowDays,
    totals: {
      shareEvents: shareEvents.length,
      shareAttributedSessions: attributedSessions.size,
      shareAttributedPageViews: sharedTrafficPageViews.length,
      copyShares: actionCounts.get("copied") ?? 0,
      nativeShares: actionCounts.get("shared") ?? 0,
      pinterestSaves: platformCounts.get("pinterest") ?? 0
    },
    platforms: sortCountEntries(platformCounts, "platform"),
    actions: sortCountEntries(actionCounts, "action"),
    topContent: Array.from(contentCounts.values())
      .sort((left, right) => right.shares - left.shares)
      .slice(0, 8),
    shareTrafficSources: sortCountEntries(sourceCounts, "source"),
    landingPages: sortCountEntries(landingPageCounts, "path"),
    recentShares: shareEvents
      .slice(-8)
      .reverse()
      .map((row) => ({
        platform: getMetadataString(row.metadata, "platform"),
        action: getMetadataString(row.metadata, "shareAction"),
        path: row.path || "/",
        occurredAt: row.occurredAt
      }))
  };
}
