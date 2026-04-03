import { AFFILIATE_LINKS } from "@/lib/affiliates";
import { flags } from "@/lib/env";
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

export async function getAffiliateAnalytics() {
  if (!flags.hasSupabaseAdmin) {
    return getFallbackAffiliateAnalytics();
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return getFallbackAffiliateAnalytics();
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

  const contentRows = fallbackContent;

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

  const pages = fallbackPages;

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
