import Link from "next/link";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { WebPageSchema } from "@/components/schema/web-page-schema";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import {
  HEAT_TIERS,
  formatScoville,
  getPeppersFromDb,
  getTierOrder,
  type HeatTier,
  type Pepper,
  type PepperSpecies
} from "@/lib/peppers";

export const metadata = buildMetadata({
  title: "The Complete Guide to Chile Peppers: Heat, Flavor, and How to Use Them | FlamingFoodies",
  description:
    "A practical reference for understanding chile peppers — heat tiers, capsicum species, regional traditions, and how to choose the right pepper for what you're cooking. Links to every pepper guide in the FlamingFoodies encyclopedia.",
  path: "/peppers/guide"
});

const SPECIES_INFO: Record<PepperSpecies, { name: string; description: string }> = {
  annuum: {
    name: "Capsicum annuum",
    description:
      "The most cultivated chile species in the world. Includes jalapeño, serrano, cayenne, poblano, Anaheim, bell pepper, and most of what shows up in mainstream grocery stores. Wide range of heat levels and flavor profiles."
  },
  chinense: {
    name: "Capsicum chinense",
    description:
      "The species responsible for nearly all of the world's hottest peppers. Habanero, scotch bonnet, ghost pepper, Carolina Reaper, 7 Pot family, and Pepper X are all chinense. Defined by fruity, floral aromatics and intense heat."
  },
  frutescens: {
    name: "Capsicum frutescens",
    description:
      "Smaller, vigorous plants with thin-walled, fast-growing pods. Tabasco peppers, malagueta, and piri-piri are all frutescens. Heat is direct and clean; flavor leans citrusy."
  },
  pubescens: {
    name: "Capsicum pubescens",
    description:
      "The Andean species. Rocoto and manzano are the main cultivated examples. Recognizable by fuzzy leaves, black seeds, and a thick-walled apple-shaped pod. Cold-tolerant and slow to fruit."
  },
  baccatum: {
    name: "Capsicum baccatum",
    description:
      "South American species, central to Andean cooking. Ají amarillo, ají limo, and lemon drop are baccatum. Distinctive tropical fruit flavor — passion fruit, mango, and citrus — at moderate-to-hot heat levels."
  }
};

const SPECIES_ORDER: PepperSpecies[] = ["annuum", "chinense", "frutescens", "baccatum", "pubescens"];

const REGION_NOTES: Array<{ key: string; title: string; story: string }> = [
  {
    key: "mexico",
    title: "Mexico and Central America",
    story:
      "The origin of all chile peppers and still the world's deepest chile-cooking tradition. Mexican cuisine distinguishes peppers by fresh and dried form — a single cultivar becomes two different ingredients with two different names (poblano/ancho, jalapeño/chipotle). The 'holy trinity' of dried Mexican chiles — ancho, pasilla, and guajillo — anchors mole sauces and braising liquids across central and southern Mexico."
  },
  {
    key: "caribbean",
    title: "The Caribbean",
    story:
      "Caribbean cooking is built around Capsicum chinense — scotch bonnet, habanero, and the 7 Pot family from Trinidad. The fruit-and-floral character of these peppers shapes Jamaican jerk, Trinidadian pepper sauce, and West African dishes that traveled across the Atlantic. Scotch bonnet specifically is culinarily inseparable from authentic jerk seasoning."
  },
  {
    key: "south-america",
    title: "South America (Andes)",
    story:
      "Capsicum baccatum is the Andean species, and ají amarillo is its most famous cultivar — sacred to the Inca and one of the three pillars of Peruvian cuisine alongside potato and corn. The tropical fruit character of baccatum peppers is unlike anything in the chinense or annuum families. Rocoto, an unrelated Andean pubescens species, is the cold-tolerant outlier."
  },
  {
    key: "southeast-asia",
    title: "Southeast Asia",
    story:
      "Chiles arrived in Southeast Asia via Portuguese traders in the 16th century and were absorbed into Thai, Vietnamese, Indonesian, and Filipino cooking within a few generations. The bird's eye chili dominates the region — small, thin-walled, aggressive heat, used liberally raw in fresh salads, dipping sauces, and stir-fries. The flavor culture is built around lots-of-chile rather than huge-individual-chile."
  },
  {
    key: "east-asia",
    title: "East Asia",
    story:
      "Korean cuisine is built on gochugaru (the sun-dried, coarsely ground Korean chile) and its fermented form gochujang. Sichuan cooking pairs chiles with sichuan peppercorn (a different plant entirely) for the 'mala' tingling sensation. Japan's contribution is the shishito — mild, blistered, and trendy globally since the 2010s."
  },
  {
    key: "south-asia",
    title: "South Asia",
    story:
      "Indian cooking uses dozens of regional chile cultivars, from the mild Kashmiri (prized for color and gentle warmth) to the extreme ghost pepper from Assam. The bhut jolokia (ghost pepper) was the world's hottest pepper from 2007 to 2011 and is genuinely traditional in Northeast Indian cooking — used in pickles, chutneys, and tribal preparations for centuries before its global moment."
  },
  {
    key: "africa",
    title: "Africa",
    story:
      "African peppers split into two main families: the piri-piri (Capsicum frutescens) of southern Africa, made famous globally by Nando's, and the fatalii (Capsicum chinense) of Central Africa — extraordinarily fruity, less famous, increasingly used in craft hot sauce. African chile cooking emphasizes whole-pepper use in stews and pepper soups."
  },
  {
    key: "europe",
    title: "Europe and the Mediterranean",
    story:
      "Europe was an early adopter after Columbus brought chiles back from the Americas. Italian Calabrian chilis became central to southern Italian cooking. Spanish padróns developed in Galicia. French Espelette earned EU Protected Designation of Origin status. Hungarian production of paprika and banana peppers defines Central European cooking. Aleppo pepper (Syrian-Turkish) is the standout from the Levant."
  }
];

export default async function PepperGuidePage() {
  const peppers = await getPeppersFromDb();
  const tierOrder = getTierOrder();

  const byTier = new Map<HeatTier, Pepper[]>();
  for (const p of peppers) {
    const bucket = byTier.get(p.heatTier) ?? [];
    bucket.push(p);
    byTier.set(p.heatTier, bucket);
  }

  const bySpecies = new Map<PepperSpecies, Pepper[]>();
  for (const p of peppers) {
    if (!p.species) continue;
    const bucket = bySpecies.get(p.species) ?? [];
    bucket.push(p);
    bySpecies.set(p.species, bucket);
  }

  return (
    <article className="container-shell py-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "Pepper Encyclopedia", item: absoluteUrl("/peppers") },
          { name: "Complete Guide", item: absoluteUrl("/peppers/guide") }
        ]}
      />
      <WebPageSchema
        name="The Complete Guide to Chile Peppers"
        description="A practical reference for understanding chile peppers — heat tiers, capsicum species, and how to choose the right pepper for your cooking."
        url={absoluteUrl("/peppers/guide")}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Pepper Encyclopedia", href: "/peppers" },
          { label: "Complete Guide" }
        ]}
      />

      <header className="mt-6 max-w-3xl">
        <p className="eyebrow">The complete guide</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-charcoal sm:text-5xl lg:text-6xl">
          Understanding chile peppers, from poblano to Pepper X.
        </h1>
        <p className="mt-5 text-lg leading-8 text-charcoal/75">
          A practical reference for how chiles actually behave in the kitchen. Built around four
          questions every recipe quietly asks: how hot, what flavor, which species, and where it
          comes from. Use this as the top-level map; each section links to a full guide on the
          specific pepper.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <a href="#by-heat" className="rounded-full border border-charcoal/15 px-4 py-2 font-semibold text-charcoal hover:border-charcoal/30">By heat level</a>
          <a href="#by-species" className="rounded-full border border-charcoal/15 px-4 py-2 font-semibold text-charcoal hover:border-charcoal/30">By species</a>
          <a href="#by-region" className="rounded-full border border-charcoal/15 px-4 py-2 font-semibold text-charcoal hover:border-charcoal/30">By region</a>
          <a href="#how-to-choose" className="rounded-full border border-charcoal/15 px-4 py-2 font-semibold text-charcoal hover:border-charcoal/30">How to choose</a>
        </div>
      </header>

      {/* Heat tiers */}
      <section id="by-heat" className="mt-14">
        <p className="eyebrow">By heat level</p>
        <h2 className="mt-2 font-display text-3xl text-charcoal sm:text-4xl">
          The six heat tiers, ranked from mild to record-holder.
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-charcoal/75">
          The Scoville scale measures capsaicin concentration in Scoville Heat Units (SHU).
          Numerically the scale spans seven orders of magnitude — from sweet bells at zero SHU
          to Pepper X at over three million. Practically, six tiers cover what cooks need to know.
        </p>
        <div className="mt-8 space-y-6">
          {tierOrder.map((tier) => {
            const meta = HEAT_TIERS[tier];
            const tieredPeppers = byTier.get(tier) ?? [];
            if (tieredPeppers.length === 0) return null;
            return (
              <div
                key={tier}
                className="rounded-[1.75rem] border border-charcoal/10 bg-white p-6 sm:p-7"
              >
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${meta.bgClass} ${meta.textClass}`}>
                    {meta.label}
                  </span>
                  <span className="text-sm font-semibold text-charcoal/65">{meta.range}</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-charcoal/75">
                  {tierCopy(tier)}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {tieredPeppers.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/peppers/${p.slug}`}
                      className="inline-flex items-center gap-1 rounded-full border border-charcoal/20 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal shadow-sm transition hover:-translate-y-0.5 hover:border-ember hover:text-ember"
                    >
                      <span>{p.name}</span>
                      <span aria-hidden className="text-[10px] text-charcoal/45">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-sm text-charcoal/65">
          Want to see every pepper plotted on one visual scale?{" "}
          <Link href="/peppers/scoville-scale" className="font-semibold text-charcoal underline underline-offset-4 hover:text-ember">
            Open the scoville scale visualization →
          </Link>
        </p>
      </section>

      {/* Species */}
      <section id="by-species" className="mt-16">
        <p className="eyebrow">By species</p>
        <h2 className="mt-2 font-display text-3xl text-charcoal sm:text-4xl">
          The five capsicum species, and what they tell you.
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-charcoal/75">
          Every chile pepper belongs to one of five domesticated Capsicum species. The species
          predicts more than you&apos;d expect — heat ceiling, flavor character, plant behavior, and
          growing requirements all track with species more than with the cultivar name.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {SPECIES_ORDER.map((species) => {
            const info = SPECIES_INFO[species];
            const speciesPeppers = bySpecies.get(species) ?? [];
            return (
              <div key={species} className="panel p-7">
                <h3 className="font-display text-2xl italic text-charcoal">{info.name}</h3>
                <p className="mt-3 text-sm leading-7 text-charcoal/75">{info.description}</p>
                {speciesPeppers.length > 0 ? (
                  <>
                    <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">
                      In the encyclopedia
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {speciesPeppers.map((p) => (
                        <Link
                          key={p.slug}
                          href={`/peppers/${p.slug}`}
                          className="rounded-full border border-charcoal/15 bg-white px-3 py-1 text-xs font-semibold text-charcoal hover:border-ember hover:text-ember"
                        >
                          {p.name}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* Region */}
      <section id="by-region" className="mt-16">
        <p className="eyebrow">By region</p>
        <h2 className="mt-2 font-display text-3xl text-charcoal sm:text-4xl">
          How chiles got everywhere — and the regional traditions they shaped.
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-charcoal/75">
          All chile peppers originated in the Americas. The Columbian Exchange in the 1500s
          carried them to Europe, Africa, and Asia, and within a few generations entire cuisines
          were rebuilt around the new ingredient. Each region selected for different
          characteristics, and the result is the global chile geography we have today.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {REGION_NOTES.map((region) => (
            <div key={region.key} className="rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.04] p-6 sm:p-7">
              <h3 className="font-display text-2xl text-charcoal">{region.title}</h3>
              <p className="mt-3 text-sm leading-7 text-charcoal/75">{region.story}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How to choose */}
      <section id="how-to-choose" className="mt-16">
        <p className="eyebrow">How to choose</p>
        <h2 className="mt-2 font-display text-3xl text-charcoal sm:text-4xl">
          Picking the right pepper for what you&apos;re cooking.
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="panel p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">If you want…</p>
            <h3 className="mt-2 font-display text-xl text-charcoal">Mild heat with vegetable flavor</h3>
            <p className="mt-3 text-sm leading-7 text-charcoal/75">
              Reach for poblano, Anaheim, Hatch, banana pepper, or the dried ancho. These deliver
              chile flavor without heat as a barrier — useful when the whole table is eating.
            </p>
          </div>
          <div className="panel p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">If you want…</p>
            <h3 className="mt-2 font-display text-xl text-charcoal">Reliable medium heat for weeknights</h3>
            <p className="mt-3 text-sm leading-7 text-charcoal/75">
              Jalapeño is the gateway and serrano is the next step up. Fresno is the slightly
              fruitier red alternative. All three are widely available and predictable.
            </p>
          </div>
          <div className="panel p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">If you want…</p>
            <h3 className="mt-2 font-display text-xl text-charcoal">Bright fruit-forward heat</h3>
            <p className="mt-3 text-sm leading-7 text-charcoal/75">
              Habanero, scotch bonnet, fatalii, or ají amarillo. The Capsicum chinense and
              baccatum species bring tropical fruit notes — mango, citrus, passion fruit — that
              annuum peppers can&apos;t match.
            </p>
          </div>
          <div className="panel p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">If you want…</p>
            <h3 className="mt-2 font-display text-xl text-charcoal">Smoky depth for slow cooking</h3>
            <p className="mt-3 text-sm leading-7 text-charcoal/75">
              Chipotle (smoked jalapeño), Hatch green chile, or the dried Mexican holy trinity
              (ancho + pasilla + guajillo). These bring concentrated, savory, slightly sweet
              depth to braises and moles.
            </p>
          </div>
          <div className="panel p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">If you want…</p>
            <h3 className="mt-2 font-display text-xl text-charcoal">Extreme heat that still tastes like something</h3>
            <p className="mt-3 text-sm leading-7 text-charcoal/75">
              7 Pot Douglah for flavor depth, Carolina Reaper for fruit-and-fire balance, or
              Pepper X if you can find it. Use small quantities and pair with fat or dairy.
            </p>
          </div>
          <div className="panel p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">If you want…</p>
            <h3 className="mt-2 font-display text-xl text-charcoal">A specific cuisine&apos;s baseline pepper</h3>
            <p className="mt-3 text-sm leading-7 text-charcoal/75">
              Mexican: poblano/ancho. Caribbean: scotch bonnet. Thai/Southeast Asian: bird&apos;s
              eye. Korean: gochugaru. Italian: Calabrian. Peruvian: ají amarillo. Indian: ghost
              or Kashmiri. Match the pepper to the cuisine and the rest gets easier.
            </p>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="mt-16 grid gap-4 md:grid-cols-3">
        <Link href="/peppers/scoville-scale" className="panel p-6 transition hover:border-charcoal/20">
          <p className="eyebrow">Tool</p>
          <h3 className="mt-2 font-display text-xl text-charcoal">Scoville scale visualization</h3>
          <p className="mt-2 text-sm leading-6 text-charcoal/70">
            Every pepper plotted on one logarithmic chart.
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

      {/* Substitute pillar CTA */}
      <section className="mt-12 rounded-[2rem] border border-charcoal/10 bg-charcoal/[0.04] p-7 sm:p-8">
        <p className="eyebrow">Stuck without the pepper a recipe calls for?</p>
        <h2 className="mt-2 font-display text-3xl text-charcoal">
          Pepper substitutes, ranked by accuracy
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-charcoal/75">
          Every pepper in the encyclopedia carries a curated list of substitutes with ratios and
          flavor notes. The substitutes reference aggregates them in one searchable place.
        </p>
        <Link
          href="/peppers/substitutes"
          className="mt-5 inline-flex rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-cream"
        >
          Open the substitutes reference →
        </Link>
      </section>
    </article>
  );
}

function tierCopy(tier: HeatTier): string {
  switch (tier) {
    case "mild":
      return "Sub-jalapeño heat. Approachable for any palate. Used for flavor and color more than for burn — chile rellenos, mild salsas, Mediterranean and European cooking. Includes most dried Mexican chiles, which preserve flavor depth while staying gentle.";
    case "medium":
      return "Jalapeño through serrano-and-cayenne range. The most-cooked tier in American kitchens. Heat is noticeable but not dominant; the chile is still a flavor ingredient, not just a heat source.";
    case "hot":
      return "Above cayenne, below habanero. Thai bird's eye, piri-piri, and Calabrian sit here. The heat is real and immediate but the flavor still reads through. Often the upper boundary for everyday cooking before the chinense fruit-forward family takes over.";
    case "very-hot":
      return "Habanero and scotch bonnet country. The Capsicum chinense fruit-and-floral flavor profile comes through alongside aggressive heat. Caribbean, Yucatecan, and West African cooking are built on this tier.";
    case "extreme":
      return "Ghost pepper territory. Heat builds and lingers in a way that most cooks haven't experienced before. Used in tiny quantities in superhot sauces and traditional Indian preserves; rarely eaten as primary flavor.";
    case "superhot":
      return "Carolina Reaper, 7 Pot Primo, Trinidad Scorpion, and Pepper X. Capsaicin levels so concentrated that the pepper functions more like an industrial heat additive than a culinary ingredient. Sub-millimeter quantities in sauce-making; not for direct consumption.";
  }
}
