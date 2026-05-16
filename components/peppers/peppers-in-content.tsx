import Link from "next/link";

import { HEAT_TIERS, formatScoville, type Pepper } from "@/lib/peppers";

export function PeppersInContent({
  peppers,
  heading = "Peppers featured here"
}: {
  peppers: Pepper[];
  heading?: string;
}) {
  if (peppers.length === 0) return null;

  return (
    <section className="rounded-[1.5rem] border border-charcoal/10 bg-charcoal/[0.04] p-5 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">{heading}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {peppers.map((p) => {
          const tier = HEAT_TIERS[p.heatTier];
          return (
            <Link
              key={p.slug}
              href={`/peppers/${p.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-charcoal/10 bg-white px-3 py-1.5 text-sm font-semibold text-charcoal transition hover:border-charcoal/20"
            >
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tier.bgClass} ${tier.textClass}`}>
                {tier.label}
              </span>
              <span>{p.name}</span>
              <span className="text-xs font-normal text-charcoal/55">
                {formatScoville(p.scovilleMin, p.scovilleMax)}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
