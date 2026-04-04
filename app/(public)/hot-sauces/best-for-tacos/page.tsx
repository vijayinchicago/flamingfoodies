import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { RecipeCard } from "@/components/cards/recipe-card";
import { ReviewCard } from "@/components/cards/review-card";
import { HotSauceComparisonTable } from "@/components/hot-sauces/hot-sauce-comparison-table";
import { HotSauceFaqSection } from "@/components/hot-sauces/hot-sauce-faq-section";
import { SectionHeading } from "@/components/layout/section-heading";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import {
  buildHotSauceComparisonRows,
  getBestForTacosReviews,
  getTacoFriendlyRecipes
} from "@/lib/hot-sauces";
import { getReviewHeroFields } from "@/lib/review-hero";
import { buildMetadata } from "@/lib/seo";
import { getRecipes, getReviews } from "@/lib/services/content";
import type { RecipeFaq } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

const tacoFaqs: RecipeFaq[] = [
  {
    question: "What heat level works best on tacos?",
    answer:
      "Usually medium to hot. Tacos tend to benefit more from brightness and spoonability than from max-heat bottles that overpower fillings and salsa."
  },
  {
    question: "Should taco hot sauce be smoky or citrusy?",
    answer:
      "It depends on the taco. Beef and birria like smoky depth, while fish, shrimp, and breakfast tacos usually benefit more from citrus or cleaner pepper lift."
  },
  {
    question: "Do I need a separate bottle for fish tacos?",
    answer:
      "Not always, but seafood-friendly sauces often pull double duty on fish tacos better than garlic-heavy wing sauces do."
  }
];

export const metadata = buildMetadata({
  title: "Best Hot Sauces for Tacos | FlamingFoodies",
  description:
    "The best hot sauces for tacos: bright, spoonable bottles that lift carne asada, breakfast tacos, birria, and weeknight taco bowls.",
  path: "/hot-sauces/best-for-tacos"
});

export default async function BestHotSaucesForTacosPage() {
  const [reviews, recipes] = await Promise.all([getReviews(), getRecipes()]);
  const tacoSauces = getBestForTacosReviews(reviews, 4);
  const tacoRecipes = getTacoFriendlyRecipes(recipes, 3);
  const comparisonRows = buildHotSauceComparisonRows(tacoSauces, "tacos");

  return (
    <section className="container-shell py-16">
      <ItemListSchema
        name="Best hot sauces for tacos"
        items={tacoSauces.map((review) => ({
          name: review.title,
          url: absoluteUrl(`/reviews/${review.slug}`),
          image: getReviewHeroFields(review).imageUrl
        }))}
      />
      <SectionHeading
        eyebrow="Hot sauces for tacos"
        title="The bottles that make taco night better instead of louder."
        copy="For tacos, the best hot sauce usually adds lift, acid, and a clear pepper identity. These are the bottles we’d reach for first with birria, breakfast tacos, fish tacos, or weeknight taco bowls."
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-8">
          <p className="eyebrow">What works on tacos</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Bright heat beats brute force most of the time.
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/72">
            Taco-friendly bottles usually have one of three things: citrus lift, a spoonable
            everyday texture, or enough smoky depth to support grilled meat without turning the
            whole bite muddy. That is why Yellowbird, Los Calientes-style reds, and balanced
            habanero sauces tend to work better than novelty superhots.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/reviews?filter=everyday"
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Browse everyday bottles
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
          <p className="eyebrow">Quick buying rule</p>
          <h2 className="mt-3 font-display text-4xl text-cream">Match the taco, not the ego.</h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-cream/72">
            <li>Birria and beef tacos want brightness or smoky tomato depth.</li>
            <li>Fish and shrimp tacos want citrus, ginger, or cleaner fruit notes.</li>
            <li>Breakfast tacos want an easy everyday pour, not a punishment sauce.</li>
            <li>Save the reaper bottles for wings, pizza, or tiny-dose cooking.</li>
          </ul>
        </div>
      </div>

      <div className="mt-12">
        <SectionHeading
          eyebrow="Recommended bottles"
          title="Start with these taco-night winners."
          copy="Each pick here earns its spot because it helps tacos taste clearer, brighter, or deeper."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {tacoSauces.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>

      <HotSauceComparisonTable
        eyebrow="Taco-night comparison"
        title="Compare the taco shelf fast."
        copy="If you are stuck between two bottles, this is the quick answer on heat, flavor lane, and the kind of taco each bottle helps most."
        rows={comparisonRows}
      />

      <div className="mt-12">
        <SectionHeading
          eyebrow="Cook with them"
          title="Recipes that make these bottles easy to use right away."
          copy="If someone lands here from search, the best next step is a recipe that helps them put the sauce to work."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {tacoRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>

      <HotSauceFaqSection
        eyebrow="FAQ"
        title="Taco-night questions worth answering before you buy."
        copy="The best taco bottle is usually the one that solves the meal you actually cook most, not the one with the scariest label."
        faqs={tacoFaqs}
      />
    </section>
  );
}
