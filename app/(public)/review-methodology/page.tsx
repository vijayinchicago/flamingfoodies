import Link from "next/link";

import { TrustPageShell } from "@/components/layout/trust-page-shell";
import { buildMetadata } from "@/lib/seo";

const LAST_UPDATED = "April 27, 2026";

export const metadata = buildMetadata({
  title: "Review Methodology | FlamingFoodies",
  description:
    "How FlamingFoodies approaches hot sauce and spicy product reviews, and how that differs from recipes and educational articles.",
  path: "/review-methodology"
});

export default function ReviewMethodologyPage() {
  return (
    <TrustPageShell
      eyebrow="Review methodology"
      title="What a FlamingFoodies review is actually trying to answer."
      description="Review pages exist to help readers judge whether a bottle, set, or spicy pantry product makes sense for the way they actually cook and eat."
      lastUpdated={LAST_UPDATED}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <article className="panel p-6">
          <p className="eyebrow">Flavor</p>
          <h2 className="mt-3 font-display text-3xl text-cream">Does it taste like something you want again?</h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            We care about flavor shape, not just heat bragging rights. A bottle should have a real
            use case and a reason to stay on the shelf.
          </p>
        </article>
        <article className="panel p-6">
          <p className="eyebrow">Heat behavior</p>
          <h2 className="mt-3 font-display text-3xl text-cream">Where does the heat land in context?</h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            We try to describe whether the heat feels sharp, slow, smoky, acidic, mellow, or
            layered, and what kind of eater or dish that behavior suits.
          </p>
        </article>
        <article className="panel p-6">
          <p className="eyebrow">Fit</p>
          <h2 className="mt-3 font-display text-3xl text-cream">Who is the bottle actually for?</h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            Review pages should help a reader decide when to buy, skip, compare, or gift a product
            instead of sounding like one more generic “best ever” writeup.
          </p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="panel p-8">
          <p className="eyebrow">What reviews are not</p>
          <h2 className="mt-3 font-display text-4xl text-cream">They are not the same as explainers or recipes.</h2>
          <div className="mt-5 space-y-4 text-sm leading-7 text-cream/75">
            <p>
              Recipes and educational stories should be useful even if a reader never clicks a
              product link. Review and buying-guide pages are allowed to be more commercially
              focused because the reader is there to make a product decision.
            </p>
            <p>
              That distinction matters. When a page is primarily a review, buying guide, or
              comparison, we want it to read that way clearly instead of hiding the intent.
            </p>
            <p>
              If we do not have enough confidence, context, or product clarity to publish a useful
              review, the better outcome is to keep it out of the spotlight until it is ready.
            </p>
          </div>
        </article>

        <article className="panel p-8">
          <p className="eyebrow">Related policies</p>
          <h2 className="mt-3 font-display text-4xl text-cream">Keep the methodology in context.</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/editorial-policy"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Editorial policy
            </Link>
            <Link
              href="/corrections"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Corrections policy
            </Link>
            <Link
              href="/affiliate-disclosure"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Affiliate disclosure
            </Link>
          </div>
        </article>
      </div>
    </TrustPageShell>
  );
}
