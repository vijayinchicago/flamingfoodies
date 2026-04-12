import { getAutonomousAgents, type AutonomousAgent } from "@/lib/autonomous-agents";
import { flags } from "@/lib/env";
import { getGrowthLoopReport } from "@/lib/services/growth-loop";
import { parseBufferProfileIds } from "@/lib/services/social";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type AgentRunStat = {
  label: string;
  value: string;
};

type AgentRunLink = {
  label: string;
  href: string;
};

export type AgentRunReportItem = AutonomousAgent & {
  summary: string;
  lastObservedAt?: string;
  stats: AgentRunStat[];
  links: AgentRunLink[];
};

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

export async function getAgentRunsReport() {
  const bufferProfiles = parseBufferProfileIds();
  const supabase = createSupabaseAdminClient();
  const autoPublishEnabledDefault = true;
  const baseAgents = getAutonomousAgents({
    autoPublishEnabled: autoPublishEnabledDefault,
    hasBuffer: flags.hasBuffer,
    hasPinterestProfile: bufferProfiles.has("pinterest") || bufferProfiles.has("all"),
    hasConvertKit: flags.hasConvertKit
  });

  if (!flags.hasSupabaseAdmin || !supabase) {
    return baseAgents.map((agent) => ({
      ...agent,
      summary:
        agent.status === "live"
          ? "This agent is configured in code, but live run data is not available in this environment."
          : agent.dependencyNote,
      stats: [],
      links: []
    })) as AgentRunReportItem[];
  }

  const cutoff7 = daysAgoIso(7);

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
      .limit(150),
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
      .select("action, performed_at, metadata")
      .in("action", [
        "queue_growth_loop_promotions",
        "refresh_shop_catalog",
        "generate_newsletter_digest",
        "send_due_newsletters",
        "publish_scheduled_content",
        "queue_social_posts"
      ])
      .order("performed_at", { ascending: false })
      .limit(100),
    supabase
      .from("recipes")
      .select("status, published_at, created_at, source")
      .eq("source", "ai_generated")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("blog_posts")
      .select("status, published_at, created_at, source")
      .eq("source", "ai_generated")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("reviews")
      .select("status, published_at, created_at, source")
      .eq("source", "ai_generated")
      .order("created_at", { ascending: false })
      .limit(200),
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

  const editorialRows = [...(aiRecipeRows ?? []), ...(aiBlogRows ?? []), ...(aiReviewRows ?? [])];
  const editorialJobs = (generationJobs ?? []).filter((job) =>
    ["recipe", "blog_post", "review"].includes(job.job_type)
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

  const pinterestPublishedLast7 = (pinterestPosts ?? []).filter(
    (row) => row.status === "published" && row.published_at && row.published_at >= cutoff7
  ).length;
  const pinterestScheduled = (pinterestPosts ?? []).filter(
    (row) => row.status === "scheduled"
  ).length;
  const pinterestFailed = (pinterestPosts ?? []).filter((row) => row.status === "failed").length;
  const pinterestLastObservedAt = latestIso(
    (pinterestPosts ?? []).map(
      (row) => row.published_at ?? row.scheduled_at ?? row.created_at
    )
  );

  const winnerCount =
    growthReport.winners.acquisition.length +
    growthReport.winners.activation.length +
    growthReport.winners.referral.length +
    growthReport.winners.revenue.length;
  const growthLastObservedAt = latestIso(
    (auditRows ?? [])
      .filter((row) => row.action === "queue_growth_loop_promotions")
      .map((row) => row.performed_at)
  );

  const merchPublished = (merchRows ?? []).filter((row) => row.status === "published").length;
  const merchFeatured = (merchRows ?? []).filter(
    (row) => row.status === "published" && row.featured
  ).length;
  const merchCreatedLast7 = (merchRows ?? []).filter(
    (row) => row.created_at && row.created_at >= cutoff7
  ).length;
  const merchJobs = (generationJobs ?? []).filter((job) => job.job_type === "merch_product");
  const merchFailedJobs = merchJobs.filter((job) => job.status === "failed").length;
  const merchLastObservedAt = latestIso([
    ...(merchRows ?? []).map((row) => row.updated_at ?? row.created_at),
    ...merchJobs.map((job) => job.completed_at ?? job.queued_at)
  ]);

  const digestCampaigns = (newsletterCampaigns ?? []).filter((campaign) =>
    isDigestSubject(campaign.subject)
  );
  const digestDrafts = digestCampaigns.filter((campaign) => campaign.status === "draft").length;
  const digestScheduled = digestCampaigns.filter(
    (campaign) => campaign.status === "scheduled"
  ).length;
  const digestSent = digestCampaigns.filter((campaign) => campaign.status === "sent").length;
  const digestClicks = digestCampaigns.reduce(
    (sum, campaign) => sum + Number(campaign.click_count ?? 0),
    0
  );
  const newsletterLastObservedAt = latestIso(
    digestCampaigns.map((campaign) => campaign.sent_at ?? campaign.send_at ?? campaign.created_at)
  );

  return agents.map((agent): AgentRunReportItem => {
    if (agent.id === "editorial-autopublisher") {
      return {
        ...agent,
        summary: autoPublishEnabled
          ? `Published ${editorialPublishedLast7} AI-led pieces in the last 7 days, with ${editorialScheduled} currently scheduled and ${editorialPending} still waiting for review.`
          : "Auto-publish is turned off, so generated content can still queue but it will wait for manual review.",
        lastObservedAt: editorialLastObservedAt,
        stats: [
          { label: "Published in 7d", value: compactNumber(editorialPublishedLast7) },
          { label: "Scheduled now", value: compactNumber(editorialScheduled) },
          { label: "Waiting review", value: compactNumber(editorialPending) },
          { label: "Failed jobs", value: compactNumber(editorialFailedJobs) }
        ],
        links: [
          { label: "Automation jobs", href: "/admin/automation/jobs" },
          { label: "Recipes queue", href: "/admin/content/recipes" },
          { label: "Blog queue", href: "/admin/content/blog" },
          { label: "Reviews queue", href: "/admin/content/reviews" }
        ]
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
        stats: [
          { label: "Published in 7d", value: compactNumber(pinterestPublishedLast7) },
          { label: "Scheduled now", value: compactNumber(pinterestScheduled) },
          { label: "Failed posts", value: compactNumber(pinterestFailed) }
        ],
        links: [
          { label: "Social queue", href: "/admin/social/queue" },
          { label: "Social history", href: "/admin/social/history" },
          { label: "Trigger", href: "/admin/automation/trigger" }
        ]
      };
    }

    if (agent.id === "growth-loop-promoter") {
      return {
        ...agent,
        summary: growthReport.autoPromotionCandidates.length
          ? `Tracking ${winnerCount} winner pages and ${growthReport.autoPromotionCandidates.length} current auto-promotion candidates from live traffic, share, and affiliate data.`
          : "No winner pages have surfaced strongly enough yet for automatic re-promotion.",
        lastObservedAt: growthLastObservedAt,
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
        links: [
          { label: "Growth loop", href: "/admin/analytics/growth-loop" },
          { label: "Pirate metrics", href: "/admin/analytics/pirate" },
          { label: "Social queue", href: "/admin/social/queue" }
        ]
      };
    }

    if (agent.id === "shop-shelf-curator") {
      return {
        ...agent,
        summary: `Observed ${merchCreatedLast7} new or refreshed shop picks in the last 7 days, with ${merchPublished} currently live on the shelf.`,
        lastObservedAt: merchLastObservedAt,
        stats: [
          { label: "Live shop picks", value: compactNumber(merchPublished) },
          { label: "Featured now", value: compactNumber(merchFeatured) },
          { label: "Merch jobs", value: compactNumber(merchJobs.length) },
          { label: "Failed jobs", value: compactNumber(merchFailedJobs) }
        ],
        links: [
          { label: "Shop picks CMS", href: "/admin/content/merch" },
          { label: "Affiliate health", href: "/admin/settings/affiliates" },
          { label: "Public shop", href: "/shop" }
        ]
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
      stats: [
        { label: "Digest drafts", value: compactNumber(digestDrafts) },
        { label: "Scheduled sends", value: compactNumber(digestScheduled) },
        { label: "Sent campaigns", value: compactNumber(digestSent) },
        { label: "Recorded clicks", value: compactNumber(digestClicks) }
      ],
      links: [
        { label: "Campaigns", href: "/admin/newsletter/campaigns" },
        { label: "Subscribers", href: "/admin/newsletter/subscribers" },
        { label: "Compose", href: "/admin/newsletter/new" }
      ]
    };
  });
}
