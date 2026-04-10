import Link from "next/link";

import { TrustPageShell } from "@/components/layout/trust-page-shell";
import { buildMetadata } from "@/lib/seo";

const LAST_UPDATED = "April 10, 2026";
const CONTACT_EMAIL = "foodiesflaming@gmail.com";

export const metadata = buildMetadata({
  title: "Contact FlamingFoodies",
  description:
    "How to reach FlamingFoodies for editorial questions, corrections, partnership notes, and general feedback.",
  path: "/contact"
});

export default function ContactPage() {
  return (
    <TrustPageShell
      eyebrow="Contact"
      title="Reach FlamingFoodies without guessing where the message should go."
      description="Questions, corrections, partnership notes, and reader feedback are all welcome. The fastest route right now is email."
      lastUpdated={LAST_UPDATED}
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="panel p-8">
          <p className="eyebrow">Primary contact</p>
          <h2 className="mt-3 font-display text-4xl text-cream">{CONTACT_EMAIL}</h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            Use this address for editorial corrections, product questions, newsletter requests,
            partnership notes, and anything else that should land with the site owner.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
          >
            Email FlamingFoodies
          </a>
        </article>

        <div className="grid gap-6">
          <article className="panel p-6">
            <p className="eyebrow">What to include</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-cream/75">
              <li>Your topic or page link</li>
              <li>What looks incorrect, missing, or worth updating</li>
              <li>The best way to follow up if more detail is needed</li>
            </ul>
          </article>
          <article className="panel p-6">
            <p className="eyebrow">Good reasons to reach out</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-cream/75">
              <li>Recipe correction requests or missing context</li>
              <li>Hot sauce review corrections or image issues</li>
              <li>Brand or affiliate partnership conversations</li>
              <li>Press, newsletter, or content collaboration notes</li>
            </ul>
          </article>
          <article className="panel p-6">
            <p className="eyebrow">Reader routes</p>
            <p className="mt-4 text-sm leading-7 text-cream/75">
              If you mainly want updates instead of a direct reply, the newsletter is the lower-lift
              option. You can choose recipe, hot sauce, or cook-and-shop lanes there.
            </p>
            <Link
              href="/subscriptions"
              className="mt-5 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Choose newsletter lanes
            </Link>
          </article>
        </div>
      </div>
    </TrustPageShell>
  );
}
