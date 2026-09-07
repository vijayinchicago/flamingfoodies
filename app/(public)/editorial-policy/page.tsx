import Link from "next/link";

import { TrustPageShell } from "@/components/layout/trust-page-shell";
import { EDITORIAL_PERSONA_DISCLOSURE } from "@/lib/authors";
import { buildMetadata } from "@/lib/seo";

const LAST_UPDATED = "September 6, 2026";

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
      title="Our standards for recipes, stories, and reviews."
      description="How we approach writing, sources, product recommendations, and corrections."
      lastUpdated={LAST_UPDATED}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <article className="panel p-6">
          <p className="eyebrow">Useful advice</p>
          <h2 className="mt-3 font-display text-3xl text-charcoal">Educational pages should teach first.</h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/75">
            Recipes, explainers, and culture pieces are expected to stand on their own before any
            shopping or product references are layered in. If the page is mainly about a bottle or
            buying decision, it should read like a review or buying guide instead of pretending to
            be pure education.
          </p>
        </article>
        <article className="panel p-6">
          <p className="eyebrow">Originality</p>
          <h2 className="mt-3 font-display text-3xl text-charcoal">Specificity beats filler.</h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/75">
            We want pages to sound grounded in real kitchen use, shelf context, and practical
            decision-making. Repetitive phrasing, vague hype, or templated “craveable” copy is a
            sign a page needs more work before it deserves wider visibility.
          </p>
        </article>
        <article className="panel p-6">
          <p className="eyebrow">Affiliate links</p>
          <h2 className="mt-3 font-display text-3xl text-charcoal">Be clear about how the site earns money.</h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/75">
            We label affiliate links and explain how purchases may support the site. Ingredient
            guides and cooking advice should remain useful whether or not you buy anything.
          </p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="panel p-8">
          <p className="eyebrow">Sourcing and updates</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">What we try to make explicit.</h2>
          <div className="mt-5 space-y-4 text-sm leading-7 text-charcoal/75">
            <p>
              Explanatory pages should be anchored in clear kitchen context, observable product
              details, and sourceable facts where claims depend on outside information.
            </p>
            <p>
              We use generative and rules-based publishing tools to support research organization,
              drafting, image selection or illustration, formatting, and QA. A page still has to
              meet the same usefulness and trust standards before it stays public.
            </p>
            <p>
              Editorial pen names group our coverage by subject. FlamingFoodies remains
              responsible for publication decisions and corrections.
            </p>
            <p>
              We revise or remove pages when information becomes outdated, a claim cannot be
              supported, or the advice is not useful enough to keep.
            </p>
          </div>
        </article>

        <article className="panel p-8">
          <p className="eyebrow">Related standards</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">More about our policies.</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/review-methodology"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Review methodology
            </Link>
            <Link
              href="/corrections"
              className="rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Corrections policy
            </Link>
            <Link
              href="/authors"
              className="rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Contributor pages
            </Link>
          </div>
        </article>
      </div>

      <article className="panel p-8">
        <p className="eyebrow">Bylines and editorial personas</p>
        <h2 className="mt-3 font-display text-4xl text-charcoal">
          Names should clarify responsibility, never manufacture authority.
        </h2>
        <p className="mt-5 max-w-4xl text-sm leading-7 text-charcoal/75">
          {EDITORIAL_PERSONA_DISCLOSURE} Persona profiles describe an assigned subject area and
          voice, not a made-up résumé. A persona byline is not evidence that an individual cooked,
          tasted, traveled, interviewed, or attended something. When first-hand work is completed,
          the page must say what was done; when it was not, the copy must not imply otherwise.
        </p>
        <Link
          href="/authors"
          className="mt-6 inline-flex rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal"
        >
          Meet the editorial board
        </Link>
      </article>
    </TrustPageShell>
  );
}
