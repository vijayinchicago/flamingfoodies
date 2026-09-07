import Link from "next/link";

import { SectionHeading } from "@/components/layout/section-heading";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
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
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "Pepper Encyclopedia", item: absoluteUrl("/peppers") }
        ]}
      />
      <ItemListSchema
        name="FlamingFoodies pepper encyclopedia"
        items={peppers.slice(0, 30).map((p) => ({
          name: p.name,
          url: absoluteUrl(`/peppers/${p.slug}`)
        }))}
      />
      <SectionHeading
        eyebrow="Pepper encyclopedia"
        title="Every pepper. Every heat level. Every use."
        copy="Scoville ratings, flavor profiles, culinary uses, and the story behind each pepper — from a gentle jalapeño to the Carolina Reaper."
      />

      {/* Pillar guides */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link href="/peppers/guide" className="panel p-6 transition hover:border-ember">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Pepper guide</p>
          <h2 className="mt-2 font-display text-2xl text-charcoal">The complete guide to chile peppers</h2>
          <p className="mt-2 text-sm leading-6 text-charcoal/70">
            Heat tiers, capsicum species, regional traditions, and how to pick the right pepper —
            the top-level map for the whole encyclopedia.
          </p>
        </Link>
        <Link href="/peppers/substitutes" className="panel p-6 transition hover:border-ember">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Substitution guide</p>
          <h2 className="mt-2 font-display text-2xl text-charcoal">Pepper substitutes reference</h2>
          <p className="mt-2 text-sm leading-6 text-charcoal/70">
            What to use when the recipe calls for a pepper you don&apos;t have. Curated swaps with
            ratios for every pepper in the encyclopedia.
          </p>
        </Link>
      </div>

      {/* Quick tools */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link href="/peppers/scoville-scale" className="panel p-5 transition hover:border-charcoal/20">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Tool</p>
          <h2 className="mt-2 font-display text-xl text-charcoal">Scoville scale</h2>
          <p className="mt-2 text-sm leading-6 text-charcoal/70">
            Every pepper plotted from mild to reaper on one visual scale.
          </p>
        </Link>
        <Link href="/peppers/find" className="panel p-5 transition hover:border-charcoal/20">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Tool</p>
          <h2 className="mt-2 font-display text-xl text-charcoal">Find a pepper</h2>
          <p className="mt-2 text-sm leading-6 text-charcoal/70">
            Filter by heat, flavor notes, and origin to find what fits your dish.
          </p>
        </Link>
        <Link href="/peppers/compare" className="panel p-5 transition hover:border-charcoal/20">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Tool</p>
          <h2 className="mt-2 font-display text-xl text-charcoal">Compare two peppers</h2>
          <p className="mt-2 text-sm leading-6 text-charcoal/70">
            Side-by-side scoville, flavor, and which-to-use verdict.
          </p>
        </Link>
      </div>

      {/* Heat scale visual */}
      <div className="mt-12 rounded-[2rem] border border-charcoal/10 bg-charcoal/[0.04] p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="eyebrow">The heat scale</p>
          <p className="text-xs font-semibold text-ember">
            Tap any pepper for its full guide →
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-4">
          {tierOrder.map((tier) => {
            const meta = HEAT_TIERS[tier];
            const tieredPeppers = byTier.get(tier) ?? [];
            return (
              <div key={tier} className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div
                  className={`w-28 shrink-0 rounded-full px-3 py-1.5 text-center text-xs font-semibold uppercase tracking-wider ${meta.bgClass} ${meta.textClass}`}
                >
                  {meta.label}
                </div>
                <div className="hidden text-xs text-charcoal/55 sm:block w-36 shrink-0">
                  {meta.range}
                </div>
                <div className="flex flex-wrap gap-2">
                  {tieredPeppers.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/peppers/${p.slug}`}
                      className="inline-flex items-center gap-1 rounded-full border border-charcoal/20 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal shadow-sm transition hover:-translate-y-0.5 hover:border-ember hover:text-ember"
                    >
                      <span>{p.name}</span>
                      <span aria-hidden className="text-[10px] text-charcoal/45 transition group-hover:text-ember">
                        →
                      </span>
                    </Link>
                  ))}
                  {tieredPeppers.length === 0 && (
                    <span className="text-xs text-charcoal/45">No peppers yet</span>
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
                <p className="text-sm text-charcoal/45">{meta.range}</p>
                <div className="h-px flex-1 bg-charcoal/10" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tieredPeppers.map((pepper) => (
                  <Link
                    key={pepper.slug}
                    href={`/peppers/${pepper.slug}`}
                    className="group rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.04] p-5 transition hover:-translate-y-0.5 hover:border-charcoal/20 hover:bg-charcoal/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs uppercase tracking-[0.2em] ${meta.textClass}`}>
                        {pepper.origin.replace(/-/g, " ")}
                      </p>
                      <span className="shrink-0 rounded-full border border-charcoal/10 bg-charcoal/[0.04] px-2.5 py-0.5 text-[11px] text-charcoal/45">
                        {formatScoville(pepper.scovilleMin, pepper.scovilleMax)}
                      </span>
                    </div>
                    <h2 className="mt-2 font-display text-2xl leading-tight text-charcoal">
                      {pepper.name}
                    </h2>
                    {pepper.aliases.length > 0 && (
                      <p className="mt-0.5 text-xs text-charcoal/45">
                        Also: {pepper.aliases.slice(0, 2).join(", ")}
                      </p>
                    )}
                    <p className="mt-3 text-sm leading-6 text-charcoal/70">{pepper.flavorProfile}</p>
                    <p className="mt-3 text-xs font-semibold text-charcoal/45 group-hover:text-charcoal/70">
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
      <div className="mt-16 grid gap-4 rounded-[2rem] border border-charcoal/10 bg-charcoal/[0.04] p-8 sm:grid-cols-3">
        <div>
          <p className="font-display text-5xl text-charcoal">{peppers.length}</p>
          <p className="mt-2 text-sm text-charcoal/55">Peppers documented</p>
        </div>
        <div>
          <p className="font-display text-5xl text-charcoal">{tierOrder.length}</p>
          <p className="mt-2 text-sm text-charcoal/55">Heat tiers</p>
        </div>
        <div>
          <p className="font-display text-5xl text-charcoal">
            {new Set(peppers.map((p) => p.origin)).size}
          </p>
          <p className="mt-2 text-sm text-charcoal/55">Origins worldwide</p>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/hot-sauces" className="rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal hover:border-charcoal/30 hover:text-charcoal">
          Hot sauce hub
        </Link>
        <Link href="/reviews" className="rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal hover:border-charcoal/30 hover:text-charcoal">
          Sauce reviews
        </Link>
        <Link href="/recipes" className="rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal hover:border-charcoal/30 hover:text-charcoal">
          Browse recipes
        </Link>
        <Link href="/brands" className="rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal hover:border-charcoal/30 hover:text-charcoal">
          Brand directory
        </Link>
      </div>
    </section>
  );
}
