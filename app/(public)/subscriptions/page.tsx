import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { EmailCapture } from "@/components/forms/email-capture";
import { SectionHeading } from "@/components/layout/section-heading";
import {
  SUBSCRIPTION_KEYS,
  getAffiliateLinkEntries,
  resolveAffiliateLink
} from "@/lib/affiliates";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Spicy Subscription Boxes | FlamingFoodies",
  description:
    "Curated hot sauce subscriptions, spicy gifts, and recurring heat-forward picks.",
  path: "/subscriptions"
});

export default function SubscriptionsPage() {
  const subscriptions = getAffiliateLinkEntries(SUBSCRIPTION_KEYS);
  const resolvedSubscriptions = subscriptions
    .map((link) => ({
      link,
      resolved: resolveAffiliateLink(link.key, {
        sourcePage: "/subscriptions",
        position: "subscription-grid"
      })
    }))
    .filter((entry): entry is { link: (typeof subscriptions)[number]; resolved: NonNullable<ReturnType<typeof resolveAffiliateLink>> } => Boolean(entry.resolved));

  return (
    <section className="container-shell py-16">
      <SectionHeading
        eyebrow="Subscriptions"
        title="Curated spicy subscriptions and partner offers."
        copy="This page leans into recurring offers and giftable collections instead of pretending we already run a merch line."
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />
      <div className="mt-10 grid gap-6 lg:grid-cols-4">
        {resolvedSubscriptions.map(({ link, resolved }) => (
          <article key={link.key} className="panel p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-ember">{link.badge}</p>
            <h2 className="mt-3 font-display text-4xl text-cream">{link.product}</h2>
            <p className="mt-4 text-sm leading-7 text-cream/75">{link.description}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-cream/45">
              Best for: {link.bestFor}
            </p>
            <AffiliateLink
              href={resolved.href}
              partnerKey={resolved.key}
              trackingMode={resolved.trackingMode}
              sourcePage="/subscriptions"
              position="subscription-grid"
              className="mt-8 inline-flex rounded-full bg-gradient-to-r from-flame to-ember px-6 py-3 font-semibold text-white"
            >
              Check price on Amazon
            </AffiliateLink>
          </article>
        ))}
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel p-8">
          <p className="eyebrow">Next best action</p>
          <h2 className="mt-3 font-display text-4xl text-cream">Stay close to the gift and gear picks.</h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            We do not need to force a merch story at launch. This signup keeps people warm for new
            gift guides, recurring boxes, and the next strong store recommendations.
          </p>
          <Link href="/shop" className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream">
            Browse the shop
          </Link>
        </div>
        <div>
          <EmailCapture
            source="subscriptions"
            tag="subscription-interest"
            heading="Get hot sauce picks, gift ideas, and recurring heat."
            description="Choose updates focused on bottle recommendations, subscriptions, and spicy finds worth revisiting."
            buttonLabel="Join this lane"
            defaultSegments={["hot-sauce-shelf", "cook-shop"]}
            segmentOptions={[
              {
                tag: "hot-sauce-shelf",
                label: "Hot Sauce Shelf Notes",
                description: "Bottle picks, reviews, and easy guidance on what to try next."
              },
              {
                tag: "cook-shop",
                label: "Cook / Shop",
                description: "A tighter mix of useful recipes plus the gear or pantry picks behind them."
              }
            ]}
          />
        </div>
      </div>
    </section>
  );
}
