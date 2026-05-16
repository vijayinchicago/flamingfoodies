import Link from "next/link";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { FaqSchema } from "@/components/schema/faq-schema";
import { WebPageSchema } from "@/components/schema/web-page-schema";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import {
  HEAT_TIERS,
  formatScoville,
  getPepperBySlug,
  getPeppersFromDb,
  type Pepper,
  type PepperSubstitute
} from "@/lib/peppers";

export const metadata = buildMetadata({
  title: "Pepper Substitutes: A Complete Reference Guide | FlamingFoodies",
  description:
    "What to use when a recipe calls for a pepper you don't have. Curated substitutes for every major chile pepper, with ratios and flavor notes — jalapeño, habanero, ghost pepper, ancho, and more.",
  path: "/peppers/substitutes"
});

const TOP_FAQS = [
  {
    question: "What's the best all-purpose pepper substitute?",
    answer:
      "For most home cooking situations, the jalapeño is the most universal swap — it's widely available, predictable, and has neutral enough flavor to slot into recipes calling for serrano, Fresno, banana pepper, or even mild Hatch chile (with quantity adjustments). For dried Mexican applications, ancho is the most universally available stand-in."
  },
  {
    question: "How do you adjust quantities when substituting peppers?",
    answer:
      "The general rule is to swap by Scoville heat: divide the original pepper's heat by the substitute's heat to get the quantity multiplier. For example, replacing one habanero (~150,000 SHU) with serrano (~15,000 SHU) means using about 10 times the amount — though usually you'd use 2–3 to avoid blowing out the flavor. Always taste as you go."
  },
  {
    question: "Can I always substitute red pepper flakes for fresh chiles?",
    answer:
      "Not really. Red pepper flakes deliver heat without the fresh-pepper flavor (vegetal, fruity, smoky notes that depend on the cultivar). For sauces and cooked applications they often work; for raw applications (salsa, salads, ceviche) the flake substitution loses what made the recipe what it is."
  },
  {
    question: "What's the best substitute for dried Mexican chiles like ancho or guajillo?",
    answer:
      "Within the dried Mexican family, ancho, pasilla, and guajillo are often used together and can partially substitute for each other. Ancho is sweetest, pasilla is earthiest, guajillo is tangiest. New Mexico dried red chiles work as a partial swap. Smoked paprika plus a pinch of cayenne approximates the heat and color but loses the chile-specific flavor."
  }
];

type SubstituteEntry = { pepper: Pepper; substitute: PepperSubstitute; resolved: Pepper };

export default async function PepperSubstitutesPage() {
  const peppers = await getPeppersFromDb();

  // Build the complete substitute map. Each pepper's substitutes are resolved
  // to full Pepper objects so we can render heat data and slug links inline.
  const entries: Array<{ source: Pepper; substitutes: Array<{ substitute: PepperSubstitute; resolved: Pepper }> }> = [];
  for (const source of peppers) {
    if (!source.substitutes?.length) continue;
    const resolved: Array<{ substitute: PepperSubstitute; resolved: Pepper }> = [];
    for (const sub of source.substitutes) {
      const r = getPepperBySlug(sub.slug);
      if (r) resolved.push({ substitute: sub, resolved: r });
    }
    if (resolved.length > 0) entries.push({ source, substitutes: resolved });
  }

  // Index of "reverse" substitutes: for each pepper, which other peppers list IT
  // as a substitute. This is the "X is a substitute for which peppers?" angle —
  // useful when you HAVE a pepper and want to know what it could stand in for.
  const reverse = new Map<string, SubstituteEntry[]>();
  for (const { source, substitutes } of entries) {
    for (const { substitute, resolved } of substitutes) {
      const list = reverse.get(resolved.slug) ?? [];
      list.push({ pepper: source, substitute, resolved });
      reverse.set(resolved.slug, list);
    }
  }

  return (
    <article className="container-shell py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "Pepper Encyclopedia", item: absoluteUrl("/peppers") },
          { name: "Substitutes", item: absoluteUrl("/peppers/substitutes") }
        ]}
      />
      <WebPageSchema
        name="Pepper Substitutes: A Complete Reference Guide"
        description="Curated substitutes for every major chile pepper, with ratios and flavor notes."
        url={absoluteUrl("/peppers/substitutes")}
      />
      <FaqSchema faqs={TOP_FAQS} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Pepper Encyclopedia", href: "/peppers" },
          { label: "Substitutes" }
        ]}
      />

      <header className="mt-6 max-w-3xl">
        <p className="eyebrow">Pepper substitutes</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-charcoal sm:text-5xl lg:text-6xl">
          What to use when the recipe calls for a pepper you don&apos;t have.
        </h1>
        <p className="mt-5 text-lg leading-8 text-charcoal/75">
          Every pepper in the FlamingFoodies encyclopedia carries a list of curated substitutes —
          with ratios, flavor notes, and the reason each swap works. This page aggregates them
          into one searchable reference, plus a reverse index for when you have a pepper and
          want to know what it can stand in for.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <a href="#by-pepper" className="rounded-full border border-charcoal/15 px-4 py-2 font-semibold text-charcoal hover:border-charcoal/30">Find substitutes for a pepper</a>
          <a href="#reverse" className="rounded-full border border-charcoal/15 px-4 py-2 font-semibold text-charcoal hover:border-charcoal/30">What can this pepper replace</a>
          <a href="#faq" className="rounded-full border border-charcoal/15 px-4 py-2 font-semibold text-charcoal hover:border-charcoal/30">FAQ</a>
        </div>
      </header>

      {/* Forward index: For each pepper, what can you use instead? */}
      <section id="by-pepper" className="mt-12">
        <p className="eyebrow">Find substitutes for a pepper</p>
        <h2 className="mt-2 font-display text-3xl text-charcoal sm:text-4xl">
          Looking for a substitute for a specific pepper?
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-charcoal/75">
          Find the pepper you can&apos;t source on the left, see its curated substitutes on the
          right. Each entry includes a quantity ratio and an editorial reason the swap works.
        </p>
        <div className="mt-8 space-y-6">
          {entries.map(({ source, substitutes }) => {
            const sourceTier = HEAT_TIERS[source.heatTier];
            return (
              <div key={source.slug} className="rounded-[1.75rem] border border-charcoal/10 bg-white p-6 sm:p-7">
                <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${sourceTier.bgClass} ${sourceTier.textClass}`}>
                        {sourceTier.label}
                      </span>
                      <span className="text-xs text-charcoal/55">
                        {formatScoville(source.scovilleMin, source.scovilleMax)}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-2xl text-charcoal">
                      <Link href={`/peppers/${source.slug}`} className="hover:text-ember">
                        Replace {source.name}
                      </Link>
                    </h3>
                    <p className="mt-2 text-xs text-charcoal/55">
                      {source.flavorProfile}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {substitutes.map(({ substitute, resolved }) => {
                      const subTier = HEAT_TIERS[resolved.heatTier];
                      return (
                        <Link
                          key={resolved.slug}
                          href={`/peppers/${resolved.slug}`}
                          className="block rounded-[1.25rem] border border-charcoal/10 bg-charcoal/[0.04] p-4 transition hover:border-ember hover:bg-charcoal/[0.06]"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h4 className="font-display text-lg text-charcoal">
                              Use {resolved.name}
                            </h4>
                            {substitute.ratio ? (
                              <span className="rounded-full border border-charcoal/15 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-charcoal">
                                {substitute.ratio}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${subTier.bgClass} ${subTier.textClass}`}>
                              {subTier.label}
                            </span>
                            <span className="text-[11px] text-charcoal/55">
                              {formatScoville(resolved.scovilleMin, resolved.scovilleMax)}
                            </span>
                          </div>
                          {substitute.note ? (
                            <p className="mt-3 text-sm leading-6 text-charcoal/75">{substitute.note}</p>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Reverse index */}
      <section id="reverse" className="mt-16 rounded-[2rem] border border-charcoal/10 bg-charcoal/[0.04] p-7 sm:p-8">
        <p className="eyebrow">Have a pepper, need a use</p>
        <h2 className="mt-2 font-display text-3xl text-charcoal sm:text-4xl">
          What can this pepper replace?
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-charcoal/75">
          The reverse lookup: when you have a specific pepper on hand and want to know which
          recipes (or other peppers) it can stand in for. This is built from the same curated
          substitute data, just inverted.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from(reverse.entries()).map(([slug, replacesList]) => {
            const subPepper = getPepperBySlug(slug);
            if (!subPepper) return null;
            const tier = HEAT_TIERS[subPepper.heatTier];
            return (
              <div key={slug} className="rounded-[1.5rem] border border-charcoal/10 bg-white p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tier.bgClass} ${tier.textClass}`}>
                    {tier.label}
                  </span>
                  <span className="text-[11px] text-charcoal/55">
                    {formatScoville(subPepper.scovilleMin, subPepper.scovilleMax)}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-xl text-charcoal">
                  <Link href={`/peppers/${subPepper.slug}`} className="hover:text-ember">
                    {subPepper.name}
                  </Link>{" "}
                  can replace
                </h3>
                <ul className="mt-3 space-y-1 text-sm leading-6 text-charcoal/75">
                  {replacesList.map(({ pepper, substitute }) => (
                    <li key={pepper.slug} className="flex items-baseline gap-2">
                      <Link href={`/peppers/${pepper.slug}`} className="font-semibold text-charcoal hover:text-ember">
                        {pepper.name}
                      </Link>
                      {substitute.ratio ? (
                        <span className="text-xs text-charcoal/55">({substitute.ratio})</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQs */}
      <section id="faq" className="mt-16">
        <p className="eyebrow">Frequently asked</p>
        <h2 className="mt-2 font-display text-3xl text-charcoal sm:text-4xl">
          Common questions about substituting peppers
        </h2>
        <div className="mt-6 divide-y divide-charcoal/10 rounded-[1.5rem] border border-charcoal/10 bg-white">
          {TOP_FAQS.map((faq) => (
            <details key={faq.question} className="group p-5 sm:p-6">
              <summary className="cursor-pointer list-none text-base font-semibold text-charcoal">
                {faq.question}
              </summary>
              <p className="mt-3 text-sm leading-7 text-charcoal/75">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section className="mt-16 grid gap-4 md:grid-cols-3">
        <Link href="/peppers/guide" className="panel p-6 transition hover:border-charcoal/20">
          <p className="eyebrow">Pillar</p>
          <h3 className="mt-2 font-display text-xl text-charcoal">The complete guide to chile peppers</h3>
          <p className="mt-2 text-sm leading-6 text-charcoal/70">
            Heat tiers, species, regional traditions, and how to pick the right pepper.
          </p>
        </Link>
        <Link href="/peppers/find" className="panel p-6 transition hover:border-charcoal/20">
          <p className="eyebrow">Tool</p>
          <h3 className="mt-2 font-display text-xl text-charcoal">Find a pepper</h3>
          <p className="mt-2 text-sm leading-6 text-charcoal/70">
            Filter by heat, flavor, and origin.
          </p>
        </Link>
        <Link href="/peppers/compare" className="panel p-6 transition hover:border-charcoal/20">
          <p className="eyebrow">Tool</p>
          <h3 className="mt-2 font-display text-xl text-charcoal">Compare two peppers</h3>
          <p className="mt-2 text-sm leading-6 text-charcoal/70">
            Side-by-side scoville, flavor, and verdict.
          </p>
        </Link>
      </section>
    </article>
  );
}
