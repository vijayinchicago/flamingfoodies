import { PrintButton } from "@/components/rewards/print-button";
import { buildMetadata } from "@/lib/seo";
import {
  FESTIVALS,
  getFestivalsFromDb,
  getMonthName,
  getRegionLabel,
  type Festival,
  type FestivalRegion
} from "@/lib/festivals";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "VIP Festival Planner — Flame Club Tier 3 Reward",
  description:
    "Every US hot sauce festival worth your travel time. Where, when, what to buy, what to skip. Built for Flame Club VIPs who hit ten referrals.",
  path: "/rewards/festival-planner-z2v8qb7r4a",
  noIndex: true
});

const REGION_ORDER: FestivalRegion[] = [
  "northeast",
  "southeast",
  "south",
  "midwest",
  "southwest",
  "west"
];

async function loadFestivals(): Promise<Festival[]> {
  try {
    const fromDb = await getFestivalsFromDb();
    if (fromDb.length > 0) return fromDb;
  } catch {
    // fall through
  }
  return FESTIVALS;
}

function FestivalCard({ festival }: { festival: Festival }) {
  return (
    <article className="break-inside-avoid border-t border-charcoal/15 pt-6 print:pt-4">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="font-display text-3xl text-charcoal print:text-2xl">
            {festival.name}
          </h3>
          <p className="mt-1 text-sm font-medium text-charcoal/70">
            {festival.city}, {festival.stateCode} · {festival.dateRange}
          </p>
        </div>
        <p className="text-[0.65rem] uppercase tracking-[0.22em] text-flame">
          {getRegionLabel(festival.region)}
        </p>
      </header>

      {festival.tagline ? (
        <p className="mt-3 text-sm font-medium italic text-charcoal/85">
          {festival.tagline}
        </p>
      ) : null}

      <p className="mt-3 text-sm leading-7 text-charcoal/85">{festival.description}</p>

      <p className="mt-3 text-sm leading-7 text-charcoal/75">{festival.editorialNote}</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2 print:grid-cols-2">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-flame">
            What to expect
          </p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-charcoal/85">
            {festival.whatToExpect.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="text-flame">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-flame">
            Best for
          </p>
          <p className="mt-2 text-sm leading-6 text-charcoal/85">{festival.bestFor}</p>
          {festival.packIntro ? (
            <>
              <p className="mt-3 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-flame">
                What to pack
              </p>
              <p className="mt-2 text-sm leading-6 text-charcoal/85">
                {festival.packIntro}
              </p>
            </>
          ) : null}
        </div>
      </div>

      {festival.website ? (
        <p className="mt-4 text-xs leading-6 text-charcoal/70">
          <span className="font-semibold text-charcoal">Official:</span>{" "}
          <a
            href={festival.website}
            target="_blank"
            rel="noreferrer"
            className="text-flame underline decoration-flame/40 underline-offset-2"
          >
            {festival.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </a>{" "}
          · Read the deeper guide at flamingfoodies.com/festivals/{festival.slug}
        </p>
      ) : null}
    </article>
  );
}

export default async function FestivalPlannerPage() {
  const festivals = await loadFestivals();

  // Calendar view: festivals grouped by month, sorted by month asc
  const byMonth = new Map<number, Festival[]>();
  for (const f of festivals) {
    const list = byMonth.get(f.month) ?? [];
    list.push(f);
    byMonth.set(f.month, list);
  }
  const calendarRows = Array.from(byMonth.entries())
    .sort((a, b) => a[0] - b[0])
    .flatMap(([month, list]) =>
      list
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((f) => ({ month, festival: f }))
    );

  // Regional sections
  const byRegion = REGION_ORDER.map((region) => ({
    region,
    festivals: festivals
      .filter((f) => f.region === region)
      .sort((a, b) => a.month - b.month)
  })).filter((bucket) => bucket.festivals.length > 0);

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
              The VIP Festival Planner
            </h1>
            <p className="mt-4 text-base leading-7 text-charcoal/80 print:text-sm">
              Every US hot sauce festival worth your travel time. Where each
              one is, when it runs, what to buy when you get there, and what
              to skip. Use the calendar at the top to plan a year; use the
              regional sections to plan a road trip.
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.22em] text-charcoal/55">
              You earned this with ten Flame Club referrals · VIP for life ·
              Edition 1
            </p>
          </header>

          {/* Calendar */}
          <section className="mt-10 break-inside-avoid">
            <h2 className="font-display text-2xl text-charcoal">Calendar at a glance</h2>
            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-charcoal/55">
              Sorted Jan → Dec. Most are annual; check the official site close to dates.
            </p>
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-charcoal/30">
                  <th className="py-2 pr-2 font-semibold text-charcoal">Month</th>
                  <th className="py-2 pr-2 font-semibold text-charcoal">Festival</th>
                  <th className="py-2 pl-2 font-semibold text-charcoal">Where</th>
                </tr>
              </thead>
              <tbody>
                {calendarRows.map(({ month, festival }) => (
                  <tr
                    key={festival.slug}
                    className="border-b border-charcoal/10 print:border-charcoal/20"
                  >
                    <td className="py-2 pr-2 text-charcoal/85">{getMonthName(month)}</td>
                    <td className="py-2 pr-2">{festival.name}</td>
                    <td className="py-2 pl-2 text-charcoal/70">
                      {festival.city}, {festival.stateCode}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Travel notes */}
          <section className="mt-10 break-inside-avoid">
            <h2 className="font-display text-2xl text-charcoal">How to travel for these</h2>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-charcoal/85">
              <li className="flex gap-2">
                <span aria-hidden className="text-flame">·</span>
                <span>
                  <strong className="text-charcoal">Buy tickets early.</strong>{" "}
                  The bigger festivals (NYC Hot Sauce Expo, ZestFest) sell out
                  general admission a few weeks before. VIP tickets are
                  usually worth it — early entry means smaller lines at the
                  best maker booths before they sell through their interesting
                  bottles.
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden className="text-flame">·</span>
                <span>
                  <strong className="text-charcoal">Stay walking distance.</strong>{" "}
                  Hot sauce sampling + driving is a poor combination. Most
                  festivals are downtown or near a hotel cluster — book within
                  a 10-minute walk so you can sample freely.
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden className="text-flame">·</span>
                <span>
                  <strong className="text-charcoal">Eat real food first.</strong>{" "}
                  Sampling on an empty stomach turns into a misery loop by
                  bottle four. Have a substantial breakfast or lunch with fat
                  in it (eggs, avocado, cheese — capsaicin binds to fat).
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden className="text-flame">·</span>
                <span>
                  <strong className="text-charcoal">Bring a checked bag.</strong>{" "}
                  Hot sauce bottles count as liquid for TSA — anything over
                  3.4 oz has to go in checked luggage on the way home.
                  Bubble-wrap or tube-sock bottles individually; one broken
                  bottle ruins a suitcase.
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden className="text-flame">·</span>
                <span>
                  <strong className="text-charcoal">Talk to the makers.</strong>{" "}
                  The best part of these isn&apos;t the bottles — it&apos;s the
                  five-minute conversation with the person who made them.
                  Ask what they cook with their own sauce. The answers are
                  always more interesting than the marketing copy.
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden className="text-flame">·</span>
                <span>
                  <strong className="text-charcoal">Skip the eating contests.</strong>{" "}
                  Watching is fun. Competing wrecks your palate (and possibly
                  your day) for everything else at the festival. Save the
                  reaper challenges for a private moment with a bucket nearby.
                </span>
              </li>
            </ul>
          </section>

          {/* Per-region sections */}
          {byRegion.map(({ region, festivals: regionFestivals }) => (
            <section key={region} className="mt-12 print:mt-8">
              <header className="break-inside-avoid border-b border-charcoal/30 pb-3">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-flame">
                  Region · {getRegionLabel(region)}
                </p>
                <h2 className="mt-2 font-display text-3xl text-charcoal print:text-2xl">
                  {getRegionLabel(region)} · {regionFestivals.length} festival
                  {regionFestivals.length === 1 ? "" : "s"}
                </h2>
              </header>
              <div className="mt-6 space-y-8 print:space-y-6">
                {regionFestivals.map((festival) => (
                  <FestivalCard key={festival.slug} festival={festival} />
                ))}
              </div>
            </section>
          ))}

          {/* Footer */}
          <footer className="mt-16 border-t-4 border-flame pt-6 print:mt-12">
            <p className="font-display text-2xl text-charcoal">— Vijay</p>
            <p className="mt-2 text-sm text-charcoal/75">
              Editor, FlamingFoodies · Updated as new festivals appear or
              older ones change format. If you&apos;ve been to one I missed, hit
              reply on any Flame Club email and tell me about it.
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.22em] text-charcoal/55">
              flamingfoodies.com · Please don&apos;t share this URL publicly — it&apos;s
              a VIP reward, not a public page.
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
