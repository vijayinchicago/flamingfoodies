"use client";

import { AffiliateLink } from "@/components/content/affiliate-link";

interface ReviewStickyBuyBarProps {
  productName: string;
  affiliateUrl: string;
  reviewSlug: string;
  reviewId: number;
}

export function ReviewStickyBuyBar({
  productName,
  affiliateUrl,
  reviewSlug,
  reviewId
}: ReviewStickyBuyBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-charcoal/95 px-4 py-3 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
        <p className="truncate text-sm font-semibold text-cream">{productName}</p>
        <AffiliateLink
          href={affiliateUrl}
          productName={productName}
          sourcePage={`/reviews/${reviewSlug}`}
          position="sticky-buy-bar"
          contentType="review"
          contentId={reviewId}
          contentSlug={reviewSlug}
          className="shrink-0 rounded-full bg-gradient-to-r from-flame to-ember px-5 py-2.5 text-sm font-semibold text-white"
        >
          Check price
        </AffiliateLink>
      </div>
    </div>
  );
}
