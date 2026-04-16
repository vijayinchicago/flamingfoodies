import Link from "next/link";

import { SectionHeading } from "@/components/layout/section-heading";
import { buildMetadata } from "@/lib/seo";
import {
  getFestivalsFromDb,
  getMonthName,
  getRegionLabel,
  type Festival
} from "@/lib/festivals";

export const metadata = buildMetadata({
  title: "Hot Sauce Festivals in the US | FlamingFoodies",
  description:
    "The complete guide to hot sauce and spicy food festivals across America — from the Scovie Awards in Albuquerque to the Austin Chronicle Hot Sauce Festival, ZestFest in Texas, and Hatch Chile Fest in New Mexico.",
  path: "/festivals"
});

const REGION_COLORS: Record<string, string> = {
  northeast: "text-sky-400",
  southeast: "text-emerald-400",
  south: "text-ember",
  midwest: "text-amber-400",
  southwest: "text-orange-400",
  west: "text-violet-400"
};

export default async function FestivalsPage() {
  const festivals = await getFestivalsFromDb();

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  const upcoming = festivals.filter(
    (f) => f.month >= currentMonth && f.month <= currentMonth + 2
  );
  const featured = festivals.filter((f) => f.featured);

  const byMonth = new Map<number, Festival[]>();
  for (const f of festivals) {
    const bucket = byMonth.get(f.month) ?? [];
    bucket.push(f);
    byMonth.set(f.month, bucket);
  }
  const sortedMonths = Array.from(byMonth.keys()).sort((a, b) => a - b);

  return (
    <section className="container-shell py-16">
      <SectionHeading
        eyebrow="US festival guide"
        title="Chase the heat across America."
        copy="Hot sauce and spicy food festivals from January through October — competitions, vendor floors, eating contests, and the best excuse to plan a road trip."
      />

      {/* Upcoming this month / next 2 months */}
      {upcoming.length > 0 ? (
        <div className="mt-12">
          <p className="eyebrow">Coming up soon</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((festival) => (
              <Link
                key={festival.slug}
                href={`/festivals/${festival.slug}`}
                className="group overflow-hidden rounded-[2rem] border border-ember/30 bg-ember/10 p-6 transition hover:border-ember/50 hover:bg-ember/15"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className={`text-xs uppercase tracking-[0.22em] ${REGION_COLORS[festival.region] ?? "text-ember"}`}>
                    {getRegionLabel(festival.region)}
                  </p>
                  <span className="shrink-0 rounded-full bg-ember/20 px-3 py-1 text-xs font-semibold text-ember">
                    {getMonthName(festival.month)}
                  </span>
                </div>
                <h2 className="mt-3 font-display text-3xl leading-tight text-cream">
                  {festival.name}
                </h2>
                <p className="mt-1 text-sm text-cream/60">
                  {festival.city}, {festival.stateCode} · {festival.dateRange}
                </p>
                <p className="mt-3 text-sm leading-7 text-cream/70">{festival.tagline}</p>
                <p className="mt-4 text-sm font-semibold text-cream/70 group-hover:text-white">
                  Plan your visit →
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* Featured festivals */}
      {upcoming.length === 0 ? (
        <div className="mt-12">
          <p className="eyebrow">Flagship events</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((festival) => (
              <Link
                key={festival.slug}
                href={`/festivals/${festival.slug}`}
                className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className={`text-xs uppercase tracking-[0.22em] ${REGION_COLORS[festival.region] ?? "text-ember"}`}>
                    {getRegionLabel(festival.region)}
                  </p>
                  <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-cream/50">
                    {getMonthName(festival.month)}
                  </span>
                </div>
                <h2 className="mt-3 font-display text-3xl leading-tight text-cream">
                  {festival.name}
                </h2>
                <p className="mt-1 text-sm text-cream/55">
                  {festival.city}, {festival.stateCode}
                </p>
                <p className="mt-3 text-sm leading-7 text-cream/65">{festival.tagline}</p>
                <p className="mt-4 text-sm font-semibold text-cream/55 group-hover:text-cream/80">
                  Plan your visit →
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* Full calendar by month */}
      <div className="mt-16">
        <p className="eyebrow">Full calendar</p>
        <div className="mt-6 space-y-12">
          {sortedMonths.map((month) => {
            const festivals = byMonth.get(month) ?? [];
            return (
              <div key={month}>
                <div className="flex items-center gap-4">
                  <h2 className="font-display text-2xl text-cream">{getMonthName(month)}</h2>
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs text-cream/40">
                    {festivals.length} {festivals.length === 1 ? "festival" : "festivals"}
                  </span>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {festivals.map((festival) => (
                    <Link
                      key={festival.slug}
                      href={`/festivals/${festival.slug}`}
                      className="group rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs uppercase tracking-[0.2em] ${REGION_COLORS[festival.region] ?? "text-ember"}`}>
                          {festival.city}, {festival.stateCode}
                        </p>
                        {festival.featured ? (
                          <span className="shrink-0 rounded-full bg-ember/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ember">
                            Featured
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-2 font-display text-2xl leading-tight text-cream">
                        {festival.name}
                      </h3>
                      <p className="mt-1 text-xs text-cream/45">{festival.dateRange}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {festival.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/8 px-2.5 py-0.5 text-[11px] text-cream/45"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="mt-3 text-xs font-semibold text-cream/45 group-hover:text-cream/70">
                        View guide →
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats strip */}
      <div className="mt-16 grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 sm:grid-cols-3">
        <div>
          <p className="font-display text-5xl text-cream">{festivals.length}</p>
          <p className="mt-2 text-sm text-cream/60">Festivals tracked</p>
        </div>
        <div>
          <p className="font-display text-5xl text-cream">
            {new Set(festivals.map((f) => f.stateCode)).size}
          </p>
          <p className="mt-2 text-sm text-cream/60">States represented</p>
        </div>
        <div>
          <p className="font-display text-5xl text-cream">
            {sortedMonths.length}
          </p>
          <p className="mt-2 text-sm text-cream/60">Months covered Jan – Dec</p>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href="/hot-sauces"
          className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white"
        >
          Browse hot sauces
        </Link>
        <Link
          href="/reviews"
          className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white"
        >
          Read reviews
        </Link>
        <Link
          href="/shop"
          className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white"
        >
          Shop picks
        </Link>
        <Link
          href="/seasonal"
          className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white"
        >
          Seasonal guides
        </Link>
      </div>
    </section>
  );
}
