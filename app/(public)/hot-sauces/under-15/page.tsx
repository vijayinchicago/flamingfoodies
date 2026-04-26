import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { ReviewCard } from "@/components/cards/review-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import { getAffordableHotSauceReviews, getFilteredHotSauceReviews } from "@/lib/hot-sauces";
import { getReviewHeroFields } from "@/lib/review-hero";
import { buildMetadata } from "@/lib/seo";
import { getReviews } from "@/lib/services/content";
import { absoluteUrl } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Best Hot Sauces Under $15 | FlamingFoodies",
  description:
    "The best hot sauces under $15: affordable bottles with real flavor, repeat-use value, and enough range to earn fridge space.",
  path: "/hot-sauces/under-15"
});

export default async function HotSaucesUnderFifteenPage() {
  const reviews = await getReviews();
  const affordableSauces = getAffordableHotSauceReviews(reviews, 6);
  const everydaySauces = getFilteredHotSauceReviews(reviews, "everyday").slice(0, 3);

  return (
    <section className="container-shell py-16">
      <ItemListSchema
        name="Best hot sauces under $15"
        items={affordableSauces.map((review) => ({
          name: review.title,
          url: absoluteUrl(`/reviews/${review.slug}`),
          image: getReviewHeroFields(review).imageUrl
        }))}
      />
      <SectionHeading
        eyebrow="Best under $15"
        title="Affordable bottles that still earn fridge space."
        copy="The cheapest shelf is not always the smartest one, but there are enough strong bottles under $15 to build a practical first lineup without overspending."
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel p-8">
          <p className="eyebrow">What to optimize for</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Cheap should still mean useful, not just tolerable.
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/72">
            A good budget bottle should work across more than one meal. If it only makes sense on one challenge-food bite, it is not actually a better buy than a slightly pricier bottle you use all week.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/reviews?sort=price-low"
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Browse price-sorted reviews
            </Link>
            <Link
              href="/shop#under-15"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Shop the under-$15 lane
            </Link>
          </div>
        </div>

        <div className="panel p-8">
          <p className="eyebrow">Budget shelf rule</p>
          <h2 className="mt-3 font-display text-4xl text-cream">Buy one pour, one pantry helper.</h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-cream/72">
            <li>Start with one everyday bottle that covers tacos, eggs, and bowls.</li>
            <li>Add a pantry builder like gochujang or chili crisp before adding a novelty bottle.</li>
            <li>Only chase bigger heat once you know what you are actually using up.</li>
            <li>Cheap is best when it multiplies the recipes you can cook next.</li>
          </ul>
        </div>
      </div>

      <div className="mt-12">
        <SectionHeading
          eyebrow="Budget winners"
          title="These bottles overdeliver for the money."
          copy="Each pick here earns its spot by being useful often, not just being cheap once."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {affordableSauces.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>

      <div className="mt-12">
        <SectionHeading
          eyebrow="Everyday pours"
          title="If you only buy one affordable bottle, start here."
          copy="These are the most likely to earn repeat use across weeknight food."
        />
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {everydaySauces.map((review) => (
            <Link
              key={review.slug}
              href={`/reviews/${review.slug}`}
              className="panel block p-6 hover:border-white/20"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-ember">{review.brand}</p>
              <h3 className="mt-3 font-display text-3xl text-cream">{review.title}</h3>
              <p className="mt-3 text-sm leading-7 text-cream/72">{review.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
