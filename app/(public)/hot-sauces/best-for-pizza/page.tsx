import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { ReviewCard } from "@/components/cards/review-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import { getBestForPizzaReviews } from "@/lib/hot-sauces";
import { getReviewHeroFields } from "@/lib/review-hero";
import { buildMetadata } from "@/lib/seo";
import { getReviews } from "@/lib/services/content";
import { absoluteUrl } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Best Hot Sauces for Pizza | FlamingFoodies",
  description:
    "The best hot sauces for pizza: hot honeys, garlicky bottles, and bigger hitters that actually improve the slice.",
  path: "/hot-sauces/best-for-pizza"
});

export default async function BestHotSaucesForPizzaPage() {
  const reviews = await getReviews();
  const pizzaSauces = getBestForPizzaReviews(reviews, 4);

  return (
    <section className="container-shell py-16">
      <ItemListSchema
        name="Best hot sauces for pizza"
        items={pizzaSauces.map((review) => ({
          name: review.title,
          url: absoluteUrl(`/reviews/${review.slug}`),
          image: getReviewHeroFields(review).imageUrl
        }))}
      />
      <SectionHeading
        eyebrow="Hot sauces for pizza"
        title="The bottles that make pizza more addictive, not just hotter."
        copy="Pizza rewards cling, sweetness, garlic, and controlled aggression. These are the sauces and condiments that improve the slice instead of just dominating it."
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel p-8">
          <p className="eyebrow">What works on pizza</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Rich cheese and crust can handle sweeter and heavier heat.
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/72">
            Pizza is one of the few lanes where hot honey, garlic-heavy heat, and bigger reaper bottles can all make sense, as long as they still taste like something beyond capsaicin.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/hot-sauces/best-for-wings"
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Best for wings
            </Link>
            <Link
              href="/hot-sauces/under-15"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Best bottles under $15
            </Link>
          </div>
        </div>

        <div className="panel p-8">
          <p className="eyebrow">Quick buying rule</p>
          <h2 className="mt-3 font-display text-4xl text-cream">Keep one drizzle and one hammer.</h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-cream/72">
            <li>Hot honey is the easiest pizza upgrade if you want immediate payoff.</li>
            <li>Garlic-reaper style bottles work best in tiny doses on fattier slices.</li>
            <li>Balanced reds and everyday habanero bottles are better on pizza than random novelty sauces.</li>
            <li>The best pizza sauces also work on wings, sandwiches, and fried chicken.</li>
          </ul>
        </div>
      </div>

      <div className="mt-12">
        <SectionHeading
          eyebrow="Pizza-night picks"
          title="Start with these slice-friendly bottles."
          copy="These are the bottles most likely to make pizza night better without turning it into a dare."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {pizzaSauces.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}
