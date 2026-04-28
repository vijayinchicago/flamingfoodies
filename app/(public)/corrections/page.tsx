import Link from "next/link";

import { TrustPageShell } from "@/components/layout/trust-page-shell";
import { buildMetadata } from "@/lib/seo";

const LAST_UPDATED = "April 27, 2026";

export const metadata = buildMetadata({
  title: "Corrections Policy | FlamingFoodies",
  description:
    "How readers can flag errors, stale details, and misleading product or recipe information on FlamingFoodies.",
  path: "/corrections"
});

export default function CorrectionsPage() {
  return (
    <TrustPageShell
      eyebrow="Corrections"
      title="If something looks off, we want the page fixed."
      description="Corrections, missing context, stale product details, and broken claims should be reported instead of shrugged off."
      lastUpdated={LAST_UPDATED}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <article className="panel p-6">
          <p className="eyebrow">What to send</p>
          <h2 className="mt-3 font-display text-3xl text-cream">The page link and the issue.</h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            Include the exact URL, what looks incorrect or misleading, and any source or context
            that would help us verify the change more quickly.
          </p>
        </article>
        <article className="panel p-6">
          <p className="eyebrow">What happens next</p>
          <h2 className="mt-3 font-display text-3xl text-cream">We review, update, or pull it back.</h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            Depending on the problem, a page may be corrected, clarified, rewritten, temporarily
            unpublished, or taken out of index until it is strong enough again.
          </p>
        </article>
        <article className="panel p-6">
          <p className="eyebrow">Why this matters</p>
          <h2 className="mt-3 font-display text-3xl text-cream">Freshness is part of trust.</h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            Product availability changes, bottles get reformulated, and food facts age badly. A
            useful spicy-food site should update those pages instead of leaving them to drift.
          </p>
        </article>
      </div>

      <div className="panel p-8">
        <p className="eyebrow">Get in touch</p>
        <h2 className="mt-3 font-display text-4xl text-cream">Corrections should be easy to send.</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-cream/75">
          Use the contact page for factual issues, sourcing problems, stale product notes, recipe
          clarifications, or anything else that affects reader trust.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
          >
            Contact FlamingFoodies
          </Link>
          <Link
            href="/editorial-policy"
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
          >
            Editorial policy
          </Link>
        </div>
      </div>
    </TrustPageShell>
  );
}
