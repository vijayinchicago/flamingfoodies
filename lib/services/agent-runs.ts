import { getAutonomousAgents, type AutonomousAgent } from "@/lib/autonomous-agents";
import { flags } from "@/lib/env";
import {
  getAutomationApprovalSummary,
  listAutomationAgents,
  listAutomationEvaluations,
  listAutomationRuns,
  type AutomationAgentRecord,
  type AutomationRunRecord
} from "@/lib/services/automation-control";
import { getGrowthLoopReport } from "@/lib/services/growth-loop";
import {
  getLatestSearchInsightRunSummary,
  getSearchRecommendationQueueSummary,
  getSearchRuntimeOptimizations,
  hasSearchConsoleConnection
} from "@/lib/services/search-insights";
import { parseBufferProfileIds } from "@/lib/services/social";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const ET_TIME_ZONE = "America/New_York";

type SummaryTone = "neutral" | "good" | "warning";

type AgentRunLink = {
  label: string;
  href: string;
};

type AgentRunStat = {
  label: string;
  value: string;
};

type ScheduleDefinition = {
  agentId: AutonomousAgent["id"];
  label: string;
  note: string;
  minuteUtc: number;
  hourUtc?: number;
  intervalHours?: number;
  weekdays?: number[];
};

type SocialPostRow = {
  platform: string;
  status: string;
  created_at: string;
  scheduled_at: string | null;
  published_at: string | null;
};

type NewsletterCampaignRow = {
  subject: string | null;
  status: string;
  created_at: string;
  send_at: string | null;
  sent_at: string | null;
  click_count: number | null;
};

type AiContentRow = {
  id: number;
  status: string;
  published_at: string | null;
  created_at: string;
  source: string | null;
};

type MerchRow = {
  status: string;
  featured: boolean | null;
  created_at: string;
  updated_at: string | null;
};

type AgentRunLedger = {
  lastRunAt?: string;
  lastSuccessfulRunAt?: string;
  lastFailedRunAt?: string;
  consecutiveFailures: number;
  runsToday: number;
  successfulRunsToday: number;
  failedRunsToday: number;
  blockedRunsToday: number;
  runsLast7Days: number;
  successfulRunsLast7Days: number;
  failedRunsLast7Days: number;
  mutationUsageToday: number;
  externalUsageToday: number;
};

export type AgentRunSummaryCard = {
  label: string;
  value: string;
  note: string;
  tone: SummaryTone;
  links: AgentRunLink[];
};

export type AgentRunScheduleWindow = {
  label: string;
  at: string;
  note: string;
};

export type AgentRunReportItem = AutonomousAgent & {
  summary: string;
  isEnabled: boolean;
  requiresManualApproval: boolean;
  controlStatus: "enabled" | "paused";
  lastObservedAt?: string;
  lastSuccessfulRunAt?: string;
  lastFailedRunAt?: string;
  nextScheduledAt?: string;
  nextScheduledLabel?: string;
  consecutiveFailures: number;
  runsToday: number;
  successfulRunsToday: number;
  failedRunsToday: number;
  blockedRunsToday: number;
  capUsage: AgentRunStat[];
  stats: AgentRunStat[];
  links: AgentRunLink[];
};

export type AgentRunsSection = {
  key: string;
  label: string;
  description: string;
  agents: AgentRunReportItem[];
};

export type AgentRunsReport = {
  controlPlaneAvailable: boolean;
  todaySummary: AgentRunSummaryCard[];
  nextRuns: AgentRunScheduleWindow[];
  agents: AgentRunReportItem[];
  sections: AgentRunsSection[];
};

const scheduleDefinitions: ScheduleDefinition[] = [
  {
    agentId: "editorial-autopublisher",
    label: "Recipe generation",
    note: "Daily batch of 3 recipes.",
    hourUtc: 6,
    minuteUtc: 0
  },
  {
    agentId: "editorial-autopublisher",
    label: "Hot sauce recipe generation",
    note: "Weekly featured-sauce recipe on Mondays.",
    hourUtc: 9,
    minuteUtc: 0,
    weekdays: [1]
  },
  {
    agentId: "editorial-autopublisher",
    label: "Blog generation",
    note: "Daily batch of 1 blog post.",
    hourUtc: 7,
    minuteUtc: 0
  },
  {
    agentId: "editorial-autopublisher",
    label: "Review generation",
    note: "Review batch on Mondays and Thursdays.",
    hourUtc: 8,
    minuteUtc: 0,
    weekdays: [1, 4]
  },
  {
    agentId: "editorial-autopublisher",
    label: "AI draft reevaluation",
    note: "Re-checks pending AI drafts and promotes anything that now clears autonomous QA.",
    hourUtc: 17,
    minuteUtc: 45
  },
  {
    agentId: "editorial-autopublisher",
    label: "Publish scheduled content",
    note: "Makes due scheduled content live.",
    hourUtc: 18,
    minuteUtc: 0
  },
  {
    agentId: "editorial-performance-evaluator",
    label: "Editorial performance evaluator",
    note: "Records keep, escalate, or revert verdicts for prior editorial publish decisions.",
    hourUtc: 18,
    minuteUtc: 45
  },
  {
    agentId: "shop-shelf-curator",
    label: "Shop pick generation",
    note: "Adds a fresh shop pick daily.",
    hourUtc: 11,
    minuteUtc: 0
  },
  {
    agentId: "content-shop-sync",
    label: "Content-shop sync",
    note: "Refreshes internal shop matching and gap signals.",
    hourUtc: 12,
    minuteUtc: 0
  },
  {
    agentId: "shop-performance-evaluator",
    label: "Shop performance evaluator",
    note: "Records keep, escalate, or revert verdicts for prior shop curator decisions.",
    hourUtc: 0,
    minuteUtc: 30
  },
  {
    agentId: "search-insights-analyst",
    label: "Search insights sync",
    note: "Pulls Search Console performance data and refreshes the approval queue.",
    hourUtc: 12,
    minuteUtc: 30,
    weekdays: [1]
  },
  {
    agentId: "search-recommendation-executor",
    label: "Search recommendation executor",
    note: "Rebuilds runtime overlays from approved Search Console recommendations.",
    hourUtc: 13,
    minuteUtc: 0
  },
  {
    agentId: "search-performance-evaluator",
    label: "Search performance evaluator",
    note: "Records keep, escalate, or revert verdicts for prior search executor decisions.",
    hourUtc: 13,
    minuteUtc: 30
  },
  {
    agentId: "shop-shelf-curator",
    label: "Shop catalog refresh",
    note: "Nightly shelf re-rank using click data.",
    hourUtc: 23,
    minuteUtc: 30
  },
  {
    agentId: "festival-discovery",
    label: "Festival discovery",
    note: "Nightly draft-only scan for new festival entities.",
    hourUtc: 2,
    minuteUtc: 0
  },
  {
    agentId: "pepper-discovery",
    label: "Pepper discovery",
    note: "Weekly draft-only scan for new pepper entities.",
    hourUtc: 3,
    minuteUtc: 0,
    weekdays: [1]
  },
  {
    agentId: "brand-discovery",
    label: "Brand discovery",
    note: "Weekly draft-only scan for new hot sauce brands.",
    hourUtc: 4,
    minuteUtc: 0,
    weekdays: [1]
  },
  {
    agentId: "release-monitor",
    label: "Release monitor",
    note: "Weekly approval-queue scan for new release signals.",
    hourUtc: 4,
    minuteUtc: 15,
    weekdays: [1]
  },
  {
    agentId: "tutorial-generator",
    label: "Tutorial generator",
    note: "Weekly draft-only tutorial generation pass.",
    hourUtc: 5,
    minuteUtc: 0,
    weekdays: [3]
  },
  {
    agentId: "growth-loop-promoter",
    label: "Growth loop scan",
    note: "Scores winners and re-promotion candidates.",
    hourUtc: 18,
    minuteUtc: 30
  },
  {
    agentId: "pinterest-distributor",
    label: "Social scheduler",
    note: "Queues and publishes social posts, including Pinterest when configured.",
    hourUtc: 19,
    minuteUtc: 15
  },
  {
    agentId: "newsletter-digest-agent",
    label: "Newsletter digest",
    note: "Weekly digest drafting pass.",
    hourUtc: 10,
    minuteUtc: 0,
    weekdays: [0]
  },
  {
    agentId: "newsletter-digest-agent",
    label: "Due newsletter sends",
    note: "Hourly check for approved campaigns whose send windows have arrived.",
    minuteUtc: 5,
    intervalHours: 1
  }
];

function compactNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function latestIso(values: Array<string | null | undefined>) {
  const filtered = values.filter(Boolean) as string[];
  return filtered.length ? filtered.sort((left, right) => right.localeCompare(left))[0] : undefined;
}

function pluralize(label: string, count: number) {
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}

function formatCountBreakdown(
  counts: Record<string, number>,
  labelMap: Record<string, string>,
  fallback: string
) {
  const parts = Object.entries(labelMap)
    .map(([key, label]) => ({ label, count: counts[key] ?? 0 }))
    .filter((entry) => entry.count > 0)
    .map((entry) => pluralize(entry.label, entry.count));

  return parts.length ? parts.join(", ") : fallback;
}

function countByType<T extends string>(entries: T[]) {
  return entries.reduce<Record<T, number>>((counts, entry) => {
    counts[entry] = (counts[entry] ?? 0) + 1;
    return counts;
  }, {} as Record<T, number>);
}

function isDigestSubject(subject?: string | null) {
  const normalized = subject?.toLowerCase().trim();
  if (!normalized) return false;

  return (
    normalized.includes("what to cook, pour, and pass around this week") ||
    normalized.includes("this week’s hottest recipes and sauce finds") ||
    normalized.includes("this week's hottest recipes and sauce finds")
  );
}

function formatEtDateTime(value: string | Date) {
  return `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ET_TIME_ZONE
  }).format(typeof value === "string" ? new Date(value) : value)} ET`;
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset"
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  const match = formatted?.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!match) {
    return 0;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);

  return sign * (hours * 60 + minutes) * 60 * 1000;
}

function getZonedDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value ?? 0);
  const month = Number(parts.find((part) => part.type === "month")?.value ?? 1);
  const day = Number(parts.find((part) => part.type === "day")?.value ?? 1);

  return { year, month, day };
}

function addCalendarDays(parts: { year: number; month: number; day: number }, days: number) {
  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, 12, 0, 0));

  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate()
  };
}

function zonedDateTimeToUtc(
  parts: { year: number; month: number; day: number },
  hour: number,
  minute: number,
  timeZone: string
) {
  const guess = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, 0));
  const offsetMs = getTimeZoneOffsetMs(guess, timeZone);
  return new Date(guess.getTime() - offsetMs);
}

function getEtDayBounds(now = new Date()) {
  const today = getZonedDateParts(now, ET_TIME_ZONE);
  const tomorrow = addCalendarDays(today, 1);

  return {
    start: zonedDateTimeToUtc(today, 0, 0, ET_TIME_ZONE),
    end: zonedDateTimeToUtc(tomorrow, 0, 0, ET_TIME_ZONE)
  };
}

function isBetween(value: string | null | undefined, start: Date, end: Date) {
  if (!value) {
    return false;
  }

  return value >= start.toISOString() && value < end.toISOString();
}

function getNextOccurrence(schedule: ScheduleDefinition, now = new Date()) {
  if (schedule.intervalHours) {
    const firstCandidate = new Date(now);
    firstCandidate.setUTCSeconds(0, 0);
    firstCandidate.setUTCMinutes(schedule.minuteUtc);

    if (firstCandidate.getTime() <= now.getTime()) {
      firstCandidate.setUTCHours(firstCandidate.getUTCHours() + 1);
    }

    while (firstCandidate.getUTCHours() % schedule.intervalHours !== 0) {
      firstCandidate.setUTCHours(firstCandidate.getUTCHours() + 1);
    }

    return firstCandidate;
  }

  if (typeof schedule.hourUtc !== "number") {
    return undefined;
  }

  for (let offset = 0; offset <= 14; offset += 1) {
    const candidate = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + offset,
        schedule.hourUtc,
        schedule.minuteUtc,
        0
      )
    );

    if (schedule.weekdays && !schedule.weekdays.includes(candidate.getUTCDay())) {
      continue;
    }

    if (candidate.getTime() > now.getTime()) {
      return candidate;
    }
  }

  return undefined;
}

function buildNextRuns(now = new Date()) {
  return scheduleDefinitions
    .map((definition) => ({
      ...definition,
      nextOccurrence: getNextOccurrence(definition, now)
    }))
    .filter((entry): entry is ScheduleDefinition & { nextOccurrence: Date } =>
      Boolean(entry.nextOccurrence)
    )
    .sort((left, right) => left.nextOccurrence.getTime() - right.nextOccurrence.getTime());
}

function buildAgentLinks(agentId: AutonomousAgent["id"]): AgentRunLink[] {
  if (agentId === "editorial-autopublisher") {
    return [
      { label: "Automation jobs", href: "/admin/automation/jobs" },
      { label: "Recipes queue", href: "/admin/content/recipes" },
      { label: "Blog queue", href: "/admin/content/blog" },
      { label: "Reviews queue", href: "/admin/content/reviews" }
    ];
  }

  if (agentId === "editorial-performance-evaluator") {
    return [
      { label: "Automation jobs", href: "/admin/automation/jobs" },
      { label: "Trigger", href: "/admin/automation/trigger" },
      { label: "Agent runs", href: "/admin/automation/runs" }
    ];
  }

  if (agentId === "pinterest-distributor") {
    return [
      { label: "Social queue", href: "/admin/social/queue" },
      { label: "Social history", href: "/admin/social/history" },
      { label: "Trigger", href: "/admin/automation/trigger" }
    ];
  }

  if (agentId === "growth-loop-promoter") {
    return [
      { label: "Growth loop", href: "/admin/analytics/growth-loop" },
      { label: "Pirate metrics", href: "/admin/analytics/pirate" },
      { label: "Social queue", href: "/admin/social/queue" }
    ];
  }

  if (agentId === "shop-shelf-curator") {
    return [
      { label: "Shop picks CMS", href: "/admin/content/merch" },
      { label: "Affiliate health", href: "/admin/settings/affiliates" },
      { label: "Public shop", href: "/shop" }
    ];
  }

  if (agentId === "shop-performance-evaluator") {
    return [
      { label: "Shop picks CMS", href: "/admin/content/merch" },
      { label: "Trigger", href: "/admin/automation/trigger" },
      { label: "Agent runs", href: "/admin/automation/runs" }
    ];
  }

  if (agentId === "newsletter-digest-agent") {
    return [
      { label: "Campaigns", href: "/admin/newsletter/campaigns" },
      { label: "Subscribers", href: "/admin/newsletter/subscribers" },
      { label: "Compose", href: "/admin/newsletter/new" }
    ];
  }

  if (
    agentId === "search-insights-analyst" ||
    agentId === "search-recommendation-executor" ||
    agentId === "search-performance-evaluator"
  ) {
    return [
      { label: "Search Console", href: "/admin/analytics/search-console" },
      { label: "Trigger", href: "/admin/automation/trigger" },
      { label: "Agent runs", href: "/admin/automation/agents" }
    ];
  }

  if (agentId === "festival-discovery") {
    return [
      { label: "Trigger", href: "/admin/automation/trigger" },
      { label: "Public festivals", href: "/festivals" }
    ];
  }

  if (agentId === "pepper-discovery") {
    return [
      { label: "Trigger", href: "/admin/automation/trigger" },
      { label: "Public peppers", href: "/peppers" }
    ];
  }

  if (agentId === "brand-discovery") {
    return [
      { label: "Trigger", href: "/admin/automation/trigger" },
      { label: "Approvals", href: "/admin/automation/approvals" },
      { label: "Public brands", href: "/brands" }
    ];
  }

  if (agentId === "release-monitor") {
    return [
      { label: "Trigger", href: "/admin/automation/trigger" },
      { label: "Approvals", href: "/admin/automation/approvals" },
      { label: "New releases", href: "/new-releases" }
    ];
  }

  if (agentId === "tutorial-generator") {
    return [
      { label: "Trigger", href: "/admin/automation/trigger" },
      { label: "How-to guides", href: "/how-to" }
    ];
  }

  return [
    { label: "Trigger", href: "/admin/automation/trigger" },
    { label: "Shop picks CMS", href: "/admin/content/merch" },
    { label: "Public shop", href: "/shop" }
  ];
}

function buildFallbackReport(baseAgents: AutonomousAgent[], now = new Date()): AgentRunsReport {
  const nextRuns = buildNextRuns(now).slice(0, 6).map((entry) => ({
    label: entry.label,
    at: formatEtDateTime(entry.nextOccurrence),
    note: entry.note
  }));

  const agents: AgentRunReportItem[] = baseAgents.map((agent) => {
    const nextWindow = buildNextRuns(now).find((entry) => entry.agentId === agent.id);

    return {
      ...agent,
      summary:
        agent.status === "live"
          ? "This agent is configured in code, but the automation control plane is not available in this environment yet."
          : agent.dependencyNote,
      isEnabled: true,
      requiresManualApproval: agent.autonomyMode === "approval_required",
      controlStatus: "enabled",
      lastObservedAt: undefined,
      lastSuccessfulRunAt: undefined,
      lastFailedRunAt: undefined,
      nextScheduledAt: nextWindow?.nextOccurrence.toISOString(),
      nextScheduledLabel: nextWindow?.label,
      consecutiveFailures: 0,
      runsToday: 0,
      successfulRunsToday: 0,
      failedRunsToday: 0,
      blockedRunsToday: 0,
      capUsage: [],
      stats: [],
      links: buildAgentLinks(agent.id)
    };
  });

  return {
    controlPlaneAvailable: false,
    todaySummary: [
      {
        label: "Control plane",
        value: "Unavailable",
        note: "Apply the automation control migration so agent state, pauses, and run ledgers can be read live.",
        tone: "warning",
        links: [{ label: "Automation trigger", href: "/admin/automation/trigger" }]
      }
    ],
    nextRuns,
    agents,
    sections: buildSections(agents)
  };
}

function buildSections(agents: AgentRunReportItem[]): AgentRunsSection[] {
  return [
    {
      key: "bounded_live",
      label: "Live bounded agents",
      description: "These lanes can mutate live state, but only inside pre-modeled surfaces with caps and rollback expectations.",
      agents: agents.filter((agent) => !agent.isSupport && agent.riskClass === "bounded_live")
    },
    {
      key: "external_send",
      label: "External send agents",
      description: "These lanes touch audience-facing delivery channels such as social or email, so send controls matter more than simple draft creation.",
      agents: agents.filter((agent) => !agent.isSupport && agent.riskClass === "external_send")
    },
    {
      key: "approval_required",
      label: "Approval-required agents",
      description: "These lanes can research or prepare output, but the target policy is to stop short of unsupervised high-risk publication.",
      agents: agents.filter(
        (agent) => !agent.isSupport && agent.riskClass === "approval_required"
      )
    },
    {
      key: "draft_only",
      label: "Draft-only agents",
      description: "These lanes create research or draft records without publishing live user-facing output on their own.",
      agents: agents.filter((agent) => !agent.isSupport && agent.riskClass === "draft_only")
    },
    {
      key: "support",
      label: "Support jobs",
      description: "These jobs matter operationally, but they are not public-facing autonomous lanes.",
      agents: agents.filter((agent) => agent.isSupport)
    }
  ].filter((section) => section.agents.length > 0);
}

function buildLedgerByAgent(
  agents: AutonomousAgent[],
  controls: Map<AutonomousAgent["id"], AutomationAgentRecord>,
  runs: AutomationRunRecord[],
  etDayBounds: { start: Date; end: Date }
) {
  const cutoff7 = daysAgoIso(7);
  const runsByAgent = new Map<AutonomousAgent["id"], AutomationRunRecord[]>();

  for (const agent of agents) {
    runsByAgent.set(
      agent.id,
      runs
        .filter((run) => run.agentId === agent.id)
        .sort((left, right) => right.startedAt.localeCompare(left.startedAt))
    );
  }

  const ledgerByAgent = new Map<AutonomousAgent["id"], AgentRunLedger>();

  for (const agent of agents) {
    const agentRuns = runsByAgent.get(agent.id) ?? [];
    const todayRuns = agentRuns.filter((run) => isBetween(run.startedAt, etDayBounds.start, etDayBounds.end));
    const runsLast7Days = agentRuns.filter((run) => run.startedAt >= cutoff7);

    let consecutiveFailures = 0;
    for (const run of agentRuns) {
      if (run.status !== "failed") {
        break;
      }
      consecutiveFailures += 1;
    }

    ledgerByAgent.set(agent.id, {
      lastRunAt: agentRuns[0]?.startedAt,
      lastSuccessfulRunAt: agentRuns.find((run) => run.status === "succeeded")?.startedAt,
      lastFailedRunAt: agentRuns.find((run) => run.status === "failed")?.startedAt,
      consecutiveFailures,
      runsToday: todayRuns.length,
      successfulRunsToday: todayRuns.filter((run) => run.status === "succeeded").length,
      failedRunsToday: todayRuns.filter((run) => run.status === "failed").length,
      blockedRunsToday: todayRuns.filter((run) => run.status === "blocked").length,
      runsLast7Days: runsLast7Days.length,
      successfulRunsLast7Days: runsLast7Days.filter((run) => run.status === "succeeded").length,
      failedRunsLast7Days: runsLast7Days.filter((run) => run.status === "failed").length,
      mutationUsageToday: todayRuns.reduce(
        (sum, run) => sum + run.rowsCreated + run.rowsUpdated + run.rowsPublished,
        0
      ),
      externalUsageToday: todayRuns.reduce(
        (sum, run) => sum + Math.max(run.rowsSent, run.externalActionsCount),
        0
      )
    });

    const control = controls.get(agent.id);
    if (!control) {
      continue;
    }
  }

  return ledgerByAgent;
}

function buildCapUsage(control: AutomationAgentRecord | undefined, ledger: AgentRunLedger) {
  if (!control) {
    return [] as AgentRunStat[];
  }

  const usage: AgentRunStat[] = [];

  if (typeof control.dailyRunCap === "number") {
    usage.push({
      label: "Run cap",
      value: `${ledger.runsToday}/${control.dailyRunCap} today`
    });
  }

  if (typeof control.dailyMutationCap === "number") {
    usage.push({
      label: "Mutation cap",
      value: `${ledger.mutationUsageToday}/${control.dailyMutationCap} today`
    });
  }

  if (typeof control.dailyExternalSendCap === "number") {
    usage.push({
      label: "Send cap",
      value: `${ledger.externalUsageToday}/${control.dailyExternalSendCap} today`
    });
  }

  return usage;
}

function withPausePrefix(agent: { isEnabled: boolean }, message: string) {
  return agent.isEnabled ? message : `Currently paused. ${message}`;
}

export async function getAgentRunsReport(): Promise<AgentRunsReport> {
  const bufferProfiles = parseBufferProfileIds();
  const now = new Date();
  const searchConsoleReady =
    flags.hasSearchConsoleAuth || (flags.hasSupabaseAdmin ? await hasSearchConsoleConnection() : false);
  const baseAgents = getAutonomousAgents({
    autoPublishEnabled: true,
    hasBuffer: flags.hasBuffer,
    hasPinterestProfile: bufferProfiles.has("pinterest") || bufferProfiles.has("all"),
    hasConvertKit: flags.hasConvertKit,
    hasSearchConsole: searchConsoleReady,
    hasAnthropic: flags.hasAnthropic,
    hasSupabaseAdmin: flags.hasSupabaseAdmin
  });

  if (!flags.hasSupabaseAdmin) {
    return buildFallbackReport(baseAgents, now);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return buildFallbackReport(baseAgents, now);
  }

  const etDayBounds = getEtDayBounds(now);

  const [
    controlAgents,
    controlRuns,
    { data: settingsRows },
    { data: pinterestPosts },
    { data: newsletterCampaigns },
    { data: aiRecipeRows },
    { data: aiBlogRows },
    { data: aiReviewRows },
    { data: merchRows },
    growthReport,
    latestSearchInsightRun,
    searchQueueSummary,
    searchRuntime,
    approvalSummary,
    searchEvaluationRecords,
    editorialEvaluationRecords,
    shopEvaluationRecords
  ] = await Promise.all([
    listAutomationAgents(),
    listAutomationRuns({ since: daysAgoIso(30), limit: 1000 }),
    supabase.from("site_settings").select("key, value"),
    supabase
      .from("social_posts")
      .select("platform, status, created_at, scheduled_at, published_at")
      .eq("platform", "pinterest")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("newsletter_campaigns")
      .select("subject, status, created_at, send_at, sent_at, click_count")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("recipes")
      .select("id, status, published_at, created_at, source")
      .eq("source", "ai_generated")
      .order("created_at", { ascending: false })
      .limit(250),
    supabase
      .from("blog_posts")
      .select("id, status, published_at, created_at, source")
      .eq("source", "ai_generated")
      .order("created_at", { ascending: false })
      .limit(250),
    supabase
      .from("reviews")
      .select("id, status, published_at, created_at, source")
      .eq("source", "ai_generated")
      .order("created_at", { ascending: false })
      .limit(250),
    supabase
      .from("merch_products")
      .select("status, featured, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(200),
    getGrowthLoopReport(30),
    getLatestSearchInsightRunSummary(),
    getSearchRecommendationQueueSummary(),
    getSearchRuntimeOptimizations(),
    getAutomationApprovalSummary(),
    listAutomationEvaluations({ agentId: "search-performance-evaluator", limit: 200 }),
    listAutomationEvaluations({ agentId: "editorial-performance-evaluator", limit: 200 }),
    listAutomationEvaluations({ agentId: "shop-performance-evaluator", limit: 200 })
  ]);

  const controlPlaneAvailable = controlAgents.length > 0;
  if (!controlPlaneAvailable) {
    return buildFallbackReport(baseAgents, now);
  }

  const settingsMap = new Map((settingsRows ?? []).map((row) => [row.key, row.value]));
  const autoPublishEnabled =
    settingsMap.get("auto_publish_ai_content") === undefined
      ? true
      : Boolean(settingsMap.get("auto_publish_ai_content"));

  const agents = getAutonomousAgents({
    autoPublishEnabled,
    hasBuffer: flags.hasBuffer,
    hasPinterestProfile: bufferProfiles.has("pinterest") || bufferProfiles.has("all"),
    hasConvertKit: flags.hasConvertKit,
    hasSearchConsole: searchConsoleReady,
    hasAnthropic: flags.hasAnthropic,
    hasSupabaseAdmin: flags.hasSupabaseAdmin
  });

  const controlsById = new Map(controlAgents.map((agent) => [agent.agentId, agent]));
  const ledgerByAgent = buildLedgerByAgent(agents, controlsById, controlRuns, etDayBounds);
  const nextRunEntries = buildNextRuns(now);

  const recipeRows = (aiRecipeRows ?? []) as AiContentRow[];
  const blogRows = (aiBlogRows ?? []) as AiContentRow[];
  const reviewRows = (aiReviewRows ?? []) as AiContentRow[];
  const editorialRows = [...recipeRows, ...blogRows, ...reviewRows];
  const pinterestRows = (pinterestPosts ?? []) as SocialPostRow[];
  const digestCampaigns = ((newsletterCampaigns ?? []) as NewsletterCampaignRow[]).filter((campaign) =>
    isDigestSubject(campaign.subject)
  );
  const merchProductRows = (merchRows ?? []) as MerchRow[];

  const cutoff7 = daysAgoIso(7);
  const editorialPublishedLast7 = editorialRows.filter(
    (row) => row.status === "published" && row.published_at && row.published_at >= cutoff7
  ).length;
  const editorialScheduled = editorialRows.filter((row) => row.status === "draft").length;
  const editorialPending = editorialRows.filter((row) => row.status === "pending_review").length;

  const pinterestPublishedLast7 = pinterestRows.filter(
    (row) => row.status === "published" && row.published_at && row.published_at >= cutoff7
  ).length;
  const pinterestScheduled = pinterestRows.filter((row) => row.status === "scheduled").length;
  const pinterestFailed = pinterestRows.filter((row) => row.status === "failed").length;

  const winnerCount =
    growthReport.winners.acquisition.length +
    growthReport.winners.activation.length +
    growthReport.winners.referral.length +
    growthReport.winners.revenue.length;

  const merchPublished = merchProductRows.filter((row) => row.status === "published").length;
  const merchFeatured = merchProductRows.filter(
    (row) => row.status === "published" && row.featured
  ).length;
  const merchCreatedLast7 = merchProductRows.filter(
    (row) => row.created_at && row.created_at >= cutoff7
  ).length;

  const digestDrafts = digestCampaigns.filter((campaign) => campaign.status === "draft").length;
  const digestPendingApproval = digestCampaigns.filter(
    (campaign) => campaign.status === "pending_approval" || campaign.status === "scheduled"
  ).length;
  const digestApproved = digestCampaigns.filter((campaign) => campaign.status === "approved").length;
  const digestSent = digestCampaigns.filter((campaign) => campaign.status === "sent").length;
  const digestClicks = digestCampaigns.reduce(
    (sum, campaign) => sum + Number(campaign.click_count ?? 0),
    0
  );

  const searchRuntimeTargetCount =
    Object.keys(searchRuntime?.pages ?? {}).length +
    Object.keys(searchRuntime?.blog ?? {}).length +
    Object.keys(searchRuntime?.recipes ?? {}).length;
  const releaseApprovalSummary = approvalSummary.byAgent["release-monitor"] ?? {
    total: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    expiredCount: 0,
    appliedCount: 0
  };
  const searchEvaluationSummary = searchEvaluationRecords.reduce(
    (summary, evaluation) => {
      summary.total += 1;
      if (evaluation.verdict === "keep") {
        summary.keep += 1;
      } else if (evaluation.verdict === "revert") {
        summary.revert += 1;
      } else if (evaluation.verdict === "escalate") {
        summary.escalate += 1;
      }
      return summary;
    },
    {
      total: 0,
      keep: 0,
      revert: 0,
      escalate: 0
    }
  );
  const editorialEvaluationSummary = editorialEvaluationRecords.reduce(
    (summary, evaluation) => {
      summary.total += 1;
      if (evaluation.verdict === "keep") {
        summary.keep += 1;
      } else if (evaluation.verdict === "revert") {
        summary.revert += 1;
      } else if (evaluation.verdict === "escalate") {
        summary.escalate += 1;
      }
      return summary;
    },
    {
      total: 0,
      keep: 0,
      revert: 0,
      escalate: 0
    }
  );
  const shopEvaluationSummary = shopEvaluationRecords.reduce(
    (summary, evaluation) => {
      summary.total += 1;
      if (evaluation.verdict === "keep") {
        summary.keep += 1;
      } else if (evaluation.verdict === "revert") {
        summary.revert += 1;
      } else if (evaluation.verdict === "escalate") {
        summary.escalate += 1;
      }
      return summary;
    },
    {
      total: 0,
      keep: 0,
      revert: 0,
      escalate: 0
    }
  );

  const waitingReviewBreakdown = {
    recipe: recipeRows.filter((row) => row.status === "pending_review").length,
    blog_post: blogRows.filter((row) => row.status === "pending_review").length,
    review: reviewRows.filter((row) => row.status === "pending_review").length
  };

  const todayRuns = controlRuns.filter((run) => isBetween(run.startedAt, etDayBounds.start, etDayBounds.end));
  const todayStatusBreakdown = countByType(
    todayRuns.map((run) => run.status as "succeeded" | "failed" | "started" | "blocked" | "cancelled" | "rolled_back")
  );
  const pausedAgents = controlAgents.filter((agent) => !agent.isEnabled).length;
  const agentsNeedingAttention = agents.filter((agent) => {
    const ledger = ledgerByAgent.get(agent.id);
    return (ledger?.consecutiveFailures ?? 0) > 0 || !controlsById.get(agent.id)?.isEnabled;
  }).length;

  const nextRuns = nextRunEntries.slice(0, 6).map((entry) => ({
    label: entry.label,
    at: formatEtDateTime(entry.nextOccurrence),
    note: entry.note
  }));

  const reportAgents: AgentRunReportItem[] = agents.map((agent) => {
    const control = controlsById.get(agent.id);
    const ledger = ledgerByAgent.get(agent.id) ?? {
      lastRunAt: undefined,
      lastSuccessfulRunAt: undefined,
      lastFailedRunAt: undefined,
      consecutiveFailures: 0,
      runsToday: 0,
      successfulRunsToday: 0,
      failedRunsToday: 0,
      blockedRunsToday: 0,
      runsLast7Days: 0,
      successfulRunsLast7Days: 0,
      failedRunsLast7Days: 0,
      mutationUsageToday: 0,
      externalUsageToday: 0
    };
    const nextWindow = nextRunEntries.find((entry) => entry.agentId === agent.id);
    const sharedFields = {
      ...agent,
      isEnabled: control?.isEnabled ?? true,
      requiresManualApproval:
        control?.requiresManualApproval ?? agent.autonomyMode === "approval_required",
      controlStatus: (control?.isEnabled ?? true) ? ("enabled" as const) : ("paused" as const),
      lastObservedAt: ledger.lastRunAt,
      lastSuccessfulRunAt: ledger.lastSuccessfulRunAt,
      lastFailedRunAt: ledger.lastFailedRunAt,
      nextScheduledAt: nextWindow?.nextOccurrence.toISOString(),
      nextScheduledLabel: nextWindow?.label,
      consecutiveFailures: ledger.consecutiveFailures,
      runsToday: ledger.runsToday,
      successfulRunsToday: ledger.successfulRunsToday,
      failedRunsToday: ledger.failedRunsToday,
      blockedRunsToday: ledger.blockedRunsToday,
      capUsage: buildCapUsage(control, ledger),
      links: buildAgentLinks(agent.id)
    };

    if (agent.id === "editorial-autopublisher") {
      return {
        ...sharedFields,
        summary: withPausePrefix(
          sharedFields,
          autoPublishEnabled
            ? `Published ${editorialPublishedLast7} AI-led pieces in the last 7 days, with ${editorialScheduled} currently scheduled and ${editorialPending} still waiting for review.`
            : "Auto-publish is turned off, so generated content can queue but it will still wait for manual review."
        ),
        stats: [
          { label: "Published in 7d", value: compactNumber(editorialPublishedLast7) },
          { label: "Scheduled now", value: compactNumber(editorialScheduled) },
          { label: "Waiting review", value: compactNumber(editorialPending) },
          { label: "Runs in 7d", value: compactNumber(ledger.runsLast7Days) }
        ]
      };
    }

    if (agent.id === "pinterest-distributor") {
      return {
        ...sharedFields,
        summary: withPausePrefix(
          sharedFields,
          agent.status === "live"
            ? `Published ${pinterestPublishedLast7} Pinterest post(s) in the last 7 days, with ${pinterestScheduled} currently scheduled through Buffer.`
            : agent.dependencyNote
        ),
        stats: [
          { label: "Published in 7d", value: compactNumber(pinterestPublishedLast7) },
          { label: "Scheduled now", value: compactNumber(pinterestScheduled) },
          { label: "Failed posts", value: compactNumber(pinterestFailed) },
          { label: "Runs in 7d", value: compactNumber(ledger.runsLast7Days) }
        ]
      };
    }

    if (agent.id === "growth-loop-promoter") {
      return {
        ...sharedFields,
        summary: withPausePrefix(
          sharedFields,
          growthReport.autoPromotionCandidates.length
            ? `Tracking ${winnerCount} winner page(s) and ${growthReport.autoPromotionCandidates.length} current auto-promotion candidate(s) from live traffic, share, and affiliate data.`
            : "No winner pages have surfaced strongly enough yet for automatic re-promotion."
        ),
        stats: [
          { label: "Winner pages", value: compactNumber(winnerCount) },
          {
            label: "Promotion candidates",
            value: compactNumber(growthReport.autoPromotionCandidates.length)
          },
          {
            label: "Share events",
            value: compactNumber(growthReport.pirateSummary.shareEvents)
          },
          {
            label: "Affiliate clicks",
            value: compactNumber(growthReport.pirateSummary.affiliateClicks)
          }
        ]
      };
    }

    if (agent.id === "shop-shelf-curator") {
      return {
        ...sharedFields,
        summary: withPausePrefix(
          sharedFields,
          `Observed ${merchCreatedLast7} new or refreshed shop pick(s) in the last 7 days, with ${merchPublished} currently live on the shelf.`
        ),
        stats: [
          { label: "Live shop picks", value: compactNumber(merchPublished) },
          { label: "Featured now", value: compactNumber(merchFeatured) },
          { label: "Created in 7d", value: compactNumber(merchCreatedLast7) },
          { label: "Runs in 7d", value: compactNumber(ledger.runsLast7Days) }
        ]
      };
    }

    if (agent.id === "shop-performance-evaluator") {
      return {
        ...sharedFields,
        summary: withPausePrefix(
          sharedFields,
          shopEvaluationSummary.total > 0
            ? `The evaluator has recorded ${shopEvaluationSummary.total} verdict(s): ${shopEvaluationSummary.keep} keep, ${shopEvaluationSummary.escalate} escalate, and ${shopEvaluationSummary.revert} revert.`
            : ledger.runsLast7Days > 0
              ? `The evaluator ran ${ledger.runsLast7Days} time(s) in the last 7 days and is watching for mature shop curator decisions to judge.`
              : agent.status === "live"
                ? "This evaluator lane is configured and waiting for mature shop curator decisions to judge."
                : agent.dependencyNote
        ),
        stats: [
          { label: "Verdicts", value: compactNumber(shopEvaluationSummary.total) },
          { label: "Keep", value: compactNumber(shopEvaluationSummary.keep) },
          { label: "Escalate", value: compactNumber(shopEvaluationSummary.escalate) },
          { label: "Revert", value: compactNumber(shopEvaluationSummary.revert) }
        ]
      };
    }

    if (agent.id === "newsletter-digest-agent") {
      return {
        ...sharedFields,
        summary: withPausePrefix(
          sharedFields,
          digestCampaigns.length
            ? `The digest lane has created ${digestCampaigns.length} automated campaign(s), with ${digestPendingApproval} waiting for approval, ${digestApproved} approved to send, and ${digestSent} already delivered.`
            : agent.status === "live"
              ? "No automated digest campaigns have been created yet."
              : agent.dependencyNote
        ),
        stats: [
          { label: "Digest drafts", value: compactNumber(digestDrafts) },
          { label: "Needs approval", value: compactNumber(digestPendingApproval) },
          { label: "Approved sends", value: compactNumber(digestApproved) },
          { label: "Sent campaigns", value: compactNumber(digestSent) },
          { label: "Recorded clicks", value: compactNumber(digestClicks) }
        ]
      };
    }

    if (agent.id === "search-insights-analyst") {
      return {
        ...sharedFields,
        summary: withPausePrefix(
          sharedFields,
          latestSearchInsightRun
            ? `The latest sync surfaced ${latestSearchInsightRun.recommendationCount} recommendation(s) from Search Console data current through ${latestSearchInsightRun.latestAvailableDate}.`
            : agent.status === "live"
              ? "Search Console is connected and waiting for the first scheduled sync."
              : agent.dependencyNote
        ),
        stats: [
          {
            label: "Recommendations",
            value: compactNumber(latestSearchInsightRun?.recommendationCount ?? 0)
          },
          { label: "New in queue", value: compactNumber(searchQueueSummary.newCount) },
          { label: "Approved queue", value: compactNumber(searchQueueSummary.approvedCount) },
          { label: "Active queue", value: compactNumber(searchQueueSummary.active) }
        ]
      };
    }

    if (agent.id === "search-recommendation-executor") {
      return {
        ...sharedFields,
        summary: withPausePrefix(
          sharedFields,
          searchRuntime
            ? `The executor currently has ${searchQueueSummary.approvedCount} approved queue item(s) waiting, ${searchQueueSummary.appliedCount} applied item(s) shaping live SEO, and ${searchRuntimeTargetCount} runtime target(s) in the active overlay snapshot.`
            : searchQueueSummary.approvedCount > 0
              ? `There are ${searchQueueSummary.approvedCount} approved recommendation(s) waiting for the first runtime rebuild.`
              : agent.status === "live"
                ? "The executor is ready, but there are no approved Search Console recommendations to apply yet."
                : agent.dependencyNote
        ),
        stats: [
          { label: "Approved queue", value: compactNumber(searchQueueSummary.approvedCount) },
          { label: "Applied queue", value: compactNumber(searchQueueSummary.appliedCount) },
          { label: "Manual review", value: compactNumber(searchQueueSummary.manualReviewCount) },
          { label: "Runtime targets", value: compactNumber(searchRuntimeTargetCount) }
        ]
      };
    }

    if (agent.id === "search-performance-evaluator") {
      return {
        ...sharedFields,
        summary: withPausePrefix(
          sharedFields,
          searchEvaluationSummary.total > 0
            ? `The evaluator has recorded ${searchEvaluationSummary.total} verdict(s): ${searchEvaluationSummary.keep} keep, ${searchEvaluationSummary.escalate} escalate, and ${searchEvaluationSummary.revert} revert.`
            : ledger.runsLast7Days > 0
              ? `The evaluator ran ${ledger.runsLast7Days} time(s) in the last 7 days and is watching for mature search recommendations to judge.`
              : agent.status === "live"
                ? "This evaluator lane is configured and waiting for mature search executor decisions to judge."
                : agent.dependencyNote
        ),
        stats: [
          { label: "Verdicts", value: compactNumber(searchEvaluationSummary.total) },
          { label: "Keep", value: compactNumber(searchEvaluationSummary.keep) },
          { label: "Escalate", value: compactNumber(searchEvaluationSummary.escalate) },
          { label: "Revert", value: compactNumber(searchEvaluationSummary.revert) }
        ]
      };
    }

    if (agent.id === "editorial-performance-evaluator") {
      return {
        ...sharedFields,
        summary: withPausePrefix(
          sharedFields,
          editorialEvaluationSummary.total > 0
            ? `The evaluator has recorded ${editorialEvaluationSummary.total} verdict(s): ${editorialEvaluationSummary.keep} keep, ${editorialEvaluationSummary.escalate} escalate, and ${editorialEvaluationSummary.revert} revert.`
            : ledger.runsLast7Days > 0
              ? `The evaluator ran ${ledger.runsLast7Days} time(s) in the last 7 days and is watching for mature editorial publish runs to judge.`
              : agent.status === "live"
                ? "This evaluator lane is configured and waiting for mature editorial publish decisions to judge."
                : agent.dependencyNote
        ),
        stats: [
          { label: "Verdicts", value: compactNumber(editorialEvaluationSummary.total) },
          { label: "Keep", value: compactNumber(editorialEvaluationSummary.keep) },
          { label: "Escalate", value: compactNumber(editorialEvaluationSummary.escalate) },
          { label: "Revert", value: compactNumber(editorialEvaluationSummary.revert) }
        ]
      };
    }

    if (agent.id === "festival-discovery") {
      return {
        ...sharedFields,
        summary: withPausePrefix(
          sharedFields,
          ledger.runsLast7Days > 0
            ? `This draft-only discovery lane ran ${ledger.runsLast7Days} time(s) in the last 7 days and keeps festival discovery out of live publishing flows.`
            : agent.status === "live"
              ? "This draft-only discovery lane is configured and waiting for its next scheduled scan."
              : agent.dependencyNote
        ),
        stats: [
          { label: "Runs in 7d", value: compactNumber(ledger.runsLast7Days) },
          { label: "Succeeded in 7d", value: compactNumber(ledger.successfulRunsLast7Days) },
          { label: "Failed in 7d", value: compactNumber(ledger.failedRunsLast7Days) }
        ]
      };
    }

    if (agent.id === "pepper-discovery") {
      return {
        ...sharedFields,
        summary: withPausePrefix(
          sharedFields,
          ledger.runsLast7Days > 0
            ? `This draft-only discovery lane ran ${ledger.runsLast7Days} time(s) in the last 7 days and keeps pepper research safely in the draft layer.`
            : agent.status === "live"
              ? "This draft-only discovery lane is configured and waiting for its next scheduled scan."
              : agent.dependencyNote
        ),
        stats: [
          { label: "Runs in 7d", value: compactNumber(ledger.runsLast7Days) },
          { label: "Succeeded in 7d", value: compactNumber(ledger.successfulRunsLast7Days) },
          { label: "Failed in 7d", value: compactNumber(ledger.failedRunsLast7Days) }
        ]
      };
    }

    if (agent.id === "brand-discovery") {
      return {
        ...sharedFields,
        summary: withPausePrefix(
          sharedFields,
          ledger.runsLast7Days > 0
            ? `This draft-only lane ran ${ledger.runsLast7Days} time(s) in the last 7 days and keeps new brand research inside the backlog instead of the public site.`
            : agent.status === "live"
              ? "This draft-only lane is configured and waiting for its next scheduled brand scan."
              : agent.dependencyNote
        ),
        stats: [
          { label: "Runs in 7d", value: compactNumber(ledger.runsLast7Days) },
          { label: "Succeeded in 7d", value: compactNumber(ledger.successfulRunsLast7Days) },
          { label: "Failed in 7d", value: compactNumber(ledger.failedRunsLast7Days) }
        ]
      };
    }

    if (agent.id === "release-monitor") {
      return {
        ...sharedFields,
        summary: withPausePrefix(
          sharedFields,
          releaseApprovalSummary.pendingCount > 0 || releaseApprovalSummary.approvedCount > 0
            ? `The release monitor currently has ${releaseApprovalSummary.pendingCount} pending approval(s), ${releaseApprovalSummary.approvedCount} approved item(s) waiting to publish, and ${releaseApprovalSummary.appliedCount} applied release decision(s) in the queue.`
            : ledger.runsLast7Days > 0
              ? `The release monitor ran ${ledger.runsLast7Days} time(s) in the last 7 days and is now routing release output into approvals instead of direct publishing.`
              : agent.status === "live"
                ? "This lane is configured and will queue release proposals for approval instead of auto-publishing them."
                : agent.dependencyNote
        ),
        stats: [
          { label: "Pending approvals", value: compactNumber(releaseApprovalSummary.pendingCount) },
          {
            label: "Approved waiting",
            value: compactNumber(releaseApprovalSummary.approvedCount)
          },
          { label: "Applied releases", value: compactNumber(releaseApprovalSummary.appliedCount) },
          { label: "Runs in 7d", value: compactNumber(ledger.runsLast7Days) }
        ]
      };
    }

    if (agent.id === "tutorial-generator") {
      return {
        ...sharedFields,
        summary: withPausePrefix(
          sharedFields,
          ledger.runsLast7Days > 0
            ? `This draft-only lane ran ${ledger.runsLast7Days} time(s) in the last 7 days and keeps tutorial generation inside the backlog, not direct publishing.`
            : agent.status === "live"
              ? "This draft-only lane is configured and waiting for its next scheduled scan."
              : agent.dependencyNote
        ),
        stats: [
          { label: "Runs in 7d", value: compactNumber(ledger.runsLast7Days) },
          { label: "Succeeded in 7d", value: compactNumber(ledger.successfulRunsLast7Days) },
          { label: "Failed in 7d", value: compactNumber(ledger.failedRunsLast7Days) }
        ]
      };
    }

    return {
      ...sharedFields,
      summary: withPausePrefix(
        sharedFields,
        ledger.runsLast7Days > 0
          ? `This support lane ran ${ledger.runsLast7Days} time(s) in the last 7 days and keeps internal commerce signals fresh for other decisions.`
          : agent.status === "live"
            ? "This support lane is configured and waiting for its next scheduled sync."
            : agent.dependencyNote
      ),
      stats: [
        { label: "Runs in 7d", value: compactNumber(ledger.runsLast7Days) },
        { label: "Succeeded in 7d", value: compactNumber(ledger.successfulRunsLast7Days) },
        { label: "Failed in 7d", value: compactNumber(ledger.failedRunsLast7Days) }
      ]
    };
  });

  const todaySummary: AgentRunSummaryCard[] = [
    {
      label: "Runs today",
      value: compactNumber(todayRuns.length),
      note: formatCountBreakdown(
        todayStatusBreakdown,
        {
          succeeded: "successful run",
          failed: "failed run",
          blocked: "blocked run",
          started: "in-progress run",
          cancelled: "cancelled run",
          rolled_back: "rolled-back run"
        },
        "No automation runs have started yet today."
      ),
      tone: todayRuns.length > 0 ? "good" : "neutral",
      links: [
        { label: "Trigger runs", href: "/admin/automation/trigger" },
        { label: "Agent runs", href: "/admin/automation/agents" }
      ]
    },
    {
      label: "Succeeded today",
      value: compactNumber(todayRuns.filter((run) => run.status === "succeeded").length),
      note: "This count comes from the explicit automation run ledger, not inferred table activity.",
      tone:
        todayRuns.filter((run) => run.status === "succeeded").length > 0 ? "good" : "neutral",
      links: [{ label: "Agent runs", href: "/admin/automation/agents" }]
    },
    {
      label: "Failed today",
      value: compactNumber(todayRuns.filter((run) => run.status === "failed").length),
      note:
        todayRuns.filter((run) => run.status === "failed").length > 0
          ? "Investigate the failing lanes before widening autonomy."
          : "No automation lane has recorded a failed run today.",
      tone:
        todayRuns.filter((run) => run.status === "failed").length === 0 ? "good" : "warning",
      links: [
        { label: "Automation trigger", href: "/admin/automation/trigger" },
        { label: "Agent runs", href: "/admin/automation/agents" }
      ]
    },
    {
      label: "Paused lanes",
      value: compactNumber(pausedAgents),
      note:
        pausedAgents > 0
          ? "These lanes are disabled in the control plane and will not run until resumed."
          : "Every registered automation lane is currently enabled.",
      tone: pausedAgents === 0 ? "good" : "warning",
      links: [{ label: "Manage lanes", href: "/admin/automation/agents" }]
    },
    {
      label: "Needs attention",
      value: compactNumber(
        Math.max(
          agentsNeedingAttention,
          waitingReviewBreakdown.recipe +
            waitingReviewBreakdown.blog_post +
            waitingReviewBreakdown.review
        )
      ),
      note: formatCountBreakdown(
        waitingReviewBreakdown,
        {
          recipe: "recipe waiting for review",
          blog_post: "blog post waiting for review",
          review: "review waiting for review"
        },
        "No AI-generated content is waiting for review right now."
      ),
      tone:
        agentsNeedingAttention > 0 ||
        waitingReviewBreakdown.recipe +
          waitingReviewBreakdown.blog_post +
          waitingReviewBreakdown.review >
          0
          ? "warning"
          : "good",
      links: [
        { label: "Recipes queue", href: "/admin/content/recipes" },
        { label: "Blog queue", href: "/admin/content/blog" },
        { label: "Reviews queue", href: "/admin/content/reviews" }
      ]
    },
    {
      label: "Pending approvals",
      value: compactNumber(approvalSummary.pendingCount + approvalSummary.approvedCount),
      note:
        approvalSummary.pendingCount + approvalSummary.approvedCount > 0
          ? `${approvalSummary.pendingCount} pending approval item(s) and ${approvalSummary.approvedCount} approved item(s) are waiting in the automation approval queue.`
          : "No approval-gated automation items are waiting right now.",
      tone:
        approvalSummary.pendingCount + approvalSummary.approvedCount > 0 ? "warning" : "good",
      links: [{ label: "Open approvals", href: "/admin/automation/approvals" }]
    }
  ];

  return {
    controlPlaneAvailable: true,
    todaySummary,
    nextRuns,
    agents: reportAgents,
    sections: buildSections(reportAgents)
  };
}
