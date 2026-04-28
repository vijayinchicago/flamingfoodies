import type { Review } from "@/lib/types";
import { buildAuthorStructuredData } from "@/lib/authors";
import { getReviewHeroFields } from "@/lib/review-hero";

export function ReviewSchema({ review }: { review: Review }) {
  const hero = getReviewHeroFields(review);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Review",
    name: review.title,
    reviewBody: review.description,
    itemReviewed: {
      "@type": "Product",
      name: review.productName,
      brand: review.brand,
      image: hero.imageUrl,
      offers: {
        "@type": "Offer",
        url: review.affiliateUrl,
        availability: "https://schema.org/InStock",
        priceCurrency: "USD"
      }
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1
    },
    author: buildAuthorStructuredData(review.authorName)
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
