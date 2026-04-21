import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { ReviewCard } from "@/components/cards/review-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import { resolveAffiliateLink } from "@/lib/affiliates";
import { getGiftableHotSauceReviewsUnderPrice } from "@/lib/hot-sauces";
import { getReviewHeroFields } from "@/lib/review-hero";
import { buildMetadata } from "@/lib/seo";
import { getReviews } from "@/lib/services/content";
import { absoluteUrl } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Best Hot Sauce Gifts Under $50 | FlamingFoodies",
  description:
    "The best hot sauce gifts under $50: curated gift sets, subscriptions, and shelf-building picks that still feel thoughtful.",
  path: "/hot-sauces/gifts-under-50"
});

export default async function HotSauceGiftsUnderFiftyPage() {
  const reviews = await getReviews();
  const giftable = getGiftableHotSauceReviewsUnderPrice(reviews, 50, 4);
  const sourcePage = "/hot-sauces/gifts-under-50";
  const resolvedGiftBox = resolveAffiliateLink("amazon-hot-sauce-gift-box", {
    sourcePage,
    position: "gifts-under-50-direct"
  });

  return (
    <section className="container-shell py-16">
      <ItemListSchema
        name="Best hot sauce gifts under $50"
        items={giftable.map((review) => ({
          name: review.title,
          url: absoluteUrl(`/reviews/${review.slug}`),
          image: getReviewHeroFields(review).imageUrl
        }))}
      />
      <SectionHeading
        eyebrow="Gifts under $50"
        title="Thoughtful hot sauce gifts that don’t need a big budget."
        copy="Under $50 is enough room for a real gift if you choose a curated lineup, a subscription starter, or a shelf-builder that feels intentional instead of random."
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel p-8">
          <p className="eyebrow">What wins in this range</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Curated beats novelty almost every time.
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/72">
            At this price point, you want something that looks like a real recommendation: a tasting set, a Hot Ones-style lineup, or a recurring box that feels like discovery instead of a prank.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/hot-sauces/best-gift-sets"
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Browse all gift picks
            </Link>
            <Link
              href="/subscriptions"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              See subscriptions
            </Link>
          </div>
        </div>

        <div className="panel p-8">
          <p className="eyebrow">Gift buying rule</p>
          <h2 className="mt-3 font-display text-4xl text-cream">Give range, not just raw heat.</h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-cream/72">
            <li>One curated flight is usually a better gift than a single extreme bottle.</li>
            <li>Subscriptions are strongest for people who already talk about sauces all year.</li>
            <li>Giftability improves fast when the packaging and selection feel editorial instead of algorithmic.</li>
            <li>Under $50 is the sweet spot for host gifts, birthdays, and first-time chili-head presents.</li>
          </ul>
        </div>
      </div>

      <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-ember">Not sure about their heat tolerance?</p>
        <p className="mt-2 text-sm leading-7 text-cream/75">
          Take our 2-minute quiz to get a personalized recommendation matched to how spicy they usually eat.
        </p>
        <Link
          href="/quiz"
          className="mt-4 inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-cream"
        >
          Take the heat tolerance quiz →
        </Link>
      </div>

      {resolvedGiftBox ? (
        <div className="mt-10 panel p-6">
          <p className="eyebrow">Quick gift — ships Prime</p>
          <h2 className="mt-3 font-display text-3xl text-cream">Hot Sauce Gift Box — $25–45</h2>
          <p className="mt-3 text-sm leading-7 text-cream/72">
            A curated multi-bottle set that lands under budget and arrives ready to give. No wrapping gymnastics required.
          </p>
          <AffiliateLink
            href={resolvedGiftBox.href}
            partnerKey={resolvedGiftBox.key}
            trackingMode={resolvedGiftBox.trackingMode}
            sourcePage={sourcePage}
            position="gifts-under-50-direct"
            className="mt-5 inline-flex rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 text-sm font-semibold text-white"
          >
            Check price on Amazon
          </AffiliateLink>
        </div>
      ) : null}

      <div className="mt-12">
        <SectionHeading
          eyebrow="Giftable picks"
          title="These are the cleanest wins under $50."
          copy="Start here for holiday gifts, thank-you presents, or the easiest upgrade from random marketplace bundles."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {giftable.map((review) => (
            <div key={review.id}>
              <ReviewCard review={review} />
              <div className="mt-3 pl-1">
                <AffiliateLink
                  href={review.affiliateUrl}
                  partnerName={review.brand}
                  productName={review.productName}
                  sourcePage={sourcePage}
                  position="gifts-under-50-card"
                  className="inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                >
                  Check price on Amazon
                </AffiliateLink>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
