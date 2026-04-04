import { createClient } from "@supabase/supabase-js";

import reviewQaModule from "../lib/review-qa.ts";
import sampleDataModule from "../lib/sample-data/index.ts";
import type { Review } from "../lib/types.ts";

const { buildReviewQaReport, getReviewManualReviewState } = reviewQaModule;
const { sampleReviews } = sampleDataModule;

function mapReviewForUpsert(review: Review) {
  const manualReview = getReviewManualReviewState(review);
  const qaReport = buildReviewQaReport({
    ...review,
    imageReviewed: manualReview.imageReviewed,
    factQaReviewed: manualReview.factQaReviewed
  });

  return {
    slug: review.slug,
    title: review.title,
    description: review.description,
    content: review.content,
    product_name: review.productName,
    brand: review.brand,
    rating: review.rating,
    price_usd: review.priceUsd ?? null,
    affiliate_url: review.affiliateUrl,
    image_url: review.imageUrl ?? null,
    image_alt: review.imageAlt ?? null,
    heat_level: review.heatLevel ?? null,
    scoville_min: review.scovilleMin ?? null,
    scoville_max: review.scovilleMax ?? null,
    flavor_notes: review.flavorNotes,
    cuisine_origin: review.cuisineOrigin ?? null,
    category: review.category,
    pros: review.pros,
    cons: review.cons,
    image_reviewed: manualReview.imageReviewed,
    fact_qa_reviewed: manualReview.factQaReviewed,
    qa_notes: manualReview.qaNotes ?? null,
    qa_report: qaReport,
    qa_checked_at:
      manualReview.imageReviewed || manualReview.factQaReviewed
        ? new Date().toISOString()
        : null,
    tags: review.tags,
    recommended: review.recommended,
    featured: review.featured ?? false,
    status: review.status,
    source: review.source,
    seo_title: review.title.slice(0, 60),
    seo_description: review.description.slice(0, 160),
    view_count: review.viewCount,
    published_at: review.publishedAt ?? null
  };
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY before running this script.");
}

const requestedSlugs = process.argv.slice(2);
const reviews =
  requestedSlugs.length > 0
    ? sampleReviews.filter((review) => requestedSlugs.includes(review.slug))
    : sampleReviews;

if (!reviews.length) {
  throw new Error("No sample reviews matched the requested slugs.");
}

const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const { data, error } = await supabase
  .from("reviews")
  .upsert(reviews.map(mapReviewForUpsert), { onConflict: "slug" })
  .select("slug, qa_report");

if (error) {
  throw error;
}

console.log(`Synced ${data?.length ?? reviews.length} reviews:`);
for (const review of reviews) {
  console.log(`- ${review.slug}`);
}
