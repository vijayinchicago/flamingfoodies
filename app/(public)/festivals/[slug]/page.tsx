import Link from "next/link";
import { notFound } from "next/navigation";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { ReviewCard } from "@/components/cards/review-card";
import { RecipeCard } from "@/components/cards/recipe-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { AFFILIATE_LINKS, resolveAffiliateLink } from "@/lib/affiliates";
import { buildMetadata } from "@/lib/seo";
import { getReviews, getRecipes } from "@/lib/services/content";
import { absoluteUrl } from "@/lib/utils";
import {
  FESTIVALS,
  getFestivalBySlug,
  getMonthName,
  getRegionLabel
} from "@/lib/festivals";

export async function generateStaticParams() {
  return FESTIVALS.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const festival = getFestivalBySlug(params.slug);
  if (!festival) {
    return buildMetadata({ title: "Festival | FlamingFoodies", description: "" });
  }
  return buildMetadata({
    title: `${festival.name} — ${festival.city}, ${festival.stateCode} | FlamingFoodies`,
    description: festival.description,
    path: `/festivals/${festival.slug}`
  });
}

const REGION_BADGE: Record<string, string> = {
  northeast: "border-sky-400/30 bg-sky-400/10 text-sky-400",
  southeast: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
  south: "border-ember/30 bg-ember/10 text-ember",
  midwest: "border-amber-400/30 bg-amber-400/10 text-amber-400",
  southwest: "border-orange-400/30 bg-orange-400/10 text-orange-400",
  west: "border-violet-400/30 bg-violet-400/10 text-violet-400"
};

export default async function FestivalPage({ params }: { params: { slug: string } }) {
  const festival = getFestivalBySlug(params.slug);
  if (!festival) notFound();

  const sourcePage = `/festivals/${festival.slug}`;

  // Resolve affiliate pack items
  const packItems = festival.packAffiliate
    .map((key) => {
      const entry = AFFILIATE_LINKS[key];
      const resolved = resolveAffiliateLink(key, { sourcePage, position: "festival-pack" });
      if (!entry || !resolved) return null;
      return { key, entry, resolved };
    })
    .filter(
      (
        item
      ): item is {
        key: string;
        entry: (typeof AFFILIATE_LINKS)[string];
        resolved: NonNullable<ReturnType<typeof resolveAffiliateLink>>;
      } => item !== null
    );

  // Pull related reviews and recipes
  const [allReviews, allRecipes] = await Promise.all([getReviews(), getRecipes()]);

  const relatedReviews = allReviews
    .filter((r) => {
      const text = [r.title, r.description, r.category, ...r.tags].join(" ").toLowerCase();
      return festival.cuisineTags.some((tag) => text.includes(tag.toLowerCase()));
    })
    .slice(0, 4);

  const displayReviews = relatedReviews.length >= 2 ? relatedReviews : allReviews.slice(0, 4);

  const relatedRecipes = allRecipes
    .filter((r) => {
      const text = [r.title, r.description, r.cuisineType ?? "", ...(r.tags ?? [])].join(" ").toLowerCase();
      return festival.cuisineTags.some((tag) => text.includes(tag.toLowerCase()));
    })
    .slice(0, 3);

  const displayRecipes = relatedRecipes.length >= 2 ? relatedRecipes : allRecipes.slice(0, 3);

  // Other festivals — same region or ±2 months
  const otherFestivals = FESTIVALS.filter(
    (f) => f.slug !== festival.slug && (f.region === festival.region || Math.abs(f.month - festival.month) <= 2)
  ).slice(0, 5);

  const regionBadgeClass = REGION_BADGE[festival.region] ?? REGION_BADGE.south;

  return (
    <article className="container-shell py-16">
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "Festivals", item: absoluteUrl("/festivals") },
          { name: festival.name, item: absoluteUrl(sourcePage) }
        ]}
      />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Festivals", href: "/festivals" },
          { label: festival.shortName }
        ]}
      />

      {/* Hero */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${regionBadgeClass}`}>
            {getRegionLabel(festival.region)}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-cream/55">
            {getMonthName(festival.month)} · Annual
          </span>
          {festival.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/8 px-3 py-1 text-xs text-cream/40"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="mt-6 max-w-4xl font-display text-4xl leading-tight text-cream sm:text-5xl lg:text-6xl">
          {festival.name}
        </h1>
        <p className="mt-3 text-base text-cream/55 sm:text-lg">
          {festival.city}, {festival.state} · {festival.dateRange}
        </p>
        <p className="mt-5 max-w-3xl text-base leading-8 text-cream/75 sm:text-lg">
          {festival.description}
        </p>

        {festival.website ? (
          <a
            href={festival.website}
            rel="noopener noreferrer"
            target="_blank"
            className="mt-6 inline-flex rounded-full bg-gradient-to-r from-flame to-ember px-6 py-3 text-sm font-semibold text-white"
          >
            Official website ↗
          </a>
        ) : null}
      </div>

      <AffiliateDisclosure className="mt-8 max-w-3xl" compact />

      {/* Editorial + Expect two-col */}
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="panel p-8">
          <p className="eyebrow">Why it matters</p>
          <p className="mt-4 text-sm leading-8 text-cream/75">{festival.editorialNote}</p>
        </div>
        <div className="panel p-8">
          <p className="eyebrow">What to expect</p>
          <ul className="mt-4 space-y-3">
            {festival.whatToExpect.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-7 text-cream/75">
                <span className="mt-0.5 shrink-0 text-ember">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Best for */}
      <div className="mt-6 rounded-[2rem] border border-ember/20 bg-ember/8 p-8">
        <p className="eyebrow">Best for</p>
        <p className="mt-3 text-base leading-8 text-cream/80">{festival.bestFor}</p>
      </div>

      {/* What to pack */}
      {packItems.length > 0 ? (
        <div className="mt-12">
          <p className="eyebrow">What to pack</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Shop before you go.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-cream/70">{festival.packIntro}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packItems.map(({ key, entry, resolved }) => (
              <article
                key={key}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-ember">
                  {"badge" in entry && entry.badge ? String(entry.badge) : "Pick"}
                </p>
                <h3 className="mt-2 font-display text-2xl text-cream">{entry.product}</h3>
                <p className="mt-2 text-sm leading-6 text-cream/65">
                  {"description" in entry && entry.description ? String(entry.description) : ""}
                </p>
                <AffiliateLink
                  href={resolved.href}
                  partnerKey={resolved.key}
                  trackingMode={resolved.trackingMode}
                  sourcePage={sourcePage}
                  position="festival-pack"
                  className="mt-4 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream hover:border-white/30 hover:text-white"
                >
                  View on Amazon ↗
                </AffiliateLink>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {/* Can't make it? Related reviews */}
      {displayReviews.length > 0 ? (
        <div className="mt-16">
          <p className="eyebrow">Can&apos;t make it?</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Try the sauces at home.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-cream/70">
            These are the sauce profiles you&apos;ll encounter on the {festival.shortName} floor —
            shop them now and arrive with your palate already calibrated.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {displayReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          <div className="mt-6">
            <Link
              href="/reviews"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white"
            >
              Browse all hot sauce reviews
            </Link>
          </div>
        </div>
      ) : null}

      {/* Related recipes */}
      {displayRecipes.length > 0 ? (
        <div className="mt-14">
          <p className="eyebrow">Cook the cuisine</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Recipes that match the festival flavor.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-cream/70">
            The best way to prepare for a hot sauce festival is to already be cooking with these
            flavors at home.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {displayRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
          <div className="mt-6">
            <Link
              href="/recipes"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white"
            >
              Browse all recipes
            </Link>
          </div>
        </div>
      ) : null}

      {/* Other festivals */}
      {otherFestivals.length > 0 ? (
        <div className="mt-16 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
          <p className="eyebrow">More festivals</p>
          <h2 className="mt-3 font-display text-3xl text-cream">
            Keep the calendar going.
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherFestivals.map((f) => (
              <Link
                key={f.slug}
                href={`/festivals/${f.slug}`}
                className="group rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-ember">
                  {f.city}, {f.stateCode}
                </p>
                <h3 className="mt-2 font-display text-xl text-cream leading-tight">{f.name}</h3>
                <p className="mt-1 text-xs text-cream/45">
                  {getMonthName(f.month)} · {f.dateRange}
                </p>
                <p className="mt-2 text-xs font-semibold text-cream/40 group-hover:text-cream/65">
                  View guide →
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <Link
              href="/festivals"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white"
            >
              Full festival calendar
            </Link>
          </div>
        </div>
      ) : null}
    </article>
  );
}
