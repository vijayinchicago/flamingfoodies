import { flags } from "@/lib/env";
import {
  buildAffiliateDestinationUrl,
  getAffiliateDestinationKind,
  getAffiliateRegistry,
  isExactAmazonProductDestination
} from "@/lib/affiliates";
import { classifyAcquisitionSource } from "@/lib/pirate-metrics";
import { buildShareAnalytics } from "@/lib/share-analytics";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const PARTNER_EPC: Record<string, number> = {
  amazon: 1.2,
  heatonist: 2.8,
  fuego_box: 5.0,
  pepper_joe: 1.6,
  mike_hot_sauce: 1.9
};

type ContentIndexEntry = {
  id: number;
  type: "blog_post" | "recipe" | "review";
  source: string;
  title: string;
  slug: string;
  path: string;
};

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

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function formatPathLabel(path: string) {
  if (path === "/") return "Home";

  const segments = path.split("/").filter(Boolean);
  if (!segments.length) return "Home";

  return segments[segments.length - 1]
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getTrafficSection(path: string) {
  if (path === "/") return "home";
  if (path.startsWith("/recipes")) return "recipes";
  if (path.startsWith("/reviews")) return "reviews";
  if (path.startsWith("/hot-sauces")) return "hot-sauces";
  if (path.startsWith("/blog")) return "blog";
  if (path.startsWith("/guides")) return "guides";
  if (path.startsWith("/shop")) return "shop";
  if (path.startsWith("/search")) return "search";
  if (path.startsWith("/quiz")) return "quiz";
  if (path.startsWith("/subscriptions")) return "subscriptions";
  if (path.startsWith("/community")) return "community";
  return "other";
}

function getSessionKey(
  row: {
    session_id?: string | null;
    user_id?: string | null;
    anonymous_id?: string | null;
    occurred_at?: string | null;
  },
  index: number
) {
  if (row.session_id) return `session:${row.session_id}`;
  if (row.user_id) return `user:${row.user_id}`;
  if (row.anonymous_id) return `anon:${row.anonymous_id}`;
  return `row:${index}:${row.occurred_at ?? "unknown"}`;
}

function buildContentIndex(
  blogPosts: any[] | null | undefined,
  recipes: any[] | null | undefined,
  reviews: any[] | null | undefined
) {
  return [
    ...(blogPosts ?? []).map(
      (post): ContentIndexEntry => ({
        id: post.id,
        type: "blog_post",
        source: post.source,
        title: post.title,
        slug: post.slug,
        path: `/blog/${post.slug}`
      })
    ),
    ...(recipes ?? []).map(
      (recipe): ContentIndexEntry => ({
        id: recipe.id,
        type: "recipe",
        source: recipe.source,
        title: recipe.title,
        slug: recipe.slug,
        path: `/recipes/${recipe.slug}`
      })
    ),
    ...(reviews ?? []).map(
      (review): ContentIndexEntry => ({
        id: review.id,
        type: "review",
        source: review.source,
        title: review.title,
        slug: review.slug,
        path: `/reviews/${review.slug}`
      })
    )
  ];
}

async function getPublishedContentIndex(supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>) {
  const [blogPosts, recipes, reviews] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("id, source, title, slug")
      .eq("status", "published"),
    supabase
      .from("recipes")
      .select("id, source, title, slug")
      .eq("status", "published"),
    supabase
      .from("reviews")
      .select("id, source, title, slug")
      .eq("status", "published")
  ]);

  return buildContentIndex(blogPosts.data, recipes.data, reviews.data);
}

export async function getAffiliateAnalytics(windowDays = 30) {
  if (!flags.hasSupabaseAdmin) {
    return {
      windowDays,
      totals: {
        clicks: 0,
        partners: 0,
        estimatedRevenue: formatCurrency(0)
      },
      partners: [],
      topProducts: [],
      topSourcePages: [],
      topPositions: []
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      windowDays,
      totals: {
        clicks: 0,
        partners: 0,
        estimatedRevenue: formatCurrency(0)
      },
      partners: [],
      topProducts: [],
      topSourcePages: [],
      topPositions: []
    };
  }

  const { data } = await supabase
    .from("affiliate_clicks")
    .select("partner, product, source_page, position, clicked_at")
    .gte("clicked_at", isoDaysAgo(windowDays));

  if (!data?.length) {
    return {
      windowDays,
      totals: {
        clicks: 0,
        partners: 0,
        estimatedRevenue: formatCurrency(0)
      },
      partners: [],
      topProducts: [],
      topSourcePages: [],
      topPositions: []
    };
  }

  const totalClicks = data.length;
  const byPartner = new Map<string, { clicks: number; products: Map<string, number> }>();
  const productCounts = new Map<string, { partner: string; product: string; clicks: number }>();
  const sourcePageCounts = new Map<string, number>();
  const positionCounts = new Map<string, number>();
  let estimatedRevenueValue = 0;

  for (const row of data) {
    const group = byPartner.get(row.partner) ?? {
      clicks: 0,
      products: new Map<string, number>()
    };

    group.clicks += 1;
    estimatedRevenueValue += PARTNER_EPC[row.partner] ?? 1.5;

    if (row.product) {
      group.products.set(row.product, (group.products.get(row.product) ?? 0) + 1);
      const productKey = `${row.partner}::${row.product}`;
      const productGroup = productCounts.get(productKey) ?? {
        partner: row.partner,
        product: row.product,
        clicks: 0
      };
      productGroup.clicks += 1;
      productCounts.set(productKey, productGroup);
    }

    if (row.source_page) {
      sourcePageCounts.set(row.source_page, (sourcePageCounts.get(row.source_page) ?? 0) + 1);
    }

    if (row.position) {
      positionCounts.set(row.position, (positionCounts.get(row.position) ?? 0) + 1);
    }

    byPartner.set(row.partner, group);
  }

  return {
    windowDays,
    totals: {
      clicks: totalClicks,
      partners: byPartner.size,
      estimatedRevenue: formatCurrency(estimatedRevenueValue)
    },
    partners: Array.from(byPartner.entries())
      .map(([partner, group]) => ({
        partner,
        clicks: group.clicks,
        clickShare: formatPercent((group.clicks / totalClicks) * 100),
        estimatedRevenue: formatCurrency(group.clicks * (PARTNER_EPC[partner] ?? 1.5)),
        topProduct:
          Array.from(group.products.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ??
          "Mixed catalog"
      }))
      .sort((left, right) => right.clicks - left.clicks),
    topProducts: Array.from(productCounts.values())
      .sort((left, right) => right.clicks - left.clicks)
      .slice(0, 10),
    topSourcePages: Array.from(sourcePageCounts.entries())
      .map(([path, clicks]) => ({ path, clicks }))
      .sort((left, right) => right.clicks - left.clicks)
      .slice(0, 8),
    topPositions: Array.from(positionCounts.entries())
      .map(([position, clicks]) => ({ position, clicks }))
      .sort((left, right) => right.clicks - left.clicks)
      .slice(0, 8)
  };
}

export async function getAffiliateRegistryHealth(windowDays = 30) {
  const registry = getAffiliateRegistry();
  const baseEntries = registry.map((entry) => ({
    key: entry.key,
    partner: entry.partner,
    product: entry.product,
    monetizationLabel: entry.monetizationLabel,
    destinationUrl: buildAffiliateDestinationUrl(entry),
    destinationKind: getAffiliateDestinationKind(entry),
    exactAmazonProduct: isExactAmazonProductDestination(entry),
    clicks: 0,
    lastClickedAt: null as string | null,
    topSourcePage: null as string | null
  }));

  if (!flags.hasSupabaseAdmin) {
    const topRisks = baseEntries
      .filter((entry) => !entry.exactAmazonProduct)
      .slice(0, 8);

    return {
      windowDays,
      totals: {
        catalogSize: baseEntries.length,
        exactAmazonProducts: baseEntries.filter((entry) => entry.exactAmazonProduct).length,
        searchFallbacks: baseEntries.filter((entry) => entry.destinationKind === "amazon_search")
          .length,
        clickedSearchFallbacks: 0
      },
      topRisks,
      entries: baseEntries
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    const topRisks = baseEntries
      .filter((entry) => !entry.exactAmazonProduct)
      .slice(0, 8);

    return {
      windowDays,
      totals: {
        catalogSize: baseEntries.length,
        exactAmazonProducts: baseEntries.filter((entry) => entry.exactAmazonProduct).length,
        searchFallbacks: baseEntries.filter((entry) => entry.destinationKind === "amazon_search")
          .length,
        clickedSearchFallbacks: 0
      },
      topRisks,
      entries: baseEntries
    };
  }

  const { data } = await supabase
    .from("affiliate_clicks")
    .select("partner, product, source_page, clicked_at")
    .gte("clicked_at", isoDaysAgo(windowDays));

  const clickCounts = new Map<string, number>();
  const lastClicked = new Map<string, string>();
  const sourcePageCounts = new Map<string, Map<string, number>>();

  for (const row of data ?? []) {
    const key = `${row.partner}::${row.product}`;
    clickCounts.set(key, (clickCounts.get(key) ?? 0) + 1);

    if (row.clicked_at) {
      const current = lastClicked.get(key);
      if (!current || new Date(row.clicked_at).getTime() > new Date(current).getTime()) {
        lastClicked.set(key, row.clicked_at);
      }
    }

    if (row.source_page) {
      const pageCounts = sourcePageCounts.get(key) ?? new Map<string, number>();
      pageCounts.set(row.source_page, (pageCounts.get(row.source_page) ?? 0) + 1);
      sourcePageCounts.set(key, pageCounts);
    }
  }

  const entries = baseEntries
    .map((entry) => {
      const metricKey = `${entry.partner}::${entry.product}`;
      const pageCounts = sourcePageCounts.get(metricKey);
      const topSourcePage = pageCounts
        ? Array.from(pageCounts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null
        : null;

      return {
        ...entry,
        clicks: clickCounts.get(metricKey) ?? 0,
        lastClickedAt: lastClicked.get(metricKey) ?? null,
        topSourcePage
      };
    })
    .sort((left, right) => {
      if (Number(left.exactAmazonProduct) !== Number(right.exactAmazonProduct)) {
        return Number(right.exactAmazonProduct) - Number(left.exactAmazonProduct);
      }

      if (right.clicks !== left.clicks) {
        return right.clicks - left.clicks;
      }

      return left.product.localeCompare(right.product);
    });

  const topRisks = entries
    .filter((entry) => !entry.exactAmazonProduct)
    .sort((left, right) => {
      if (right.clicks !== left.clicks) {
        return right.clicks - left.clicks;
      }

      return left.product.localeCompare(right.product);
    })
    .slice(0, 8);

  return {
    windowDays,
    totals: {
      catalogSize: entries.length,
      exactAmazonProducts: entries.filter((entry) => entry.exactAmazonProduct).length,
      searchFallbacks: entries.filter((entry) => entry.destinationKind === "amazon_search").length,
      clickedSearchFallbacks: entries.filter(
        (entry) => entry.destinationKind === "amazon_search" && entry.clicks > 0
      ).length
    },
    topRisks,
    entries
  };
}

export async function getContentAnalytics(windowDays = 30) {
  const emptyState = {
    windowDays,
    totals: {
      trackedItems: 0,
      views: 0,
      saves: 0,
      ratings: 0,
      comments: 0
    },
    groups: [] as Array<{
      source: string;
      count: number;
      avgViews: number;
      avgSaves: number;
      avgRatings: number;
      avgComments: number;
    }>,
    topContent: [] as Array<{
      label: string;
      path: string;
      source: string;
      views: number;
      saves: number;
      ratings: number;
      comments: number;
      interactions: number;
    }>
  };

  if (!flags.hasSupabaseAdmin) {
    return emptyState;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return emptyState;
  }

  const contentIndex = await getPublishedContentIndex(supabase);
  if (!contentIndex.length) {
    return emptyState;
  }

  const cutoff = isoDaysAgo(windowDays);
  const [pageViewsResult, recipeSavesResult, recipeRatingsResult, commentsResult] = await Promise.all([
    supabase
      .from("telemetry_events")
      .select("path")
      .eq("event_name", "page_view")
      .gte("occurred_at", cutoff),
    supabase
      .from("recipe_saves")
      .select("recipe_id")
      .gte("saved_at", cutoff),
    supabase
      .from("recipe_ratings")
      .select("recipe_id")
      .gte("created_at", cutoff),
    supabase
      .from("comments")
      .select("content_type, content_id")
      .gte("created_at", cutoff)
  ]);

  const contentByPath = new Map(contentIndex.map((entry) => [entry.path, entry]));
  const pageViewCounts = new Map<string, number>();
  const recipeSaveCounts = new Map<number, number>();
  const recipeRatingCounts = new Map<number, number>();
  const commentCounts = new Map<string, number>();

  for (const row of pageViewsResult.data ?? []) {
    const path = row.path ?? "";
    if (!contentByPath.has(path)) continue;
    pageViewCounts.set(path, (pageViewCounts.get(path) ?? 0) + 1);
  }

  for (const row of recipeSavesResult.data ?? []) {
    recipeSaveCounts.set(row.recipe_id, (recipeSaveCounts.get(row.recipe_id) ?? 0) + 1);
  }

  for (const row of recipeRatingsResult.data ?? []) {
    recipeRatingCounts.set(row.recipe_id, (recipeRatingCounts.get(row.recipe_id) ?? 0) + 1);
  }

  for (const row of commentsResult.data ?? []) {
    const key = `${row.content_type}:${row.content_id}`;
    commentCounts.set(key, (commentCounts.get(key) ?? 0) + 1);
  }

  const observedContent = contentIndex
    .map((entry) => {
      const views = pageViewCounts.get(entry.path) ?? 0;
      const saves = entry.type === "recipe" ? recipeSaveCounts.get(entry.id) ?? 0 : 0;
      const ratings = entry.type === "recipe" ? recipeRatingCounts.get(entry.id) ?? 0 : 0;
      const comments = commentCounts.get(`${entry.type}:${entry.id}`) ?? 0;
      const interactions = saves + ratings + comments;

      return {
        label: entry.title,
        path: entry.path,
        source: entry.source,
        views,
        saves,
        ratings,
        comments,
        interactions
      };
    })
    .filter((entry) => entry.views > 0 || entry.interactions > 0);

  if (!observedContent.length) {
    return emptyState;
  }

  const groups = Array.from(
    observedContent.reduce((map, entry) => {
      const bucket = map.get(entry.source) ?? [];
      bucket.push(entry);
      map.set(entry.source, bucket);
      return map;
    }, new Map<string, typeof observedContent>())
  )
    .map(([source, items]) => ({
      source,
      count: items.length,
      avgViews: Math.round(average(items.map((item) => item.views))),
      avgSaves: Math.round(average(items.map((item) => item.saves))),
      avgRatings: Math.round(average(items.map((item) => item.ratings))),
      avgComments: Math.round(average(items.map((item) => item.comments)))
    }))
    .sort((left, right) => right.avgViews - left.avgViews);

  return {
    windowDays,
    totals: {
      trackedItems: observedContent.length,
      views: observedContent.reduce((sum, entry) => sum + entry.views, 0),
      saves: observedContent.reduce((sum, entry) => sum + entry.saves, 0),
      ratings: observedContent.reduce((sum, entry) => sum + entry.ratings, 0),
      comments: observedContent.reduce((sum, entry) => sum + entry.comments, 0)
    },
    groups,
    topContent: [...observedContent]
      .sort(
        (left, right) =>
          right.views - left.views || right.interactions - left.interactions
      )
      .slice(0, 8)
  };
}

export async function getTrafficAnalytics(windowDays = 30) {
  const emptyState = {
    windowDays,
    totalViews: 0,
    totalSessions: 0,
    uniquePages: 0,
    bySection: [] as Array<{ section: string; views: number }>,
    topSources: [] as Array<{ source: string; sessions: number }>,
    topPages: [] as Array<{ label: string; path: string; section: string; views: number }>
  };

  if (!flags.hasSupabaseAdmin) {
    return emptyState;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return emptyState;
  }

  const [pageViewsResult, contentIndex] = await Promise.all([
    supabase
      .from("telemetry_events")
      .select("path, session_id, anonymous_id, user_id, occurred_at, utm_source, referrer")
      .eq("event_name", "page_view")
      .gte("occurred_at", isoDaysAgo(windowDays)),
    getPublishedContentIndex(supabase)
  ]);

  const rows = (pageViewsResult.data ?? []).filter(
    (row) =>
      row.path &&
      !row.path.startsWith("/admin") &&
      !row.path.startsWith("/api")
  );

  if (!rows.length) {
    return emptyState;
  }

  const pathCounts = new Map<string, number>();
  const sectionCounts = new Map<string, number>();
  const sessions = new Set<string>();
  const sessionFirstTouches = new Map<
    string,
    {
      utm_source?: string | null;
      referrer?: string | null;
    }
  >();
  const contentByPath = new Map(contentIndex.map((entry) => [entry.path, entry]));

  rows.forEach((row, index) => {
    const path = row.path ?? "/";
    pathCounts.set(path, (pathCounts.get(path) ?? 0) + 1);

    const section = getTrafficSection(path);
    sectionCounts.set(section, (sectionCounts.get(section) ?? 0) + 1);

    const sessionKey = getSessionKey(row, index);
    sessions.add(sessionKey);

    if (!sessionFirstTouches.has(sessionKey)) {
      sessionFirstTouches.set(sessionKey, row);
    }
  });

  const sourceCounts = new Map<string, number>();
  sessionFirstTouches.forEach((row) => {
    const source = classifyAcquisitionSource({
      utmSource: row.utm_source ?? null,
      referrer: row.referrer ?? null
    });
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
  });

  return {
    windowDays,
    totalViews: rows.length,
    totalSessions: sessions.size,
    uniquePages: pathCounts.size,
    bySection: Array.from(sectionCounts.entries())
      .map(([section, views]) => ({ section, views }))
      .sort((left, right) => right.views - left.views)
      .slice(0, 8),
    topSources: Array.from(sourceCounts.entries())
      .map(([source, sessions]) => ({ source, sessions }))
      .sort((left, right) => right.sessions - left.sessions)
      .slice(0, 8),
    topPages: Array.from(pathCounts.entries())
      .map(([path, views]) => ({
        label: contentByPath.get(path)?.title ?? formatPathLabel(path),
        path,
        section: getTrafficSection(path),
        views
      }))
      .sort((left, right) => right.views - left.views)
      .slice(0, 10)
  };
}

export async function getShareAnalytics(windowDays = 30) {
  if (!flags.hasSupabaseAdmin) {
    return buildShareAnalytics([], windowDays);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return buildShareAnalytics([], windowDays);
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
  if (!flags.hasSupabaseAdmin) {
    return buildSearchAnalyticsFromRows([]);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return buildSearchAnalyticsFromRows([]);
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

export async function getAdAnalytics(windowDays = 30) {
  if (!flags.hasSupabaseAdmin) {
    return buildAdAnalyticsFromRows([]);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return buildAdAnalyticsFromRows([]);
  }

  const { data } = await supabase
    .from("telemetry_events")
    .select("occurred_at, path, metadata")
    .eq("event_name", "ad_slot_rendered")
    .gte("occurred_at", isoDaysAgo(windowDays))
    .order("occurred_at", { ascending: false });

  return buildAdAnalyticsFromRows(data ?? []);
}

function buildAdAnalyticsFromRows(
  rows: Array<{
    occurred_at: string;
    path?: string | null;
    metadata?: Record<string, unknown> | null;
  }>
) {
  const slotCounts = new Map<string, number>();
  const placementCounts = new Map<string, number>();
  const pathCounts = new Map<string, number>();

  for (const row of rows) {
    const slotName = String(row.metadata?.slotName || "unknown_slot");
    const placement = String(row.metadata?.placement || "unknown");
    const path = row.path || "/";

    slotCounts.set(slotName, (slotCounts.get(slotName) ?? 0) + 1);
    placementCounts.set(placement, (placementCounts.get(placement) ?? 0) + 1);
    pathCounts.set(path, (pathCounts.get(path) ?? 0) + 1);
  }

  return {
    totalImpressions: rows.length,
    uniqueSlots: slotCounts.size,
    uniquePages: pathCounts.size,
    topSlots: Array.from(slotCounts.entries())
      .map(([slotName, count]) => ({ slotName, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 6),
    topPlacements: Array.from(placementCounts.entries())
      .map(([placement, count]) => ({ placement, count }))
      .sort((left, right) => right.count - left.count),
    topPages: Array.from(pathCounts.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 8)
  };
}
