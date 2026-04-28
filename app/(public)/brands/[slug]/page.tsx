import Link from "next/link";
import { notFound } from "next/navigation";

import { AffiliateLink } from "@/components/content/affiliate-link";
import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { ReviewCard } from "@/components/cards/review-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { WebPageSchema } from "@/components/schema/web-page-schema";
import { AFFILIATE_LINKS, resolveAffiliateLink } from "@/lib/affiliates";
import { buildMetadata } from "@/lib/seo";
import { getReviews } from "@/lib/services/content";
import { absoluteUrl } from "@/lib/utils";
import {
  BRANDS,
  getBrandsFromDb,
  getBrandFromDb,
  TIER_LABELS
} from "@/lib/brands";

export async function generateStaticParams() {
  try {
    const brands = await getBrandsFromDb();
    return brands.map((b) => ({ slug: b.slug }));
  } catch {
    return BRANDS.map((b) => ({ slug: b.slug }));
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const brand = await getBrandFromDb(params.slug);
  if (!brand) return buildMetadata({ title: "Brand | FlamingFoodies", description: "" });
  return buildMetadata({
    title: `${brand.name}: History, Products & Reviews | FlamingFoodies`,
    description: brand.description,
    path: `/brands/${brand.slug}`
  });
}

export default async function BrandPage({ params }: { params: { slug: string } }) {
  const brand = await getBrandFromDb(params.slug);
  if (!brand) notFound();

  const sourcePage = `/brands/${brand.slug}`;

  const resolvedProducts = brand.signatureProducts
    .map((product) => {
      if (!product.affiliateKey) return { product, resolved: null };
      const resolved = resolveAffiliateLink(product.affiliateKey, { sourcePage, position: "brand-product" });
      return { product, resolved };
    });

  const allReviews = await getReviews();
  const relatedReviews = allReviews
    .filter((r) => {
      const text = [r.title, r.description, r.brand ?? "", ...r.tags].join(" ").toLowerCase();
      return text.includes(brand.name.toLowerCase()) ||
        brand.signatureProducts.some((p) => text.includes(p.name.toLowerCase()));
    })
    .slice(0, 4);
  const displayReviews = relatedReviews.length >= 1 ? relatedReviews : allReviews.slice(0, 4);

  const allBrands = await getBrandsFromDb();
  const sameTierBrands = allBrands
    .filter((b) => b.slug !== brand.slug && b.tier === brand.tier)
    .slice(0, 5);

  return (
    <article className="container-shell py-16">
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "Brand Directory", item: absoluteUrl("/brands") },
          { name: brand.name, item: absoluteUrl(sourcePage) }
        ]}
      />
      <WebPageSchema
        name={`${brand.name}: History, Products & Reviews`}
        description={brand.description}
        url={absoluteUrl(sourcePage)}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Brand Directory", href: "/brands" },
          { label: brand.name }
        ]}
      />

      {/* Hero */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-ember/30 bg-ember/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ember">
            {TIER_LABELS[brand.tier]}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-cream/55">
            Est. {brand.founded}
          </span>
          <span className="rounded-full border border-white/8 px-3 py-1 text-xs text-cream/40">
            {brand.city}
          </span>
        </div>
        <h1 className="mt-6 font-display text-5xl leading-tight text-cream sm:text-6xl lg:text-7xl">
          {brand.name}
        </h1>
        <p className="mt-3 text-lg text-cream/55">{brand.tagline}</p>
        <p className="mt-5 max-w-3xl text-base leading-8 text-cream/75">{brand.description}</p>
        <div className="mt-6 max-w-3xl rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-cream/72">
          <p className="eyebrow">Directory note</p>
          <p className="mt-3">
            Brand pages are meant to separate company background, tasting context, and our review
            coverage from the act of shopping. If we link to bottles, those links live lower on the
            page after the editorial summary.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/editorial-policy" className="font-semibold text-cream underline underline-offset-4">
              Editorial policy
            </Link>
            <Link href="/review-methodology" className="font-semibold text-cream underline underline-offset-4">
              Review methodology
            </Link>
          </div>
        </div>
      </div>

      {/* Editorial + Why it matters */}
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="panel p-8">
          <p className="eyebrow">The full story</p>
          <p className="mt-4 text-sm leading-8 text-cream/75">{brand.editorialNote}</p>
        </div>
        <div className="space-y-4">
          <div className="panel p-6">
            <p className="eyebrow">Why it matters</p>
            <p className="mt-3 text-sm leading-7 text-cream/75">{brand.whyItMatters}</p>
          </div>
          <div className="rounded-[1.75rem] border border-ember/20 bg-ember/8 p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-ember">Best for</p>
            <p className="mt-3 text-sm leading-7 text-cream/80">{brand.bestFor}</p>
          </div>
          {brand.pepperSlug && (
            <Link
              href={`/peppers/${brand.pepperSlug}`}
              className="flex items-center justify-between rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 transition hover:border-white/20"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ember">Signature pepper</p>
                <p className="mt-1 font-display text-xl text-cream capitalize">
                  {brand.pepperSlug.replace(/-/g, " ")}
                </p>
              </div>
              <span className="text-cream/40 group-hover:text-cream">→</span>
            </Link>
          )}
        </div>
      </div>

      {/* Related reviews */}
      {displayReviews.length > 0 && (
        <div className="mt-14">
          <p className="eyebrow">Read the reviews</p>
          <h2 className="mt-3 font-display text-4xl text-cream">What we think of {brand.name}.</h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {displayReviews.map((review) => <ReviewCard key={review.id} review={review} />)}
          </div>
          <Link href="/reviews" className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white">
            Browse all reviews
          </Link>
        </div>
      )}

      {/* Product line */}
      {resolvedProducts.length > 0 && (
        <div className="mt-12">
          <AffiliateDisclosure className="max-w-3xl" compact />
          <p className="mt-6 eyebrow">Signature lineup</p>
          <h2 className="mt-3 font-display text-4xl text-cream">If you want to browse the bottles.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-cream/72">
            These links are here for readers who already know they want to explore the lineup after
            reading the brand profile or the reviews above.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resolvedProducts.map(({ product, resolved }) => (
              <article key={product.name} className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
                <h3 className="font-display text-2xl text-cream">{product.name}</h3>
                <p className="mt-2 text-sm leading-6 text-cream/65">{product.description}</p>
                {resolved ? (
                  <AffiliateLink
                    href={resolved.href}
                    partnerKey={resolved.key}
                    trackingMode={resolved.trackingMode}
                    sourcePage={sourcePage}
                    position="brand-product"
                    className="mt-4 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream hover:border-white/30 hover:text-white"
                  >
                    View bottle ↗
                  </AffiliateLink>
                ) : (
                  <p className="mt-4 text-xs text-cream/35">Link coming soon</p>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Same tier */}
      {sameTierBrands.length > 0 && (
        <div className="mt-16 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
          <p className="eyebrow">More {TIER_LABELS[brand.tier].toLowerCase()} brands</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {sameTierBrands.map((b) => (
              <Link key={b.slug} href={`/brands/${b.slug}`}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-cream hover:border-white/20 hover:text-white">
                {b.name}
              </Link>
            ))}
          </div>
          <Link href="/brands" className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream hover:border-white/30 hover:text-white">
            Full brand directory
          </Link>
        </div>
      )}
    </article>
  );
}
