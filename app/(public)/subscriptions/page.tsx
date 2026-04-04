import Link from "next/link";

import { EmailCapture } from "@/components/forms/email-capture";
import { SectionHeading } from "@/components/layout/section-heading";
import { SUBSCRIPTION_KEYS, getAffiliateLinkEntries } from "@/lib/affiliates";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Spicy Subscription Boxes | FlamingFoodies",
  description:
    "Curated hot sauce subscriptions, spicy gifts, merch waitlist offers, and recurring heat-forward picks.",
  path: "/subscriptions"
});

export default function SubscriptionsPage() {
  const subscriptions = getAffiliateLinkEntries(SUBSCRIPTION_KEYS);

  return (
    <section className="container-shell py-16">
      <SectionHeading
        eyebrow="Subscriptions"
        title="Curated spicy subscriptions and partner offers."
        copy="This page now leans into recurring offers, giftable collections, and the merch waitlist instead of only pushing one box."
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-4">
        {subscriptions.map((link) => (
          <article key={link.key} className="panel p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-ember">{link.badge}</p>
            <h2 className="mt-3 font-display text-4xl text-cream">{link.product}</h2>
            <p className="mt-4 text-sm leading-7 text-cream/75">{link.description}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-cream/45">
              Best for: {link.bestFor}
            </p>
            <Link
              href={`/go/${link.key}?source=/subscriptions&position=subscription-grid`}
              className="mt-8 inline-flex rounded-full bg-gradient-to-r from-flame to-ember px-6 py-3 font-semibold text-white"
            >
              Open offer
            </Link>
          </article>
        ))}
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel p-8">
          <p className="eyebrow">Owned offer next</p>
          <h2 className="mt-3 font-display text-4xl text-cream">Merch waitlist plugs the gap.</h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            Until the first merch drop is live, this page should still capture recurring intent
            from readers who want the gear side of the brand, not just partner products.
          </p>
          <Link
            href="/shop#merch-waitlist"
            className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
          >
            Join merch waitlist
          </Link>
        </div>
        <div>
          <EmailCapture source="subscriptions" tag="subscription-interest" />
        </div>
      </div>
    </section>
  );
}
