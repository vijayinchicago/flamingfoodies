import Link from "next/link";

import { AdSlot } from "@/components/ads/ad-slot";
import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { ShareBar } from "@/components/content/share-bar";
import { ReviewCard } from "@/components/cards/review-card";
import { HotSauceComparisonTable } from "@/components/hot-sauces/hot-sauce-comparison-table";
import { HotSauceFaqSection } from "@/components/hot-sauces/hot-sauce-faq-section";
import { SectionHeading } from "@/components/layout/section-heading";
import { FaqSchema } from "@/components/schema/faq-schema";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import {
  buildHotSauceComparisonRows,
  getBestHotSaucesReviews,
  getFilteredHotSauceReviews
} from "@/lib/hot-sauces";
import { getReviewHeroFields } from "@/lib/review-hero";
import { getAdRuntimeConfig } from "@/lib/ads";
import { buildMetadata } from "@/lib/seo";
import { getReviews } from "@/lib/services/content";
import type { RecipeFaq } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

const bestHotSaucesFaqs: RecipeFaq[] = [
  {
    question: "What hot sauce should a beginner buy first?",
    answer:
      "Start with one everyday bottle you can pour generously, one brighter bottle for tacos or eggs, and only then add a bigger hitter for pizza or wings."
  },
  {
    question: "How many hot sauces should a starter shelf have?",
    answer:
      "Three useful bottles beat six random ones. A balanced shelf usually needs an everyday pour, a bright meal-specific bottle, and one richer-food or higher-heat option."
  },
  {
    question: "Is a more expensive hot sauce always better?",
    answer:
      "Not at all. Price usually matters less than use case. Some of the most useful bottles are affordable everyday sauces that simply fit more meals."
  }
];

export const metadata = buildMetadata({
  title: "Best Hot Sauces | FlamingFoodies",
  description:
    "The best hot sauces to buy right now, from everyday bottles and taco-night favorites to hotter shelf flexes that still taste good.",
  path: "/hot-sauces/best"
});

export default async function BestHotSaucesPage() {
  const [reviews, ads] = await Promise.all([getReviews(), getAdRuntimeConfig()]);
  const bestSauces = getBestHotSaucesReviews(reviews, 6);
  const everyday = getFilteredHotSauceReviews(reviews, "everyday").slice(0, 3);
  const bigHeat = getFilteredHotSauceReviews(reviews, "big-heat").slice(0, 3);
  const comparisonRows = buildHotSauceComparisonRows(bestSauces.slice(0, 4));

  return (
    <section className="container-shell py-16">
      <ItemListSchema
        name="Best hot sauces"
        items={bestSauces.map((review) => ({
          name: review.title,
          url: absoluteUrl(`/reviews/${review.slug}`),
          image: getReviewHeroFields(review).imageUrl
        }))}
      />
      <SectionHeading
        eyebrow="Best hot sauces"
        title="The bottles we would actually tell someone to buy first."
        copy="This page is the short list: bottles with real repeat-use value, not just one-hot-bite novelty. If someone asks what belongs in a first serious hot sauce lineup, start here."
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel p-8">
          <p className="eyebrow">How we choose</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            A good bottle has to survive real weeknight use.
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/72">
            We bias toward bottles that solve more than one meal: tacos, eggs, bowls, roast
            chicken, pizza, dumplings, grilled seafood. That means flavor, texture, and repeat-use
            matter more than heat stunts.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/hot-sauces"
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Visit the hot sauce hub
            </Link>
            <Link
              href="/reviews"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              See all reviews
            </Link>
          </div>
        </div>

        <div className="panel p-8">
          <p className="eyebrow">Starter guide</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Build one balanced fridge shelf first.
          </h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-cream/72">
            <li>Start with one everyday bottle you can pour generously.</li>
            <li>Add one brighter bottle for tacos, seafood, and eggs.</li>
            <li>Keep one higher-heat bottle for wings, pizza, or tiny doses.</li>
            <li>Skip novelty heat until you already know what you like using.</li>
          </ul>
        </div>
      </div>

      <div className="mt-12">
        <SectionHeading
          eyebrow="The short list"
          title="Start with these first."
          copy="These are the best overall picks when you want one simple place to begin."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {bestSauces.map((review) => (
            <div key={review.id} className="flex flex-col">
              <ReviewCard review={review} />
              <AffiliateLink
                href={review.affiliateUrl}
                productName={review.productName}
                sourcePage="/hot-sauces/best"
                position="picks-grid"
                className="mt-3 flex items-center justify-center rounded-full bg-ember px-5 py-3 text-sm font-semibold text-charcoal transition hover:bg-ember/90"
              >
                Check price on Amazon
              </AffiliateLink>
            </div>
          ))}
        </div>
      </div>

      <HotSauceComparisonTable
        eyebrow="Compare the short list"
        title="See the tradeoffs before you buy."
        copy="This is the quick read: what each bottle is best for, how hard it hits, and where it shines."
        rows={comparisonRows}
      />

      {ads.manualSlotsEnabled && ads.clientId && ads.slotIds.reviewInline ? (
        <div className="mt-10">
          <AdSlot
            clientId={ads.clientId}
            slotId={ads.slotIds.reviewInline}
            slotName="hot_sauce_best_mid_page"
            placement="mid-page"
          />
        </div>
      ) : null}

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="panel p-6">
          <p className="eyebrow">Everyday winners</p>
          <h2 className="mt-3 font-display text-4xl text-cream">Use these all week.</h2>
          <div className="mt-5 space-y-3 text-sm text-cream/72">
            {everyday.map((review) => (
              <div key={review.slug} className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
                <Link href={`/reviews/${review.slug}`} className="flex-1 hover:text-cream">
                  {review.title}
                </Link>
                <AffiliateLink
                  href={review.affiliateUrl}
                  productName={review.productName}
                  sourcePage="/hot-sauces/best"
                  position="everyday-list"
                  className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-cream hover:bg-white/10"
                >
                  Buy
                </AffiliateLink>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <p className="eyebrow">When you want more fire</p>
          <h2 className="mt-3 font-display text-4xl text-cream">Keep one bigger hitter.</h2>
          <div className="mt-5 space-y-3 text-sm text-cream/72">
            {bigHeat.map((review) => (
              <div key={review.slug} className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
                <Link href={`/reviews/${review.slug}`} className="flex-1 hover:text-cream">
                  {review.title}
                </Link>
                <AffiliateLink
                  href={review.affiliateUrl}
                  productName={review.productName}
                  sourcePage="/hot-sauces/best"
                  position="big-heat-list"
                  className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-cream hover:bg-white/10"
                >
                  Buy
                </AffiliateLink>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FaqSchema faqs={bestHotSaucesFaqs} />
      <HotSauceFaqSection
        eyebrow="FAQ"
        title="What people usually want answered first."
        copy="These are the buying questions people usually ask before choosing a bottle."
        faqs={bestHotSaucesFaqs}
      />

      <ShareBar
        title="Best Hot Sauces — The bottles we would actually tell someone to buy first."
        description="The short list: bottles with real repeat-use value, from everyday pours to bigger hitters that still taste good."
        url={absoluteUrl("/hot-sauces/best")}
        contentType="hot-sauce-list"
        contentId={0}
        contentSlug="best"
        className="mt-12"
      />
    </section>
  );
}
