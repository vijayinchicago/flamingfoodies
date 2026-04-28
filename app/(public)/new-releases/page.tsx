import Link from "next/link";

import { SectionHeading } from "@/components/layout/section-heading";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { buildMetadata } from "@/lib/seo";
import { getReleasesFromDb, RELEASE_TYPE_LABELS } from "@/lib/releases";
import { resolveAffiliateLink } from "@/lib/affiliates";
import { formatDate } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "New Hot Sauce Releases | FlamingFoodies",
  description:
    "A rolling feed of new hot sauce launches, limited editions, collabs, and restocks that may later earn fuller editorial coverage.",
  path: "/new-releases",
  noIndex: true
});

const TYPE_COLORS: Record<string, string> = {
  "new-product":     "text-emerald-400",
  "limited-edition": "text-amber-400",
  "collab":          "text-violet-400",
  "restock":         "text-sky-400",
  "brand-news":      "text-ember"
};

export default async function NewReleasesPage() {
  const releases = await getReleasesFromDb(50);

  return (
    <section className="container-shell py-16">
      <SectionHeading
        eyebrow="New releases"
        title="What's just dropped in hot sauce."
        copy="New products, limited editions, brand collabs, and restocks collected in one place before the strongest items graduate into fuller review or guide coverage."
      />

      <AffiliateDisclosure className="mt-8 max-w-3xl" compact />

      {releases.length === 0 ? (
        <div className="mt-12 rounded-[2rem] border border-white/10 bg-white/[0.03] p-12 text-center">
          <p className="font-display text-3xl text-cream">First scan coming soon.</p>
          <p className="mt-4 text-sm text-cream/55 max-w-md mx-auto">
            Check back after the first update cycle and this feed will start filling in with fresh launches and restocks.
          </p>
          <div className="mt-8 flex justify-center flex-wrap gap-3">
            <Link href="/reviews" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white">
              Read our reviews
            </Link>
            <Link href="/brands" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white">
              Browse brands
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {releases.map((release) => {
            const resolved = release.affiliateKey
              ? resolveAffiliateLink(release.affiliateKey, { sourcePage: "/new-releases", position: "release-feed" })
              : null;
            const typeColor = TYPE_COLORS[release.type] ?? "text-ember";
            return (
              <div
                key={release.slug}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/15"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs uppercase tracking-[0.22em] ${typeColor}`}>
                      {RELEASE_TYPE_LABELS[release.type]}
                    </span>
                    <span className="text-xs text-cream/40">{release.brand}</span>
                  </div>
                  <span className="text-xs text-cream/35">
                    {formatDate(release.publishedAt)}
                  </span>
                </div>
                <h2 className="mt-3 font-display text-2xl text-cream">{release.title}</h2>
                <p className="mt-2 text-sm leading-7 text-cream/70">{release.description}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {resolved && (
                    <AffiliateLink
                      href={resolved.href}
                      partnerKey={resolved.key}
                      trackingMode={resolved.trackingMode}
                      sourcePage="/new-releases"
                      position="release-feed"
                      className="inline-flex rounded-full bg-gradient-to-r from-flame to-ember px-4 py-2 text-sm font-semibold text-white"
                    >
                      Shop now ↗
                    </AffiliateLink>
                  )}
                  {release.sourceUrl && (
                    <a
                      href={release.sourceUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream hover:border-white/30"
                    >
                      Read more ↗
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/brands" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white">
          Brand directory
        </Link>
        <Link href="/reviews" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white">
          Sauce reviews
        </Link>
        <Link href="/shop" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white">
          Shop picks
        </Link>
      </div>
    </section>
  );
}
