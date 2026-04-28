import Link from "next/link";
import { notFound } from "next/navigation";

import { AffiliateLink } from "@/components/content/affiliate-link";
import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { EmailCapture } from "@/components/forms/email-capture";
import { RecipeCard } from "@/components/cards/recipe-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { WebPageSchema } from "@/components/schema/web-page-schema";
import { AFFILIATE_LINKS, resolveAffiliateLink } from "@/lib/affiliates";
import { buildMetadata } from "@/lib/seo";
import { getRecipes } from "@/lib/services/content";
import { absoluteUrl } from "@/lib/utils";
import {
  PEPPERS,
  getPeppersFromDb,
  getPepperFromDb,
  HEAT_TIERS,
  formatScoville
} from "@/lib/peppers";

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
    title: `${pepper.name}: Scoville Rating, Flavor & Uses | FlamingFoodies`,
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

  return (
    <article className="container-shell py-16">
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "Pepper Encyclopedia", item: absoluteUrl("/peppers") },
          { name: pepper.name, item: absoluteUrl(sourcePage) }
        ]}
      />
      <WebPageSchema
        name={`${pepper.name}: Scoville Rating, Flavor & Uses`}
        description={pepper.description}
        url={absoluteUrl(sourcePage)}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Pepper Encyclopedia", href: "/peppers" },
          { label: pepper.name }
        ]}
      />

      {/* Hero */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${tierMeta.bgClass} ${tierMeta.textClass}`}>
            {tierMeta.label}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-cream/55">
            {formatScoville(pepper.scovilleMin, pepper.scovilleMax)}
          </span>
          <span className="rounded-full border border-white/8 px-3 py-1 text-xs text-cream/40">
            {pepper.origin.replace(/-/g, " ")}
          </span>
        </div>
        <h1 className="mt-6 font-display text-5xl leading-tight text-cream sm:text-6xl lg:text-7xl">
          {pepper.name}
        </h1>
        {pepper.aliases.length > 0 && (
          <p className="mt-2 text-sm text-cream/45">
            Also known as: {pepper.aliases.join(", ")}
          </p>
        )}
        <p className="mt-5 max-w-3xl text-lg leading-8 text-cream/75">{pepper.description}</p>
        <div className="mt-6 max-w-3xl rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-cream/72">
          <p className="eyebrow">Field guide note</p>
          <p className="mt-3">
            Pepper pages are meant to help you understand heat range, flavor, and cooking use
            first. If we include sauce or pantry links, they sit later on the page as optional
            examples rather than part of the core reference.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/editorial-policy" className="font-semibold text-cream underline underline-offset-4">
              Editorial policy
            </Link>
            <Link href="/corrections" className="font-semibold text-cream underline underline-offset-4">
              Corrections
            </Link>
          </div>
        </div>
      </div>

      {/* Flavor + Scoville two-col */}
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <div className="panel p-8 lg:col-span-2">
          <p className="eyebrow">The full profile</p>
          <p className="mt-4 text-sm leading-8 text-cream/75">{pepper.editorialNote}</p>
        </div>
        <div className="space-y-4">
          <div className="panel p-6">
            <p className="eyebrow">Flavor</p>
            <p className="mt-3 text-sm leading-7 text-cream/75">{pepper.flavorProfile}</p>
          </div>
          <div className="panel p-6">
            <p className="eyebrow">Color</p>
            <p className="mt-3 text-sm text-cream/75">{pepper.color}</p>
          </div>
          <div className={`rounded-[1.75rem] border p-6 ${tierMeta.bgClass} border-white/10`}>
            <p className={`text-xs uppercase tracking-[0.22em] ${tierMeta.textClass}`}>Heat level</p>
            <p className="mt-2 font-display text-3xl text-cream">{tierMeta.label}</p>
            <p className="mt-1 text-sm text-cream/60">{formatScoville(pepper.scovilleMin, pepper.scovilleMax)}</p>
            <p className="mt-2 text-xs text-cream/45">{tierMeta.range}</p>
          </div>
        </div>
      </div>

      {/* Fun fact */}
      <div className="mt-6 rounded-[2rem] border border-ember/20 bg-ember/8 p-8">
        <p className="eyebrow">Did you know</p>
        <p className="mt-3 text-base leading-8 text-cream/80">{pepper.funFact}</p>
      </div>

      {/* Culinary uses */}
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="panel p-8">
          <p className="eyebrow">How to use it</p>
          <ul className="mt-4 space-y-3">
            {pepper.culinaryUses.map((use) => (
              <li key={use} className="flex gap-3 text-sm leading-7 text-cream/75">
                <span className="mt-0.5 shrink-0 text-ember">—</span>
                <span>{use}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel p-8">
          <p className="eyebrow">Pairs well with</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {pepper.pairsWith.map((pair) => (
              <span
                key={pair}
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-cream/70"
              >
                {pair}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Related recipes */}
      {displayRecipes.length > 0 && (
        <div className="mt-14">
          <p className="eyebrow">Cook with it</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Recipes that use {pepper.name.toLowerCase()}.
          </h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {displayRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
          <Link href="/recipes" className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white">
            Browse all recipes
          </Link>
        </div>
      )}

      {/* Same heat tier */}
      {nearbyPeppers.length > 0 && (
        <div className="mt-16 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
          <p className="eyebrow">Same heat tier</p>
          <h2 className="mt-3 font-display text-3xl text-cream">Other {tierMeta.label.toLowerCase()} peppers.</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {nearbyPeppers.map((p) => (
              <Link
                key={p.slug}
                href={`/peppers/${p.slug}`}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-cream hover:border-white/20 hover:text-white"
              >
                {p.name}
              </Link>
            ))}
          </div>
          <Link href="/peppers" className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white">
            Full pepper encyclopedia
          </Link>
        </div>
      )}

      {/* Pantry examples */}
      {affiliateItems.length > 0 && (
        <div className="mt-12">
          <AffiliateDisclosure className="max-w-3xl" compact />
          <p className="mt-6 eyebrow">Pantry examples</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            If you want to taste {pepper.name.toLowerCase()} in a bottle or pantry product.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-cream/72">
            These are optional examples of how this pepper shows up in real products. The profile
            above should still stand on its own even if you never shop from this section.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {affiliateItems.map(({ key, entry, resolved }) => (
              <article key={key} className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-ember">
                  {"badge" in entry ? String(entry.badge) : "Example"}
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
                  position="pepper-affiliate"
                  className="mt-4 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream hover:border-white/30 hover:text-white"
                >
                  View example ↗
                </AffiliateLink>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="mt-14 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
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
