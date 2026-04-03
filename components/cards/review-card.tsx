import { ContentCard } from "@/components/cards/content-card";
import type { Review } from "@/lib/types";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <ContentCard
      href={`/reviews/${review.slug}`}
      image={review.imageUrl}
      imageAlt={review.imageAlt}
      eyebrow={`${review.brand} · ${review.category}`}
      title={review.title}
      description={`${review.description} Rated ${review.rating.toFixed(1)}/5.`}
      meta={review.publishedAt}
    />
  );
}
