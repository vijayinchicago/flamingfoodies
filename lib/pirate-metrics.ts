import { ANALYTICS_EVENTS } from "@/lib/telemetry-events";

export type TelemetryEventRow = {
  eventName: string;
  anonymousId?: string | null;
  sessionId?: string | null;
  userId?: string | null;
  path?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  occurredAt: string;
  metadata?: Record<string, unknown> | null;
};

export type AffiliateClickRow = {
  partner: string;
  clickedAt: string;
};

export const PARTNER_EPC: Record<string, number> = {
  amazon: 1.2,
  heatonist: 2.8,
  fuego_box: 5.0,
  pepper_joe: 1.6,
  mike_hot_sauce: 1.9
};

const SOCIAL_HOST_LABELS = [
  ["pinterest.", "pinterest"],
  ["facebook.", "facebook"],
  ["instagram.", "instagram"],
  ["whatsapp.", "whatsapp"],
  ["t.co", "x"],
  ["twitter.", "x"],
  ["reddit.", "reddit"],
  ["youtube.", "youtube"],
  ["tiktok.", "tiktok"],
  ["linkedin.", "linkedin"]
] as const;

const SEARCH_HOST_LABELS = [
  ["google.", "google"],
  ["bing.", "bing"],
  ["duckduckgo.", "duckduckgo"],
  ["yahoo.", "yahoo"]
] as const;

const ACTIVATION_EVENT_LABELS: Array<{ name: string; label: string }> = [
  { name: ANALYTICS_EVENTS.emailSignup, label: "Email signups" },
  { name: ANALYTICS_EVENTS.onboardingComplete, label: "Completed onboarding" },
  { name: ANALYTICS_EVENTS.recipeSave, label: "Recipe saves" },
  { name: ANALYTICS_EVENTS.recipeRating, label: "Recipe ratings" },
  { name: ANALYTICS_EVENTS.commentPosted, label: "Comments posted" },
  { name: ANALYTICS_EVENTS.communitySubmit, label: "Community submissions" },
  { name: ANALYTICS_EVENTS.competitionEnter, label: "Competition entries" },
  { name: ANALYTICS_EVENTS.voteCast, label: "Votes cast" },
  { name: ANALYTICS_EVENTS.quizComplete, label: "Quiz completions" }
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function safeHost(value?: string | null) {
  if (!value) return null;

  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function classifyHost(host?: string | null) {
  if (!host) return "direct";

  for (const [needle, label] of SEARCH_HOST_LABELS) {
    if (host.includes(needle)) return label;
  }

  for (const [needle, label] of SOCIAL_HOST_LABELS) {
    if (host.includes(needle)) return label;
  }

  return host.replace(/^www\./, "");
}

export function classifyAcquisitionSource(event: Pick<TelemetryEventRow, "utmSource" | "referrer">) {
  if (event.utmSource?.trim()) {
    return event.utmSource.trim().toLowerCase();
  }

  return classifyHost(safeHost(event.referrer));
}

export function isSocialSource(source: string) {
  return [
    "pinterest",
    "facebook",
    "instagram",
    "whatsapp",
    "x",
    "reddit",
    "youtube",
    "tiktok",
    "linkedin"
  ].includes(source);
}

function getVisitorKey(event: Pick<TelemetryEventRow, "userId" | "anonymousId" | "sessionId">) {
  if (event.userId) return `user:${event.userId}`;
  if (event.anonymousId) return `anon:${event.anonymousId}`;
  if (event.sessionId) return `session:${event.sessionId}`;
  return null;
}

function getSessionKey(
  event: Pick<TelemetryEventRow, "sessionId" | "anonymousId" | "userId" | "occurredAt">,
  index: number
) {
  if (event.sessionId) return `session:${event.sessionId}`;
  return getVisitorKey(event) ?? `row:${index}:${event.occurredAt}`;
}

export function buildPirateMetrics(
  events: TelemetryEventRow[],
  affiliateClicks: AffiliateClickRow[],
  windowDays = 30
) {
  const orderedEvents = [...events].sort((left, right) =>
    left.occurredAt.localeCompare(right.occurredAt)
  );
  const pageViews = orderedEvents.filter((event) => event.eventName === ANALYTICS_EVENTS.pageView);
  const activationEventNames = new Set(ACTIVATION_EVENT_LABELS.map((event) => event.name));
  const activationEvents = orderedEvents.filter((event) => activationEventNames.has(event.eventName));
  const shareEvents = orderedEvents.filter((event) => event.eventName === ANALYTICS_EVENTS.recipeShare);

  const sessionFirstTouches = new Map<string, TelemetryEventRow>();

  pageViews.forEach((event, index) => {
    const sessionKey = getSessionKey(event, index);
    if (!sessionFirstTouches.has(sessionKey)) {
      sessionFirstTouches.set(sessionKey, event);
    }
  });

  const uniqueVisitors = new Set(
    pageViews.map((event) => getVisitorKey(event)).filter(Boolean) as string[]
  );
  const activatedVisitors = new Set(
    activationEvents.map((event) => getVisitorKey(event)).filter(Boolean) as string[]
  );

  const sourceCounts = new Map<string, number>();
  const landingPageCounts = new Map<string, number>();
  const referrerCounts = new Map<string, number>();
  let socialSessions = 0;

  sessionFirstTouches.forEach((event) => {
    const source = classifyAcquisitionSource(event);
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
    landingPageCounts.set(event.path || "/", (landingPageCounts.get(event.path || "/") ?? 0) + 1);

    const host = safeHost(event.referrer);
    if (host) {
      referrerCounts.set(host, (referrerCounts.get(host) ?? 0) + 1);
    }

    if (isSocialSource(source)) {
      socialSessions += 1;
    }
  });

  const activeDaysByVisitor = new Map<string, Set<string>>();

  orderedEvents.forEach((event) => {
    const visitorKey = getVisitorKey(event);
    if (!visitorKey) return;

    const day = event.occurredAt.slice(0, 10);
    const activeDays = activeDaysByVisitor.get(visitorKey) ?? new Set<string>();
    activeDays.add(day);
    activeDaysByVisitor.set(visitorKey, activeDays);
  });

  let returningVisitors = 0;
  activeDaysByVisitor.forEach((days) => {
    if (days.size >= 2) {
      returningVisitors += 1;
    }
  });

  const activationBreakdown = ACTIVATION_EVENT_LABELS.map((event) => ({
    name: event.name,
    label: event.label,
    count: activationEvents.filter((row) => row.eventName === event.name).length
  }));

  const partnerCounts = new Map<string, number>();
  let estimatedRevenueValue = 0;

  affiliateClicks.forEach((click) => {
    partnerCounts.set(click.partner, (partnerCounts.get(click.partner) ?? 0) + 1);
    estimatedRevenueValue += PARTNER_EPC[click.partner] ?? 1.5;
  });

  const topPartners = Array.from(partnerCounts.entries())
    .map(([partner, clicks]) => ({
      partner,
      clicks,
      estimatedRevenue: formatCurrency(clicks * (PARTNER_EPC[partner] ?? 1.5))
    }))
    .sort((left, right) => right.clicks - left.clicks)
    .slice(0, 5);

  return {
    windowDays,
    totals: {
      eventCount: orderedEvents.length,
      firstTrackedAt: orderedEvents[0]?.occurredAt ?? null
    },
    coverage: [
      {
        stage: "Acquisition",
        status: "live",
        detail: "Page views, sessions, landing pages, UTM tags, and referrers are being tracked."
      },
      {
        stage: "Activation",
        status: "live",
        detail: "Signups, onboarding, saves, ratings, comments, community posts, and competition actions are tracked."
      },
      {
        stage: "Retention",
        status: pageViews.length ? "live" : "warming",
        detail: "Repeat activity is measured from returning visitors and repeat active days."
      },
      {
        stage: "Referral",
        status: shareEvents.length ? "live" : "partial",
        detail:
          shareEvents.length
            ? "Share events are flowing into the funnel."
            : "Social referrer traffic is tracked now; public share-button events are still light or not live yet."
      },
      {
        stage: "Revenue",
        status: "live",
        detail: "Affiliate clicks are measured, with estimated EPC-based revenue shown as a proxy."
      }
    ],
    acquisition: {
      visitors: uniqueVisitors.size,
      sessions: sessionFirstTouches.size,
      pageViews: pageViews.length,
      topSources: Array.from(sourceCounts.entries())
        .map(([source, visits]) => ({ source, visits }))
        .sort((left, right) => right.visits - left.visits)
        .slice(0, 5),
      topLandingPages: Array.from(landingPageCounts.entries())
        .map(([path, views]) => ({ path, views }))
        .sort((left, right) => right.views - left.views)
        .slice(0, 5)
    },
    activation: {
      activatedVisitors: activatedVisitors.size,
      activationRate:
        uniqueVisitors.size > 0
          ? formatPercent(activatedVisitors.size / uniqueVisitors.size)
          : "0%",
      keyEvents: activationBreakdown,
      emailSignups:
        activationBreakdown.find((event) => event.name === ANALYTICS_EVENTS.emailSignup)?.count ??
        0
    },
    retention: {
      returningVisitors,
      retentionRate:
        uniqueVisitors.size > 0 ? formatPercent(returningVisitors / uniqueVisitors.size) : "0%"
    },
    referral: {
      shareEvents: shareEvents.length,
      socialSessions,
      topReferrers: Array.from(referrerCounts.entries())
        .map(([host, visits]) => ({ host, visits }))
        .sort((left, right) => right.visits - left.visits)
        .slice(0, 5)
    },
    revenue: {
      affiliateClicks: affiliateClicks.length,
      estimatedRevenue: formatCurrency(estimatedRevenueValue),
      topPartners
    }
  };
}
