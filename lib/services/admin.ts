import { flags } from "@/lib/env";
import {
  sampleAuditLog,
  sampleDashboardMetrics,
  sampleGenerationJobs,
  sampleGenerationSchedule,
  sampleNewsletterCampaigns,
  sampleProfiles,
  sampleRecipes,
  sampleSettings,
  sampleSocialPosts,
  sampleSubscribers
} from "@/lib/sample-data";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  AdminAuditEntry,
  DashboardMetric,
  GenerationJob,
  GenerationSchedule,
  NewsletterCampaign,
  NewsletterSubscriber,
  SiteSetting,
  SocialPost
} from "@/lib/types";

function mapGenerationJob(row: any): GenerationJob {
  return {
    id: row.id,
    jobType: row.job_type,
    promptTemplate: row.prompt_template ?? undefined,
    parameters: (row.parameters as Record<string, unknown> | null) ?? undefined,
    status: row.status,
    resultId: row.result_id ?? undefined,
    resultType: row.result_type ?? undefined,
    errorMessage: row.error_message ?? undefined,
    tokensUsed: row.tokens_used ?? undefined,
    modelUsed: row.model_used ?? undefined,
    attempts: row.attempts ?? 0,
    queuedAt: row.queued_at,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined
  };
}

function mapGenerationSchedule(row: any): GenerationSchedule {
  return {
    id: row.id,
    jobType: row.job_type,
    quantity: row.quantity ?? 1,
    cronExpr: row.cron_expr,
    parameters: (row.parameters as Record<string, unknown> | null) ?? undefined,
    isActive: row.is_active ?? true,
    lastRunAt: row.last_run_at ?? undefined,
    createdAt: row.created_at
  };
}

function mapSetting(row: any): SiteSetting {
  return {
    key: row.key,
    value: row.value,
    updatedAt: row.updated_at
  };
}

function mapSocialPost(row: any): SocialPost {
  return {
    id: row.id,
    platform: row.platform,
    contentType: row.content_type ?? "custom",
    contentId: row.content_id ?? 0,
    caption: row.caption,
    hashtags: row.hashtags ?? [],
    imageUrl: row.image_url ?? undefined,
    linkUrl: row.link_url ?? undefined,
    platformPostId: row.platform_post_id ?? undefined,
    status: row.status,
    scheduledAt: row.scheduled_at ?? undefined,
    publishedAt: row.published_at ?? undefined,
    engagement: (row.engagement as Record<string, number> | null) ?? undefined
  };
}

function mapSubscriber(row: any): NewsletterSubscriber {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name ?? undefined,
    status: row.status,
    source: row.source ?? undefined,
    tags: row.tags ?? [],
    subscribedAt: row.subscribed_at
  };
}

function mapNewsletterCampaign(row: any): NewsletterCampaign {
  return {
    id: row.id,
    subject: row.subject,
    previewText: row.preview_text ?? undefined,
    htmlContent: row.html_content,
    textContent: row.text_content ?? undefined,
    provider: row.provider ?? undefined,
    providerBroadcastId: row.provider_broadcast_id ?? undefined,
    status: row.status,
    sendAt: row.send_at ?? undefined,
    sentAt: row.sent_at ?? undefined,
    recipientCount: row.recipient_count ?? undefined,
    openCount: row.open_count ?? undefined,
    clickCount: row.click_count ?? undefined,
    createdAt: row.created_at
  };
}

async function getAuditAdminMap(adminIds: string[]) {
  const supabase = createSupabaseAdminClient();
  const adminMap = new Map(
    sampleProfiles.map((profile) => [
      profile.id,
      {
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName
      }
    ])
  );

  if (!supabase || !adminIds.length) {
    return adminMap;
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", Array.from(new Set(adminIds)));

  for (const row of data ?? []) {
    adminMap.set(row.id, {
      id: row.id,
      username: row.username,
      displayName: row.display_name
    });
  }

  return adminMap;
}

function mapAuditRow(
  row: any,
  adminMap: Map<string, { id: string; username: string; displayName: string }>
): AdminAuditEntry {
  return {
    id: row.id,
    action: row.action,
    targetType: row.target_type ?? undefined,
    targetId: row.target_id ?? undefined,
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
    performedAt: row.performed_at,
    admin:
      adminMap.get(row.admin_id) ?? {
        id: row.admin_id,
        username: "unknown",
        displayName: "Unknown admin"
      }
  };
}

function toCompactMetric(label: string, value: number, delta = "live"): DashboardMetric {
  return {
    label,
    value: new Intl.NumberFormat("en-US", { notation: "compact" }).format(value),
    delta,
    sparkline: [Math.max(1, Math.floor(value * 0.4)), Math.max(1, Math.floor(value * 0.6)), value]
  };
}

export async function getAdminDashboard() {
  if (!flags.hasSupabaseAdmin) {
    return {
      metrics: sampleDashboardMetrics,
      topRecipe: "Spicy Korean Gochujang Noodles",
      pendingModerationCount: 7,
      queuedSocialPosts: sampleSocialPosts.filter((post) => post.status === "scheduled").length,
      subscriberGrowth: "+11%"
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      metrics: sampleDashboardMetrics,
      topRecipe: "Spicy Korean Gochujang Noodles",
      pendingModerationCount: 7,
      queuedSocialPosts: sampleSocialPosts.filter((post) => post.status === "scheduled").length,
      subscriberGrowth: "+11%"
    };
  }

  const [
    { count: blogCount },
    { count: recipeCount },
    { count: reviewCount },
    { count: pendingCommunityCount },
    { count: pendingEntryCount },
    { count: scheduledSocialCount },
    { count: subscriberCount },
    { count: affiliateClicks },
    { data: topRecipeRow }
  ] = await Promise.all([
    supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("recipes").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase
      .from("community_posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_review"),
    supabase
      .from("competition_entries")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_review"),
    supabase.from("social_posts").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
    supabase
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("affiliate_clicks").select("*", { count: "exact", head: true }),
    supabase
      .from("recipes")
      .select("title")
      .eq("status", "published")
      .order("view_count", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  const totalPublished = (blogCount ?? 0) + (recipeCount ?? 0) + (reviewCount ?? 0);
  const moderationCount = (pendingCommunityCount ?? 0) + (pendingEntryCount ?? 0);
  const metrics = [
    toCompactMetric("Published posts", totalPublished),
    toCompactMetric("Affiliate clicks", affiliateClicks ?? 0),
    toCompactMetric("Pending moderation", moderationCount),
    toCompactMetric("Newsletter subs", subscriberCount ?? 0)
  ];

  return {
    metrics,
    topRecipe: topRecipeRow?.title ?? sampleRecipes[0]?.title ?? "No published recipe yet",
    pendingModerationCount: moderationCount,
    queuedSocialPosts: scheduledSocialCount ?? 0,
    subscriberGrowth: `${subscriberCount ?? 0} active`
  };
}

export async function getGenerationJobs() {
  if (!flags.hasSupabaseAdmin) {
    return sampleGenerationJobs;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sampleGenerationJobs;
  }

  const { data } = await supabase
    .from("content_generation_jobs")
    .select("*")
    .order("queued_at", { ascending: false })
    .limit(50);

  if (!data?.length) {
    return sampleGenerationJobs;
  }

  return data.map(mapGenerationJob);
}

export async function getGenerationSchedule() {
  if (!flags.hasSupabaseAdmin) {
    return sampleGenerationSchedule;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sampleGenerationSchedule;
  }

  const { data } = await supabase
    .from("generation_schedule")
    .select("*")
    .order("created_at", { ascending: true });

  if (!data?.length) {
    return sampleGenerationSchedule;
  }

  return data.map(mapGenerationSchedule);
}

export async function getSiteSettings() {
  if (!flags.hasSupabaseAdmin) {
    return sampleSettings;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sampleSettings;
  }

  const { data } = await supabase.from("site_settings").select("*").order("key");

  if (!data?.length) {
    return sampleSettings;
  }

  return data.map(mapSetting);
}

export async function getSocialQueue(status?: SocialPost["status"]) {
  if (!flags.hasSupabaseAdmin) {
    return status
      ? sampleSocialPosts.filter((post) => post.status === status)
      : sampleSocialPosts;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return status
      ? sampleSocialPosts.filter((post) => post.status === status)
      : sampleSocialPosts;
  }

  let query = supabase.from("social_posts").select("*").order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data } = await query;

  if (!data?.length) {
    return status
      ? sampleSocialPosts.filter((post) => post.status === status)
      : sampleSocialPosts;
  }

  return data.map(mapSocialPost);
}

export async function getSubscribers() {
  if (!flags.hasSupabaseAdmin) {
    return sampleSubscribers;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sampleSubscribers;
  }

  const { data } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false });

  if (!data?.length) {
    return sampleSubscribers;
  }

  return data.map(mapSubscriber);
}

export async function getNewsletterCampaigns() {
  if (!flags.hasSupabaseAdmin) {
    return sampleNewsletterCampaigns;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sampleNewsletterCampaigns;
  }

  const { data } = await supabase
    .from("newsletter_campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (!data?.length) {
    return sampleNewsletterCampaigns;
  }

  return data.map(mapNewsletterCampaign);
}

export async function getAuditLog() {
  if (!flags.hasSupabaseAdmin) {
    return sampleAuditLog;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sampleAuditLog;
  }

  const { data } = await supabase
    .from("admin_audit_log")
    .select("*")
    .order("performed_at", { ascending: false })
    .limit(50);

  if (!data?.length) {
    return sampleAuditLog;
  }

  const adminMap = await getAuditAdminMap(data.map((entry) => entry.admin_id));
  return data.map((row) => mapAuditRow(row, adminMap));
}
