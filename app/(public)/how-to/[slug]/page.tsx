import Link from "next/link";
import { notFound } from "next/navigation";

import { AffiliateLink } from "@/components/content/affiliate-link";
import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { HowToSchema } from "@/components/schema/how-to-schema";
import { AFFILIATE_LINKS, resolveAffiliateLink } from "@/lib/affiliates";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import {
  TUTORIALS,
  getTutorialsFromDb,
  getTutorialFromDb,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS
} from "@/lib/tutorials";

export async function generateStaticParams() {
  try {
    const tutorials = await getTutorialsFromDb();
    return tutorials.map((t) => ({ slug: t.slug }));
  } catch {
    return TUTORIALS.map((t) => ({ slug: t.slug }));
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const tutorial = await getTutorialFromDb(params.slug);
  if (!tutorial) return buildMetadata({ title: "How-To | FlamingFoodies", description: "" });
  return buildMetadata({
    title: `${tutorial.title} | FlamingFoodies`,
    description: tutorial.description,
    path: `/how-to/${tutorial.slug}`
  });
}

export default async function TutorialPage({ params }: { params: { slug: string } }) {
  const tutorial = await getTutorialFromDb(params.slug);
  if (!tutorial) notFound();

  const sourcePage = `/how-to/${tutorial.slug}`;

  const affiliateItems = tutorial.affiliateKeys
    .map((key) => {
      const entry = AFFILIATE_LINKS[key];
      const resolved = resolveAffiliateLink(key, { sourcePage, position: "how-to-tool" });
      if (!entry || !resolved) return null;
      return { key, entry, resolved };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const allTutorials = await getTutorialsFromDb();
  const related = allTutorials
    .filter((t) => t.slug !== tutorial.slug && t.category === tutorial.category)
    .slice(0, 3);

  return (
    <article className="container-shell py-16">
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "How-To Guides", item: absoluteUrl("/how-to") },
          { name: tutorial.title, item: absoluteUrl(sourcePage) }
        ]}
      />
      <HowToSchema tutorial={tutorial} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "How-To", href: "/how-to" },
          { label: tutorial.title }
        ]}
      />

      {/* Hero */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-ember/30 bg-ember/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ember">
            {CATEGORY_LABELS[tutorial.category]}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-cream/55">
            {DIFFICULTY_LABELS[tutorial.difficulty]}
          </span>
          <span className="rounded-full border border-white/8 px-3 py-1 text-xs text-cream/40">
            {tutorial.timeEstimate}
          </span>
        </div>
        <h1 className="mt-6 max-w-4xl font-display text-4xl leading-tight text-cream sm:text-5xl lg:text-6xl">
          {tutorial.title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-cream/75">{tutorial.intro}</p>
      </div>

      <AffiliateDisclosure className="mt-8 max-w-3xl" compact />

      {/* Steps */}
      <div className="mt-12 space-y-6">
        {tutorial.steps.map((step, i) => (
          <div key={i} id={`step-${i + 1}`} className="panel p-8">
            <div className="flex items-start gap-4">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ember/20 font-display text-lg text-ember">
                {i + 1}
              </span>
              <div>
                <h2 className="font-display text-2xl text-cream">{step.heading}</h2>
                <p className="mt-3 text-sm leading-8 text-cream/75">{step.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pro tips */}
      {tutorial.proTips.length > 0 && (
        <div className="mt-8 rounded-[2rem] border border-ember/20 bg-ember/8 p-8">
          <p className="eyebrow">Pro tips</p>
          <ul className="mt-4 space-y-3">
            {tutorial.proTips.map((tip) => (
              <li key={tip} className="flex gap-3 text-sm leading-7 text-cream/80">
                <span className="mt-0.5 shrink-0 text-ember">—</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gear / tools */}
      {affiliateItems.length > 0 && (
        <div className="mt-12">
          <p className="eyebrow">Tools for this guide</p>
          <h2 className="mt-3 font-display text-4xl text-cream">What you&apos;ll need.</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {affiliateItems.map(({ key, entry, resolved }) => (
              <article key={key} className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-ember">
                  {"badge" in entry ? String(entry.badge) : "Tool"}
                </p>
                <h3 className="mt-2 font-display text-2xl text-cream">{entry.product}</h3>
                <p className="mt-2 text-sm leading-6 text-cream/65">
                  {"description" in entry ? String(entry.description) : ""}
                </p>
                <AffiliateLink
                  href={resolved.href}
                  partnerKey={resolved.key}
                  trackingMode={resolved.trackingMode}
                  sourcePage={sourcePage}
                  position="how-to-tool"
                  className="mt-4 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream hover:border-white/30 hover:text-white"
                >
                  Check price ↗
                </AffiliateLink>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Related guides */}
      {related.length > 0 && (
        <div className="mt-16 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
          <p className="eyebrow">Related guides</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((t) => (
              <Link key={t.slug} href={`/how-to/${t.slug}`}
                className="group rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20">
                <p className="text-xs text-cream/40">{t.timeEstimate}</p>
                <h3 className="mt-2 font-display text-xl text-cream leading-tight">{t.title}</h3>
                <p className="mt-2 text-xs font-semibold text-cream/40 group-hover:text-cream/65">Read →</p>
              </Link>
            ))}
          </div>
          <Link href="/how-to" className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white">
            All how-to guides
          </Link>
        </div>
      )}
    </article>
  );
}
