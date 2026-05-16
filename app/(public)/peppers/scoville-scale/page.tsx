import Link from "next/link";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { WebPageSchema } from "@/components/schema/web-page-schema";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import {
  HEAT_TIERS,
  formatScoville,
  getPeppersSortedByHeat,
  getTierOrder,
  type HeatTier
} from "@/lib/peppers";

export const metadata = buildMetadata({
  title: "Scoville Scale: Every Pepper Plotted from Mild to Reaper | FlamingFoodies",
  description:
    "The complete scoville scale showing every chile pepper from bell to Carolina Reaper. Includes scoville ranges, heat tiers, and direct links to each pepper guide.",
  path: "/peppers/scoville-scale"
});

// Position a scoville value on a logarithmic 0–100% scale.
// 0 SHU → 0%, 2.5M SHU → 100%
const LOG_MAX = Math.log10(2_500_000);
function logPercent(shu: number): number {
  if (shu <= 1) return 0;
  return Math.min(100, (Math.log10(shu) / LOG_MAX) * 100);
}

const TIER_HEX: Record<HeatTier, string> = {
  mild: "#86efac",
  medium: "#fbbf24",
  hot: "#fb923c",
  "very-hot": "#f97316",
  extreme: "#ef4444",
  superhot: "#b91c1c"
};

const TIER_RANGE_LABEL: Record<HeatTier, string> = {
  mild: "0 – 2,500 SHU",
  medium: "2,500 – 30,000",
  hot: "30,000 – 100,000",
  "very-hot": "100,000 – 500,000",
  extreme: "500,000 – 1.5M",
  superhot: "1.5M+"
};

export default async function ScovilleScalePage() {
  const peppers = getPeppersSortedByHeat();
  const tiers = getTierOrder();

  return (
    <article className="container-shell py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "Pepper Encyclopedia", item: absoluteUrl("/peppers") },
          { name: "Scoville Scale", item: absoluteUrl("/peppers/scoville-scale") }
        ]}
      />
      <WebPageSchema
        name="Scoville Scale: Every Pepper From Mild to Reaper"
        description="A visual scoville scale showing every pepper in the FlamingFoodies encyclopedia."
        url={absoluteUrl("/peppers/scoville-scale")}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Pepper Encyclopedia", href: "/peppers" },
          { label: "Scoville Scale" }
        ]}
      />

      <header className="mt-6 max-w-3xl">
        <p className="eyebrow">Scoville scale</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-charcoal sm:text-5xl">
          Every pepper on the scoville scale, from mild to reaper.
        </h1>
        <p className="mt-4 text-lg leading-8 text-charcoal/75">
          The scoville scale measures the heat of a chile pepper in Scoville Heat Units (SHU). Each
          pepper below is plotted on a logarithmic scale so the full range — from sweet bells to
          the Carolina Reaper — fits in one view.
        </p>
      </header>

      {/* Heat tier legend */}
      <section className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiers.map((tier) => (
          <div
            key={tier}
            className="rounded-[1rem] border border-charcoal/10 bg-white p-4"
            style={{ borderLeftWidth: 6, borderLeftColor: TIER_HEX[tier] }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-charcoal/55">
              {HEAT_TIERS[tier].label}
            </p>
            <p className="mt-1 text-xs font-semibold text-charcoal">{TIER_RANGE_LABEL[tier]}</p>
          </div>
        ))}
      </section>

      {/* The scale itself */}
      <section className="mt-12">
        <div className="rounded-[2rem] border border-charcoal/10 bg-white p-4 sm:p-7">
          {/* Axis ticks */}
          <div className="relative h-6">
            {[0, 25, 50, 75, 100].map((pct) => {
              const shu = Math.round(Math.pow(10, (pct / 100) * LOG_MAX));
              const label =
                shu >= 1_000_000 ? `${(shu / 1_000_000).toFixed(1)}M` :
                shu >= 1_000 ? `${Math.round(shu / 1000)}K` :
                shu === 0 ? "0" : String(shu);
              return (
                <div
                  key={pct}
                  className="absolute -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.16em] text-charcoal/45"
                  style={{ left: `${pct}%` }}
                >
                  {label}
                </div>
              );
            })}
          </div>

          {/* Bar plot, one row per pepper */}
          <ol className="mt-2 space-y-3">
            {peppers.map((p) => {
              const startPct = logPercent(p.scovilleMin || 1);
              const endPct = logPercent(p.scovilleMax || 1);
              const widthPct = Math.max(0.5, endPct - startPct);
              const tier = HEAT_TIERS[p.heatTier];
              const fill = TIER_HEX[p.heatTier];
              return (
                <li key={p.slug} className="grid grid-cols-[140px_1fr] items-center gap-3 sm:grid-cols-[180px_1fr]">
                  <Link
                    href={`/peppers/${p.slug}`}
                    className="truncate text-sm font-semibold text-charcoal hover:text-ember"
                  >
                    {p.name}
                  </Link>
                  <div className="relative h-7 rounded-full bg-charcoal/[0.04]">
                    <div
                      className="absolute top-0 h-full rounded-full"
                      style={{
                        left: `${startPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor: fill,
                        opacity: 0.85
                      }}
                      aria-hidden
                    />
                    <span
                      className="absolute inset-y-0 left-3 flex items-center text-[11px] font-semibold text-charcoal/65"
                      style={{ paddingLeft: `${startPct}%` }}
                    >
                      <span className="ml-2 whitespace-nowrap rounded-full bg-white/85 px-2 py-0.5 text-charcoal/80 backdrop-blur-sm">
                        {formatScoville(p.scovilleMin, p.scovilleMax)} · {tier.label}
                      </span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <p className="mt-3 text-xs text-charcoal/55">
          Scale is logarithmic. The same visual distance covers 100× more SHU on the right side
          than on the left, because the scoville range spans seven orders of magnitude.
        </p>
      </section>

      {/* CTAs */}
      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <Link
          href="/peppers/find"
          className="panel p-6 transition hover:border-charcoal/20"
        >
          <p className="eyebrow">Find a pepper</p>
          <h3 className="mt-2 font-display text-2xl text-charcoal">Filter by heat, flavor, and origin</h3>
          <p className="mt-2 text-sm leading-6 text-charcoal/70">
            Pick the heat tier and flavor profile that fits your dish.
          </p>
        </Link>
        <Link
          href="/peppers/compare"
          className="panel p-6 transition hover:border-charcoal/20"
        >
          <p className="eyebrow">Compare two peppers</p>
          <h3 className="mt-2 font-display text-2xl text-charcoal">Side-by-side scoville and flavor</h3>
          <p className="mt-2 text-sm leading-6 text-charcoal/70">
            Get a heat multiplier and a quick which-to-use verdict for any two peppers.
          </p>
        </Link>
      </section>
    </article>
  );
}
