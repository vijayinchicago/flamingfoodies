import Image from "next/image";
import Link from "next/link";

import { RecipeCard } from "@/components/cards/recipe-card";
import { ReviewCard } from "@/components/cards/review-card";
import { EmailCapture } from "@/components/forms/email-capture";
import { SectionHeading } from "@/components/layout/section-heading";
import { OrganizationSchema } from "@/components/schema/organization-schema";
import { WebSiteSchema } from "@/components/schema/website-schema";
import { HOT_SAUCE_LANDING_LINKS } from "@/lib/hot-sauces";
import { getFeaturedCollection } from "@/lib/services/content";
import { getGuides } from "@/lib/content/guides";
import { getEditorialFranchises } from "@/lib/editorial-franchises";
import { getRecipeHeroFields } from "@/lib/recipe-hero";
import { getCurrentOccasions } from "@/lib/seasonal/occasions";

export const revalidate = 600;

export default async function HomePage() {
  const [{ recipes, blogPosts, reviews, recipeSchedule }, guides] = await Promise.all([
    getFeaturedCollection(),
    getGuides()
  ]);
  const isWeekendRecipeSchedule = recipeSchedule === "weekend";
  const seasonalNow = getCurrentOccasions();
  const editorialFranchises = getEditorialFranchises(blogPosts);
  const featuredRecipe = recipes[0] ?? null;
  const featuredRecipeHero = featuredRecipe ? getRecipeHeroFields(featuredRecipe) : null;
  const recipeGrid = recipes.slice(1);
  const featuredGuide = guides[0] ?? null;
  const mobileRecipePreviewCount = 4;
  const popularBottleGuides = HOT_SAUCE_LANDING_LINKS.slice(0, 6);

  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />
      <section className="dark-scope bg-flame-gradient">
        <div className="container-shell py-8 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] px-5 py-7 backdrop-blur-sm sm:px-8 sm:py-12 lg:px-12 lg:py-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,99,30,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(230,57,70,0.22),transparent_30%)]" />
            <div className="relative">
              <p className="eyebrow">Flavor-first spicy food</p>
              <h1 className="mt-3 max-w-4xl font-display text-[1.75rem] leading-[1.05] text-cream sm:mt-4 sm:text-6xl sm:leading-[0.98] xl:text-[5.35rem]">
                Good food. As much heat as you like.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-cream/85 sm:mt-6 sm:text-lg sm:leading-8">
                Cook approachable dinners, read practical reviews, and get sharper spicy-food
                guidance without turning every meal into a stunt.
              </p>
              <div className="mt-6 sm:mt-8">
                <Link
                  href="/recipes"
                  className="inline-flex w-full justify-center rounded-full bg-gradient-to-r from-flame to-ember px-6 py-3 font-semibold text-white sm:w-auto"
                >
                  Browse recipes
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
                      <p className="text-xs uppercase tracking-[0.24em] text-ember">
                        {isWeekendRecipeSchedule ? "Weekend project" : "Tonight's quick pick"}
                      </p>
                      <h2 className="mt-3 font-display text-4xl text-cream">{featuredRecipe.title}</h2>
                      <p className="mt-4 text-sm leading-7 text-cream/85">{featuredRecipe.description}</p>
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
                <p className="eyebrow">Hot sauce guide</p>
                <h2 className="mt-3 font-display text-4xl text-cream">Find the right bottle faster.</h2>
                <p className="mt-4 text-sm leading-7 text-cream/85">
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
        </div>
      </section>

      <section className="container-shell py-10">
        <SectionHeading
          eyebrow="Top recipes"
          title="Flavor-first dinners with room for mild, medium, and serious heat."
          copy={
            isWeekendRecipeSchedule
              ? "Longer cooks worth settling into, plus fresh and popular recipes from the archive."
              : "Weeknight-friendly cooks led by recipes ready in 45 minutes or less."
          }
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {recipeGrid.map((recipe, index) => (
            <div key={recipe.id} className={index >= mobileRecipePreviewCount ? "hidden lg:block" : ""}>
              <RecipeCard recipe={recipe} />
            </div>
          ))}
        </div>
        <div className="mt-6 lg:hidden">
          <Link
            href="/recipes"
            className="inline-flex rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal"
          >
            See all recipes
          </Link>
        </div>
      </section>

      <section className="container-shell py-10">
        <SectionHeading
          eyebrow="Popular searches"
          title="Find a hot sauce for your next meal."
          copy="Find a sauce for eggs, tacos or wings, compare prices, and learn what to look for on the label."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {popularBottleGuides.map((guide) => (
            <Link key={guide.href} href={guide.href} className="panel p-7 transition hover:bg-charcoal/[0.03]">
              <p className="eyebrow">{guide.eyebrow}</p>
              <h3 className="mt-3 font-display text-4xl text-charcoal">{guide.title}</h3>
              <p className="mt-4 text-sm leading-7 text-charcoal/75">{guide.description}</p>
              <span className="mt-5 inline-flex rounded-full border border-charcoal/15 px-4 py-2 text-sm font-semibold text-charcoal">
                Open guide
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-shell py-10">
        <SectionHeading
          eyebrow="Stories and reviews"
          title="Get to know your peppers, sauces, and spices."
          copy="Ingredient guides, cooking advice, and a closer look at the bottles on your shelf."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {blogPosts.map((post) => (
            <div key={post.id} className="panel p-7">
              <p className="eyebrow">{post.category}</p>
              <h3 className="mt-4 font-display text-4xl text-charcoal">{post.title}</h3>
              <p className="mt-4 text-sm leading-7 text-charcoal/75">{post.description}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-6 inline-flex rounded-full border border-charcoal/15 px-4 py-2 text-sm font-semibold text-charcoal"
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
          eyebrow="More to explore"
          title="Series, seasons, and ideas to explore."
          copy="Find something for the grill, a new sauce to make, or a dinner for the season."
        />
        <div className="mt-10 grid gap-6 xl:grid-cols-3">
          {seasonalNow.slice(0, 1).map((occasion) => (
            <article key={occasion.slug} className="panel p-7">
              <p className="eyebrow">In season now</p>
              <h3 className="mt-3 font-display text-4xl text-charcoal">{occasion.title}</h3>
              <p className="mt-4 text-sm leading-7 text-charcoal/75">{occasion.tagline}</p>
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
              <p className="mt-4 text-sm leading-7 text-charcoal/75">{franchise.description}</p>
              {franchise.posts[0] ? (
                <Link
                  href={`/blog/${franchise.posts[0].slug}`}
                  className="mt-5 block rounded-[1.35rem] border border-charcoal/10 bg-charcoal/[0.03] px-4 py-4 text-sm text-charcoal/75 transition hover:bg-charcoal/[0.06]"
                >
                  <span className="text-xs uppercase tracking-[0.18em] text-ember">Recent post</span>
                  <span className="mt-2 block font-semibold text-charcoal">{franchise.posts[0].title}</span>
                </Link>
              ) : null}
              <Link
                href={franchise.href}
                className="mt-5 inline-flex rounded-full border border-charcoal/15 px-4 py-2 text-sm font-semibold text-charcoal"
              >
                {franchise.ctaLabel}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="container-shell py-16">
        <SectionHeading
          eyebrow="Flame Club newsletter"
          title="Flame Club keeps the best spicy finds in one place."
          copy="Get standout recipes, useful reviews, and new guides without having to hunt through the site every week."
        />
        <div className="mt-8">
          <EmailCapture
            source="homepage"
            tag="homepage-hero"
            variant="email-only"
            heading="Get one useful spicy-food email every Friday."
            buttonLabel="Join Flame Club"
            description="One standout recipe, one honest bottle pick, and one guide worth keeping."
            defaultSegments={["weekly-roundup"]}
          />
        </div>
      </section>
    </>
  );
}
