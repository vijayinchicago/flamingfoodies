import Link from "next/link";
import { notFound } from "next/navigation";

import { AffiliateLink } from "@/components/content/affiliate-link";
import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { EmailCapture } from "@/components/forms/email-capture";
import { RecipeCard } from "@/components/cards/recipe-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { FaqSchema } from "@/components/schema/faq-schema";
import { WebPageSchema } from "@/components/schema/web-page-schema";
import { AFFILIATE_LINKS, resolveAffiliateLink } from "@/lib/affiliates";
import { buildMetadata } from "@/lib/seo";
import { getRecipes } from "@/lib/services/content";
import { absoluteUrl } from "@/lib/utils";
import {
  PEPPERS,
  getPeppersFromDb,
  getPepperFromDb,
  resolveSubstitutes,
  getNeighborInScovilleScale,
  HEAT_TIERS,
  formatScoville
} from "@/lib/peppers";

const SPECIES_LABEL: Record<string, string> = {
  annuum: "C. annuum",
  chinense: "C. chinense",
  frutescens: "C. frutescens",
  pubescens: "C. pubescens",
  baccatum: "C. baccatum"
};

const PEPPER_TYPE_LABEL: Record<string, string> = {
  "fresh-pod": "Fresh pod",
  drying: "Drying chile",
  smoking: "Smoked chile",
  superhot: "Superhot",
  sweet: "Sweet"
};

export async function generateStaticParams() {
  try {
    const peppers = await getPeppersFromDb();
    return peppers.map((p) => ({ slug: p.slug }));
  } catch {
    return PEPPERS.map((p) => ({ slug: p.slug }));
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const pepper = await getPepperFromDb(params.slug);
  if (!pepper) return buildMetadata({ title: "Pepper | FlamingFoodies", description: "" });
  return buildMetadata({
    title: `${pepper.name}: Scoville, Flavor, Substitutes & Growing | FlamingFoodies`,
    description: pepper.description,
    path: `/peppers/${pepper.slug}`
  });
}

export default async function PepperPage({ params }: { params: { slug: string } }) {
  const pepper = await getPepperFromDb(params.slug);
  if (!pepper) notFound();

  const sourcePage = `/peppers/${pepper.slug}`;
  const tierMeta = HEAT_TIERS[pepper.heatTier];

  const affiliateItems = pepper.affiliateKeys
    .map((key) => {
      const entry = AFFILIATE_LINKS[key];
      const resolved = resolveAffiliateLink(key, { sourcePage, position: "pepper-affiliate" });
      if (!entry || !resolved) return null;
      return { key, entry, resolved };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const allRecipes = await getRecipes();
  const relatedRecipes = allRecipes
    .filter((r) => {
      const text = [r.title, r.description, r.cuisineType ?? "", ...(r.tags ?? [])].join(" ").toLowerCase();
      return pepper.recipeTagMatch.some((tag) => text.includes(tag.toLowerCase())) ||
        text.includes(pepper.name.toLowerCase());
    })
    .slice(0, 3);
  const displayRecipes = relatedRecipes.length >= 1 ? relatedRecipes : allRecipes.slice(0, 3);

  const allPeppers = await getPeppersFromDb();
  const nearbyPeppers = allPeppers
    .filter((p) => p.slug !== pepper.slug && p.heatTier === pepper.heatTier)
    .slice(0, 6);

  const substitutes = resolveSubstitutes(pepper);
  const hotterNeighbor = getNeighborInScovilleScale(pepper, "hotter");
  const milderNeighbor = getNeighborInScovilleScale(pepper, "milder");

  // Quick facts for the at-a-glance strip
  const quickFacts: Array<{ label: string; value: string }> = [
    { label: "Scoville", value: formatScoville(pepper.scovilleMin, pepper.scovilleMax) },
    { label: "Heat", value: tierMeta.label },
    { label: "Origin", value: pepper.origin.replace(/-/g, " ") }
  ];
  if (pepper.species) quickFacts.push({ label: "Species", value: SPECIES_LABEL[pepper.species] ?? pepper.species });
  if (pepper.pepperType) quickFacts.push({ label: "Type", value: PEPPER_TYPE_LABEL[pepper.pepperType] ?? pepper.pepperType });
  if (pepper.growing?.plantHeight) quickFacts.push({ label: "Plant height", value: pepper.growing.plantHeight });

  return (
    <article className="container-shell py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "Pepper Encyclopedia", item: absoluteUrl("/peppers") },
          { name: pepper.name, item: absoluteUrl(sourcePage) }
        ]}
      />
      <WebPageSchema
        name={`${pepper.name}: Scoville, Flavor, Substitutes & Growing`}
        description={pepper.description}
        url={absoluteUrl(sourcePage)}
      />
      {pepper.faqs?.length ? <FaqSchema faqs={pepper.faqs} /> : null}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Pepper Encyclopedia", href: "/peppers" },
          { label: pepper.name }
        ]}
      />

      {/* Hero */}
      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${tierMeta.bgClass} ${tierMeta.textClass}`}>
            {tierMeta.label} heat
          </span>
          <span className="rounded-full border border-charcoal/10 bg-charcoal/[0.04] px-3 py-1 text-xs text-charcoal/65">
            {formatScoville(pepper.scovilleMin, pepper.scovilleMax)}
          </span>
          <span className="rounded-full border border-charcoal/10 px-3 py-1 text-xs capitalize text-charcoal/55">
            {pepper.origin.replace(/-/g, " ")}
          </span>
        </div>
        <h1 className="mt-5 font-display text-4xl leading-tight text-charcoal sm:text-5xl lg:text-6xl">
          {pepper.name}
        </h1>
        {pepper.aliases.length > 0 ? (
          <p className="mt-2 text-sm text-charcoal/55">
            Also known as: {pepper.aliases.join(", ")}
          </p>
        ) : null}
        <p className="mt-5 max-w-3xl text-lg leading-8 text-charcoal/75">{pepper.description}</p>
      </header>

      {/* Quick facts strip — above the fold reference */}
      <section className="mt-8 grid grid-cols-2 gap-2 rounded-[1.5rem] border border-charcoal/10 bg-white p-4 sm:grid-cols-3 md:grid-cols-6">
        {quickFacts.map((fact) => (
          <div key={fact.label} className="px-2 py-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">{fact.label}</p>
            <p className="mt-1 text-sm font-semibold capitalize text-charcoal">{fact.value}</p>
          </div>
        ))}
      </section>

      {/* Heat profile with comparison anchors */}
      <section className="mt-12">
        <p className="eyebrow">Heat profile</p>
        <h2 className="mt-2 font-display text-3xl text-charcoal">
          {tierMeta.label} heat — {formatScoville(pepper.scovilleMin, pepper.scovilleMax)}
        </h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          {milderNeighbor ? (
            <Link
              href={`/peppers/${milderNeighbor.slug}`}
              className="rounded-[1.25rem] border border-charcoal/10 bg-charcoal/[0.04] p-4 transition hover:border-charcoal/20"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-charcoal/55">Step milder</p>
              <p className="mt-2 font-display text-xl text-charcoal">{milderNeighbor.name}</p>
              <p className="mt-1 text-xs text-charcoal/55">
                {formatScoville(milderNeighbor.scovilleMin, milderNeighbor.scovilleMax)}
              </p>
            </Link>
          ) : <div />}
          <div className={`rounded-[1.25rem] border p-4 ${tierMeta.bgClass} border-charcoal/10`}>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${tierMeta.textClass}`}>This pepper</p>
            <p className="mt-2 font-display text-xl text-charcoal">{pepper.name}</p>
            <p className="mt-1 text-xs text-charcoal/65">
              {formatScoville(pepper.scovilleMin, pepper.scovilleMax)}
            </p>
          </div>
          {hotterNeighbor ? (
            <Link
              href={`/peppers/${hotterNeighbor.slug}`}
              className="rounded-[1.25rem] border border-charcoal/10 bg-charcoal/[0.04] p-4 transition hover:border-charcoal/20"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-charcoal/55">Step hotter</p>
              <p className="mt-2 font-display text-xl text-charcoal">{hotterNeighbor.name}</p>
              <p className="mt-1 text-xs text-charcoal/55">
                {formatScoville(hotterNeighbor.scovilleMin, hotterNeighbor.scovilleMax)}
              </p>
            </Link>
          ) : <div />}
        </div>
        <Link
          href="/peppers/scoville-scale"
          className="mt-4 inline-flex text-sm font-semibold text-ember hover:underline"
        >
          See the full scoville scale →
        </Link>
      </section>

      {/* Flavor profile */}
      <section className="mt-12 grid gap-6 lg:grid-cols-3">
        <div className="panel p-7 lg:col-span-2">
          <p className="eyebrow">Flavor profile</p>
          <p className="mt-4 text-sm leading-7 text-charcoal/80">{pepper.flavorProfile}</p>
          <p className="mt-4 text-sm leading-8 text-charcoal/75">{pepper.editorialNote}</p>
          {pepper.flavorNotes?.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {pepper.flavorNotes.map((note) => (
                <span
                  key={note}
                  className="rounded-full border border-ember/30 bg-ember/[0.08] px-3 py-1 text-xs font-semibold capitalize text-ember"
                >
                  {note}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="space-y-4">
          <div className="panel p-6">
            <p className="eyebrow">Color</p>
            <p className="mt-3 text-sm text-charcoal/75">{pepper.color}</p>
          </div>
          <div className="panel p-6">
            <p className="eyebrow">Did you know</p>
            <p className="mt-3 text-sm leading-7 text-charcoal/75">{pepper.funFact}</p>
          </div>
        </div>
      </section>

      {/* Culinary uses */}
      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="panel p-7">
          <p className="eyebrow">How to use it</p>
          <ul className="mt-4 space-y-3">
            {pepper.culinaryUses.map((use) => (
              <li key={use} className="flex gap-3 text-sm leading-7 text-charcoal/75">
                <span className="mt-0.5 shrink-0 text-ember">—</span>
                <span>{use}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel p-7">
          <p className="eyebrow">Pairs well with</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {pepper.pairsWith.map((pair) => (
              <span
                key={pair}
                className="rounded-full border border-charcoal/10 bg-charcoal/[0.04] px-3 py-1.5 text-sm text-charcoal/75"
              >
                {pair}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Substitutes — only when populated */}
      {substitutes.length > 0 ? (
        <section className="mt-12">
          <p className="eyebrow">Substitutes</p>
          <h2 className="mt-2 font-display text-3xl text-charcoal">
            Can&apos;t find {pepper.name.toLowerCase()}? Try one of these.
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {substitutes.map((sub) => (
              <Link
                key={sub.pepper.slug}
                href={`/peppers/${sub.pepper.slug}`}
                className="panel p-5 transition hover:border-charcoal/20"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-xl text-charcoal">{sub.pepper.name}</h3>
                  {sub.ratio ? (
                    <span className="rounded-full border border-charcoal/15 px-2 py-0.5 text-xs font-semibold text-charcoal/70">
                      {sub.ratio}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-charcoal/55">
                  {formatScoville(sub.pepper.scovilleMin, sub.pepper.scovilleMax)}
                </p>
                {sub.note ? (
                  <p className="mt-3 text-sm leading-6 text-charcoal/70">{sub.note}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* How to grow it — only when populated */}
      {pepper.growing ? (
        <section className="mt-12 rounded-[2rem] border border-charcoal/10 bg-charcoal/[0.04] p-7 sm:p-8">
          <p className="eyebrow">How to grow it</p>
          <h2 className="mt-2 font-display text-3xl text-charcoal">
            Growing {pepper.name.toLowerCase()} at home
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pepper.growing.usdaZones ? (
              <div className="rounded-[1rem] bg-white/70 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">USDA zones</p>
                <p className="mt-2 text-sm font-semibold text-charcoal">{pepper.growing.usdaZones}</p>
              </div>
            ) : null}
            {pepper.growing.daysToGerminate ? (
              <div className="rounded-[1rem] bg-white/70 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Germinate</p>
                <p className="mt-2 text-sm font-semibold text-charcoal">{pepper.growing.daysToGerminate} days</p>
              </div>
            ) : null}
            {pepper.growing.daysToHarvest ? (
              <div className="rounded-[1rem] bg-white/70 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">To harvest</p>
                <p className="mt-2 text-sm font-semibold text-charcoal">~{pepper.growing.daysToHarvest} days from transplant</p>
              </div>
            ) : null}
            {pepper.growing.plantHeight ? (
              <div className="rounded-[1rem] bg-white/70 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Plant height</p>
                <p className="mt-2 text-sm font-semibold text-charcoal">{pepper.growing.plantHeight}</p>
              </div>
            ) : null}
            {pepper.growing.sunRequirement ? (
              <div className="rounded-[1rem] bg-white/70 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Sun</p>
                <p className="mt-2 text-sm font-semibold capitalize text-charcoal">{pepper.growing.sunRequirement} sun</p>
              </div>
            ) : null}
            {pepper.growing.waterNeeds ? (
              <div className="rounded-[1rem] bg-white/70 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Water</p>
                <p className="mt-2 text-sm font-semibold capitalize text-charcoal">{pepper.growing.waterNeeds}</p>
              </div>
            ) : null}
            {pepper.growing.containerFriendly !== undefined ? (
              <div className="rounded-[1rem] bg-white/70 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Container</p>
                <p className="mt-2 text-sm font-semibold text-charcoal">
                  {pepper.growing.containerFriendly ? "Container-friendly" : "Garden bed preferred"}
                </p>
              </div>
            ) : null}
          </div>
          {pepper.growing.notes ? (
            <p className="mt-5 max-w-3xl text-sm leading-7 text-charcoal/75">{pepper.growing.notes}</p>
          ) : null}
        </section>
      ) : null}

      {/* Where to buy — only when populated */}
      {pepper.buying ? (
        <section className="mt-12">
          <p className="eyebrow">Where to find it</p>
          <h2 className="mt-2 font-display text-3xl text-charcoal">
            Buying {pepper.name.toLowerCase()}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {pepper.buying.freshAvailability ? (
              <div className="panel p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Fresh</p>
                <p className="mt-2 text-sm leading-6 text-charcoal/75">{pepper.buying.freshAvailability}</p>
              </div>
            ) : null}
            {pepper.buying.driedAvailability ? (
              <div className="panel p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Dried</p>
                <p className="mt-2 text-sm leading-6 text-charcoal/75">{pepper.buying.driedAvailability}</p>
              </div>
            ) : null}
            {pepper.buying.seasonality ? (
              <div className="panel p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Seasonality</p>
                <p className="mt-2 text-sm leading-6 text-charcoal/75">{pepper.buying.seasonality}</p>
              </div>
            ) : null}
            {pepper.buying.seedSources?.length ? (
              <div className="panel p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Seed sources</p>
                <ul className="mt-2 space-y-1 text-sm leading-6 text-charcoal/75">
                  {pepper.buying.seedSources.map((source) => (
                    <li key={source}>{source}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          {pepper.buying.notes ? (
            <p className="mt-4 max-w-3xl text-sm leading-7 text-charcoal/70">{pepper.buying.notes}</p>
          ) : null}
        </section>
      ) : null}

      {/* History — only when populated */}
      {pepper.history?.story ? (
        <section className="mt-12 rounded-[2rem] border border-charcoal/10 bg-white p-7 sm:p-8">
          <p className="eyebrow">History &amp; origin</p>
          <h2 className="mt-2 font-display text-3xl text-charcoal">
            Where {pepper.name.toLowerCase()} comes from
          </h2>
          {pepper.history.region || pepper.history.era ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {pepper.history.region ? (
                <span className="rounded-full border border-charcoal/10 bg-charcoal/[0.04] px-3 py-1 text-xs text-charcoal/70">
                  {pepper.history.region}
                </span>
              ) : null}
              {pepper.history.era ? (
                <span className="rounded-full border border-charcoal/10 bg-charcoal/[0.04] px-3 py-1 text-xs text-charcoal/70">
                  {pepper.history.era}
                </span>
              ) : null}
            </div>
          ) : null}
          <p className="mt-4 max-w-3xl text-sm leading-8 text-charcoal/75">{pepper.history.story}</p>
        </section>
      ) : null}

      {/* Related recipes */}
      {displayRecipes.length > 0 ? (
        <section className="mt-14">
          <p className="eyebrow">Cook with it</p>
          <h2 className="mt-3 font-display text-3xl text-charcoal sm:text-4xl">
            Recipes that use {pepper.name.toLowerCase()}.
          </h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {displayRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
          <Link
            href="/recipes"
            className="mt-6 inline-flex rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal hover:border-charcoal/30"
          >
            Browse all recipes
          </Link>
        </section>
      ) : null}

      {/* Similar peppers + compare CTA */}
      {nearbyPeppers.length > 0 ? (
        <section className="mt-14 rounded-[2rem] border border-charcoal/10 bg-charcoal/[0.04] p-7 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Similar peppers</p>
              <h2 className="mt-2 font-display text-3xl text-charcoal">
                Other {tierMeta.label.toLowerCase()} peppers
              </h2>
            </div>
            {nearbyPeppers[0] ? (
              <Link
                href={`/peppers/compare/${pepper.slug}/${nearbyPeppers[0].slug}`}
                className="rounded-full bg-charcoal px-4 py-2 text-sm font-semibold text-cream"
              >
                Compare {pepper.name} vs {nearbyPeppers[0].name} →
              </Link>
            ) : null}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {nearbyPeppers.map((p) => (
              <Link
                key={p.slug}
                href={`/peppers/${p.slug}`}
                className="rounded-full border border-charcoal/10 bg-white px-4 py-2 text-sm font-semibold text-charcoal hover:border-charcoal/20"
              >
                {p.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* FAQ — only when populated, with schema */}
      {pepper.faqs?.length ? (
        <section className="mt-14">
          <p className="eyebrow">Frequently asked</p>
          <h2 className="mt-2 font-display text-3xl text-charcoal">
            Common questions about {pepper.name.toLowerCase()}
          </h2>
          <div className="mt-6 divide-y divide-charcoal/10 rounded-[1.5rem] border border-charcoal/10 bg-white">
            {pepper.faqs.map((faq) => (
              <details key={faq.question} className="group p-5 sm:p-6">
                <summary className="cursor-pointer list-none text-base font-semibold text-charcoal">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm leading-7 text-charcoal/75">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {/* Pantry examples (affiliate) — kept at the bottom */}
      {affiliateItems.length > 0 ? (
        <section className="mt-14">
          <AffiliateDisclosure className="max-w-3xl" compact />
          <p className="mt-6 eyebrow">Pantry examples</p>
          <h2 className="mt-3 font-display text-3xl text-charcoal sm:text-4xl">
            If you want to taste {pepper.name.toLowerCase()} in a bottle or pantry product
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-charcoal/72">
            These are optional examples of how this pepper shows up in real products. The profile
            above stands on its own even if you never shop from this section.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {affiliateItems.map(({ key, entry, resolved }) => (
              <article key={key} className="panel p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-ember">
                  {"badge" in entry ? String(entry.badge) : "Example"}
                </p>
                <h3 className="mt-2 font-display text-2xl text-charcoal">{entry.product}</h3>
                <p className="mt-2 text-sm leading-6 text-charcoal/65">
                  {"description" in entry ? String(entry.description) : ""}
                </p>
                <AffiliateLink
                  href={resolved.href}
                  partnerKey={resolved.key}
                  trackingMode={resolved.trackingMode}
                  sourcePage={sourcePage}
                  position="pepper-affiliate"
                  className="mt-4 inline-flex rounded-full border border-charcoal/15 px-4 py-2 text-sm font-semibold text-charcoal hover:border-charcoal/30"
                >
                  View example ↗
                </AffiliateLink>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-14 rounded-[2rem] border border-charcoal/10 bg-charcoal/[0.04] p-6 sm:p-8">
        <EmailCapture
          source="pepper-page"
          tag={pepper.slug}
          defaultSegments={["hot-sauce-shelf"]}
          heading={`Get recipes featuring ${pepper.name}.`}
          description="Weekly hot sauce picks and spicy recipes in your inbox."
        />
      </div>
    </article>
  );
}
