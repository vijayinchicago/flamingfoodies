import Image from "next/image";
import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { SectionHeading } from "@/components/layout/section-heading";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import {
  findAffiliateLinkByUrl,
  resolveAffiliateLink,
  buildAmazonSearchUrl
} from "@/lib/affiliates";
import { getReviewHeroFields } from "@/lib/review-hero";
import { buildMetadata } from "@/lib/seo";
import { getReviews } from "@/lib/services/content";
import type { HeatLevel, Review } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Compare Hot Sauces | FlamingFoodies",
  description:
    "Compare two hot sauces side by side — heat, flavor, Scoville range, rating, pros and cons.",
  path: "/hot-sauces/compare"
});

const HEAT_ORDER: Record<HeatLevel, number> = {
  mild: 1,
  medium: 2,
  hot: 3,
  inferno: 4,
  reaper: 5
};

function formatLabel(value: string) {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ScovBar({ min, max }: { min?: number; max?: number }) {
  if (!min && !max) return <span className="text-cream/45">Not listed</span>;
  const MAX_SCOV = 2_200_000;
  const pct = Math.min(100, (((max ?? min ?? 0) / MAX_SCOV) * 100));
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-cream">
        {min?.toLocaleString()}{max && max !== min ? `–${max.toLocaleString()}` : ""} SHU
      </p>
      <div className="h-2 w-full rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-ember to-flame"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < filled ? "text-amber-300" : "text-white/20"}>
            ★
          </span>
        ))}
      </div>
      <span className="text-sm font-semibold text-cream">{rating.toFixed(1)}</span>
    </div>
  );
}

interface CompareCardProps {
  review: Review;
  sourcePage: string;
  position: number;
  highlight?: boolean;
}

function CompareCard({ review, sourcePage, position, highlight }: CompareCardProps) {
  const hero = getReviewHeroFields(review);
  const primaryOffer = findAffiliateLinkByUrl(review.affiliateUrl);
  const resolvedOffer = primaryOffer
    ? resolveAffiliateLink(primaryOffer.key, { sourcePage, position: `compare-${position}` })
    : null;

  return (
    <div
      className={`overflow-hidden rounded-[2rem] border ${
        highlight
          ? "border-ember/40 shadow-[0_0_0_1px_rgba(244,99,30,0.15)]"
          : "border-white/10"
      } bg-white/[0.05]`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3]">
        <Image
          src={hero.imageUrl}
          alt={hero.imageAlt}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 480px, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <span className="rounded-full border border-white/20 bg-charcoal/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cream/90 backdrop-blur-sm">
            {review.brand}
          </span>
        </div>
        {review.recommended ? (
          <div className="absolute right-4 top-4">
            <span className="rounded-full bg-ember px-3 py-1 text-xs font-semibold text-white">
              Recommended
            </span>
          </div>
        ) : null}
      </div>

      {/* Header */}
      <div className="p-6 sm:p-7">
        <p className="eyebrow">{review.category}</p>
        <h2 className="mt-3 font-display text-3xl leading-tight text-cream sm:text-4xl">
          {review.productName}
        </h2>
        <p className="mt-3 text-sm leading-7 text-cream/72">{review.description}</p>

        {/* Quick stats */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ember">Rating</p>
            <div className="mt-2">
              <StarRating rating={review.rating} />
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ember">Heat level</p>
            <p className="mt-2 font-semibold text-cream">
              {review.heatLevel ? formatLabel(review.heatLevel) : "—"}
            </p>
          </div>
          {review.priceUsd ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ember">Price</p>
              <p className="mt-2 font-semibold text-cream">${review.priceUsd.toFixed(2)}</p>
            </div>
          ) : null}
          {review.cuisineOrigin ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ember">Origin</p>
              <p className="mt-2 font-semibold text-cream">{formatLabel(review.cuisineOrigin)}</p>
            </div>
          ) : null}
        </div>

        {/* Scoville */}
        <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-ember">Scoville range</p>
          <div className="mt-3">
            <ScovBar min={review.scovilleMin} max={review.scovilleMax} />
          </div>
        </div>

        {/* Flavor notes */}
        {review.flavorNotes.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ember">Flavor notes</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {review.flavorNotes.map((note) => (
                <span
                  key={note}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-cream/75"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Pros */}
        {review.pros.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Pros</p>
            <ul className="mt-2 space-y-2">
              {review.pros.map((pro) => (
                <li key={pro} className="flex gap-2 text-sm text-cream/75">
                  <span className="mt-0.5 text-emerald-400">+</span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Cons */}
        {review.cons.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-[0.2em] text-rose-400">Cons</p>
            <ul className="mt-2 space-y-2">
              {review.cons.map((con) => (
                <li key={con} className="flex gap-2 text-sm text-cream/75">
                  <span className="mt-0.5 text-rose-400">–</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* CTA */}
        <div className="mt-6 flex flex-wrap gap-3">
          <AffiliateLink
            href={resolvedOffer?.href ?? buildAmazonSearchUrl(review.productName)}
            partnerKey={resolvedOffer?.key}
            partnerName={review.brand}
            productName={review.productName}
            trackingMode={resolvedOffer?.trackingMode ?? "client_beacon"}
            sourcePage={sourcePage}
            position={`compare-${position}`}
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
          >
            Buy on Amazon
          </AffiliateLink>
          <Link
            href={`/reviews/${review.slug}`}
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
          >
            Full review
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function HotSauceComparePage({
  searchParams
}: {
  searchParams?: { a?: string | string[]; b?: string | string[] };
}) {
  const reviews = await getReviews();

  const slugA = Array.isArray(searchParams?.a) ? searchParams.a[0] : searchParams?.a;
  const slugB = Array.isArray(searchParams?.b) ? searchParams.b[0] : searchParams?.b;

  const reviewA = slugA ? reviews.find((r) => r.slug === slugA) ?? null : null;
  const reviewB = slugB ? reviews.find((r) => r.slug === slugB) ?? null : null;

  // Winner determination — only show when both are loaded
  let winner: Review | null = null;
  if (reviewA && reviewB) {
    const scoreA =
      reviewA.rating * 20 +
      (HEAT_ORDER[reviewA.heatLevel ?? "mild"] ?? 0) * 2 +
      (reviewA.recommended ? 10 : 0);
    const scoreB =
      reviewB.rating * 20 +
      (HEAT_ORDER[reviewB.heatLevel ?? "mild"] ?? 0) * 2 +
      (reviewB.recommended ? 10 : 0);
    if (scoreA !== scoreB) {
      winner = scoreA > scoreB ? reviewA : reviewB;
    }
  }

  const sourcePage = "/hot-sauces/compare";
  const popularPairs = reviews.slice(0, 6);

  return (
    <section className="container-shell py-16">
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "Hot Sauces", item: absoluteUrl("/hot-sauces") },
          { name: "Compare", item: absoluteUrl("/hot-sauces/compare") }
        ]}
      />

      <SectionHeading
        eyebrow="Head to head"
        title="Compare two hot sauces side by side."
        copy="Pick any two sauces to compare heat, Scoville range, flavor notes, pros, cons, and price in one view."
      />

      {/* Sauce selector */}
      <form method="get" action="/hot-sauces/compare" className="panel-light mt-10 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-ember">Pick your two sauces</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sauce-a" className="mb-2 block text-sm font-semibold text-charcoal">
              Sauce A
            </label>
            <select
              id="sauce-a"
              name="a"
              defaultValue={slugA ?? ""}
              className="w-full rounded-2xl border border-charcoal/12 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/15"
            >
              <option value="">Select a sauce...</option>
              {reviews.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.brand} — {r.productName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sauce-b" className="mb-2 block text-sm font-semibold text-charcoal">
              Sauce B
            </label>
            <select
              id="sauce-b"
              name="b"
              defaultValue={slugB ?? ""}
              className="w-full rounded-2xl border border-charcoal/12 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/15"
            >
              <option value="">Select a sauce...</option>
              {reviews.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.brand} — {r.productName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button
            type="submit"
            className="rounded-full bg-gradient-to-r from-flame to-ember px-6 py-3 text-sm font-semibold text-white"
          >
            Compare these sauces
          </button>
        </div>
      </form>

      {/* Comparison view */}
      {reviewA && reviewB ? (
        <div className="mt-12 space-y-8">
          {/* Winner banner */}
          {winner ? (
            <div className="rounded-[2rem] border border-ember/30 bg-ember/10 p-6 text-center">
              <p className="text-xs uppercase tracking-[0.24em] text-ember">Our pick</p>
              <p className="mt-2 font-display text-3xl text-cream">
                {winner.brand} — {winner.productName}
              </p>
              <p className="mt-2 text-sm text-cream/70">
                Edges ahead on rating
                {winner.recommended ? " and comes recommended" : ""}.
                Both are worth buying — this one just has a slight edge overall.
              </p>
            </div>
          ) : (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center">
              <p className="font-display text-3xl text-cream">A near-perfect tie.</p>
              <p className="mt-2 text-sm text-cream/70">
                Both sauces are closely matched. Read the pros and cons below to decide which fits your use case better.
              </p>
            </div>
          )}

          {/* Side by side */}
          <div className="grid gap-6 lg:grid-cols-2">
            <CompareCard
              review={reviewA}
              sourcePage={sourcePage}
              position={1}
              highlight={winner?.slug === reviewA.slug}
            />
            <CompareCard
              review={reviewB}
              sourcePage={sourcePage}
              position={2}
              highlight={winner?.slug === reviewB.slug}
            />
          </div>

          {/* Quick-compare table */}
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]">
            <div className="border-b border-white/10 p-6">
              <p className="eyebrow">Quick compare</p>
              <h2 className="mt-2 font-display text-3xl text-cream">At a glance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-cream/45">
                      Attribute
                    </th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-cream/75">
                      {reviewA.productName}
                    </th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-cream/75">
                      {reviewB.productName}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {[
                    {
                      label: "Brand",
                      a: reviewA.brand,
                      b: reviewB.brand
                    },
                    {
                      label: "Rating",
                      a: `${reviewA.rating.toFixed(1)} / 5`,
                      b: `${reviewB.rating.toFixed(1)} / 5`
                    },
                    {
                      label: "Heat level",
                      a: reviewA.heatLevel ? formatLabel(reviewA.heatLevel) : "—",
                      b: reviewB.heatLevel ? formatLabel(reviewB.heatLevel) : "—"
                    },
                    {
                      label: "Scoville",
                      a: reviewA.scovilleMin
                        ? `${reviewA.scovilleMin.toLocaleString()}${reviewA.scovilleMax ? `–${reviewA.scovilleMax.toLocaleString()}` : ""} SHU`
                        : "Not listed",
                      b: reviewB.scovilleMin
                        ? `${reviewB.scovilleMin.toLocaleString()}${reviewB.scovilleMax ? `–${reviewB.scovilleMax.toLocaleString()}` : ""} SHU`
                        : "Not listed"
                    },
                    {
                      label: "Price",
                      a: reviewA.priceUsd ? `$${reviewA.priceUsd.toFixed(2)}` : "—",
                      b: reviewB.priceUsd ? `$${reviewB.priceUsd.toFixed(2)}` : "—"
                    },
                    {
                      label: "Recommended",
                      a: reviewA.recommended ? "Yes" : "No",
                      b: reviewB.recommended ? "Yes" : "No"
                    }
                  ].map((row) => (
                    <tr key={row.label}>
                      <td className="px-6 py-4 text-xs uppercase tracking-[0.18em] text-cream/45">
                        {row.label}
                      </td>
                      <td
                        className={`px-6 py-4 font-semibold ${
                          winner?.slug === reviewA.slug ? "text-ember" : "text-cream"
                        }`}
                      >
                        {row.a}
                      </td>
                      <td
                        className={`px-6 py-4 font-semibold ${
                          winner?.slug === reviewB.slug ? "text-ember" : "text-cream"
                        }`}
                      >
                        {row.b}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* No selection — show popular sauces to compare */
        <div className="mt-12">
          <div className="mb-8">
            <p className="eyebrow">Popular sauces to compare</p>
            <h2 className="mt-3 font-display text-4xl text-cream">
              Start with one of these.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-cream/70">
              Pick two sauces from the dropdown above, or click any card below to jump-start a comparison.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularPairs.map((r) => {
              const hero = getReviewHeroFields(r);
              return (
                <Link
                  key={r.slug}
                  href={`/hot-sauces/compare?a=${r.slug}`}
                  className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] transition hover:border-white/25 hover:bg-white/[0.07]"
                >
                  <div className="relative h-40">
                    <Image
                      src={hero.imageUrl}
                      alt={hero.imageAlt}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 to-transparent" />
                  </div>
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-ember">{r.brand}</p>
                    <h3 className="mt-2 font-display text-2xl text-cream">{r.productName}</h3>
                    <p className="mt-1 text-sm text-cream/55">{r.rating.toFixed(1)} / 5</p>
                    <p className="mt-3 text-xs font-semibold text-cream/60 group-hover:text-cream">
                      Compare this sauce →
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-12">
        <AffiliateDisclosure compact />
      </div>

      {/* Nav links */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/hot-sauces"
          className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
        >
          Back to hot sauce hub
        </Link>
        <Link
          href="/reviews"
          className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
        >
          Browse all reviews
        </Link>
      </div>
    </section>
  );
}
