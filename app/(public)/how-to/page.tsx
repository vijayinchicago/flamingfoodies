import Link from "next/link";

import { SectionHeading } from "@/components/layout/section-heading";
import { buildMetadata } from "@/lib/seo";
import {
  getTutorialsFromDb,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  type TutorialCategory,
  type Tutorial
} from "@/lib/tutorials";

export const metadata = buildMetadata({
  title: "How-To Guides: Hot Sauce, Fermentation & Pepper Growing | FlamingFoodies",
  description:
    "Step-by-step guides for making hot sauce from scratch, fermenting peppers, growing chilis in containers, building heat tolerance, and mastering spicy food.",
  path: "/how-to"
});

const CATEGORY_ORDER: TutorialCategory[] = [
  "making-sauce", "fermentation", "growing", "cooking-technique", "pairing", "heat-culture"
];

export default async function HowToPage() {
  const tutorials = await getTutorialsFromDb();

  const byCategory = new Map<TutorialCategory, Tutorial[]>();
  for (const t of tutorials) {
    const bucket = byCategory.get(t.category) ?? [];
    bucket.push(t);
    byCategory.set(t.category, bucket);
  }

  const featured = tutorials.filter((t) => t.featured);

  return (
    <section className="container-shell py-16">
      <SectionHeading
        eyebrow="How-to guides"
        title="Make it. Grow it. Master the heat."
        copy="Step-by-step guides for everything in the spicy food world — from your first hot sauce bottle to fermenting, growing peppers, and pairing like a pro."
      />

      {/* Featured */}
      {featured.length > 0 && (
        <div className="mt-12">
          <p className="eyebrow">Start here</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((tutorial) => (
              <Link
                key={tutorial.slug}
                href={`/how-to/${tutorial.slug}`}
                className="group overflow-hidden rounded-[2rem] border border-ember/30 bg-ember/10 p-6 transition hover:border-ember/50 hover:bg-ember/15"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-ember">
                    {CATEGORY_LABELS[tutorial.category]}
                  </p>
                  <span className="shrink-0 rounded-full bg-ember/20 px-3 py-1 text-xs font-semibold text-ember">
                    {DIFFICULTY_LABELS[tutorial.difficulty]}
                  </span>
                </div>
                <h2 className="mt-3 font-display text-2xl leading-tight text-cream">{tutorial.title}</h2>
                <p className="mt-2 text-xs text-cream/50">{tutorial.timeEstimate}</p>
                <p className="mt-3 text-sm leading-6 text-cream/70">{tutorial.description}</p>
                <p className="mt-4 text-sm font-semibold text-cream/70 group-hover:text-white">
                  Read the guide →
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* By category */}
      <div className="mt-14 space-y-12">
        {CATEGORY_ORDER.map((cat) => {
          const catTutorials = byCategory.get(cat) ?? [];
          if (catTutorials.length === 0) return null;
          return (
            <div key={cat}>
              <div className="flex items-center gap-4">
                <h2 className="font-display text-2xl text-cream">{CATEGORY_LABELS[cat]}</h2>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {catTutorials.map((tutorial) => (
                  <Link
                    key={tutorial.slug}
                    href={`/how-to/${tutorial.slug}`}
                    className="group rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-cream/45">
                        {DIFFICULTY_LABELS[tutorial.difficulty]}
                      </span>
                      <span className="text-[11px] text-cream/35">{tutorial.timeEstimate}</span>
                    </div>
                    <h3 className="mt-3 font-display text-xl leading-tight text-cream">{tutorial.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-cream/60">{tutorial.description}</p>
                    <p className="mt-3 text-xs font-semibold text-cream/40 group-hover:text-cream/65">
                      Read guide →
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/recipes" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white">
          Browse recipes
        </Link>
        <Link href="/peppers" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white">
          Pepper encyclopedia
        </Link>
        <Link href="/shop" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white">
          Shop the tools
        </Link>
      </div>
    </section>
  );
}
