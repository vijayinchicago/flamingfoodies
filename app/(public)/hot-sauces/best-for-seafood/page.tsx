import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { RecipeCard } from "@/components/cards/recipe-card";
import { ReviewCard } from "@/components/cards/review-card";
import { HotSauceComparisonTable } from "@/components/hot-sauces/hot-sauce-comparison-table";
import { HotSauceFaqSection } from "@/components/hot-sauces/hot-sauce-faq-section";
import { SectionHeading } from "@/components/layout/section-heading";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import { buildHotSauceComparisonRows, getBestForSeafoodReviews } from "@/lib/hot-sauces";
import { getReviewHeroFields } from "@/lib/review-hero";
import { buildMetadata } from "@/lib/seo";
import { getRecipes, getReviews } from "@/lib/services/content";
import type { RecipeFaq } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

const seafoodFaqs: RecipeFaq[] = [
  {
    question: "What kind of hot sauce works best on seafood?",
    answer:
      "Usually bottles with brightness, ginger, citrus, or cleaner pepper notes. They wake up shrimp, fish, and grilled seafood without flattening them."
  },
  {
    question: "Are smoky sauces too heavy for fish?",
    answer:
      "Often yes, especially on lighter seafood. A little smoke can work, but dense, muddy sauces usually bury delicate proteins faster than they help them."
  },
  {
    question: "Can one seafood bottle also work on tacos?",
    answer:
      "Absolutely. Many seafood-friendly bottles are also excellent on fish tacos, shrimp tacos, and rice bowls because they bring the same lift and clarity."
  }
];

export const metadata = buildMetadata({
  title: "Best Hot Sauces for Seafood | FlamingFoodies",
  description:
    "The best hot sauces for seafood: bright, gingery, and fruit-forward bottles that sharpen shrimp, fish, and grilled seafood.",
  path: "/hot-sauces/best-for-seafood"
});

export default async function BestHotSaucesForSeafoodPage() {
  const [reviews, recipes] = await Promise.all([getReviews(), getRecipes()]);
  const seafoodSauces = getBestForSeafoodReviews(reviews, 4);
  const comparisonRows = buildHotSauceComparisonRows(seafoodSauces, "seafood");
  const seafoodRecipes = recipes.filter((recipe) =>
    [recipe.title, recipe.description, recipe.tags.join(" ")].join(" ").toLowerCase().match(/shrimp|seafood|fish|salmon/)
  ).slice(0, 3);

  return (
    <section className="container-shell py-16">
      <ItemListSchema
        name="Best hot sauces for seafood"
        items={seafoodSauces.map((review) => ({
          name: review.title,
          url: absoluteUrl(`/reviews/${review.slug}`),
          image: getReviewHeroFields(review).imageUrl
        }))}
      />
      <SectionHeading
        eyebrow="Hot sauces for seafood"
        title="The bottles that wake up shrimp, fish, and grilled seafood without flattening them."
        copy="Seafood usually wants brightness, citrus, ginger, or cleaner fruit notes. These are the bottles that sharpen the plate instead of crushing it under brute heat."
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-8">
          <p className="eyebrow">What works on seafood</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Lighter proteins want cleaner, brighter heat.
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/72">
            Seafood-friendly bottles tend to lean citrusy, gingery, or fruit-forward. If the sauce tastes muddy or too smoky, it can bury the fish instead of sharpening it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/hot-sauces/best-for-tacos"
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Taco-friendly bottles
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
          <h2 className="mt-3 font-display text-4xl text-cream">Reach for brightness first.</h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-cream/72">
            <li>Use brighter bottles for grilled shrimp, fish tacos, and flaky fish.</li>
            <li>Ginger and citrus usually outperform dense smoke on seafood.</li>
            <li>Save heavy reaper sauces for wings and pizza instead of delicate proteins.</li>
            <li>If the bottle works with lime, herbs, and grill char, it usually belongs in this lane.</li>
          </ul>
        </div>
      </div>

      <div className="mt-12">
        <SectionHeading
          eyebrow="Recommended bottles"
          title="Start with these seafood-friendly picks."
          copy="These are the bottles most likely to lift shrimp, salmon, and grilled fish instead of overpowering them."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {seafoodSauces.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>

      <HotSauceComparisonTable
        eyebrow="Seafood comparison"
        title="Compare the bottles that keep seafood tasting clear."
        copy="This is the quick-buy table for shrimp, fish tacos, grilled fish, and seafood bowls when you want the right kind of lift without overthinking it."
        rows={comparisonRows}
      />

      {seafoodRecipes.length ? (
        <div className="mt-12">
          <SectionHeading
            eyebrow="Cook with them"
            title="Recipes that make the seafood lane actionable."
            copy="These are the fastest next steps if someone lands here from search and wants to use a bottle tonight."
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {seafoodRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </div>
      ) : null}

      <HotSauceFaqSection
        eyebrow="FAQ"
        title="Seafood buying questions worth solving before dinner."
        copy="The most useful seafood sauces tend to be the ones that add brightness and range, not just raw heat."
        faqs={seafoodFaqs}
      />
    </section>
  );
}
