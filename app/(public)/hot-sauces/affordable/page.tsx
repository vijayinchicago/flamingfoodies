import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { ReviewCard } from "@/components/cards/review-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { FaqSchema } from "@/components/schema/faq-schema";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import { getAffordableHotSauceReviews, getFilteredHotSauceReviews } from "@/lib/hot-sauces";
import { getReviewHeroFields } from "@/lib/review-hero";
import { buildMetadata } from "@/lib/seo";
import { getReviews } from "@/lib/services/content";
import type { RecipeFaq } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

const affordableFaqs: RecipeFaq[] = [
  {
    question: "Are cheap hot sauces actually worth buying?",
    answer:
      "The strongest hot sauces under $15 are some of the best buys in the category. Frank's RedHot, Cholula, Tapatío, Crystal — these are everyday-pour bottles that outperform many three-times-pricier alternatives in actual weeknight cooking. Cheap and useful aren't opposites."
  },
  {
    question: "What's the difference between a $5 and a $25 hot sauce?",
    answer:
      "Usually fermentation, ingredient sourcing, and packaging. Sub-$15 bottles use vinegar acceleration and standardized pepper sources; $25+ bottles often use long fermentation, single-origin peppers, and small-batch processing. The flavor difference is real but not always proportional to price."
  },
  {
    question: "Can a budget hot sauce really replace a craft one?",
    answer:
      "For everyday cooking, often yes. Where craft bottles earn their price is in distinctive flavor character — fruit-forward fermentation, unusual pepper varieties, smoke or barrel-aging that affordable bottles can't replicate. A useful shelf usually has both: cheap for daily use, craft for specific dishes."
  },
  {
    question: "What's a good starter budget for building a hot sauce shelf?",
    answer:
      "Under $50 total gets you a real shelf. Pick three bottles in the $5–15 tier: one everyday pour (Frank's, Cholula), one bright meal-specific bottle (taco or seafood-leaning), and one starter big-heat (Crystal Extra Hot, a $10 cayenne-based sauce). That's the working set; add craft bottles as you find specific gaps."
  }
];

export const metadata = buildMetadata({
  title: "Best Affordable Hot Sauces: Picks Under $15 and Under $50 | FlamingFoodies",
  description:
    "The best affordable hot sauces by price tier — bottles under $15 for everyday pouring, plus the strongest picks under $50 for shelf-building. Curated by repeat-use value, not just cheapness.",
  path: "/hot-sauces/affordable"
});

export default async function AffordableHotSaucesPage() {
  const reviews = await getReviews();
  const underFifteen = getAffordableHotSauceReviews(reviews, 6);
  const underFifty = reviews
    .filter((r) => typeof r.priceUsd === "number" && r.priceUsd > 15 && r.priceUsd <= 50)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);
  const everyday = getFilteredHotSauceReviews(reviews, "everyday").slice(0, 3);

  return (
    <section className="container-shell py-16">
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "Hot Sauces", item: absoluteUrl("/hot-sauces") },
          { name: "Affordable Picks", item: absoluteUrl("/hot-sauces/affordable") }
        ]}
      />
      <ItemListSchema
        name="Best affordable hot sauces"
        items={[...underFifteen, ...underFifty].map((review) => ({
          name: review.title,
          url: absoluteUrl(`/reviews/${review.slug}`),
          image: getReviewHeroFields(review).imageUrl
        }))}
      />
      <FaqSchema faqs={affordableFaqs} />

      <SectionHeading
        eyebrow="Affordable hot sauces"
        title="The best hot sauces that don&apos;t blow the budget."
        copy="Affordable bottles aren&apos;t a compromise — they&apos;re often the most useful picks on the shelf. Curated by price tier with the strongest under $15 and the best shelf-building options up to $50."
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />

      {/* Section TOC */}
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <a href="#under-15" className="rounded-full border border-charcoal/15 px-4 py-2 font-semibold text-charcoal hover:border-charcoal/30">
          Best under $15
        </a>
        <a href="#under-50" className="rounded-full border border-charcoal/15 px-4 py-2 font-semibold text-charcoal hover:border-charcoal/30">
          Best $15–$50
        </a>
        <a href="#how-to-choose" className="rounded-full border border-charcoal/15 px-4 py-2 font-semibold text-charcoal hover:border-charcoal/30">
          How to choose
        </a>
        <a href="#faq" className="rounded-full border border-charcoal/15 px-4 py-2 font-semibold text-charcoal hover:border-charcoal/30">
          FAQ
        </a>
      </div>

      {/* How to choose */}
      <section id="how-to-choose" className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel p-8">
          <p className="eyebrow">What to optimize for</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">
            Cheap should still mean useful, not just tolerable.
          </h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/75">
            A good budget bottle should work across more than one meal. If it only makes sense on
            one challenge-food bite, it&apos;s not actually a better buy than a slightly pricier
            bottle you use all week. The strongest affordable picks pull double or triple duty
            across breakfast, lunch, and dinner.
          </p>
        </div>
        <div className="panel p-8">
          <p className="eyebrow">Budget shelf rule</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Three bottles, three jobs.</h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-charcoal/75">
            <li>One everyday pour (covers tacos, eggs, bowls, sandwiches).</li>
            <li>One bright meal-specific bottle (seafood, breakfast, citrus-forward).</li>
            <li>One starter big-heat for wings, pizza, or pantry building.</li>
          </ul>
        </div>
      </section>

      {/* Under $15 */}
      <section id="under-15" className="mt-14">
        <SectionHeading
          eyebrow="Under $15"
          title="The strongest budget pours."
          copy="Compare the listed prices, heat levels, and suggested pairings."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {underFifteen.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>

      {/* Under $50 */}
      <section id="under-50" className="mt-14">
        <SectionHeading
          eyebrow="$15 to $50"
          title="The shelf-building range."
          copy="The $15–$50 tier is where craft bottles, longer ferments, and distinctive pepper sourcing start to show up. Each pick here adds something a budget bottle can't replicate."
        />
        {underFifty.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {underFifty.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm leading-7 text-charcoal/70">
            No reviews in the $15–$50 price tier yet. Browse{" "}
            <Link href="/reviews" className="font-semibold text-charcoal underline underline-offset-4">
              all reviews
            </Link>{" "}
            for the current selection.
          </p>
        )}
      </section>

      {/* Everyday picks */}
      <section className="mt-14">
        <SectionHeading
          eyebrow="Start here"
          title="If you only buy one affordable bottle."
          copy="These three are the most likely to earn repeat use across weeknight cooking."
        />
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {everyday.map((review) => (
            <Link
              key={review.slug}
              href={`/reviews/${review.slug}`}
              className="panel block p-6 hover:border-charcoal/20"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-ember">{review.brand}</p>
              <h3 className="mt-3 font-display text-3xl text-charcoal">{review.title}</h3>
              <p className="mt-3 text-sm leading-7 text-charcoal/75">{review.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section id="faq" className="mt-14">
        <p className="eyebrow">Frequently asked</p>
        <h2 className="mt-2 font-display text-3xl text-charcoal sm:text-4xl">
          Common questions about affordable hot sauces
        </h2>
        <div className="mt-6 divide-y divide-charcoal/10 rounded-[1.5rem] border border-charcoal/10 bg-white">
          {affordableFaqs.map((faq) => (
            <details key={faq.question} className="group p-5 sm:p-6">
              <summary className="cursor-pointer list-none text-base font-semibold text-charcoal">
                {faq.question}
              </summary>
              <p className="mt-3 text-sm leading-7 text-charcoal/75">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Cross-links */}
      <section className="mt-12 grid gap-4 md:grid-cols-3">
        <Link href="/hot-sauces/best" className="panel p-6 transition hover:border-charcoal/20">
          <p className="eyebrow">Hub</p>
          <h3 className="mt-2 font-display text-xl text-charcoal">Best hot sauces (overall)</h3>
          <p className="mt-2 text-sm leading-6 text-charcoal/70">The bottles we&apos;d tell anyone to buy first, at any price.</p>
        </Link>
        <Link href="/hot-sauces/best-gift-sets" className="panel p-6 transition hover:border-charcoal/20">
          <p className="eyebrow">Gifts</p>
          <h3 className="mt-2 font-display text-xl text-charcoal">Best hot sauce gift sets</h3>
          <p className="mt-2 text-sm leading-6 text-charcoal/70">Curated lineups and subscriptions for gifting.</p>
        </Link>
        <Link href="/reviews" className="panel p-6 transition hover:border-charcoal/20">
          <p className="eyebrow">Browse</p>
          <h3 className="mt-2 font-display text-xl text-charcoal">All hot sauce reviews</h3>
          <p className="mt-2 text-sm leading-6 text-charcoal/70">Every bottle reviewed, sortable by price, heat, and category.</p>
        </Link>
      </section>
    </section>
  );
}
