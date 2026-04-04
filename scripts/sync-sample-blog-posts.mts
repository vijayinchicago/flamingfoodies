import { createClient } from "@supabase/supabase-js";

import sampleDataModule from "../lib/sample-data/index.ts";
import type { BlogPost } from "../lib/types.ts";

const { sampleBlogPosts } = sampleDataModule;

function calculateReadTime(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function mapBlogPostForUpsert(post: BlogPost) {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    content: post.content,
    author_name: post.authorName,
    category: post.category,
    tags: post.tags,
    image_url: post.imageUrl ?? null,
    image_alt: post.imageAlt ?? null,
    featured: post.featured ?? false,
    source: post.source,
    status: post.status,
    seo_title: post.seoTitle ?? post.title.slice(0, 60),
    seo_description: post.seoDescription ?? post.description.slice(0, 160),
    cuisine_type: post.cuisineType ?? null,
    heat_level: post.heatLevel ?? null,
    scoville_rating: post.scovilleRating ?? null,
    read_time_minutes: post.readTimeMinutes ?? calculateReadTime(post.content),
    view_count: post.viewCount,
    like_count: post.likeCount,
    published_at: post.publishedAt ?? null
  };
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY before running this script.");
}

const requestedSlugs = process.argv.slice(2);
const posts =
  requestedSlugs.length > 0
    ? sampleBlogPosts.filter((post) => requestedSlugs.includes(post.slug))
    : sampleBlogPosts;

if (!posts.length) {
  throw new Error("No sample blog posts matched the requested slugs.");
}

const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const { data, error } = await supabase
  .from("blog_posts")
  .upsert(posts.map(mapBlogPostForUpsert), { onConflict: "slug" })
  .select("slug");

if (error) {
  throw error;
}

console.log(`Synced ${data?.length ?? posts.length} blog posts:`);
for (const post of posts) {
  console.log(`- ${post.slug}`);
}
