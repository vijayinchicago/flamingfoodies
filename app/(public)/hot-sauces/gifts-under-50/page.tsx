import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { ReviewCard } from "@/components/cards/review-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { ItemListSchema } from "@/components/schema/item-list-schema";
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

      <div className="mt-12">
        <SectionHeading
          eyebrow="Giftable picks"
          title="These are the cleanest wins under $50."
          copy="Start here for holiday gifts, thank-you presents, or the easiest upgrade from random marketplace bundles."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {giftable.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}
