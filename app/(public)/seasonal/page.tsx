import Link from "next/link";

import { SectionHeading } from "@/components/layout/section-heading";
import { buildMetadata } from "@/lib/seo";
import { SEASONAL_OCCASIONS, getCurrentOccasions } from "@/lib/seasonal/occasions";

export const metadata = buildMetadata({
  title: "Seasonal Spicy Food Guides | FlamingFoodies",
  description:
    "Seasonal guides for spicy food — Super Bowl wings, BBQ season, Cinco de Mayo tacos, holiday gifts, and more.",
  path: "/seasonal"
});

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default function SeasonalHubPage() {
  const current = getCurrentOccasions();

  return (
    <section className="container-shell py-16">
      <SectionHeading
        eyebrow="Seasonal guides"
        title="The right heat for every occasion."
        copy="Game day spreads, grill season staples, holiday gifts, and celebration cooks — each guide matches the moment to the right sauce and recipe."
      />

      {/* Live right now */}
      {current.length > 0 ? (
        <div className="mt-10">
          <p className="eyebrow">Happening now</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {current.map((occasion) => (
              <Link
                key={occasion.slug}
                href={`/seasonal/${occasion.slug}`}
                className="group overflow-hidden rounded-[2rem] border border-ember/30 bg-ember/10 p-6 transition hover:border-ember/50 hover:bg-ember/15"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-ember">
                    {occasion.eyebrow}
                  </p>
                  <span className="rounded-full bg-ember/20 px-3 py-1 text-xs font-semibold text-ember">
                    In season
                  </span>
                </div>
                <h2 className="mt-3 font-display text-3xl text-cream">{occasion.title}</h2>
                <p className="mt-2 text-sm leading-7 text-cream/70">{occasion.tagline}</p>
                <p className="mt-4 text-sm font-semibold text-cream/70 group-hover:text-white">
                  Open the guide →
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* All occasions */}
      <div className="mt-12">
        <p className="eyebrow">All seasonal guides</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {SEASONAL_OCCASIONS.map((occasion) => {
            const isActive = current.some((c) => c.slug === occasion.slug);
            const months = occasion.peakMonths
              .map((m) => MONTH_NAMES[m - 1])
              .join(", ");

            return (
              <Link
                key={occasion.slug}
                href={`/seasonal/${occasion.slug}`}
                className={`group overflow-hidden rounded-[2rem] border p-6 transition hover:-translate-y-1 ${
                  isActive
                    ? "border-ember/25 bg-ember/8"
                    : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-ember">
                    {occasion.eyebrow}
                  </p>
                  <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-cream/50">
                    {months}
                  </span>
                </div>
                <h2 className="mt-3 font-display text-3xl text-cream leading-tight">
                  {occasion.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-cream/65">{occasion.tagline}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {occasion.guideLinks.slice(0, 2).map((link) => (
                    <span
                      key={link.href}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-cream/55"
                    >
                      {link.label}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm font-semibold text-cream/55 group-hover:text-cream/80">
                  Open the guide →
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom links */}
      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href="/recipes"
          className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
        >
          Browse all recipes
        </Link>
        <Link
          href="/hot-sauces"
          className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
        >
          Hot sauce hub
        </Link>
        <Link
          href="/shop"
          className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
        >
          Shop picks
        </Link>
      </div>
    </section>
  );
}
