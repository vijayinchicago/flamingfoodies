import Link from "next/link";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { WebPageSchema } from "@/components/schema/web-page-schema";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import {
  PEPPERS,
  HEAT_TIERS,
  formatScoville,
  type FlavorNote,
  type HeatTier,
  type Pepper,
  type PepperOrigin
} from "@/lib/peppers";

const ALL_FLAVORS: FlavorNote[] = [
  "fruity", "smoky", "earthy", "vegetal", "citrus", "floral", "tropical", "nutty", "bitter", "sweet"
];

const ALL_HEAT_TIERS: HeatTier[] = ["mild", "medium", "hot", "very-hot", "extreme", "superhot"];

const ALL_ORIGINS: PepperOrigin[] = [
  "mexico", "central-america", "caribbean", "south-america",
  "north-america", "africa", "southeast-asia", "east-asia", "south-asia",
  "europe", "middle-east"
];

function parseParam<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v) return undefined;
  return (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
}

function filterPeppers(
  peppers: Pepper[],
  filters: { heat?: HeatTier; flavor?: FlavorNote; origin?: PepperOrigin }
): Pepper[] {
  return peppers.filter((p) => {
    if (filters.heat && p.heatTier !== filters.heat) return false;
    if (filters.flavor && !p.flavorNotes?.includes(filters.flavor)) return false;
    if (filters.origin && p.origin !== filters.origin) return false;
    return true;
  });
}

function buildHref(base: Record<string, string | undefined>, override: Record<string, string | undefined>) {
  const merged = { ...base, ...override };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/peppers/find?${qs}` : "/peppers/find";
}

function summarize(filters: { heat?: HeatTier; flavor?: FlavorNote; origin?: PepperOrigin }, total: number): string {
  const parts: string[] = [];
  if (filters.heat) parts.push(HEAT_TIERS[filters.heat].label.toLowerCase());
  if (filters.flavor) parts.push(filters.flavor);
  if (filters.origin) parts.push(`from ${filters.origin.replace(/-/g, " ")}`);
  const desc = parts.length ? parts.join(", ") : "all peppers";
  return `${total} pepper${total === 1 ? "" : "s"} — ${desc}`;
}

export async function generateMetadata({
  searchParams
}: {
  searchParams?: { heat?: string; flavor?: string; origin?: string };
}) {
  const heat = parseParam(searchParams?.heat, ALL_HEAT_TIERS);
  const flavor = parseParam(searchParams?.flavor, ALL_FLAVORS);
  const origin = parseParam(searchParams?.origin, ALL_ORIGINS);
  const segments: string[] = [];
  if (heat) segments.push(`${HEAT_TIERS[heat].label.toLowerCase()} heat`);
  if (flavor) segments.push(`${flavor} flavor`);
  if (origin) segments.push(`from ${origin.replace(/-/g, " ")}`);
  const title = segments.length
    ? `Peppers: ${segments.join(", ")}`
    : "Find a pepper by heat, flavor, or origin";
  return buildMetadata({
    title: `${title} | FlamingFoodies`,
    description: "Find a pepper that matches the heat, flavor, and origin you're looking for.",
    path: "/peppers/find"
  });
}

export default async function FindPepperPage({
  searchParams
}: {
  searchParams?: { heat?: string; flavor?: string; origin?: string };
}) {
  const heat = parseParam(searchParams?.heat, ALL_HEAT_TIERS);
  const flavor = parseParam(searchParams?.flavor, ALL_FLAVORS);
  const origin = parseParam(searchParams?.origin, ALL_ORIGINS);
  const filters = { heat, flavor, origin };

  const all = PEPPERS;
  const matches = filterPeppers(all, filters);

  const activeQuery: Record<string, string | undefined> = {
    heat: heat,
    flavor: flavor,
    origin: origin
  };

  return (
    <article className="container-shell py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "Pepper Encyclopedia", item: absoluteUrl("/peppers") },
          { name: "Find a pepper", item: absoluteUrl("/peppers/find") }
        ]}
      />
      <WebPageSchema
        name="Find a pepper by heat, flavor, and origin"
        description="Filter peppers by heat tier, flavor notes, and country of origin."
        url={absoluteUrl("/peppers/find")}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Pepper Encyclopedia", href: "/peppers" },
          { label: "Find a pepper" }
        ]}
      />

      <header className="mt-6 max-w-3xl">
        <p className="eyebrow">Find a pepper</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-charcoal sm:text-5xl">
          Find a pepper by heat, flavor, and origin.
        </h1>
        <p className="mt-4 text-lg leading-8 text-charcoal/75">
          Combine any of the three filters below to narrow to peppers that fit what you&apos;re
          cooking, growing, or sourcing. Each result links to a full pepper guide.
        </p>
      </header>

      {/* Filter rail */}
      <section className="mt-8 space-y-5">
        {/* Heat */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Heat</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href={buildHref(activeQuery, { heat: undefined })}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                !heat
                  ? "border-charcoal bg-charcoal text-cream"
                  : "border-charcoal/15 bg-white text-charcoal hover:border-charcoal/30"
              }`}
            >
              Any heat
            </Link>
            {ALL_HEAT_TIERS.map((tier) => (
              <Link
                key={tier}
                href={buildHref(activeQuery, { heat: heat === tier ? undefined : tier })}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  heat === tier
                    ? "border-ember bg-ember text-white"
                    : "border-charcoal/15 bg-white text-charcoal hover:border-charcoal/30"
                }`}
              >
                {HEAT_TIERS[tier].label}
              </Link>
            ))}
          </div>
        </div>

        {/* Flavor */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Flavor notes</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href={buildHref(activeQuery, { flavor: undefined })}
              className={`rounded-full border px-4 py-2 text-sm font-semibold capitalize transition ${
                !flavor
                  ? "border-charcoal bg-charcoal text-cream"
                  : "border-charcoal/15 bg-white text-charcoal hover:border-charcoal/30"
              }`}
            >
              Any flavor
            </Link>
            {ALL_FLAVORS.map((f) => (
              <Link
                key={f}
                href={buildHref(activeQuery, { flavor: flavor === f ? undefined : f })}
                className={`rounded-full border px-4 py-2 text-sm font-semibold capitalize transition ${
                  flavor === f
                    ? "border-charcoal bg-charcoal text-cream"
                    : "border-charcoal/15 bg-white text-charcoal hover:border-charcoal/30"
                }`}
              >
                {f}
              </Link>
            ))}
          </div>
        </div>

        {/* Origin */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Origin</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href={buildHref(activeQuery, { origin: undefined })}
              className={`rounded-full border px-4 py-2 text-sm font-semibold capitalize transition ${
                !origin
                  ? "border-charcoal bg-charcoal text-cream"
                  : "border-charcoal/15 bg-white text-charcoal hover:border-charcoal/30"
              }`}
            >
              Anywhere
            </Link>
            {ALL_ORIGINS.map((o) => (
              <Link
                key={o}
                href={buildHref(activeQuery, { origin: origin === o ? undefined : o })}
                className={`rounded-full border px-4 py-2 text-sm font-semibold capitalize transition ${
                  origin === o
                    ? "border-charcoal bg-charcoal text-cream"
                    : "border-charcoal/15 bg-white text-charcoal hover:border-charcoal/30"
                }`}
              >
                {o.replace(/-/g, " ")}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Results header */}
      <div className="mt-10 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl text-charcoal sm:text-3xl">{summarize(filters, matches.length)}</h2>
        {(heat || flavor || origin) ? (
          <Link href="/peppers/find" className="text-sm font-semibold text-ember hover:underline">
            Clear filters
          </Link>
        ) : null}
      </div>

      {/* Results */}
      {matches.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((p) => {
            const tier = HEAT_TIERS[p.heatTier];
            return (
              <Link
                key={p.slug}
                href={`/peppers/${p.slug}`}
                className="panel p-5 transition hover:border-charcoal/20"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tier.bgClass} ${tier.textClass}`}>
                    {tier.label}
                  </span>
                  <span className="text-xs text-charcoal/55">
                    {formatScoville(p.scovilleMin, p.scovilleMax)}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-2xl text-charcoal">{p.name}</h3>
                <p className="mt-2 text-sm leading-6 text-charcoal/70">{p.flavorProfile}</p>
                {p.flavorNotes?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.flavorNotes.slice(0, 3).map((note) => (
                      <span
                        key={note}
                        className="rounded-full bg-ember/[0.08] px-2 py-0.5 text-[10px] font-semibold capitalize text-ember"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="panel mt-6 p-7">
          <p className="eyebrow">No match</p>
          <h3 className="mt-2 font-display text-2xl text-charcoal">
            No peppers fit all of those filters.
          </h3>
          <p className="mt-3 text-sm leading-6 text-charcoal/70">
            Clear one of the filters above, or browse the{" "}
            <Link href="/peppers" className="font-semibold text-charcoal underline underline-offset-4">
              full encyclopedia
            </Link>
            .
          </p>
        </div>
      )}
    </article>
  );
}
