import type { Review } from "@/lib/types";

export function ReviewSchema({ review }: { review: Review }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Review",
    name: review.title,
    reviewBody: review.description,
    itemReviewed: {
      "@type": "Product",
      name: review.productName,
      brand: review.brand
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5
    },
    author: {
      "@type": "Organization",
      name: "FlamingFoodies"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
