import Link from "next/link";

import { SectionHeading } from "@/components/layout/section-heading";
import { buildMetadata } from "@/lib/seo";
import {
  getBrandsFromDb,
  TIER_LABELS,
  type BrandTier,
  type Brand
} from "@/lib/brands";

export const metadata = buildMetadata({
  title: "Hot Sauce Brand Directory | FlamingFoodies",
  description:
    "Profiles of the world's best hot sauce brands — from Tabasco and Frank's to Fly By Jing and TRUFF. History, product lines, and what makes each brand worth knowing.",
  path: "/brands"
});

const TIER_ORDER: BrandTier[] = ["iconic", "premium", "craft", "regional", "subscription"];

export default async function BrandsPage() {
  const brands = await getBrandsFromDb();

  const byTier = new Map<BrandTier, Brand[]>();
  for (const b of brands) {
    const bucket = byTier.get(b.tier) ?? [];
    bucket.push(b);
    byTier.set(b.tier, bucket);
  }

  return (
    <section className="container-shell py-16">
      <SectionHeading
        eyebrow="Brand directory"
        title="Know the brands behind the heat."
        copy="From 150-year-old Louisiana institutions to Brooklyn craft startups — the history, product lines, and story behind every brand worth knowing."
      />

      {/* Tier-grouped brand grid */}
      <div className="mt-12 space-y-14">
        {TIER_ORDER.map((tier) => {
          const tierBrands = byTier.get(tier) ?? [];
          if (tierBrands.length === 0) return null;
          return (
            <div key={tier}>
              <div className="flex items-center gap-4">
                <h2 className="font-display text-2xl text-cream">{TIER_LABELS[tier]}</h2>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tierBrands.map((brand) => (
                  <Link
                    key={brand.slug}
                    href={`/brands/${brand.slug}`}
                    className="group rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-ember">
                        {brand.city}
                      </p>
                      <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-cream/45">
                        Est. {brand.founded}
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-3xl leading-tight text-cream">
                      {brand.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-cream/65">{brand.tagline}</p>
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
          <p className="font-display text-5xl text-cream">{brands.length}</p>
          <p className="mt-2 text-sm text-cream/60">Brands profiled</p>
        </div>
        <div>
          <p className="font-display text-5xl text-cream">
            {new Set(brands.map((b) => b.origin)).size}
          </p>
          <p className="mt-2 text-sm text-cream/60">Countries of origin</p>
        </div>
        <div>
          <p className="font-display text-5xl text-cream">
            {Math.min(...brands.map((b) => parseInt(b.founded) || 2024))}
          </p>
          <p className="mt-2 text-sm text-cream/60">Oldest brand founded</p>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/reviews" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white">
          Read sauce reviews
        </Link>
        <Link href="/peppers" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white">
          Pepper encyclopedia
        </Link>
        <Link href="/shop" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white">
          Shop all picks
        </Link>
      </div>
    </section>
  );
}
