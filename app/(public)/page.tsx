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
  getAffiliateCtaLabel,
  getAffiliateLinkEntries,
  resolveAffiliateLink
} from "@/lib/affiliates";
import { getFeaturedCollection, getCompetitions } from "@/lib/services/content";
import { getGuides } from "@/lib/content/guides";
import { getEditorialFranchises } from "@/lib/editorial-franchises";
import { getShopAffiliateCollections } from "@/lib/shop";
import { getCurrentOccasions } from "@/lib/seasonal/occasions";
import { formatDate } from "@/lib/utils";

export default async function HomePage() {
  const [{ recipes, blogPosts, reviews }, guides, competitions] = await Promise.all([
    getFeaturedCollection(),
    getGuides(),
    getCompetitions()
  ]);
  const seasonalNow = getCurrentOccasions();
  const homeAffiliateLinks = getAffiliateLinkEntries(HOME_FEATURED_AFFILIATE_KEYS);
  const shopCollections = getShopAffiliateCollections();
  const editorialFranchises = getEditorialFranchises(blogPosts);
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
          <div className="panel relative overflow-hidden px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,99,30,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(230,57,70,0.22),transparent_30%)]" />
            <div className="relative">
              <p className="eyebrow">Flavor-first recipes, bottle guides, and practical spice advice.</p>
              <h1 className="mt-4 max-w-4xl font-display text-4xl leading-none text-cream sm:text-6xl xl:text-7xl">
                The spicy food guide for curious beginners, weeknight cooks, and real sauce people.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-cream/78 sm:text-lg sm:leading-8">
                Find approachable dinners, sharper hot sauce reviews, gift-friendly picks, and
                practical buying guides that help you cook and shop with more confidence.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/recipes"
                  className="inline-flex w-full justify-center rounded-full bg-gradient-to-r from-flame to-ember px-6 py-3 font-semibold text-white sm:w-auto"
                >
                  Browse recipes
                </Link>
                <Link
                  href="/recipes?heat=mild&maxTime=45&sort=quickest"
                  className="inline-flex w-full justify-center rounded-full bg-white px-6 py-3 font-semibold text-charcoal sm:w-auto"
                >
                  Start mild and fast
                </Link>
                <Link
                  href="/shop#gift-mode"
                  className="inline-flex w-full justify-center rounded-full border border-white/15 px-6 py-3 font-semibold text-cream sm:w-auto"
                >
                  Shop gift ideas
                </Link>
              </div>
              <div className="mt-10 grid gap-4 text-sm text-cream/72 sm:grid-cols-3">
                <Link
                  href="/recipes?maxTime=45&sort=quickest"
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 transition hover:bg-white/[0.08]"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-ember">Dinner fast</p>
                  <p className="mt-2 font-display text-3xl text-cream">Quick recipes</p>
                  <p className="mt-2 leading-6">Jump straight into weeknight-friendly dinners instead of digging through the full archive first.</p>
                </Link>
                <Link
                  href="/quiz"
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 transition hover:bg-white/[0.08]"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-ember">New to spice?</p>
                  <p className="mt-2 font-display text-3xl text-cream">Take the quiz</p>
                  <p className="mt-2 leading-6">Get a gentler starting point for recipes, bottles, and next steps if you are still finding your ceiling.</p>
                </Link>
                <Link
                  href="/shop#gift-mode"
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 transition hover:bg-white/[0.08]"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-ember">Buying for someone else?</p>
                  <p className="mt-2 font-display text-3xl text-cream">Gift mode</p>
                  <p className="mt-2 leading-6">Start with curated sets, safe gifts, and shelf builders instead of guessing someone else&apos;s heat tolerance.</p>
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
          title="Flavor-first dinners with room for mild, medium, and serious heat."
          copy="From quick weeknight bowls to bigger weekend projects, the recipe layer is built to help people find the right dinner path fast."
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
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="eyebrow">Shop lanes</p>
                <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
                  Start with the shelves and gift lanes people actually need.
                </h2>
              </div>
              <Link
                href="/shop#starter-kit"
                className="inline-flex w-full justify-center rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream sm:w-auto"
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
                    href={`/shop#${collection.key}`}
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
              Products that pair naturally with the recipes and reviews.
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
                    {getAffiliateCtaLabel(resolved)}
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

      <section className="container-shell py-10">
        <SectionHeading
          eyebrow="Recurring series"
          title="Series, seasons, and ideas to explore."
          copy="Browse regular features with helpful buying advice, spicy recipes, seasonal guides, and ideas for what to cook next."
        />
        <div className="mt-10 grid gap-6 xl:grid-cols-3">
          {seasonalNow.slice(0, 1).map((occasion) => (
            <article key={occasion.slug} className="panel p-7">
              <p className="eyebrow">In season now</p>
              <h3 className="mt-3 font-display text-4xl text-cream">{occasion.title}</h3>
              <p className="mt-4 text-sm leading-7 text-cream/72">{occasion.tagline}</p>
              <Link
                href={`/seasonal/${occasion.slug}`}
                className="mt-5 inline-flex rounded-full bg-gradient-to-r from-flame to-ember px-4 py-2 text-sm font-semibold text-white"
              >
                Open the guide
              </Link>
            </article>
          ))}
          {editorialFranchises.map((franchise) => (
            <article key={franchise.key} className="panel p-7">
              <p className="eyebrow">{franchise.title}</p>
              <p className="mt-4 text-sm leading-7 text-cream/72">{franchise.description}</p>
              {franchise.posts[0] ? (
                <Link
                  href={`/blog/${franchise.posts[0].slug}`}
                  className="mt-5 block rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4 text-sm text-cream/80 transition hover:bg-white/[0.08]"
                >
                  <span className="text-xs uppercase tracking-[0.18em] text-ember">Recent post</span>
                  <span className="mt-2 block font-semibold text-cream">{franchise.posts[0].title}</span>
                </Link>
              ) : null}
              <Link
                href={franchise.href}
                className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
              >
                {franchise.ctaLabel}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {competitions.filter((c) => c.status === "active" || c.status === "voting").length > 0 ? (
        <section className="container-shell py-10">
          <SectionHeading
            eyebrow="Live now"
            title="Community competitions open for entries."
            copy="Submit a photo, recipe, or video. The community votes and the best cooks win."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {competitions
              .filter((c) => c.status === "active" || c.status === "voting")
              .slice(0, 3)
              .map((competition) => {
                const daysLeft = Math.max(
                  0,
                  Math.ceil(
                    (new Date(competition.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  )
                );
                return (
                  <Link
                    key={competition.id}
                    href={`/competitions/${competition.slug}`}
                    className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] transition hover:-translate-y-1 hover:border-white/20"
                  >
                    <div className="relative flex h-24 items-center justify-between bg-gradient-to-br from-flame/25 via-ember/15 to-transparent px-6">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                        competition.status === "voting"
                          ? "bg-amber-400/20 text-amber-200"
                          : "bg-ember/20 text-ember"
                      }`}>
                        {competition.status === "voting" ? "Voting open" : "Entries open"}
                      </span>
                      {daysLeft <= 7 ? (
                        <span className="text-xs font-semibold text-cream/60">
                          {daysLeft === 0 ? "Last day!" : `${daysLeft}d left`}
                        </span>
                      ) : null}
                    </div>
                    <div className="p-6">
                      <p className="text-xs uppercase tracking-[0.22em] text-ember">
                        {competition.theme}
                      </p>
                      <h3 className="mt-3 font-display text-3xl text-cream leading-tight">
                        {competition.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-cream/70 line-clamp-2">
                        {competition.description}
                      </p>
                      {competition.prizeDescription ? (
                        <p className="mt-4 text-xs text-cream/50">
                          Prize: {competition.prizeDescription}
                        </p>
                      ) : null}
                      <div className="mt-4 flex items-center justify-between gap-4">
                        <span className="text-xs text-cream/45">
                          {competition.entries.length} {competition.entries.length === 1 ? "entry" : "entries"}
                        </span>
                        <span className="text-sm font-semibold text-cream group-hover:text-white">
                          {competition.status === "voting" ? "Vote now →" : "Enter now →"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
          <div className="mt-6">
            <Link
              href="/competitions"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              View all competitions
            </Link>
          </div>
        </section>
      ) : null}

      <section className="container-shell py-16">
        <SectionHeading
          eyebrow="Email capture"
          title="Flame Club keeps the best spicy finds in one place."
          copy="Get standout recipes, bottle picks, and new guides without having to hunt through the site every week."
        />
        <div className="mt-8">
          <EmailCapture
            source="homepage"
            tag="homepage-hero"
            heading="Choose the newsletter lane that matches how you use the site."
            description="Choose a full weekly roundup, more recipes, or more shopping-focused picks."
            defaultSegments={["weekly-roundup", "recipe-club"]}
          />
        </div>
      </section>
    </>
  );
}
