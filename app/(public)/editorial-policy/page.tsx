import Link from "next/link";

import { TrustPageShell } from "@/components/layout/trust-page-shell";
import { buildMetadata } from "@/lib/seo";

const LAST_UPDATED = "April 27, 2026";

export const metadata = buildMetadata({
  title: "Editorial Policy | FlamingFoodies",
  description:
    "How FlamingFoodies handles editorial standards, sourcing expectations, and the line between educational and commercial content.",
  path: "/editorial-policy"
});

export default function EditorialPolicyPage() {
  return (
    <TrustPageShell
      eyebrow="Editorial policy"
      title="What we expect from pages before they stay public."
      description="FlamingFoodies aims to make recipes, explainers, reviews, and shopping guides feel useful, specific, and clear about what kind of page the reader is on."
      lastUpdated={LAST_UPDATED}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <article className="panel p-6">
          <p className="eyebrow">Page intent</p>
          <h2 className="mt-3 font-display text-3xl text-cream">Educational pages should teach first.</h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            Recipes, explainers, and culture pieces are expected to stand on their own before any
            shopping or product references are layered in. If the page is mainly about a bottle or
            buying decision, it should read like a review or buying guide instead of pretending to
            be pure education.
          </p>
        </article>
        <article className="panel p-6">
          <p className="eyebrow">Originality</p>
          <h2 className="mt-3 font-display text-3xl text-cream">Specificity beats filler.</h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            We want pages to sound grounded in real kitchen use, shelf context, and practical
            decision-making. Repetitive phrasing, vague hype, or templated “craveable” copy is a
            sign a page needs more work before it deserves wider visibility.
          </p>
        </article>
        <article className="panel p-6">
          <p className="eyebrow">Commercial clarity</p>
          <h2 className="mt-3 font-display text-3xl text-cream">Monetization should never hide the page type.</h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            Reviews, comparison pages, and gift guides can be commercial-intent surfaces. Blog
            explainers and educational stories should not read like shopping pages wearing an
            educational headline.
          </p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="panel p-8">
          <p className="eyebrow">Sourcing and updates</p>
          <h2 className="mt-3 font-display text-4xl text-cream">What we try to make explicit.</h2>
          <div className="mt-5 space-y-4 text-sm leading-7 text-cream/75">
            <p>
              Explanatory pages should be anchored in clear kitchen context, observable product
              details, and sourceable facts where claims depend on outside information.
            </p>
            <p>
              We may use internal publishing tools to support drafting, organization, or QA, but a
              page still has to meet the same usefulness and trust standards before it stays public.
            </p>
            <p>
              If a page becomes stale, over-optimized, repetitive, or too thin to justify
              indexation, we would rather revise it, noindex it, or pull it back than leave it
              floating as filler.
            </p>
          </div>
        </article>

        <article className="panel p-8">
          <p className="eyebrow">Related standards</p>
          <h2 className="mt-3 font-display text-4xl text-cream">Read the rest of the trust stack.</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/review-methodology"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Review methodology
            </Link>
            <Link
              href="/corrections"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Corrections policy
            </Link>
            <Link
              href="/authors"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Contributor pages
            </Link>
          </div>
        </article>
      </div>
    </TrustPageShell>
  );
}
