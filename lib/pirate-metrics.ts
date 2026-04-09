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

export type PirateOperationalSignals = {
  emailSignups?: TelemetryEventRow[];
  recipeSaves?: TelemetryEventRow[];
  recipeRatings?: TelemetryEventRow[];
  comments?: TelemetryEventRow[];
  communitySubmissions?: TelemetryEventRow[];
  follows?: TelemetryEventRow[];
  competitionEntries?: TelemetryEventRow[];
  competitionVotes?: TelemetryEventRow[];
};

export type PirateFlywheelPriority = {
  stage: "Acquisition" | "Activation" | "Retention" | "Referral" | "Revenue";
  status: "focus" | "monitor" | "stable";
  metric: string;
  headline: string;
  playbook: string;
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
  { name: ANALYTICS_EVENTS.searchPerformed, label: "Searches performed" },
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

function parsePercentLabel(value: string) {
  const normalized = Number.parseInt(value.replace("%", "").trim(), 10);
  return Number.isFinite(normalized) ? normalized : 0;
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
  windowDays = 30,
  operationalSignals: PirateOperationalSignals = {}
) {
  const operationalGroups: Array<{
    eventName: string;
    rows: TelemetryEventRow[];
  }> = [
    {
      eventName: ANALYTICS_EVENTS.emailSignup,
      rows: operationalSignals.emailSignups ?? []
    },
    {
      eventName: ANALYTICS_EVENTS.recipeSave,
      rows: operationalSignals.recipeSaves ?? []
    },
    {
      eventName: ANALYTICS_EVENTS.recipeRating,
      rows: operationalSignals.recipeRatings ?? []
    },
    {
      eventName: ANALYTICS_EVENTS.commentPosted,
      rows: operationalSignals.comments ?? []
    },
    {
      eventName: ANALYTICS_EVENTS.communitySubmit,
      rows: operationalSignals.communitySubmissions ?? []
    },
    {
      eventName: ANALYTICS_EVENTS.userFollow,
      rows: operationalSignals.follows ?? []
    },
    {
      eventName: ANALYTICS_EVENTS.competitionEnter,
      rows: operationalSignals.competitionEntries ?? []
    },
    {
      eventName: ANALYTICS_EVENTS.voteCast,
      rows: operationalSignals.competitionVotes ?? []
    }
  ];

  const overriddenEventNames = new Set(
    operationalGroups.filter((group) => group.rows.length > 0).map((group) => group.eventName)
  );
  const supplementalEvents = operationalGroups.flatMap((group) => group.rows);
  const telemetryEvents = events.filter((event) => !overriddenEventNames.has(event.eventName));

  const orderedEvents = [...telemetryEvents, ...supplementalEvents].sort((left, right) =>
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

  const activationEventCount = activationEvents.length;
  const retentionEvidenceCount = Array.from(activeDaysByVisitor.values()).filter(
    (days) => days.size >= 2
  ).length;
  const referralEvidenceCount = shareEvents.length + socialSessions + referrerCounts.size;
  const revenueEvidenceCount = affiliateClicks.length;
  const acquisitionStatus = pageViews.length ? "live" : "warming";
  const activationStatus = activationEventCount ? "live" : "warming";
  const retentionStatus = retentionEvidenceCount ? "live" : uniqueVisitors.size ? "warming" : "warming";
  const referralStatus = referralEvidenceCount ? "live" : "warming";
  const revenueStatus = revenueEvidenceCount ? "live" : "warming";

  return {
    windowDays,
    totals: {
      eventCount: orderedEvents.length,
      telemetryEventCount: events.length,
      supplementalEventCount: supplementalEvents.length,
      firstTrackedAt: orderedEvents[0]?.occurredAt ?? null
    },
    coverage: [
      {
        stage: "Acquisition",
        status: acquisitionStatus,
        detail: pageViews.length
          ? `${pageViews.length} page views across ${sessionFirstTouches.size} sessions with landing pages and referrers tracked.`
          : "No page-view telemetry has been recorded in this window yet."
      },
      {
        stage: "Activation",
        status: activationStatus,
        detail: activationEventCount
          ? `${activationEventCount} activation signals captured from telemetry plus live product tables for signups, saves, ratings, comments, and community actions.`
          : "Activation instrumentation is wired, but no qualifying activation signals have been recorded yet."
      },
      {
        stage: "Retention",
        status: retentionStatus,
        detail: returningVisitors
          ? `${returningVisitors} returning visitors have shown repeat activity on multiple days.`
          : "Retention is measured from repeat active days, but no returning visitors have been observed yet."
      },
      {
        stage: "Referral",
        status: referralStatus,
        detail: referralEvidenceCount
          ? `${shareEvents.length} share events and ${socialSessions} social sessions have been attributed in this window.`
          : "Referral tracking is live, but no share-driven or social referral activity has been recorded yet."
      },
      {
        stage: "Revenue",
        status: revenueStatus,
        detail: revenueEvidenceCount
          ? `${affiliateClicks.length} affiliate clicks are recorded, with EPC-based revenue shown as a proxy.`
          : "Affiliate click tracking is wired, but no clicks have landed in this window yet."
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

export function buildPirateFlywheelPriorities(metrics: ReturnType<typeof buildPirateMetrics>) {
  const activationRate = parsePercentLabel(metrics.activation.activationRate);
  const retentionRate = parsePercentLabel(metrics.retention.retentionRate);
  const priorities: PirateFlywheelPriority[] = [];

  priorities.push(
    metrics.acquisition.pageViews < 250
      ? {
          stage: "Acquisition",
          status: "focus",
          metric: `${metrics.acquisition.pageViews} page views / ${metrics.acquisition.sessions} sessions`,
          headline: "Publish more search-first entry points.",
          playbook:
            "Double down on high-intent landing pages, comparison guides, and internal links that feed the hot-sauce and recipe clusters."
        }
      : {
          stage: "Acquisition",
          status: metrics.acquisition.topSources.length > 1 ? "stable" : "monitor",
          metric: `${metrics.acquisition.pageViews} page views / ${metrics.acquisition.sessions} sessions`,
          headline: "Keep compounding the pages already pulling people in.",
          playbook:
            "Refresh winning landing pages first, then add adjacent search pages and supporting blog posts to widen the cluster."
        }
  );

  priorities.push(
    activationRate < 8
      ? {
          stage: "Activation",
          status: "focus",
          metric: metrics.activation.activationRate,
          headline: "Make the first useful action easier to spot.",
          playbook:
            "Tighten save, signup, and next-click modules on top landing pages so new visitors have an obvious first move."
        }
      : {
          stage: "Activation",
          status: activationRate < 15 ? "monitor" : "stable",
          metric: metrics.activation.activationRate,
          headline: "Keep turning visitors into readers who act.",
          playbook:
            "Watch which activation events win by surface, then reinforce the best-performing CTA patterns instead of adding more options."
        }
  );

  priorities.push(
    retentionRate < 10
      ? {
          stage: "Retention",
          status: "focus",
          metric: metrics.retention.retentionRate,
          headline: "Give people a reason to come back this week.",
          playbook:
            "Use related-content modules, newsletter hooks, and recurring hot-sauce/recipe series so a first visit naturally leads to another one."
        }
      : {
          stage: "Retention",
          status: retentionRate < 18 ? "monitor" : "stable",
          metric: metrics.retention.retentionRate,
          headline: "Build repeat habits around the strongest content lanes.",
          playbook:
            "Keep linking clusters together and package repeat-worthy themes like taco night, wings, pantry staples, and starter sauce shelves."
        }
  );

  priorities.push(
    metrics.referral.shareEvents === 0 || metrics.referral.socialSessions === 0
      ? {
          stage: "Referral",
          status: "focus",
          metric: `${metrics.referral.shareEvents} shares / ${metrics.referral.socialSessions} social sessions`,
          headline: "Package pages so people want to pass them along.",
          playbook:
            "Improve social hooks, image moments, and send-to-a-friend framing on recipes, reviews, and guides before adding more channels."
        }
      : {
          stage: "Referral",
          status: metrics.referral.shareEvents < 10 ? "monitor" : "stable",
          metric: `${metrics.referral.shareEvents} shares / ${metrics.referral.socialSessions} social sessions`,
          headline: "Lean into the formats that already earn shares.",
          playbook:
            "Study the top shared pages, then reuse their packaging, topic framing, and visual treatments across the next content batch."
        }
  );

  priorities.push(
    metrics.revenue.affiliateClicks === 0
      ? {
          stage: "Revenue",
          status: "focus",
          metric: `${metrics.revenue.affiliateClicks} affiliate clicks`,
          headline: "Move product recommendations closer to real intent.",
          playbook:
            "Strengthen affiliate modules on the pages people already trust most: hot-sauce guides, comparison pages, and recipe pairings."
        }
      : {
          stage: "Revenue",
          status: metrics.revenue.affiliateClicks < 20 ? "monitor" : "stable",
          metric: `${metrics.revenue.affiliateClicks} affiliate clicks`,
          headline: "Refine the buying paths that are already working.",
          playbook:
            "Watch which page types and modules drive clicks, then make those buying lanes easier to repeat across the site."
        }
  );

  return priorities;
}
