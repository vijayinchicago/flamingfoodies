import { PrintButton } from "@/components/rewards/print-button";
import { buildMetadata } from "@/lib/seo";
import {
  formatScoville,
  getPeppersFromDb,
  getTierOrder,
  PEPPERS,
  type HeatTier,
  type Pepper
} from "@/lib/peppers";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "The Pepper Dossier — Flame Club VIP Reward",
  description:
    "Every common pepper, decoded. Scoville range, flavor profile, what to cook with it, what to substitute. Flame Club Tier 1 reward — please don't share publicly.",
  path: "/rewards/pepper-dossier-h8d4kf2j7c",
  noIndex: true
});

const TIER_LABELS: Record<HeatTier, { label: string; range: string; tone: string }> = {
  mild: {
    label: "Mild",
    range: "0 – 2,500 SHU",
    tone: "Gentle warmth. Family-table friendly."
  },
  medium: {
    label: "Medium",
    range: "2,500 – 30,000 SHU",
    tone: "A real kick. Most home cooks live here."
  },
  hot: {
    label: "Hot",
    range: "30,000 – 100,000 SHU",
    tone: "Sweat-inducing. Use with intent."
  },
  "very-hot": {
    label: "Very Hot",
    range: "100,000 – 500,000 SHU",
    tone: "Capsaicin-forward. Wear gloves."
  },
  extreme: {
    label: "Extreme",
    range: "500,000 – 1.5M SHU",
    tone: "Specialty territory. Tiny amounts only."
  },
  superhot: {
    label: "Superhot",
    range: "1.5M+ SHU",
    tone: "Not seasoning. Special-occasion stunt."
  }
};

async function loadPeppers(): Promise<Pepper[]> {
  try {
    const fromDb = await getPeppersFromDb();
    if (fromDb.length > 0) return fromDb;
  } catch {
    // fall through to static
  }
  return PEPPERS;
}

function PepperCard({ pepper }: { pepper: Pepper }) {
  return (
    <article className="break-inside-avoid border-t border-charcoal/15 pt-6 print:pt-4">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-display text-3xl text-charcoal print:text-2xl">
          {pepper.name}
        </h3>
        <p className="text-sm font-semibold tracking-wide text-flame">
          {formatScoville(pepper.scovilleMin, pepper.scovilleMax)} SHU
        </p>
      </header>

      {pepper.aliases.length ? (
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-charcoal/55">
          Also known as: {pepper.aliases.join(" · ")}
        </p>
      ) : null}

      <p className="mt-3 text-sm font-medium italic text-charcoal/85">
        {pepper.flavorProfile}
      </p>

      <p className="mt-3 text-sm leading-7 text-charcoal/85">{pepper.description}</p>

      <p className="mt-3 text-sm leading-7 text-charcoal/75">{pepper.editorialNote}</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2 print:grid-cols-2">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-flame">
            Best uses
          </p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-charcoal/85">
            {pepper.culinaryUses.map((use) => (
              <li key={use} className="flex gap-2">
                <span aria-hidden className="text-flame">·</span>
                <span>{use}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-flame">
            Pairs with
          </p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-charcoal/85">
            {pepper.pairsWith.map((pair) => (
              <li key={pair} className="flex gap-2">
                <span aria-hidden className="text-flame">·</span>
                <span>{pair}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-4 rounded-[0.9rem] border-l-4 border-ember/60 bg-ember/5 px-4 py-3 text-xs leading-6 text-charcoal/80">
        <strong className="font-semibold text-charcoal">Fun fact —</strong>{" "}
        {pepper.funFact}
      </p>
    </article>
  );
}

export default async function PepperDossierPage() {
  const peppers = await loadPeppers();
  const sortedTiers = getTierOrder();
  const peppersByTier = sortedTiers
    .map((tier) => ({
      tier,
      meta: TIER_LABELS[tier],
      peppers: peppers.filter((p) => p.heatTier === tier)
    }))
    .filter((bucket) => bucket.peppers.length > 0);

  // Quick-reference Scoville chart sorted by max heat
  const scovilleChart = [...peppers].sort((a, b) => a.scovilleMax - b.scovilleMax);

  return (
    <article className="bg-cream text-charcoal print:bg-white">
      <style>{`
        @media print {
          @page { margin: 0.6in; }
          a { color: inherit; text-decoration: none; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="container-shell py-12 print:py-0">
        <div className="mx-auto max-w-3xl">
          {/* Cover */}
          <header className="border-b-4 border-flame pb-10 print:pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-flame">
              Flame Club · VIP Reward
            </p>
            <h1 className="mt-4 font-display text-5xl leading-tight text-charcoal print:text-4xl">
              The Pepper Dossier
            </h1>
            <p className="mt-4 text-base leading-7 text-charcoal/80 print:text-sm">
              Every common pepper worth knowing. Scoville range, flavor profile,
              what to cook with it, what it pairs with, and the one weird fact
              that sticks. Built for the inside of your spice cabinet door.
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.22em] text-charcoal/55">
              You earned this with three Flame Club referrals · Edition 1
            </p>
          </header>

          {/* How to use */}
          <section className="mt-10 break-inside-avoid">
            <h2 className="font-display text-2xl text-charcoal">How to use this dossier</h2>
            <p className="mt-3 text-sm leading-7 text-charcoal/85">
              Heat tiers move bottom-to-top: mild dinners through reaper-class
              specialty work. Each entry&apos;s Scoville range is real, but heat
              perception varies by pepper origin, ripeness, and how it&apos;s
              prepared — roasting and fermenting both mellow heat, drying
              concentrates it. Use the pairing list to plan, the fun fact to
              remember.
            </p>
            <p className="mt-3 text-sm leading-7 text-charcoal/85">
              Print landscape if you want a wider read; portrait if you want
              column density. The whole thing fits on roughly six pages.
            </p>
          </section>

          {/* Quick-reference Scoville chart */}
          <section className="mt-10 break-inside-avoid">
            <h2 className="font-display text-2xl text-charcoal">Scoville quick reference</h2>
            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-charcoal/55">
              Mild → superhot, by maximum SHU
            </p>
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-charcoal/30">
                  <th className="py-2 pr-2 font-semibold text-charcoal">Pepper</th>
                  <th className="py-2 pr-2 font-semibold text-charcoal">Tier</th>
                  <th className="py-2 pl-2 font-semibold text-charcoal">SHU range</th>
                </tr>
              </thead>
              <tbody>
                {scovilleChart.map((p) => (
                  <tr
                    key={p.slug}
                    className="border-b border-charcoal/10 print:border-charcoal/20"
                  >
                    <td className="py-2 pr-2">{p.name}</td>
                    <td className="py-2 pr-2 text-charcoal/70">{TIER_LABELS[p.heatTier].label}</td>
                    <td className="py-2 pl-2 text-charcoal/70">
                      {formatScoville(p.scovilleMin, p.scovilleMax)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Per-tier sections */}
          {peppersByTier.map(({ tier, meta, peppers: tierPeppers }) => (
            <section key={tier} className="mt-12 print:mt-8">
              <header className="break-inside-avoid border-b border-charcoal/30 pb-3">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-flame">
                  Tier · {meta.label}
                </p>
                <h2 className="mt-2 font-display text-3xl text-charcoal print:text-2xl">
                  {meta.label} peppers ({meta.range})
                </h2>
                <p className="mt-2 text-sm italic leading-6 text-charcoal/75">
                  {meta.tone}
                </p>
              </header>
              <div className="mt-6 space-y-8 print:space-y-6">
                {tierPeppers.map((pepper) => (
                  <PepperCard key={pepper.slug} pepper={pepper} />
                ))}
              </div>
            </section>
          ))}

          {/* Footer */}
          <footer className="mt-16 border-t-4 border-flame pt-6 print:mt-12">
            <p className="font-display text-2xl text-charcoal">— Vijay</p>
            <p className="mt-2 text-sm text-charcoal/75">
              Editor, FlamingFoodies · Built for Flame Club members who give
              the newsletter to people they actually like.
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.22em] text-charcoal/55">
              flamingfoodies.com · Please don&apos;t share this URL publicly — it&apos;s a
              VIP reward, not a public page.
            </p>
          </footer>

          <div className="no-print mt-10 flex justify-center">
            <PrintButton />
          </div>
        </div>
      </div>
    </article>
  );
}
