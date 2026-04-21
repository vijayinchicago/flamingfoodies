import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { ShareBar } from "@/components/content/share-bar";
import { RecipeCard } from "@/components/cards/recipe-card";
import { ReviewCard } from "@/components/cards/review-card";
import { HotSauceComparisonTable } from "@/components/hot-sauces/hot-sauce-comparison-table";
import { HotSauceFaqSection } from "@/components/hot-sauces/hot-sauce-faq-section";
import { SectionHeading } from "@/components/layout/section-heading";
import { FaqSchema } from "@/components/schema/faq-schema";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import { buildHotSauceComparisonRows, getBestForSeafoodReviews } from "@/lib/hot-sauces";
import { getReviewHeroFields } from "@/lib/review-hero";
import { buildMetadata } from "@/lib/seo";
import { getRecipes, getReviews } from "@/lib/services/content";
import {
  getSearchLandingPageOptimization,
  type SearchLandingPageOptimization
} from "@/lib/services/search-insights";
import type { RecipeFaq } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

const seafoodFaqs: RecipeFaq[] = [
  {
    question: "What kind of hot sauce works best on seafood and fish?",
    answer:
      "Usually bottles with brightness, ginger, citrus, or cleaner pepper notes. They wake up shrimp, fish, and grilled seafood without flattening them."
  },
  {
    question: "Are smoky sauces too heavy for fish?",
    answer:
      "Often yes, especially on lighter seafood. A little smoke can work, but dense, muddy sauces usually bury delicate proteins faster than they help them."
  },
  {
    question: "Can you use hot sauce in ceviche?",
    answer:
      "Yes, but go lightly and choose a bright bottle. Ceviche already has acid from citrus, so the sauce should add lift and pepper character instead of muddy sweetness or heavy smoke."
  },
  {
    question: "Can one seafood bottle also work on fish tacos?",
    answer:
      "Absolutely. Many seafood-friendly bottles are also excellent on fish tacos, shrimp tacos, and rice bowls because they bring the same lift and clarity."
  }
];

const defaultSeafoodPageOptimization: SearchLandingPageOptimization = {
  metadataTitle: "Best Hot Sauces for Seafood and Fish | FlamingFoodies",
  metadataDescription:
    "The best hot sauces for seafood, fish tacos, ceviche, and shrimp: bright, gingery bottles that sharpen the plate instead of flattening it.",
  heroEyebrow: "Hot sauces for seafood",
  heroTitle:
    "Best Hot Sauces for Seafood — The bottles that wake up shrimp, fish, and ceviche without flattening them.",
  heroCopy:
    "Seafood usually wants brightness, citrus, ginger, or cleaner fruit notes. These are the bottles that sharpen fish tacos, grilled seafood, and ceviche instead of crushing them under brute heat.",
  faqEyebrow: "FAQ",
  faqTitle: "Seafood buying questions worth solving before dinner.",
  faqCopy:
    "The most useful seafood sauces tend to be the ones that add brightness and range to fish, shellfish, and ceviche, not just raw heat.",
  faqs: seafoodFaqs
};

export async function generateMetadata() {
  const runtimeOptimization = await getSearchLandingPageOptimization("/hot-sauces/best-for-seafood");
  const pageOptimization = {
    ...defaultSeafoodPageOptimization,
    ...runtimeOptimization,
    faqs: runtimeOptimization?.faqs ?? defaultSeafoodPageOptimization.faqs
  };

  return buildMetadata({
    title:
      pageOptimization.metadataTitle || defaultSeafoodPageOptimization.metadataTitle || "FlamingFoodies",
    description:
      pageOptimization.metadataDescription ||
      defaultSeafoodPageOptimization.metadataDescription ||
      "Seafood buying guide.",
    path: "/hot-sauces/best-for-seafood"
  });
}

export default async function BestHotSaucesForSeafoodPage() {
  const [reviews, recipes, runtimeOptimization] = await Promise.all([
    getReviews(),
    getRecipes(),
    getSearchLandingPageOptimization("/hot-sauces/best-for-seafood")
  ]);
  const seafoodSauces = getBestForSeafoodReviews(reviews, 4);
  const comparisonRows = buildHotSauceComparisonRows(seafoodSauces, "seafood");
  const seafoodRecipes = recipes.filter((recipe) =>
    [recipe.title, recipe.description, recipe.tags.join(" ")].join(" ").toLowerCase().match(/shrimp|seafood|fish|salmon/)
  ).slice(0, 3);
  const pageOptimization = {
    ...defaultSeafoodPageOptimization,
    ...runtimeOptimization,
    faqs: runtimeOptimization?.faqs ?? defaultSeafoodPageOptimization.faqs
  };

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
        eyebrow={pageOptimization.heroEyebrow || defaultSeafoodPageOptimization.heroEyebrow || "Hot sauces"}
        title={pageOptimization.heroTitle || defaultSeafoodPageOptimization.heroTitle || "FlamingFoodies"}
        copy={pageOptimization.heroCopy || defaultSeafoodPageOptimization.heroCopy || ""}
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-8">
          <p className="eyebrow">What works on seafood</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Lighter proteins want cleaner, brighter heat.
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/72">
            Seafood-friendly bottles tend to lean citrusy, gingery, or fruit-forward. If the sauce tastes muddy or too smoky, it can bury the fish instead of sharpening it, especially in ceviche or on flaky white fish.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/blog/how-to-choose-a-hot-sauce-for-seafood"
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Seafood buying guide
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
            <li>Use brighter bottles for grilled shrimp, fish tacos, flaky fish, and ceviche.</li>
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
          copy="These are the bottles most likely to lift shrimp, salmon, grilled fish, and ceviche instead of overpowering them."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {seafoodSauces.map((review) => (
            <div key={review.id} className="flex flex-col">
              <ReviewCard review={review} />
              <AffiliateLink
                href={review.affiliateUrl}
                productName={review.productName}
                sourcePage="/hot-sauces/best-for-seafood"
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
        eyebrow="Seafood comparison"
        title="Compare the bottles that keep seafood tasting clear."
        copy="This is the quick-buy table for shrimp, fish tacos, grilled fish, ceviche, and seafood bowls when you want the right kind of lift without overthinking it."
        rows={comparisonRows}
      />

      {seafoodRecipes.length ? (
        <div className="mt-12">
          <SectionHeading
            eyebrow="Cook with them"
            title="Recipes to try with these bottles."
            copy="If you want to put one of these sauces to work tonight, start with these seafood-friendly recipes."
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {seafoodRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </div>
      ) : null}

      <FaqSchema faqs={pageOptimization.faqs ?? seafoodFaqs} />
      <HotSauceFaqSection
        eyebrow={pageOptimization.faqEyebrow || "FAQ"}
        title={pageOptimization.faqTitle || defaultSeafoodPageOptimization.faqTitle || "FAQ"}
        copy={pageOptimization.faqCopy || ""}
        faqs={pageOptimization.faqs ?? seafoodFaqs}
      />

      <ShareBar
        title="Best Hot Sauces for Seafood and Fish"
        description="Bright, gingery bottles that sharpen fish tacos, grilled seafood, and ceviche instead of flattening them."
        url={absoluteUrl("/hot-sauces/best-for-seafood")}
        contentType="hot-sauce-list"
        contentId={0}
        contentSlug="best-for-seafood"
        className="mt-12"
      />
    </section>
  );
}
