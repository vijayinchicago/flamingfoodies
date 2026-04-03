import Link from "next/link";

import { RecipeCard } from "@/components/cards/recipe-card";
import { ReviewCard } from "@/components/cards/review-card";
import { EmailCapture } from "@/components/forms/email-capture";
import { SectionHeading } from "@/components/layout/section-heading";
import { OrganizationSchema } from "@/components/schema/organization-schema";
import {
  HOME_FEATURED_AFFILIATE_KEYS,
  MERCH_COLLECTION,
  getAffiliateLinkEntries
} from "@/lib/affiliates";
import { getFeaturedCollection, getCompetitions } from "@/lib/services/content";
import { getGuides } from "@/lib/content/guides";

export default async function HomePage() {
  const [{ recipes, blogPosts, reviews }, competitions, guides] = await Promise.all([
    getFeaturedCollection(),
    getCompetitions(),
    getGuides()
  ]);
  const homeAffiliateLinks = getAffiliateLinkEntries(HOME_FEATURED_AFFILIATE_KEYS);
  const merchPreview = MERCH_COLLECTION.slice(0, 3);

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
                Explore high-heat recipes, product reviews, member challenges, and a
                content engine designed to grow into the internet’s loudest home for real
                chili-head culture.
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
                  Shop merch and gear
                </Link>
                <Link
                  href="/quiz"
                  className="rounded-full border border-white/15 px-6 py-3 font-semibold text-cream"
                >
                  Take the heat quiz
                </Link>
              </div>
              <div className="mt-10 grid gap-4 text-sm text-cream/72 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-ember">Recipes</p>
                  <p className="mt-2 font-display text-3xl text-cream">12+</p>
                  <p className="mt-2 leading-6">Flavor-first spicy dinners, sides, and cookout staples.</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-ember">Hot sauces</p>
                  <p className="mt-2 font-display text-3xl text-cream">10</p>
                  <p className="mt-2 leading-6">Reviews built to drive useful clicks instead of empty hype.</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-ember">Merch and gear</p>
                  <p className="mt-2 font-display text-3xl text-cream">20+</p>
                  <p className="mt-2 leading-6">Owned merch previews backed by partner tools and sauce picks.</p>
                </div>
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
              <p className="eyebrow">Live competition</p>
              <h2 className="mt-3 font-display text-4xl text-cream">{competitions[0]?.title}</h2>
              <p className="mt-4 text-sm leading-7 text-cream/70">
                {competitions[0]?.entries.length} entries already in. Vote, enter, or scout
                inspiration before the next round.
              </p>
              <Link
                href={`/competitions/${competitions[0]?.slug}`}
                className="mt-6 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
              >
                See the showdown
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
          title="Put merch up front and keep the affiliate picks useful."
          copy="The commercial layer should feel like part of the brand: drop-preview merch on one side, trusted sauce and kitchen picks on the other."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="panel p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Merch preview</p>
                <h2 className="mt-3 font-display text-4xl text-cream">
                  Flame Club goods deserve homepage space.
                </h2>
              </div>
              <Link
                href="/shop#merch-preview"
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
              >
                View the drop
              </Link>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {merchPreview.map((item) => (
                <article
                  key={item.slug}
                  className={`rounded-[1.75rem] border border-white/10 bg-gradient-to-br ${item.accent} p-5`}
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-ember">{item.badge}</p>
                  <h3 className="mt-3 font-display text-3xl text-cream">{item.name}</h3>
                  <p className="mt-2 text-sm text-cream/60">{item.category}</p>
                  <p className="mt-4 text-sm leading-7 text-cream/72">{item.description}</p>
                  <p className="mt-4 text-sm font-semibold text-cream">{item.priceLabel}</p>
                  <Link
                    href={item.href}
                    className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-charcoal"
                  >
                    {item.ctaLabel}
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
              {homeAffiliateLinks.map((link) => (
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
                  <Link
                    href={`/go/${link.key}?source=/&position=home-commerce`}
                    className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                  >
                    Open offer
                  </Link>
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
          title="Flame Club keeps the retention engine warm."
          copy="Homepage signup feeds ConvertKit segments, weekly digest drafts, and future community activation without waiting for paid features."
        />
        <div className="mt-8">
          <EmailCapture />
        </div>
      </section>
    </>
  );
}
