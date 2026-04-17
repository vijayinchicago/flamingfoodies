import Link from "next/link";

import { SectionHeading } from "@/components/layout/section-heading";
import { buildMetadata } from "@/lib/seo";
import {
  getPeppersFromDb,
  HEAT_TIERS,
  getTierOrder,
  formatScoville,
  type HeatTier,
  type Pepper
} from "@/lib/peppers";

export const metadata = buildMetadata({
  title: "Pepper Encyclopedia | Scoville Ratings, Flavor Profiles & Uses | FlamingFoodies",
  description:
    "The complete guide to hot peppers — Scoville ratings, flavor profiles, culinary uses, and where each pepper sits on the heat scale. From jalapeño to Carolina Reaper.",
  path: "/peppers"
});

export default async function PeppersPage() {
  const peppers = await getPeppersFromDb();
  const tierOrder = getTierOrder();

  const byTier = new Map<HeatTier, Pepper[]>();
  for (const p of peppers) {
    const bucket = byTier.get(p.heatTier) ?? [];
    bucket.push(p);
    byTier.set(p.heatTier, bucket);
  }

  return (
    <section className="container-shell py-16">
      <SectionHeading
        eyebrow="Pepper encyclopedia"
        title="Every pepper. Every heat level. Every use."
        copy="Scoville ratings, flavor profiles, culinary uses, and the story behind each pepper — from a gentle jalapeño to the Carolina Reaper."
      />

      {/* Heat scale visual */}
      <div className="mt-12 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
        <p className="eyebrow">The heat scale</p>
        <div className="mt-6 flex flex-col gap-3">
          {tierOrder.map((tier) => {
            const meta = HEAT_TIERS[tier];
            const tieredPeppers = byTier.get(tier) ?? [];
            return (
              <div key={tier} className="flex items-center gap-4">
                <div
                  className={`w-28 shrink-0 rounded-full px-3 py-1.5 text-center text-xs font-semibold uppercase tracking-wider ${meta.bgClass} ${meta.textClass}`}
                >
                  {meta.label}
                </div>
                <div className="hidden text-xs text-cream/40 sm:block w-36 shrink-0">
                  {meta.range}
                </div>
                <div className="flex flex-wrap gap-2">
                  {tieredPeppers.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/peppers/${p.slug}`}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-cream/70 transition hover:border-white/20 hover:text-cream"
                    >
                      {p.name}
                    </Link>
                  ))}
                  {tieredPeppers.length === 0 && (
                    <span className="text-xs text-cream/25">No peppers yet</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier-by-tier grid */}
      <div className="mt-16 space-y-14">
        {tierOrder.map((tier) => {
          const tieredPeppers = byTier.get(tier) ?? [];
          if (tieredPeppers.length === 0) return null;
          const meta = HEAT_TIERS[tier];
          return (
            <div key={tier}>
              <div className="flex items-center gap-4">
                <span className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${meta.bgClass} ${meta.textClass}`}>
                  {meta.label}
                </span>
                <p className="text-sm text-cream/40">{meta.range}</p>
                <div className="h-px flex-1 bg-white/8" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tieredPeppers.map((pepper) => (
                  <Link
                    key={pepper.slug}
                    href={`/peppers/${pepper.slug}`}
                    className="group rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs uppercase tracking-[0.2em] ${meta.textClass}`}>
                        {pepper.origin.replace(/-/g, " ")}
                      </p>
                      <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-cream/45">
                        {formatScoville(pepper.scovilleMin, pepper.scovilleMax)}
                      </span>
                    </div>
                    <h2 className="mt-2 font-display text-2xl leading-tight text-cream">
                      {pepper.name}
                    </h2>
                    {pepper.aliases.length > 0 && (
                      <p className="mt-0.5 text-xs text-cream/40">
                        Also: {pepper.aliases.slice(0, 2).join(", ")}
                      </p>
                    )}
                    <p className="mt-3 text-sm leading-6 text-cream/65">{pepper.flavorProfile}</p>
                    <p className="mt-3 text-xs font-semibold text-cream/40 group-hover:text-cream/65">
                      Full profile →
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-16 grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 sm:grid-cols-3">
        <div>
          <p className="font-display text-5xl text-cream">{peppers.length}</p>
          <p className="mt-2 text-sm text-cream/60">Peppers documented</p>
        </div>
        <div>
          <p className="font-display text-5xl text-cream">{tierOrder.length}</p>
          <p className="mt-2 text-sm text-cream/60">Heat tiers</p>
        </div>
        <div>
          <p className="font-display text-5xl text-cream">
            {new Set(peppers.map((p) => p.origin)).size}
          </p>
          <p className="mt-2 text-sm text-cream/60">Origins worldwide</p>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/hot-sauces" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white">
          Hot sauce hub
        </Link>
        <Link href="/reviews" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white">
          Sauce reviews
        </Link>
        <Link href="/recipes" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white">
          Browse recipes
        </Link>
        <Link href="/brands" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white">
          Brand directory
        </Link>
      </div>
    </section>
  );
}
