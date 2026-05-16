import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { WebPageSchema } from "@/components/schema/web-page-schema";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import {
  PEPPERS,
  getPepperBySlug,
  getPeppersFromDb,
  HEAT_TIERS,
  formatScoville,
  type Pepper
} from "@/lib/peppers";

// Pre-build the most common pairs: each pepper compared with every other one in
// the seed catalogue. Larger catalogues should narrow this to the top-N popular
// pairs to keep the build small.
export async function generateStaticParams() {
  const peppers = PEPPERS;
  const pairs: Array<{ a: string; b: string }> = [];
  for (let i = 0; i < peppers.length; i += 1) {
    for (let j = 0; j < peppers.length; j += 1) {
      if (i === j) continue;
      pairs.push({ a: peppers[i].slug, b: peppers[j].slug });
    }
  }
  return pairs;
}

export const dynamicParams = true;

function multiplier(a: Pepper, b: Pepper): string | null {
  const aMid = (a.scovilleMin + a.scovilleMax) / 2;
  const bMid = (b.scovilleMin + b.scovilleMax) / 2;
  if (!aMid || !bMid) return null;
  if (aMid === bMid) return null;
  const ratio = aMid > bMid ? aMid / bMid : bMid / aMid;
  const hotter = aMid > bMid ? a : b;
  const cooler = aMid > bMid ? b : a;
  return `${hotter.name} is roughly ${ratio.toFixed(ratio >= 10 ? 0 : 1)}× hotter than ${cooler.name}`;
}

export async function generateMetadata({ params }: { params: { a: string; b: string } }) {
  const a = getPepperBySlug(params.a);
  const b = getPepperBySlug(params.b);
  if (!a || !b) return buildMetadata({ title: "Compare peppers | FlamingFoodies", description: "" });
  const title = `${a.name} vs ${b.name}: Scoville, Flavor, and Heat Compared`;
  const description = `Side-by-side comparison of ${a.name} and ${b.name}: scoville, flavor profile, culinary uses, and which to pick.`;
  return buildMetadata({
    title: `${title} | FlamingFoodies`,
    description,
    path: `/peppers/compare/${a.slug}/${b.slug}`
  });
}

function ComparePanel({ pepper }: { pepper: Pepper }) {
  const tier = HEAT_TIERS[pepper.heatTier];
  return (
    <div className="panel p-7">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${tier.bgClass} ${tier.textClass}`}>
          {tier.label}
        </span>
        <span className="rounded-full border border-charcoal/10 bg-charcoal/[0.04] px-3 py-1 text-xs text-charcoal/65">
          {formatScoville(pepper.scovilleMin, pepper.scovilleMax)}
        </span>
      </div>
      <Link
        href={`/peppers/${pepper.slug}`}
        className="mt-4 block font-display text-3xl text-charcoal hover:text-ember sm:text-4xl"
      >
        {pepper.name}
      </Link>
      <p className="mt-2 text-xs capitalize text-charcoal/55">
        From {pepper.origin.replace(/-/g, " ")}
      </p>
      <dl className="mt-5 space-y-3 text-sm">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Flavor</dt>
          <dd className="mt-1 leading-6 text-charcoal/75">{pepper.flavorProfile}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Color</dt>
          <dd className="mt-1 text-charcoal/75">{pepper.color}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Best uses</dt>
          <dd className="mt-1 leading-6 text-charcoal/75">
            {pepper.culinaryUses.slice(0, 3).join(" · ")}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Pairs with</dt>
          <dd className="mt-1 leading-6 text-charcoal/75">
            {pepper.pairsWith.slice(0, 4).join(", ")}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export default async function ComparePage({ params }: { params: { a: string; b: string } }) {
  if (params.a === params.b) notFound();
  const a = getPepperBySlug(params.a);
  const b = getPepperBySlug(params.b);
  if (!a || !b) {
    // Fall back to DB-backed lookup in case the catalogue is loaded remotely.
    const dbPeppers = await getPeppersFromDb();
    const fa = a ?? dbPeppers.find((p) => p.slug === params.a);
    const fb = b ?? dbPeppers.find((p) => p.slug === params.b);
    if (!fa || !fb) notFound();
    return renderCompare(fa, fb);
  }
  return renderCompare(a, b);
}

function renderCompare(a: Pepper, b: Pepper) {
  const path = `/peppers/compare/${a.slug}/${b.slug}`;
  const heatRel = multiplier(a, b);
  const hotter = a.scovilleMax > b.scovilleMax ? a : b;
  const cooler = a.scovilleMax > b.scovilleMax ? b : a;

  return (
    <article className="container-shell py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "Pepper Encyclopedia", item: absoluteUrl("/peppers") },
          { name: `${a.name} vs ${b.name}`, item: absoluteUrl(path) }
        ]}
      />
      <WebPageSchema
        name={`${a.name} vs ${b.name}`}
        description={`Compare ${a.name} and ${b.name}: scoville, flavor, and culinary use.`}
        url={absoluteUrl(path)}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Pepper Encyclopedia", href: "/peppers" },
          { label: `${a.name} vs ${b.name}` }
        ]}
      />

      <header className="mt-6">
        <p className="eyebrow">Pepper comparison</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-charcoal sm:text-5xl lg:text-6xl">
          {a.name} <span className="text-charcoal/45">vs</span> {b.name}
        </h1>
        {heatRel ? (
          <p className="mt-4 max-w-3xl text-lg leading-8 text-charcoal/75">{heatRel}.</p>
        ) : null}
      </header>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <ComparePanel pepper={a} />
        <ComparePanel pepper={b} />
      </section>

      <section className="mt-12 rounded-[2rem] border border-charcoal/10 bg-charcoal/[0.04] p-7 sm:p-8">
        <p className="eyebrow">Quick verdict</p>
        <h2 className="mt-2 font-display text-3xl text-charcoal">Which one to use</h2>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-charcoal/80">
          <li className="flex gap-3">
            <span className="mt-0.5 shrink-0 text-ember">—</span>
            <span>
              <strong className="text-charcoal">If you want more heat:</strong> reach for{" "}
              <Link href={`/peppers/${hotter.slug}`} className="font-semibold text-charcoal underline underline-offset-4">
                {hotter.name}
              </Link>{" "}
              ({formatScoville(hotter.scovilleMin, hotter.scovilleMax)}).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 shrink-0 text-ember">—</span>
            <span>
              <strong className="text-charcoal">If you want manageable heat:</strong> use{" "}
              <Link href={`/peppers/${cooler.slug}`} className="font-semibold text-charcoal underline underline-offset-4">
                {cooler.name}
              </Link>{" "}
              ({formatScoville(cooler.scovilleMin, cooler.scovilleMax)}).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 shrink-0 text-ember">—</span>
            <span>
              <strong className="text-charcoal">For {a.name}-style flavor:</strong> {a.flavorProfile.toLowerCase()}
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 shrink-0 text-ember">—</span>
            <span>
              <strong className="text-charcoal">For {b.name}-style flavor:</strong> {b.flavorProfile.toLowerCase()}
            </span>
          </li>
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap gap-3 text-sm">
        <Link
          href={`/peppers/${a.slug}`}
          className="rounded-full border border-charcoal/15 px-4 py-2 font-semibold text-charcoal hover:border-charcoal/30"
        >
          Full {a.name} guide →
        </Link>
        <Link
          href={`/peppers/${b.slug}`}
          className="rounded-full border border-charcoal/15 px-4 py-2 font-semibold text-charcoal hover:border-charcoal/30"
        >
          Full {b.name} guide →
        </Link>
        <Link
          href="/peppers/scoville-scale"
          className="rounded-full border border-charcoal/15 px-4 py-2 font-semibold text-charcoal hover:border-charcoal/30"
        >
          Full scoville scale →
        </Link>
      </div>
    </article>
  );
}
