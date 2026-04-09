import Link from "next/link";

import { RecipeCard } from "@/components/cards/recipe-card";
import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { ReviewCard } from "@/components/cards/review-card";
import { EmailCapture } from "@/components/forms/email-capture";
import { SectionHeading } from "@/components/layout/section-heading";
import { OrganizationSchema } from "@/components/schema/organization-schema";
import {
  HOME_FEATURED_AFFILIATE_KEYS,
  getAffiliateLinkEntries,
  resolveAffiliateLink
} from "@/lib/affiliates";
import { getFeaturedCollection } from "@/lib/services/content";
import { getGuides } from "@/lib/content/guides";
import { getShopAffiliateCollections } from "@/lib/shop";

export default async function HomePage() {
  const [{ recipes, blogPosts, reviews }, guides] = await Promise.all([
    getFeaturedCollection(),
    getGuides()
  ]);
  const homeAffiliateLinks = getAffiliateLinkEntries(HOME_FEATURED_AFFILIATE_KEYS);
  const shopCollections = getShopAffiliateCollections();
  const resolvedHomeAffiliateLinks = homeAffiliateLinks
    .map((link) => ({
      link,
      resolved: resolveAffiliateLink(link.key, {
        sourcePage: "/",
        position: "home-commerce"
      })
    }))
    .filter((entry): entry is { link: (typeof homeAffiliateLinks)[number]; resolved: NonNullable<ReturnType<typeof resolveAffiliateLink>> } => Boolean(entry.resolved));

  return (
    <>
      <OrganizationSchema />
      <section className="container-shell py-16 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="panel relative overflow-hidden px-8 py-12 sm:px-12 sm:py-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,99,30,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(230,57,70,0.22),transparent_30%)]" />
            <div className="relative">
              <p className="eyebrow">Bold recipes. Sauce reviews. Heat-loving people.</p>
              <h1 className="mt-4 max-w-4xl font-display text-6xl leading-none text-cream sm:text-7xl">
                The spicy food platform for people who want flavor before flexing.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-cream/78">
                Explore high-heat recipes, product reviews, community posts, and practical guides
                for people who care about heat, flavor, and what is actually worth cooking or
                buying.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/recipes"
                  className="rounded-full bg-gradient-to-r from-flame to-ember px-6 py-3 font-semibold text-white"
                >
                  Browse recipes
                </Link>
                <Link
                  href="/shop"
                  className="rounded-full bg-white px-6 py-3 font-semibold text-charcoal"
                >
                  Shop sauces and gear
                </Link>
                <Link
                  href="/quiz"
                  className="rounded-full border border-white/15 px-6 py-3 font-semibold text-cream"
                >
                  Take the heat quiz
                </Link>
              </div>
              <div className="mt-10 grid gap-4 text-sm text-cream/72 sm:grid-cols-3">
                <Link
                  href="/recipes"
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 transition hover:bg-white/[0.08]"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-ember">Start with dinner</p>
                  <p className="mt-2 font-display text-3xl text-cream">Recipes</p>
                  <p className="mt-2 leading-6">Search by cuisine, heat, cook time, or difficulty instead of scrolling one giant archive.</p>
                </Link>
                <Link
                  href="/hot-sauces"
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 transition hover:bg-white/[0.08]"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-ember">Find a bottle</p>
                  <p className="mt-2 font-display text-3xl text-cream">Hot sauces</p>
                  <p className="mt-2 leading-6">Browse everyday pours, gift picks, and best-for pages that match what you actually eat.</p>
                </Link>
                <Link
                  href="/shop"
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 transition hover:bg-white/[0.08]"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-ember">Shop the shelf</p>
                  <p className="mt-2 font-display text-3xl text-cream">Sauces and gear</p>
                  <p className="mt-2 leading-6">Jump into starter shelves, gift ideas, pantry heat, and tools that earn their keep.</p>
                </Link>
              </div>
            </div>
          </div>
          <div className="grid gap-6">
            <div className="panel p-7">
              <p className="eyebrow">Featured guide</p>
              <h2 className="mt-3 font-display text-4xl text-cream">{guides[0]?.title}</h2>
              <p className="mt-4 text-sm leading-7 text-cream/70">{guides[0]?.description}</p>
              <Link
                href={`/guides/${guides[0]?.slug}`}
                className="mt-6 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
              >
                Read guide
              </Link>
            </div>
            <div className="panel p-7">
              <p className="eyebrow">Hot sauce hub</p>
              <h2 className="mt-3 font-display text-4xl text-cream">Find the right bottle faster.</h2>
              <p className="mt-4 text-sm leading-7 text-cream/70">
                Browse best-for pages, under-$15 picks, giftable sets, and hot sauce reviews that
                make it easier to buy the right bottle the first time.
              </p>
              <Link
                href="/hot-sauces"
                className="mt-6 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
              >
                Explore hot sauces
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-10">
        <SectionHeading
          eyebrow="Top recipes"
          title="High-heat dinner ideas with actual range."
          copy="From fermented Korean noodle bowls to Scotch bonnet grill skewers, the recipe layer is built for both discovery and search."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>

      <section className="container-shell py-10">
        <SectionHeading
          eyebrow="Shop the heat"
          title="Shop the bottles, gear, and pantry picks that earn their keep."
          copy="At launch, the store should stay practical: better bottles, useful gear, giftable sets, and pantry staples that actually support the cooking."
        />
        <AffiliateDisclosure className="mt-6 max-w-3xl" compact />
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="panel p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Shop lanes</p>
                <h2 className="mt-3 font-display text-4xl text-cream">
                  Start with the shelves and gift lanes people actually need.
                </h2>
              </div>
              <Link
                href="/shop#starter-kits"
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
              >
                Open the shop
              </Link>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {shopCollections.map((collection) => (
                <article
                  key={collection.key}
                  className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-ember">{collection.title}</p>
                  <h3 className="mt-3 font-display text-3xl text-cream">{collection.ctaLabel}</h3>
                  <p className="mt-4 text-sm leading-7 text-cream/72">{collection.description}</p>
                  <Link
                    href={collection.key === "gift-guide" ? "/shop#gift-ideas" : `/shop#${collection.key}`}
                    className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-charcoal"
                  >
                    Explore
                  </Link>
                </article>
              ))}
            </div>
          </div>
          <div className="panel p-8">
            <p className="eyebrow">Affiliate staples</p>
            <h2 className="mt-3 font-display text-4xl text-cream">
              Products that make the content more actionable.
            </h2>
            <div className="mt-8 space-y-4">
              {resolvedHomeAffiliateLinks.map(({ link, resolved }) => (
                <article
                  key={link.key}
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-ember">{link.badge}</p>
                    {link.priceLabel ? (
                      <span className="text-xs text-cream/55">{link.priceLabel}</span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 font-display text-3xl text-cream">{link.product}</h3>
                  <p className="mt-3 text-sm leading-7 text-cream/72">{link.description}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-cream/48">
                    Best for: {link.bestFor}
                  </p>
                  <AffiliateLink
                    href={resolved.href}
                    partnerKey={resolved.key}
                    trackingMode={resolved.trackingMode}
                    sourcePage="/"
                    position="home-commerce"
                    className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                  >
                    View on Amazon
                  </AffiliateLink>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-10">
        <SectionHeading
          eyebrow="Hot takes"
          title="Editorial and reviews that make the commerce layer feel earned."
          copy="The site pairs practical food content with buying guides and sauce reviews so affiliates feel useful, not bolted on."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {blogPosts.map((post) => (
            <div key={post.id} className="panel p-7">
              <p className="eyebrow">{post.category}</p>
              <h3 className="mt-4 font-display text-4xl text-cream">{post.title}</h3>
              <p className="mt-4 text-sm leading-7 text-cream/72">{post.description}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-6 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
              >
                Read post
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>

      <section className="container-shell py-16">
        <SectionHeading
          eyebrow="Email capture"
          title="Flame Club keeps the best spicy finds in one place."
          copy="Get standout recipes, bottle picks, and new guides without having to hunt through the site every week."
        />
        <div className="mt-8">
          <EmailCapture />
        </div>
      </section>
    </>
  );
}
