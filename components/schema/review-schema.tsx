import type { Review } from "@/lib/types";
import { getReviewHeroFields } from "@/lib/review-hero";

export function ReviewSchema({ review }: { review: Review }) {
  const hero = getReviewHeroFields(review);
  const author = review.authorName
    ? {
        "@type": "Person",
        name: review.authorName,
        url: "https://flamingfoodies.com/about"
      }
    : {
        "@type": "Organization",
        name: "FlamingFoodies",
        url: "https://flamingfoodies.com/about"
      };
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
    author
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
