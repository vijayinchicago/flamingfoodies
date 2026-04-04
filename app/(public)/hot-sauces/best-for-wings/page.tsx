import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { RecipeCard } from "@/components/cards/recipe-card";
import { ReviewCard } from "@/components/cards/review-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import { getBestForWingsReviews, getWingFriendlyRecipes } from "@/lib/hot-sauces";
import { getReviewHeroFields } from "@/lib/review-hero";
import { buildMetadata } from "@/lib/seo";
import { getRecipes, getReviews } from "@/lib/services/content";
import { absoluteUrl } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Best Hot Sauces for Wings | FlamingFoodies",
  description:
    "The best hot sauces for wings, pizza, and game-day food: garlicky, clingy bottles and bigger hitters that still taste good.",
  path: "/hot-sauces/best-for-wings"
});

export default async function BestHotSaucesForWingsPage() {
  const [reviews, recipes] = await Promise.all([getReviews(), getRecipes()]);
  const wingSauces = getBestForWingsReviews(reviews, 4);
  const wingRecipes = getWingFriendlyRecipes(recipes, 3);

  return (
    <section className="container-shell py-16">
      <ItemListSchema
        name="Best hot sauces for wings"
        items={wingSauces.map((review) => ({
          name: review.title,
          url: absoluteUrl(`/reviews/${review.slug}`),
          image: getReviewHeroFields(review).imageUrl
        }))}
      />
      <SectionHeading
        eyebrow="Hot sauces for wings"
        title="The bottles that hold up on wings, pizza, and late-night comfort food."
        copy="Wing-friendly bottles need more than heat. They need enough garlic, cling, smoke, or vinegar structure to stay interesting on rich food and not disappear into the fat."
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-8">
          <p className="eyebrow">What works on wings</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Rich food can carry more aggression, but it still needs flavor.
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/72">
            Wings, pizza, and fried chicken can take bolder garlic, thicker texture, and higher heat than tacos or seafood. The trick is picking bottles that still taste distinct after the first hit.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/reviews?filter=big-heat"
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Browse big-heat bottles
            </Link>
            <Link
              href="/hot-sauces/under-15"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Budget-friendly picks
            </Link>
          </div>
        </div>
        <div className="panel p-8">
          <p className="eyebrow">Quick buying rule</p>
          <h2 className="mt-3 font-display text-4xl text-cream">Pick cling, garlic, or smoke.</h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-cream/72">
            <li>Garlic-forward sauces overperform on wings, pizza, and cheesy food.</li>
            <li>Thicker sauces cling better when you want a real coating instead of a drizzle.</li>
            <li>One reaper-level bottle is enough; most shelves do better with a single heavy hitter.</li>
            <li>Keep a balanced wing sauce and a brighter everyday bottle instead of three novelty superhots.</li>
          </ul>
        </div>
      </div>

      <div className="mt-12">
        <SectionHeading
          eyebrow="Recommended bottles"
          title="Start with these wing-night winners."
          copy="These picks either cling well, cut through richer food, or hit hard without turning one-dimensional."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {wingSauces.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>

      <div className="mt-12">
        <SectionHeading
          eyebrow="Use them tonight"
          title="Recipes that make the wing-night lane useful right away."
          copy="If someone lands here from search, the best next move is food that rewards one of these bottles immediately."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {wingRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>
    </section>
  );
}
