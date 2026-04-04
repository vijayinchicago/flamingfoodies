import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { ReviewCard } from "@/components/cards/review-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import { getBestForEggsReviews } from "@/lib/hot-sauces";
import { getReviewHeroFields } from "@/lib/review-hero";
import { buildMetadata } from "@/lib/seo";
import { getReviews } from "@/lib/services/content";
import { absoluteUrl } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Best Hot Sauces for Eggs | FlamingFoodies",
  description:
    "The best hot sauces for eggs: bright everyday bottles, chili crisps, and breakfast-friendly heat that works on scramble, fried eggs, and breakfast tacos.",
  path: "/hot-sauces/best-for-eggs"
});

export default async function BestHotSaucesForEggsPage() {
  const reviews = await getReviews();
  const eggSauces = getBestForEggsReviews(reviews, 4);

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
        title="The fastest way to make eggs feel less predictable."
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
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}
