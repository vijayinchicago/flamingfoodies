import { AFFILIATE_LINKS } from "@/lib/affiliates";
import { flags } from "@/lib/env";
import { buildShareAnalytics } from "@/lib/share-analytics";
import {
  sampleBlogPosts,
  sampleRecipes,
  sampleReviews
} from "@/lib/sample-data";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const PARTNER_EPC: Record<string, number> = {
  amazon: 1.2,
  heatonist: 2.8,
  fuego_box: 5.0,
  pepper_joe: 1.6,
  mike_hot_sauce: 1.9
};

function getFallbackAffiliateAnalytics() {
  const fallback = [
    { partner: "amazon", clicks: 241 },
    { partner: "heatonist", clicks: 121 },
    { partner: "fuego_box", clicks: 88 }
  ];
  const total = fallback.reduce((sum, entry) => sum + entry.clicks, 0);

  return fallback.map((entry) => ({
    partner: entry.partner,
    clicks: entry.clicks,
    clickShare: formatPercent((entry.clicks / total) * 100),
    estimatedRevenue: formatCurrency(entry.clicks * (PARTNER_EPC[entry.partner] ?? 1.5)),
    topProduct:
      Object.entries(AFFILIATE_LINKS).find(([, link]) => link.partner === entry.partner)?.[1]
        .product ?? "Mixed catalog"
  }));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getFallbackArray<T>(items: T[]) {
  return flags.allowSampleFallbacks ? items : [];
}

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function getAffiliateAnalytics() {
  if (!flags.hasSupabaseAdmin) {
    return flags.allowSampleFallbacks ? getFallbackAffiliateAnalytics() : [];
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return flags.allowSampleFallbacks ? getFallbackAffiliateAnalytics() : [];
  }

  const { data } = await supabase
    .from("affiliate_clicks")
    .select("partner, product");

  if (!data?.length) {
    return [];
  }

  const totalClicks = data.length;
  const byPartner = new Map<
    string,
    { clicks: number; products: Map<string, number> }
  >();

  for (const row of data) {
    const group = byPartner.get(row.partner) ?? {
      clicks: 0,
      products: new Map<string, number>()
    };

    group.clicks += 1;
    if (row.product) {
      group.products.set(row.product, (group.products.get(row.product) ?? 0) + 1);
    }
    byPartner.set(row.partner, group);
  }

  return Array.from(byPartner.entries())
    .map(([partner, group]) => ({
      partner,
      clicks: group.clicks,
      clickShare: formatPercent((group.clicks / totalClicks) * 100),
      estimatedRevenue: formatCurrency(group.clicks * (PARTNER_EPC[partner] ?? 1.5)),
      topProduct:
        Array.from(group.products.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ??
        "Mixed catalog"
    }))
    .sort((left, right) => right.clicks - left.clicks);
}

export async function getContentAnalytics() {
  const fallbackContent = [
    ...sampleBlogPosts.map((post) => ({
      source: post.source,
      views: post.viewCount,
      likes: post.likeCount,
      saves: 0,
      label: post.title,
      path: `/blog/${post.slug}`
    })),
    ...sampleRecipes.map((recipe) => ({
      source: recipe.source,
      views: recipe.viewCount,
      likes: recipe.likeCount,
      saves: recipe.saveCount,
      label: recipe.title,
      path: `/recipes/${recipe.slug}`
    })),
    ...sampleReviews.map((review) => ({
      source: review.source,
      views: review.viewCount,
      likes: review.likeCount,
      saves: 0,
      label: review.title,
      path: `/reviews/${review.slug}`
    }))
  ];

  const contentRows = getFallbackArray(fallbackContent);

  if (flags.hasSupabaseAdmin) {
    const supabase = createSupabaseAdminClient();
    if (supabase) {
      const [blogPosts, recipes, reviews] = await Promise.all([
        supabase.from("blog_posts").select("source, view_count, like_count, title, slug"),
        supabase
          .from("recipes")
          .select("source, view_count, like_count, save_count, title, slug"),
        supabase.from("reviews").select("source, view_count, like_count, title, slug")
      ]);

      const liveRows = [
        ...(blogPosts.data ?? []).map((post) => ({
          source: post.source,
          views: post.view_count ?? 0,
          likes: post.like_count ?? 0,
          saves: 0,
          label: post.title,
          path: `/blog/${post.slug}`
        })),
        ...(recipes.data ?? []).map((recipe) => ({
          source: recipe.source,
          views: recipe.view_count ?? 0,
          likes: recipe.like_count ?? 0,
          saves: recipe.save_count ?? 0,
          label: recipe.title,
          path: `/recipes/${recipe.slug}`
        })),
        ...(reviews.data ?? []).map((review) => ({
          source: review.source,
          views: review.view_count ?? 0,
          likes: review.like_count ?? 0,
          saves: 0,
          label: review.title,
          path: `/reviews/${review.slug}`
        }))
      ];

      if (liveRows.length) {
        contentRows.splice(0, contentRows.length, ...liveRows);
      }
    }
  }

  const groups = ["editorial", "ai_generated", "community"].map((source) => {
    const rows = contentRows.filter((row) => row.source === source);
    return {
      source,
      count: rows.length,
      avgViews: Math.round(average(rows.map((row) => row.views))),
      avgLikes: Math.round(average(rows.map((row) => row.likes))),
      avgSaves: Math.round(average(rows.map((row) => row.saves)))
    };
  });

  const topContent = [...contentRows]
    .sort((left, right) => right.views - left.views)
    .slice(0, 5);

  return {
    groups,
    topContent
  };
}

export async function getTrafficAnalytics() {
  const fallbackPages = [
    ...sampleRecipes.map((recipe) => ({
      label: recipe.title,
      path: `/recipes/${recipe.slug}`,
      section: "recipes",
      views: recipe.viewCount
    })),
    ...sampleBlogPosts.map((post) => ({
      label: post.title,
      path: `/blog/${post.slug}`,
      section: "blog",
      views: post.viewCount
    })),
    ...sampleReviews.map((review) => ({
      label: review.title,
      path: `/reviews/${review.slug}`,
      section: "reviews",
      views: review.viewCount
    }))
  ];

  const pages = getFallbackArray(fallbackPages);

  if (flags.hasSupabaseAdmin) {
    const supabase = createSupabaseAdminClient();
    if (supabase) {
      const [blogPosts, recipes, reviews] = await Promise.all([
        supabase.from("blog_posts").select("title, slug, view_count"),
        supabase.from("recipes").select("title, slug, view_count"),
        supabase.from("reviews").select("title, slug, view_count")
      ]);

      const livePages = [
        ...(recipes.data ?? []).map((recipe) => ({
          label: recipe.title,
          path: `/recipes/${recipe.slug}`,
          section: "recipes",
          views: recipe.view_count ?? 0
        })),
        ...(blogPosts.data ?? []).map((post) => ({
          label: post.title,
          path: `/blog/${post.slug}`,
          section: "blog",
          views: post.view_count ?? 0
        })),
        ...(reviews.data ?? []).map((review) => ({
          label: review.title,
          path: `/reviews/${review.slug}`,
          section: "reviews",
          views: review.view_count ?? 0
        }))
      ];

      if (livePages.length) {
        pages.splice(0, pages.length, ...livePages);
      }
    }
  }

  const totalViews = pages.reduce((sum, page) => sum + page.views, 0);
  const bySection = Array.from(
    pages.reduce((map, page) => {
      map.set(page.section, (map.get(page.section) ?? 0) + page.views);
      return map;
    }, new Map<string, number>())
  )
    .map(([section, views]) => ({ section, views }))
    .sort((left, right) => right.views - left.views);

  return {
    totalViews,
    bySection,
    topPages: [...pages].sort((left, right) => right.views - left.views).slice(0, 8)
  };
}

export async function getShareAnalytics(windowDays = 30) {
  const fallbackRows = getFallbackArray([
    {
      eventName: "recipe_share",
      path: "/recipes/birria-quesatacos-with-arbol-salsa",
      contentType: "recipe",
      contentSlug: "birria-quesatacos-with-arbol-salsa",
      sessionId: "fallback-session-1",
      occurredAt: isoDaysAgo(2),
      metadata: {
        platform: "pinterest",
        shareAction: "saved_image"
      }
    },
    {
      eventName: "recipe_share",
      path: "/blog/best-hot-sauces-for-taco-night",
      contentType: "blog_post",
      contentSlug: "best-hot-sauces-for-taco-night",
      sessionId: "fallback-session-2",
      occurredAt: isoDaysAgo(1),
      metadata: {
        platform: "whatsapp",
        shareAction: "opened"
      }
    },
    {
      eventName: "page_view",
      path: "/recipes/birria-quesatacos-with-arbol-salsa",
      sessionId: "fallback-session-3",
      occurredAt: isoDaysAgo(1),
      utmSource: "pinterest",
      utmCampaign: "organic_share"
    }
  ]);

  if (!flags.hasSupabaseAdmin) {
    return buildShareAnalytics(fallbackRows, windowDays);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return buildShareAnalytics(fallbackRows, windowDays);
  }

  const cutoff = isoDaysAgo(windowDays);
  const { data } = await supabase
    .from("telemetry_events")
    .select(
      "event_name, path, content_type, content_slug, session_id, anonymous_id, user_id, occurred_at, utm_source, utm_campaign, metadata"
    )
    .gte("occurred_at", cutoff)
    .in("event_name", ["page_view", "recipe_share"])
    .order("occurred_at", { ascending: true });

  if (!data?.length) {
    return buildShareAnalytics([], windowDays);
  }

  const rows = data.map((row) => ({
    eventName: row.event_name,
    path: row.path,
    contentType: row.content_type,
    contentSlug: row.content_slug,
    sessionId: row.session_id,
    anonymousId: row.anonymous_id,
    userId: row.user_id,
    occurredAt: row.occurred_at,
    utmSource: row.utm_source,
    utmCampaign: row.utm_campaign,
    metadata: row.metadata ?? {}
  }));

  return buildShareAnalytics(rows, windowDays);
}

export async function getSearchAnalytics(windowDays = 30) {
  const fallbackRows = getFallbackArray([
    {
      occurred_at: isoDaysAgo(2),
      path: "/search",
      metadata: {
        query: "birria tacos",
        source: "header",
        hasResults: true,
        resultCount: 3
      }
    },
    {
      occurred_at: isoDaysAgo(1),
      path: "/search",
      metadata: {
        query: "reaper honey",
        source: "search-page",
        hasResults: false,
        resultCount: 0
      }
    }
  ]);

  if (!flags.hasSupabaseAdmin) {
    return buildSearchAnalyticsFromRows(fallbackRows);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return buildSearchAnalyticsFromRows(fallbackRows);
  }

  const { data } = await supabase
    .from("telemetry_events")
    .select("occurred_at, path, metadata")
    .eq("event_name", "search_performed")
    .gte("occurred_at", isoDaysAgo(windowDays))
    .order("occurred_at", { ascending: false });

  return buildSearchAnalyticsFromRows(data ?? []);
}

function buildSearchAnalyticsFromRows(
  rows: Array<{
    occurred_at: string;
    path?: string | null;
    metadata?: Record<string, unknown> | null;
  }>
) {
  const queryCounts = new Map<string, number>();
  const sourceCounts = new Map<string, number>();
  const noResultCounts = new Map<string, number>();
  let totalSearches = 0;
  let noResultSearches = 0;

  for (const row of rows) {
    const query = String(row.metadata?.query || "").trim();
    const source = String(row.metadata?.source || "direct").trim() || "direct";
    const hasResults = Boolean(row.metadata?.hasResults);

    if (!query) continue;

    totalSearches += 1;
    queryCounts.set(query, (queryCounts.get(query) ?? 0) + 1);
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);

    if (!hasResults) {
      noResultSearches += 1;
      noResultCounts.set(query, (noResultCounts.get(query) ?? 0) + 1);
    }
  }

  return {
    totalSearches,
    noResultSearches,
    noResultRate:
      totalSearches > 0 ? `${Math.round((noResultSearches / totalSearches) * 100)}%` : "0%",
    topQueries: Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 8),
    topSources: Array.from(sourceCounts.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 6),
    noResultQueries: Array.from(noResultCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 8)
  };
}
