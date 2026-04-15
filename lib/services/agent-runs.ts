import { getAutonomousAgents, type AutonomousAgent } from "@/lib/autonomous-agents";
import { flags } from "@/lib/env";
import { getGrowthLoopReport } from "@/lib/services/growth-loop";
import { parseBufferProfileIds } from "@/lib/services/social";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const ET_TIME_ZONE = "America/New_York";
const PUBLISH_ACTIONS = new Set(["update_recipe", "update_blog_post", "update_review"]);

type AgentRunStat = {
  label: string;
  value: string;
};

type AgentRunLink = {
  label: string;
  href: string;
};

type SummaryTone = "neutral" | "good" | "warning";

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

type ScheduleDefinition = {
  agentId: AutonomousAgent["id"];
  label: string;
  note: string;
  hourUtc: number;
  minuteUtc: number;
  weekdays?: number[];
};

type GenerationJobRow = {
  job_type: string;
  status: string;
  queued_at: string | null;
  completed_at: string | null;
  error_message?: string | null;
  parameters?: Record<string, unknown> | null;
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
  recipient_count: number | null;
  click_count: number | null;
};

type AuditRow = {
  action: string;
  target_type: string | null;
  target_id: string | null;
  performed_at: string;
  metadata?: Record<string, unknown> | null;
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

export type AgentRunReportItem = AutonomousAgent & {
  summary: string;
  lastObservedAt?: string;
  nextScheduledAt?: string;
  nextScheduledLabel?: string;
  stats: AgentRunStat[];
  links: AgentRunLink[];
};

export type AgentRunsReport = {
  todaySummary: AgentRunSummaryCard[];
  nextRuns: AgentRunScheduleWindow[];
  agents: AgentRunReportItem[];
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
    label: "Hot sauce recipe generation",
    note: "Weekly featured-sauce recipe on Mondays.",
    hourUtc: 9,
    minuteUtc: 0,
    weekdays: [1]
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
    agentId: "shop-shelf-curator",
    label: "Shop pick generation",
    note: "Adds a fresh shop pick daily.",
    hourUtc: 11,
    minuteUtc: 0
  },
  {
    agentId: "shop-shelf-curator",
    label: "Shop catalog refresh",
    note: "Nightly shelf re-rank using click data.",
    hourUtc: 23,
    minuteUtc: 30
  },
  {
    agentId: "newsletter-digest-agent",
    label: "Newsletter digest",
    note: "Weekly digest preparation and due-send processing.",
    hourUtc: 10,
    minuteUtc: 0,
    weekdays: [0]
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

  if (!filtered.length) {
    return undefined;
  }

  return filtered.sort((left, right) => right.localeCompare(left))[0];
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

function pluralize(label: string, count: number) {
  return `${count} ${label}${count === 1 ? "" : "s"}`;
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
  if (!value) return false;

  return value >= start.toISOString() && value < end.toISOString();
}

function countByType<T extends string>(entries: T[]) {
  return entries.reduce<Record<T, number>>((counts, entry) => {
    counts[entry] = (counts[entry] ?? 0) + 1;
    return counts;
  }, {} as Record<T, number>);
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

function getNextOccurrence(schedule: ScheduleDefinition, now = new Date()) {
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

  return [
    { label: "Campaigns", href: "/admin/newsletter/campaigns" },
    { label: "Subscribers", href: "/admin/newsletter/subscribers" },
    { label: "Compose", href: "/admin/newsletter/new" }
  ];
}

function buildFallbackReport(baseAgents: AutonomousAgent[], now = new Date()): AgentRunsReport {
  const nextRuns = buildNextRuns(now).slice(0, 6).map((entry) => ({
    label: entry.label,
    at: formatEtDateTime(entry.nextOccurrence),
    note: entry.note
  }));

  return {
    todaySummary: [
      {
        label: "Live data",
        value: "Unavailable",
        note: "Supabase admin access is not configured in this environment, so run counts cannot be read.",
        tone: "warning",
        links: [{ label: "Automation trigger", href: "/admin/automation/trigger" }]
      }
    ],
    nextRuns,
    agents: baseAgents.map((agent) => {
      const nextWindow = buildNextRuns(now).find((entry) => entry.agentId === agent.id);

      return {
        ...agent,
        summary:
          agent.status === "live"
            ? "This agent is configured in code, but live run data is not available in this environment."
            : agent.dependencyNote,
        lastObservedAt: undefined,
        nextScheduledAt: nextWindow ? nextWindow.nextOccurrence.toISOString() : undefined,
        nextScheduledLabel: nextWindow?.label,
        stats: [],
        links: buildAgentLinks(agent.id)
      };
    })
  };
}

export async function getAgentRunsReport(): Promise<AgentRunsReport> {
  const bufferProfiles = parseBufferProfileIds();
  const supabase = createSupabaseAdminClient();
  const autoPublishEnabledDefault = true;
  const now = new Date();
  const baseAgents = getAutonomousAgents({
    autoPublishEnabled: autoPublishEnabledDefault,
    hasBuffer: flags.hasBuffer,
    hasPinterestProfile: bufferProfiles.has("pinterest") || bufferProfiles.has("all"),
    hasConvertKit: flags.hasConvertKit
  });

  if (!flags.hasSupabaseAdmin || !supabase) {
    return buildFallbackReport(baseAgents, now);
  }

  const cutoff7 = daysAgoIso(7);
  const etDayBounds = getEtDayBounds(now);

  const [
    { data: settingsRows },
    { data: generationJobs },
    { data: pinterestPosts },
    { data: newsletterCampaigns },
    { data: auditRows },
    { data: aiRecipeRows },
    { data: aiBlogRows },
    { data: aiReviewRows },
    { data: merchRows },
    growthReport
  ] = await Promise.all([
    supabase.from("site_settings").select("key, value"),
    supabase
      .from("content_generation_jobs")
      .select("job_type, status, queued_at, completed_at, error_message, parameters")
      .in("job_type", ["recipe", "blog_post", "review", "merch_product"])
      .order("queued_at", { ascending: false })
      .limit(200),
    supabase
      .from("social_posts")
      .select("platform, status, created_at, scheduled_at, published_at")
      .eq("platform", "pinterest")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("newsletter_campaigns")
      .select("subject, status, created_at, send_at, sent_at, recipient_count, click_count")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("admin_audit_log")
      .select("action, target_type, target_id, performed_at, metadata")
      .in("action", [
        "queue_growth_loop_promotions",
        "refresh_shop_catalog",
        "generate_newsletter_digest",
        "send_due_newsletters",
        "publish_scheduled_content",
        "queue_social_posts",
        "update_recipe",
        "update_blog_post",
        "update_review"
      ])
      .order("performed_at", { ascending: false })
      .limit(200),
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
    getGrowthLoopReport(30)
  ]);

  const settingsMap = new Map((settingsRows ?? []).map((row) => [row.key, row.value]));
  const autoPublishEnabled =
    settingsMap.get("auto_publish_ai_content") === undefined
      ? autoPublishEnabledDefault
      : Boolean(settingsMap.get("auto_publish_ai_content"));

  const agents = getAutonomousAgents({
    autoPublishEnabled,
    hasBuffer: flags.hasBuffer,
    hasPinterestProfile: bufferProfiles.has("pinterest") || bufferProfiles.has("all"),
    hasConvertKit: flags.hasConvertKit
  });

  const recipeRows = (aiRecipeRows ?? []) as AiContentRow[];
  const blogRows = (aiBlogRows ?? []) as AiContentRow[];
  const reviewRows = (aiReviewRows ?? []) as AiContentRow[];
  const editorialRows = [...recipeRows, ...blogRows, ...reviewRows];
  const editorialJobs = ((generationJobs ?? []) as GenerationJobRow[]).filter((job) =>
    ["recipe", "blog_post", "review"].includes(job.job_type)
  );
  const merchGenerationJobs = ((generationJobs ?? []) as GenerationJobRow[]).filter(
    (job) => job.job_type === "merch_product"
  );
  const auditLogRows = (auditRows ?? []) as AuditRow[];
  const pinterestRows = (pinterestPosts ?? []) as SocialPostRow[];
  const digestCampaigns = ((newsletterCampaigns ?? []) as NewsletterCampaignRow[]).filter((campaign) =>
    isDigestSubject(campaign.subject)
  );
  const merchProductRows = (merchRows ?? []) as MerchRow[];

  const manualPublishRows = auditLogRows.filter(
    (row) =>
      PUBLISH_ACTIONS.has(row.action) &&
      row.metadata &&
      String(row.metadata.intent ?? "") === "publish"
  );
  const manualPublishKeys = new Set(
    manualPublishRows
      .filter((row) => row.target_type && row.target_id)
      .map((row) => `${row.target_type}:${row.target_id}`)
  );

  const editorialPublishedLast7 = editorialRows.filter(
    (row) => row.status === "published" && row.published_at && row.published_at >= cutoff7
  ).length;
  const editorialScheduled = editorialRows.filter((row) => row.status === "draft").length;
  const editorialPending = editorialRows.filter((row) => row.status === "pending_review").length;
  const editorialFailedJobs = editorialJobs.filter((job) => job.status === "failed").length;
  const editorialLastObservedAt = latestIso([
    ...editorialRows.map((row) => row.published_at ?? row.created_at),
    ...editorialJobs.map((job) => job.completed_at ?? job.queued_at)
  ]);

  const pinterestPublishedLast7 = pinterestRows.filter(
    (row) => row.status === "published" && row.published_at && row.published_at >= cutoff7
  ).length;
  const pinterestScheduled = pinterestRows.filter((row) => row.status === "scheduled").length;
  const pinterestFailed = pinterestRows.filter((row) => row.status === "failed").length;
  const pinterestLastObservedAt = latestIso(
    pinterestRows.map((row) => row.published_at ?? row.scheduled_at ?? row.created_at)
  );

  const winnerCount =
    growthReport.winners.acquisition.length +
    growthReport.winners.activation.length +
    growthReport.winners.referral.length +
    growthReport.winners.revenue.length;
  const growthLastObservedAt = latestIso(
    auditLogRows
      .filter((row) => row.action === "queue_growth_loop_promotions")
      .map((row) => row.performed_at)
  );

  const merchPublished = merchProductRows.filter((row) => row.status === "published").length;
  const merchFeatured = merchProductRows.filter(
    (row) => row.status === "published" && row.featured
  ).length;
  const merchCreatedLast7 = merchProductRows.filter(
    (row) => row.created_at && row.created_at >= cutoff7
  ).length;
  const merchFailedJobs = merchGenerationJobs.filter((job) => job.status === "failed").length;
  const merchLastObservedAt = latestIso([
    ...merchProductRows.map((row) => row.updated_at ?? row.created_at),
    ...merchGenerationJobs.map((job) => job.completed_at ?? job.queued_at)
  ]);

  const digestDrafts = digestCampaigns.filter((campaign) => campaign.status === "draft").length;
  const digestScheduled = digestCampaigns.filter((campaign) => campaign.status === "scheduled").length;
  const digestSent = digestCampaigns.filter((campaign) => campaign.status === "sent").length;
  const digestClicks = digestCampaigns.reduce(
    (sum, campaign) => sum + Number(campaign.click_count ?? 0),
    0
  );
  const newsletterLastObservedAt = latestIso(
    digestCampaigns.map((campaign) => campaign.sent_at ?? campaign.send_at ?? campaign.created_at)
  );

  const completedJobsToday = [...editorialJobs, ...merchGenerationJobs].filter(
    (job) => job.status === "completed" && isBetween(job.completed_at ?? job.queued_at, etDayBounds.start, etDayBounds.end)
  );
  const completedTodayBreakdown = countByType(
    completedJobsToday.map((job) => job.job_type as "recipe" | "blog_post" | "review" | "merch_product")
  );

  const failedJobsToday = [...editorialJobs, ...merchGenerationJobs].filter(
    (job) => job.status === "failed" && isBetween(job.completed_at ?? job.queued_at, etDayBounds.start, etDayBounds.end)
  );
  const failedTodayBreakdown = countByType(
    failedJobsToday.map((job) => job.job_type as "recipe" | "blog_post" | "review" | "merch_product")
  );

  const publishedRecipesToday = recipeRows.filter((row) =>
    isBetween(row.published_at, etDayBounds.start, etDayBounds.end)
  );
  const publishedBlogsToday = blogRows.filter((row) =>
    isBetween(row.published_at, etDayBounds.start, etDayBounds.end)
  );
  const publishedReviewsToday = reviewRows.filter((row) =>
    isBetween(row.published_at, etDayBounds.start, etDayBounds.end)
  );
  const publishedTodayRows = [
    ...publishedRecipesToday.map((row) => ({ row, type: "recipe" })),
    ...publishedBlogsToday.map((row) => ({ row, type: "blog_post" })),
    ...publishedReviewsToday.map((row) => ({ row, type: "review" }))
  ];

  const manualPublishedTodayRows = publishedTodayRows.filter(({ row, type }) =>
    manualPublishKeys.has(`${type === "blog_post" ? "blog_post" : type}:${row.id}`)
  );
  const autoPublishedTodayRows = publishedTodayRows.filter(
    ({ row, type }) => !manualPublishKeys.has(`${type === "blog_post" ? "blog_post" : type}:${row.id}`)
  );

  const manualPublishedTodayBreakdown = countByType(
    manualPublishedTodayRows.map((entry) => entry.type)
  );
  const autoPublishedTodayBreakdown = countByType(
    autoPublishedTodayRows.map((entry) => entry.type)
  );

  const waitingReviewBreakdown = {
    recipe: recipeRows.filter((row) => row.status === "pending_review").length,
    blog_post: blogRows.filter((row) => row.status === "pending_review").length,
    review: reviewRows.filter((row) => row.status === "pending_review").length
  };

  const nextRunEntries = buildNextRuns(now);
  const nextRuns = nextRunEntries.slice(0, 6).map((entry) => ({
    label: entry.label,
    at: formatEtDateTime(entry.nextOccurrence),
    note: entry.note
  }));

  const waitingReviewLinks: AgentRunLink[] = [
    ...(waitingReviewBreakdown.recipe > 0
      ? [{ label: "Recipes queue", href: "/admin/content/recipes#review-queue" }]
      : []),
    ...(waitingReviewBreakdown.blog_post > 0
      ? [{ label: "Blog queue", href: "/admin/content/blog#review-queue" }]
      : []),
    ...(waitingReviewBreakdown.review > 0
      ? [{ label: "Review queue", href: "/admin/content/reviews#review-queue" }]
      : [])
  ];

  const autoPublishedLinks: AgentRunLink[] = [
    ...(autoPublishedTodayBreakdown.recipe > 0
      ? [{ label: "Recipes", href: "/admin/content/recipes" }]
      : []),
    ...(autoPublishedTodayBreakdown.blog_post > 0
      ? [{ label: "Blog", href: "/admin/content/blog" }]
      : []),
    ...(autoPublishedTodayBreakdown.review > 0
      ? [{ label: "Reviews", href: "/admin/content/reviews" }]
      : [])
  ];

  const manualPublishedLinks: AgentRunLink[] = [
    ...(manualPublishedTodayBreakdown.recipe > 0
      ? [{ label: "Recipes", href: "/admin/content/recipes" }]
      : []),
    ...(manualPublishedTodayBreakdown.blog_post > 0
      ? [{ label: "Blog", href: "/admin/content/blog" }]
      : []),
    ...(manualPublishedTodayBreakdown.review > 0
      ? [{ label: "Reviews", href: "/admin/content/reviews" }]
      : [])
  ];

  const todaySummary: AgentRunSummaryCard[] = [
    {
      label: "Completed runs today",
      value: compactNumber(completedJobsToday.length),
      note: formatCountBreakdown(
        completedTodayBreakdown,
        {
          recipe: "recipe",
          blog_post: "blog post",
          review: "review",
          merch_product: "shop pick"
        },
        "No completed automation runs yet today."
      ),
      tone: completedJobsToday.length > 0 ? "good" : "neutral",
      links: [
        { label: "View jobs", href: "/admin/automation/jobs" },
        { label: "Trigger runs", href: "/admin/automation/trigger" }
      ]
    },
    {
      label: "Auto-published today",
      value: compactNumber(autoPublishedTodayRows.length),
      note: formatCountBreakdown(
        autoPublishedTodayBreakdown,
        {
          recipe: "recipe",
          blog_post: "blog post",
          review: "review"
        },
        "Nothing has auto-published yet today."
      ),
      tone: autoPublishedTodayRows.length > 0 ? "good" : "neutral",
      links: autoPublishedLinks.length
        ? autoPublishedLinks
        : [{ label: "Content queues", href: "/admin/content/recipes" }]
    },
    {
      label: "Manual publishes today",
      value: compactNumber(manualPublishedTodayRows.length),
      note: formatCountBreakdown(
        manualPublishedTodayBreakdown,
        {
          recipe: "recipe",
          blog_post: "blog post",
          review: "review"
        },
        "No AI-generated content needed a manual publish today."
      ),
      tone: manualPublishedTodayRows.length === 0 ? "good" : "warning",
      links: manualPublishedLinks.length
        ? manualPublishedLinks
        : [{ label: "Content queues", href: "/admin/content/recipes" }]
    },
    {
      label: "Failed runs today",
      value: compactNumber(failedJobsToday.length),
      note: formatCountBreakdown(
        failedTodayBreakdown,
        {
          recipe: "recipe job",
          blog_post: "blog job",
          review: "review job",
          merch_product: "shop job"
        },
        "No automation jobs have failed today."
      ),
      tone: failedJobsToday.length === 0 ? "good" : "warning",
      links: [
        { label: "View jobs", href: "/admin/automation/jobs" },
        { label: "Open trigger", href: "/admin/automation/trigger" }
      ]
    },
    {
      label: "Waiting for review",
      value: compactNumber(
        waitingReviewBreakdown.recipe +
          waitingReviewBreakdown.blog_post +
          waitingReviewBreakdown.review
      ),
      note: formatCountBreakdown(
        waitingReviewBreakdown,
        {
          recipe: "recipe",
          blog_post: "blog post",
          review: "review"
        },
        "No AI-generated content is waiting for review right now."
      ),
      tone:
        waitingReviewBreakdown.recipe +
          waitingReviewBreakdown.blog_post +
          waitingReviewBreakdown.review >
        0
          ? "warning"
          : "good",
      links: waitingReviewLinks.length
        ? waitingReviewLinks
        : [{ label: "Recipes", href: "/admin/content/recipes" }]
    }
  ];

  return {
    todaySummary,
    nextRuns,
    agents: agents.map((agent): AgentRunReportItem => {
      const nextWindow = nextRunEntries.find((entry) => entry.agentId === agent.id);

      if (agent.id === "editorial-autopublisher") {
        return {
          ...agent,
          summary: autoPublishEnabled
            ? `Published ${editorialPublishedLast7} AI-led pieces in the last 7 days, with ${editorialScheduled} currently scheduled and ${editorialPending} still waiting for review.`
            : "Auto-publish is turned off, so generated content can still queue but it will wait for manual review.",
          lastObservedAt: editorialLastObservedAt,
          nextScheduledAt: nextWindow?.nextOccurrence.toISOString(),
          nextScheduledLabel: nextWindow?.label,
          stats: [
            { label: "Published in 7d", value: compactNumber(editorialPublishedLast7) },
            { label: "Scheduled now", value: compactNumber(editorialScheduled) },
            { label: "Waiting review", value: compactNumber(editorialPending) },
            { label: "Failed jobs", value: compactNumber(editorialFailedJobs) }
          ],
          links: buildAgentLinks(agent.id)
        };
      }

      if (agent.id === "pinterest-distributor") {
        return {
          ...agent,
          summary:
            agent.status === "live"
              ? `Published ${pinterestPublishedLast7} Pinterest posts in the last 7 days, with ${pinterestScheduled} currently scheduled through Buffer.`
              : agent.dependencyNote,
          lastObservedAt: pinterestLastObservedAt,
          nextScheduledAt: nextWindow?.nextOccurrence.toISOString(),
          nextScheduledLabel: nextWindow?.label,
          stats: [
            { label: "Published in 7d", value: compactNumber(pinterestPublishedLast7) },
            { label: "Scheduled now", value: compactNumber(pinterestScheduled) },
            { label: "Failed posts", value: compactNumber(pinterestFailed) }
          ],
          links: buildAgentLinks(agent.id)
        };
      }

      if (agent.id === "growth-loop-promoter") {
        return {
          ...agent,
          summary: growthReport.autoPromotionCandidates.length
            ? `Tracking ${winnerCount} winner pages and ${growthReport.autoPromotionCandidates.length} current auto-promotion candidates from live traffic, share, and affiliate data.`
            : "No winner pages have surfaced strongly enough yet for automatic re-promotion.",
          lastObservedAt: growthLastObservedAt,
          nextScheduledAt: nextWindow?.nextOccurrence.toISOString(),
          nextScheduledLabel: nextWindow?.label,
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
          ],
          links: buildAgentLinks(agent.id)
        };
      }

      if (agent.id === "shop-shelf-curator") {
        return {
          ...agent,
          summary: `Observed ${merchCreatedLast7} new or refreshed shop picks in the last 7 days, with ${merchPublished} currently live on the shelf.`,
          lastObservedAt: merchLastObservedAt,
          nextScheduledAt: nextWindow?.nextOccurrence.toISOString(),
          nextScheduledLabel: nextWindow?.label,
          stats: [
            { label: "Live shop picks", value: compactNumber(merchPublished) },
            { label: "Featured now", value: compactNumber(merchFeatured) },
            { label: "Merch jobs", value: compactNumber(merchGenerationJobs.length) },
            { label: "Failed jobs", value: compactNumber(merchFailedJobs) }
          ],
          links: buildAgentLinks(agent.id)
        };
      }

      return {
        ...agent,
        summary: digestCampaigns.length
          ? `The digest lane has created ${digestCampaigns.length} automated campaign(s), with ${digestSent} already sent and ${digestScheduled} still queued to go out.`
          : agent.status === "live"
            ? "No automated digest campaigns have been created yet."
            : agent.dependencyNote,
        lastObservedAt: newsletterLastObservedAt,
        nextScheduledAt: nextWindow?.nextOccurrence.toISOString(),
        nextScheduledLabel: nextWindow?.label,
        stats: [
          { label: "Digest drafts", value: compactNumber(digestDrafts) },
          { label: "Scheduled sends", value: compactNumber(digestScheduled) },
          { label: "Sent campaigns", value: compactNumber(digestSent) },
          { label: "Recorded clicks", value: compactNumber(digestClicks) }
        ],
        links: buildAgentLinks(agent.id)
      };
    })
  };
}
