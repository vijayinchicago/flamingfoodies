import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { ShareBar } from "@/components/content/share-bar";
import { ReviewCard } from "@/components/cards/review-card";
import { HotSauceComparisonTable } from "@/components/hot-sauces/hot-sauce-comparison-table";
import { HotSauceFaqSection } from "@/components/hot-sauces/hot-sauce-faq-section";
import { SectionHeading } from "@/components/layout/section-heading";
import { FaqSchema } from "@/components/schema/faq-schema";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import { buildHotSauceComparisonRows, getBestForEggsReviews } from "@/lib/hot-sauces";
import { getReviewHeroFields } from "@/lib/review-hero";
import { buildMetadata } from "@/lib/seo";
import { getReviews } from "@/lib/services/content";
import type { RecipeFaq } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

const eggFaqs: RecipeFaq[] = [
  {
    question: "Is hot sauce or chili crisp better on eggs?",
    answer:
      "They do different jobs. A pourable hot sauce wakes eggs up quickly, while chili crisp adds texture and richness. The best breakfast shelf usually has one of each."
  },
  {
    question: "How hot should a breakfast sauce be?",
    answer:
      "Usually milder than your wing or pizza bottle. Breakfast tends to reward brightness and repeat use more than brute force."
  },
  {
    question: "Can one egg-friendly bottle also work on tacos?",
    answer:
      "Yes. The overlap between eggs and breakfast tacos is real, especially with bright, everyday bottles you can pour generously."
  }
];

export const metadata = buildMetadata({
  title: "Best Hot Sauces for Eggs | FlamingFoodies",
  description:
    "The best hot sauces for eggs: bright everyday bottles, chili crisps, and breakfast-friendly heat that works on scramble, fried eggs, and breakfast tacos.",
  path: "/hot-sauces/best-for-eggs"
});

export default async function BestHotSaucesForEggsPage() {
  const reviews = await getReviews();
  const eggSauces = getBestForEggsReviews(reviews, 4);
  const comparisonRows = buildHotSauceComparisonRows(eggSauces, "eggs");

  return (
    <section className="container-shell py-16">
      <ItemListSchema
        name="Best hot sauces for eggs"
        items={eggSauces.map((review) => ({
          name: review.title,
          url: absoluteUrl(`/reviews/${review.slug}`),
          image: getReviewHeroFields(review).imageUrl
        }))}
      />
      <SectionHeading
        eyebrow="Hot sauces for eggs"
        title="Best Hot Sauces for Eggs — The fastest way to make eggs feel less predictable."
        copy="Egg-friendly heat is usually bright, pourable, or textural. These are the bottles and condiments that do the most work on scrambled eggs, fried eggs, breakfast tacos, and lazy weekend breakfasts."
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel p-8">
          <p className="eyebrow">What works on eggs</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Breakfast wants lift, not punishment.
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/72">
            Eggs do best with sauces you can pour generously, spoon crisps into, or finish with a little sweetness and crunch. This is a lane for everyday bottles, not one-drop stunt sauces.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/hot-sauces/under-15"
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Best bottles under $15
            </Link>
            <Link
              href="/hot-sauces/best-for-tacos"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Best for breakfast tacos
            </Link>
          </div>
        </div>

        <div className="panel p-8">
          <p className="eyebrow">Quick buying rule</p>
          <h2 className="mt-3 font-display text-4xl text-cream">Pick one pour, one topper.</h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-cream/72">
            <li>Keep one pourable bottle for eggs, tacos, and hash.</li>
            <li>Add one textural topper like chili crisp or hot honey for contrast.</li>
            <li>Bright habanero and balanced reds usually beat smoky superhots at breakfast.</li>
            <li>If you can’t use it generously on eggs, it probably should not be your breakfast bottle.</li>
          </ul>
        </div>
      </div>

      <div className="mt-12">
        <SectionHeading
          eyebrow="Breakfast winners"
          title="Start with these eggs-first bottles."
          copy="These picks are the easiest way to make your breakfast shelf feel smarter immediately."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {eggSauces.map((review) => (
            <div key={review.id} className="flex flex-col">
              <ReviewCard review={review} />
              <AffiliateLink
                href={review.affiliateUrl}
                productName={review.productName}
                sourcePage="/hot-sauces/best-for-eggs"
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
        eyebrow="Breakfast comparison"
        title="Pick the right breakfast lane."
        copy="Some bottles are better as generous everyday pours, while others work more like toppers. This table helps you sort that out quickly."
        rows={comparisonRows}
      />

      <FaqSchema faqs={eggFaqs} />
      <HotSauceFaqSection
        eyebrow="FAQ"
        title="Breakfast bottle questions, answered."
        copy="If the goal is better eggs, breakfast tacos, and hash, these are the answers that save the most buying mistakes."
        faqs={eggFaqs}
      />

      <ShareBar
        title="Best Hot Sauces for Eggs"
        description="Bright, tangy bottles that make scrambles, omelets, and breakfast tacos genuinely better."
        url={absoluteUrl("/hot-sauces/best-for-eggs")}
        contentType="hot-sauce-list"
        contentId={0}
        contentSlug="best-for-eggs"
        className="mt-12"
      />
    </section>
  );
}
