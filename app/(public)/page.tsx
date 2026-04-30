import Image from "next/image";
import Link from "next/link";

import { RecipeCard } from "@/components/cards/recipe-card";
import { ReviewCard } from "@/components/cards/review-card";
import { EmailCapture } from "@/components/forms/email-capture";
import { SectionHeading } from "@/components/layout/section-heading";
import { OrganizationSchema } from "@/components/schema/organization-schema";
import { getFeaturedCollection } from "@/lib/services/content";
import { getGuides } from "@/lib/content/guides";
import { getEditorialFranchises } from "@/lib/editorial-franchises";
import { getRecipeHeroFields } from "@/lib/recipe-hero";
import { getCurrentOccasions } from "@/lib/seasonal/occasions";

export const revalidate = 3600;

export default async function HomePage() {
  const [{ recipes, blogPosts, reviews }, guides] = await Promise.all([
    getFeaturedCollection(),
    getGuides()
  ]);
  const seasonalNow = getCurrentOccasions();
  const editorialFranchises = getEditorialFranchises(blogPosts);
  const featuredRecipe = recipes[0] ?? null;
  const featuredRecipeHero = featuredRecipe ? getRecipeHeroFields(featuredRecipe) : null;
  const featuredGuide = guides[0] ?? null;
  const mobileRecipePreviewCount = 4;

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
                Cook approachable dinners, read practical reviews, and get sharper spicy-food
                guidance without turning every meal into a stunt.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/recipes"
                  className="inline-flex w-full justify-center rounded-full bg-gradient-to-r from-flame to-ember px-6 py-3 font-semibold text-white sm:w-auto"
                >
                  Browse recipes
                </Link>
                <Link
                  href="/reviews"
                  className="inline-flex w-full justify-center rounded-full bg-white px-6 py-3 font-semibold text-charcoal sm:w-auto"
                >
                  Read reviews
                </Link>
                <Link
                  href="/how-to"
                  className="inline-flex w-full justify-center rounded-full border border-white/15 px-6 py-3 font-semibold text-cream sm:w-auto"
                >
                  Open how-to guides
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
                <p className="eyebrow">Review path</p>
                <h2 className="mt-3 font-display text-4xl text-cream">Find the right bottle faster.</h2>
                <p className="mt-4 text-sm leading-7 text-cream/70">
                  Start with practical reviews that separate everyday pours, starter bottles, and
                  high-heat outliers before you buy anything.
                </p>
                <Link
                  href="/reviews"
                  className="mt-6 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                >
                  Read the reviews
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
          copy="Browse regular features with seasonal guides, recurring story lines, and ideas for what to cook next."
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

      <section className="container-shell py-16">
        <SectionHeading
          eyebrow="Email capture"
          title="Flame Club keeps the best spicy finds in one place."
          copy="Get standout recipes, useful reviews, and new guides without having to hunt through the site every week."
        />
        <div className="mt-8">
          <EmailCapture
            source="homepage"
            tag="homepage-hero"
            heading="Choose the newsletter lane that matches how you use the site."
            description="Choose a full weekly roundup, more recipes, or more review-focused notes."
            defaultSegments={["weekly-roundup", "recipe-club"]}
          />
        </div>
      </section>
    </>
  );
}
