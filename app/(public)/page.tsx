import Image from "next/image";
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
import { getFeaturedCollection, getCompetitions } from "@/lib/services/content";
import { getGuides } from "@/lib/content/guides";
import { getEditorialFranchises } from "@/lib/editorial-franchises";
import { getRecipeHeroFields } from "@/lib/recipe-hero";
import { getShopAffiliateCollections } from "@/lib/shop";
import { getCurrentOccasions } from "@/lib/seasonal/occasions";
import { formatDate } from "@/lib/utils";

export const revalidate = 3600;

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
  const featuredRecipe = recipes[0] ?? null;
  const featuredRecipeHero = featuredRecipe ? getRecipeHeroFields(featuredRecipe) : null;
  const featuredGuide = guides[0] ?? null;
  const mobileRecipePreviewCount = 4;
  const mobileShopLaneCount = 2;
  const mobileAffiliatePreviewCount = 1;
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
              <p className="eyebrow">Flavor-first spicy food</p>
              <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[0.98] text-cream sm:text-6xl xl:text-[5.35rem]">
                Flavor-first spicy food for real kitchens and mixed tables.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-cream/78 sm:text-lg sm:leading-8">
                Cook approachable dinners, choose better bottles, and find gift-worthy heat
                without turning every meal into a stunt.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/recipes"
                  className="inline-flex w-full justify-center rounded-full bg-gradient-to-r from-flame to-ember px-6 py-3 font-semibold text-white sm:w-auto"
                >
                  Browse recipes
                </Link>
                <Link
                  href="/hot-sauces"
                  className="inline-flex w-full justify-center rounded-full bg-white px-6 py-3 font-semibold text-charcoal sm:w-auto"
                >
                  Find a hot sauce
                </Link>
                <Link
                  href="/shop#gift-mode"
                  className="inline-flex w-full justify-center rounded-full border border-white/15 px-6 py-3 font-semibold text-cream sm:w-auto"
                >
                  Shop gift ideas
                </Link>
              </div>

              {featuredRecipe && featuredRecipeHero ? (
                <Link
                  href={`/recipes/${featuredRecipe.slug}`}
                  className="relative mt-8 block overflow-hidden rounded-[2rem] border border-white/10 bg-[#120b08] shadow-[0_22px_60px_rgba(0,0,0,0.28)] lg:hidden"
                >
                  <div className="relative min-h-[260px]">
                    <Image
                      src={featuredRecipeHero.imageUrl}
                      alt={featuredRecipeHero.imageAlt}
                      fill
                      sizes="100vw"
                      priority
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/45 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <div className="rounded-[1.6rem] border border-white/10 bg-charcoal/75 p-5 backdrop-blur-md">
                        <p className="text-xs uppercase tracking-[0.24em] text-ember">Cook this first</p>
                        <h2 className="mt-3 font-display text-3xl text-cream">{featuredRecipe.title}</h2>
                        <p className="mt-3 text-sm leading-7 text-cream/78">
                          {featuredRecipe.description}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-cream/58">
                          <span>{featuredRecipe.totalTimeMinutes} min</span>
                          <span>{featuredRecipe.heatLevel} heat</span>
                          <span>{featuredRecipe.saveCount} saves</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : null}

              <div className="mt-8 grid gap-4 text-sm text-cream/72 sm:grid-cols-2">
                <Link
                  href="/recipes?maxTime=45&sort=quickest"
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 transition hover:bg-white/[0.08]"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-ember">Dinner tonight</p>
                  <p className="mt-2 font-display text-3xl text-cream">Quick recipes</p>
                  <p className="mt-2 leading-6">Jump straight into 45-minute dinners instead of digging through the full archive first.</p>
                </Link>
                <Link
                  href="/recipes?heat=mild&maxTime=45&sort=quickest"
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 transition hover:bg-white/[0.08]"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-ember">New to spice?</p>
                  <p className="mt-2 font-display text-3xl text-cream">Start mild</p>
                  <p className="mt-2 leading-6">Use the gentler recipe lane if you want flavor first and less risk on the first pass.</p>
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden gap-6 lg:grid">
            {featuredRecipe && featuredRecipeHero ? (
              <Link
                href={`/recipes/${featuredRecipe.slug}`}
                className="group relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#120b08] shadow-[0_24px_70px_rgba(0,0,0,0.32)]"
              >
                <div className="relative min-h-[500px]">
                  <Image
                    src={featuredRecipeHero.imageUrl}
                    alt={featuredRecipeHero.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 34vw, 100vw"
                    priority
                    className="object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/35 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <div className="rounded-[2rem] border border-white/10 bg-charcoal/78 p-6 backdrop-blur-md">
                      <p className="text-xs uppercase tracking-[0.24em] text-ember">Tonight&apos;s pick</p>
                      <h2 className="mt-3 font-display text-4xl text-cream">{featuredRecipe.title}</h2>
                      <p className="mt-4 text-sm leading-7 text-cream/78">{featuredRecipe.description}</p>
                      <div className="mt-5 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-cream/58">
                        <span>{featuredRecipe.totalTimeMinutes} min</span>
                        <span>{featuredRecipe.heatLevel} heat</span>
                        <span>{featuredRecipe.saveCount} saves</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ) : null}
            {featuredGuide ? (
              <div className="panel p-7">
                <p className="eyebrow">Bottle path</p>
                <h2 className="mt-3 font-display text-4xl text-cream">Find the right bottle faster.</h2>
                <p className="mt-4 text-sm leading-7 text-cream/70">
                  Start with everyday bottles, under-$15 picks, and giftable sets that make the
                  hot sauce side feel easier to navigate.
                </p>
                <Link
                  href="/hot-sauces"
                  className="mt-6 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                >
                  Explore hot sauces
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="container-shell py-10">
        <SectionHeading
          eyebrow="Top recipes"
          title="Flavor-first dinners with room for mild, medium, and serious heat."
          copy="Fast dinners, gentler starts, and bigger weekend payoffs."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {recipes.map((recipe, index) => (
            <div key={recipe.id} className={index >= mobileRecipePreviewCount ? "hidden lg:block" : ""}>
              <RecipeCard recipe={recipe} />
            </div>
          ))}
        </div>
        <div className="mt-6 lg:hidden">
          <Link
            href="/recipes"
            className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
          >
            See all recipes
          </Link>
        </div>
      </section>

      <section className="container-shell py-10">
        <SectionHeading
          eyebrow="Stories and reviews"
          title="Recipes, explainers, and bottle reviews with a clearer line between them."
          copy="Start with food and practical context, then use reviews and buying guides when you need product help."
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

      <section className="container-shell py-10">
        <SectionHeading
          eyebrow="Optional shopping help"
          title="When you need a bottle or gift, start with the shelves that stay useful."
          copy="Keep cooking first. These buying lanes are here when you want a better bottle, a practical tool, or a giftable pick."
        />
        <AffiliateDisclosure className="mt-4 max-w-3xl" compact />
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="panel p-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="eyebrow">Shop lanes</p>
                <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
                  Gift ideas, starter bottles, and pantry upgrades in one place.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-cream/70">
                  This section is for readers who want shopping help after they have cooked,
                  browsed reviews, or figured out what kind of heat they actually like.
                </p>
              </div>
              <Link
                href="/shop#starter-kit"
                className="inline-flex w-full justify-center rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream sm:w-auto"
              >
                Browse shop lanes
              </Link>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {shopCollections.map((collection, index) => (
                <article
                  key={collection.key}
                  className={`${index >= mobileShopLaneCount ? "hidden md:block " : ""}rounded-[1.75rem] border border-white/10 bg-white/5 p-5`}
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-ember">{collection.title}</p>
                  <h3 className="mt-3 font-display text-3xl text-cream">{collection.ctaLabel}</h3>
                  <p className="mt-4 text-sm leading-7 text-cream/72">{collection.description}</p>
                  <Link
                    href={`/shop#${collection.key}`}
                    className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-charcoal"
                  >
                    Browse lane
                  </Link>
                </article>
              ))}
            </div>
            <div className="mt-6 md:hidden">
              <Link
                href="/shop"
                className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
              >
                See the full shop
              </Link>
            </div>
          </div>
          <div className="panel p-8">
            <p className="eyebrow">Optional picks</p>
            <h2 className="mt-3 font-display text-4xl text-cream">
              A short list of things readers actually use.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-cream/70">
              We keep these secondary to the recipes and guides so the homepage stays useful even
              if you are not shopping today.
            </p>
            <div className="mt-8 space-y-4">
              {resolvedHomeAffiliateLinks.map(({ link, resolved }, index) => (
                <article
                  key={link.key}
                  className={`${index >= mobileAffiliatePreviewCount ? "hidden lg:block " : ""}rounded-[1.5rem] border border-white/10 bg-white/5 p-5`}
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
                    View pick
                  </AffiliateLink>
                </article>
              ))}
            </div>
            <div className="mt-6 lg:hidden">
              <Link
                href="/shop"
                className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
              >
                See more shop picks
              </Link>
            </div>
          </div>
        </div>
      </section>

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
