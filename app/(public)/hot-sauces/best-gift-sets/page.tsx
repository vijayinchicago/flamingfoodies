import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { ReviewCard } from "@/components/cards/review-card";
import { HotSauceComparisonTable } from "@/components/hot-sauces/hot-sauce-comparison-table";
import { HotSauceFaqSection } from "@/components/hot-sauces/hot-sauce-faq-section";
import { SectionHeading } from "@/components/layout/section-heading";
import { FaqSchema } from "@/components/schema/faq-schema";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import { buildHotSauceComparisonRows, getBestGiftableHotSauceReviews } from "@/lib/hot-sauces";
import { resolveAffiliateLink } from "@/lib/affiliates";
import { getReviewHeroFields } from "@/lib/review-hero";
import { buildMetadata } from "@/lib/seo";
import { getReviews } from "@/lib/services/content";
import type { RecipeFaq } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

const giftFaqs: RecipeFaq[] = [
  {
    question: "Is a gift set better than one bottle?",
    answer:
      "Usually yes, unless you know exactly what the person already loves. Sets and subscriptions lower the risk and feel more intentionally curated."
  },
  {
    question: "How much should I spend on a hot sauce gift?",
    answer:
      "The sweet spot is usually enough to feel thoughtful without drifting into novelty pricing. Sets and gifts under $50 often hit that balance best."
  },
  {
    question: "Are subscriptions worth giving?",
    answer:
      "They are best for people who already talk about sauces all year. For casual spice lovers, a strong curated set is usually the safer first gift."
  }
];

export const metadata = buildMetadata({
  title: "Best Hot Sauce Gift Sets and Subscriptions | FlamingFoodies",
  description:
    "The best hot sauce gift sets and subscriptions for spice lovers, from tasting kits and Hot Ones-style lineups to recurring discovery boxes.",
  path: "/hot-sauces/best-gift-sets"
});

const GIFT_PICKS = [
  {
    key: "amazon-hot-sauce-gift-box" as const,
    label: "Best value gift box",
    copy: "A curated multi-bottle set — $25–45, ships Prime."
  },
  {
    key: "heatonist-gift-set" as const,
    label: "Curator's choice",
    copy: "Heatonist's hand-picked gift set — from $30."
  },
  {
    key: "heatonist-hot-ones-season-22" as const,
    label: "Hot Ones lineup",
    copy: "The full Season 22 flight — $35+. Perfect for a fan."
  }
];

export default async function BestHotSauceGiftSetsPage() {
  const reviews = await getReviews();
  const giftable = getBestGiftableHotSauceReviews(reviews, 4);
  const comparisonRows = buildHotSauceComparisonRows(giftable, "gifts");
  const sourcePage = "/hot-sauces/best-gift-sets";
  const resolvedGiftPicks = GIFT_PICKS.map((pick) => ({
    ...pick,
    resolved: resolveAffiliateLink(pick.key, { sourcePage, position: "gift-sets-direct" })
  })).filter((p): p is typeof p & { resolved: NonNullable<typeof p.resolved> } => Boolean(p.resolved));

  return (
    <section className="container-shell py-16">
      <ItemListSchema
        name="Best hot sauce gift sets and subscriptions"
        items={giftable.map((review) => ({
          name: review.title,
          url: absoluteUrl(`/reviews/${review.slug}`),
          image: getReviewHeroFields(review).imageUrl
        }))}
      />
      <SectionHeading
        eyebrow="Giftable heat"
        title="The easiest hot sauce gifts to get right."
        copy="If you are buying for a spice fan and do not want to guess at one bottle, start with a tasting set, a subscription, or a curated lineup that feels intentional instead of random."
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel p-8">
          <p className="eyebrow">Why gifts are different</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Buying for someone else means lowering the risk.
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/72">
            A single bottle can miss on heat level, flavor profile, or format. Gift sets and
            subscription boxes win because they feel curated, exploratory, and a lot less likely to
            sit unopened in the pantry.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/subscriptions"
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Browse subscriptions
            </Link>
            <Link
              href="/hot-sauces"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Visit the hot sauce hub
            </Link>
          </div>
        </div>

        <div className="panel p-8">
          <p className="eyebrow">Gift buying rule</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Go broader before you go hotter.
          </h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-cream/72">
            <li>Choose variety before raw heat unless you know their tolerance well.</li>
            <li>Hot Ones-style flights are great for gifting because they feel like an event.</li>
            <li>Subscriptions work best for people who already talk about sauces all year.</li>
            <li>Gift sets beat novelty prank bottles almost every time.</li>
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

      {resolvedGiftPicks.length > 0 ? (
        <div className="mt-12">
          <SectionHeading
            eyebrow="Direct picks"
            title="Shop these gift sets on Amazon now."
            copy="No review needed — these are the safest wins at each price point."
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {resolvedGiftPicks.map((pick) => (
              <div key={pick.key} className="panel p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-ember">{pick.label}</p>
                <p className="mt-2 text-sm leading-6 text-cream/75">{pick.copy}</p>
                <AffiliateLink
                  href={pick.resolved.href}
                  partnerKey={pick.resolved.key}
                  trackingMode={pick.resolved.trackingMode}
                  sourcePage={sourcePage}
                  position="gift-sets-direct"
                  className="mt-4 inline-flex rounded-full bg-gradient-to-r from-flame to-ember px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Check price on Amazon
                </AffiliateLink>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-12">
        <SectionHeading
          eyebrow="Giftable picks"
          title="These are the safest wins for spice lovers."
          copy="Start here for host gifts, birthdays, holidays, or anyone building a better sauce shelf."
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
                  position="gift-sets-card"
                  className="inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                >
                  Check price on Amazon
                </AffiliateLink>
              </div>
            </div>
          ))}
        </div>
      </div>

      <HotSauceComparisonTable
        eyebrow="Gift comparison"
        title="See which gift lane fits the person."
        copy="This is the fast way to separate broad tasting gifts from recurring subscriptions and other lower-risk presents."
        rows={comparisonRows}
      />

      <FaqSchema faqs={giftFaqs} />
      <HotSauceFaqSection
        eyebrow="FAQ"
        title="Gift-buying questions people usually ask too late."
        copy="If you are buying for a spice fan and want the safest win, start with these answers."
        faqs={giftFaqs}
      />
    </section>
  );
}
