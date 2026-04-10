import {
  buildGrowthLoopReport,
  getGrowthLoopContentTypeFromPath,
  type GrowthLoopContentType
} from "@/lib/growth-loop";
import {
  getAffiliateAnalytics,
  getContentAnalytics,
  getShareAnalytics,
  getTrafficAnalytics
} from "@/lib/services/analytics";
import { createSocialPostsForContent } from "@/lib/services/social";
import { getPirateMetrics } from "@/lib/services/telemetry";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { flags } from "@/lib/env";

type PromotableContent = {
  id: number;
  type: GrowthLoopContentType;
  title: string;
  slug: string;
  path: string;
  imageUrl?: string | null;
};

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function getPromotablePublishedContent(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>
) {
  const [recipesResult, blogPostsResult, reviewsResult] = await Promise.all([
    supabase
      .from("recipes")
      .select("id, title, slug, image_url")
      .eq("status", "published"),
    supabase
      .from("blog_posts")
      .select("id, title, slug, image_url")
      .eq("status", "published"),
    supabase
      .from("reviews")
      .select("id, title, slug, image_url")
      .eq("status", "published")
  ]);

  return [
    ...(recipesResult.data ?? []).map(
      (row): PromotableContent => ({
        id: row.id,
        type: "recipe",
        title: row.title,
        slug: row.slug,
        path: `/recipes/${row.slug}`,
        imageUrl: row.image_url
      })
    ),
    ...(blogPostsResult.data ?? []).map(
      (row): PromotableContent => ({
        id: row.id,
        type: "blog_post",
        title: row.title,
        slug: row.slug,
        path: `/blog/${row.slug}`,
        imageUrl: row.image_url
      })
    ),
    ...(reviewsResult.data ?? []).map(
      (row): PromotableContent => ({
        id: row.id,
        type: "review",
        title: row.title,
        slug: row.slug,
        path: `/reviews/${row.slug}`,
        imageUrl: row.image_url
      })
    )
  ];
}

export async function getGrowthLoopReport(windowDays = 30) {
  const [traffic, content, shares, affiliate, pirate] = await Promise.all([
    getTrafficAnalytics(windowDays),
    getContentAnalytics(windowDays),
    getShareAnalytics(windowDays),
    getAffiliateAnalytics(windowDays),
    getPirateMetrics(windowDays)
  ]);

  const report = buildGrowthLoopReport({
    windowDays,
    trafficPages: traffic.topPages,
    contentPages: content.topContent,
    sharePages: shares.topContent,
    shareLandingPages: shares.landingPages.map((entry) => ({
      path: String(entry.path),
      count: entry.count
    })),
    affiliatePages: affiliate.topSourcePages
  });

  return {
    ...report,
    pirateSummary: {
      acquisitionVisitors: pirate.acquisition.visitors,
      activationRate: pirate.activation.activationRate,
      retentionRate: pirate.retention.retentionRate,
      shareEvents: pirate.referral.shareEvents,
      affiliateClicks: pirate.revenue.affiliateClicks
    }
  };
}

export async function queueGrowthLoopPromotions(windowDays = 30) {
  const report = await getGrowthLoopReport(windowDays);

  if (!flags.hasSupabaseAdmin) {
    return {
      mode: flags.hasBuffer ? "live" : "mock",
      windowDays,
      candidatesConsidered: report.autoPromotionCandidates.length,
      queuedContent: 0,
      queuedPosts: 0,
      promoted: [],
      skipped: []
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      mode: flags.hasBuffer ? "live" : "mock",
      windowDays,
      candidatesConsidered: report.autoPromotionCandidates.length,
      queuedContent: 0,
      queuedPosts: 0,
      promoted: [],
      skipped: []
    };
  }

  const promotableIndex = await getPromotablePublishedContent(supabase);
  const promotableByPath = new Map(promotableIndex.map((entry) => [entry.path, entry]));
  const candidates = report.autoPromotionCandidates
    .map((candidate) => {
      const content = promotableByPath.get(candidate.path);
      if (!content) return null;
      if (content.type !== getGrowthLoopContentTypeFromPath(candidate.path)) return null;

      return {
        ...candidate,
        content
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))
    .slice(0, 2);

  if (!candidates.length) {
    return {
      mode: flags.hasBuffer ? "live" : "mock",
      windowDays,
      candidatesConsidered: 0,
      queuedContent: 0,
      queuedPosts: 0,
      promoted: [],
      skipped: []
    };
  }

  const recentCutoff = isoDaysAgo(7);
  const { data: recentRows } = await supabase
    .from("social_posts")
    .select("content_type, content_id, created_at, status")
    .gte("created_at", recentCutoff)
    .in("status", ["pending", "scheduled", "published"]);

  const recentKeys = new Set(
    (recentRows ?? [])
      .filter((row) => row.content_type && row.content_id)
      .map((row) => `${row.content_type}:${row.content_id}`)
  );

  const promoted: Array<{
    title: string;
    path: string;
    contentType: GrowthLoopContentType;
    reason: string;
    postsCreated: number;
  }> = [];
  const skipped: Array<{
    title: string;
    path: string;
    reason: string;
  }> = [];

  let queuedPosts = 0;

  for (const candidate of candidates) {
    const recentKey = `${candidate.content.type}:${candidate.content.id}`;
    if (recentKeys.has(recentKey)) {
      skipped.push({
        title: candidate.label,
        path: candidate.path,
        reason: "Already promoted in the last 7 days."
      });
      continue;
    }

    const result = await createSocialPostsForContent({
      contentType: candidate.content.type,
      contentId: candidate.content.id,
      title: candidate.content.title,
      slug: candidate.content.slug,
      imageUrl: candidate.content.imageUrl ?? undefined
    });

    queuedPosts += result.created.length;
    promoted.push({
      title: candidate.content.title,
      path: candidate.content.path,
      contentType: candidate.content.type,
      reason: candidate.reason,
      postsCreated: result.created.length
    });
  }

  return {
    mode: flags.hasBuffer ? "live" : "mock",
    windowDays,
    candidatesConsidered: candidates.length,
    queuedContent: promoted.length,
    queuedPosts,
    promoted,
    skipped
  };
}
