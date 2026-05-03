import Link from "next/link";
import { Suspense } from "react";

import { FlameClubSignup } from "@/components/forms/flame-club-signup";
import { buildMetadata } from "@/lib/seo";
import { getFeaturedCollection } from "@/lib/services/content";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Flame Club — One spicy recipe + one honest hot sauce pick, every Friday",
  description:
    "Join 2,400+ home cooks getting one tested spicy weeknight recipe and one honest hot sauce pick every Friday. Free, no fluff, unsubscribe anytime.",
  path: "/flame-club"
});

const PROMISES = [
  {
    eyebrow: "Friday #1",
    title: "One tested weeknight recipe",
    body: "Under 45 minutes, family-table friendly, with a heat dial you can turn down for kids or up for chili-heads at the same dinner."
  },
  {
    eyebrow: "Friday #2",
    title: "One honest hot sauce pick",
    body: "What it's actually good on, what to skip it for, and where to buy it cheapest. No paid placements. Ever."
  },
  {
    eyebrow: "Bonus",
    title: "Seasonal heat drops",
    body: "Festival roundups, holiday gift guides, new release alerts. The stuff that doesn't fit on the site goes straight to the inbox."
  }
];

const FAQ = [
  {
    q: "How often will you email me?",
    a: "Once a week, every Friday morning. Plus the occasional seasonal drop (Super Bowl wings, holiday gifts, festival lineups)."
  },
  {
    q: "Will you sell or share my email?",
    a: "Never. Not now, not later. We use Kit to deliver the newsletter and that's it."
  },
  {
    q: "What if I don't like it?",
    a: "Every email has a one-click unsubscribe at the bottom. No questions, no friction."
  },
  {
    q: "Is this a beginner-friendly newsletter?",
    a: "Yes. We write for cooks who like flavor first and heat second, and most recipes scale from mild to wild so the whole table can share."
  },
  {
    q: "What does it cost?",
    a: "Nothing. Flame Club is free. We make money through honest affiliate links on hot sauce reviews if you choose to buy something we recommend."
  }
];

export default async function FlameClubPage() {
  const { recipes, reviews } = await getFeaturedCollection();
  const previewRecipe = recipes[0] ?? null;
  const previewReview = reviews[0] ?? null;

  return (
    <>
      <section className="container-shell py-12 sm:py-20">
        <div className="panel relative overflow-hidden px-5 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,99,30,0.28),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(230,57,70,0.24),transparent_32%)]" />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="eyebrow">Flame Club · Free weekly newsletter</p>
            <h1 className="mt-5 font-display text-4xl leading-[1.02] text-cream sm:text-6xl xl:text-[4.6rem]">
              One spicy recipe.<br />One honest sauce pick.<br />Every Friday.
            </h1>
            <p className="mt-6 text-base leading-7 text-cream/80 sm:text-lg sm:leading-8">
              Join thousands of home cooks who use Flame Club to find the next great
              weeknight dinner and the next bottle worth space on their shelf — without
              wading through hype, listicles, or pay-to-play reviews.
            </p>

            <div className="mt-10">
              <Suspense fallback={<div className="h-[120px]" />}>
                <FlameClubSignup source="flame-club-hero" />
              </Suspense>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs uppercase tracking-[0.22em] text-cream/55">
              <span>Free forever</span>
              <span>·</span>
              <span>No sponsored picks</span>
              <span>·</span>
              <span>Unsubscribe in one click</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell pb-12 sm:pb-20">
        <div className="text-center">
          <p className="eyebrow">What lands in your inbox</p>
          <h2 className="mt-3 font-display text-3xl text-cream sm:text-5xl">
            Three useful things, every week.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PROMISES.map((item) => (
            <article key={item.title} className="panel p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-ember">{item.eyebrow}</p>
              <h3 className="mt-3 font-display text-2xl text-cream">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-cream/75">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {previewRecipe || previewReview ? (
        <section className="container-shell pb-12 sm:pb-20">
          <div className="text-center">
            <p className="eyebrow">A preview of this week</p>
            <h2 className="mt-3 font-display text-3xl text-cream sm:text-5xl">
              The kind of pick you&apos;ll get on Friday.
            </h2>
            <p className="mt-4 text-sm leading-7 text-cream/70 sm:text-base">
              These are pulled live from the site. The real Friday email goes deeper —
              with notes on why we picked them, what to swap, and where to buy.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {previewRecipe ? (
              <Link
                href={`/recipes/${previewRecipe.slug}`}
                className="panel block p-6 transition hover:border-white/20"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-ember">Recipe sample</p>
                <h3 className="mt-3 font-display text-2xl text-cream">{previewRecipe.title}</h3>
                <p className="mt-3 text-sm leading-7 text-cream/75">{previewRecipe.description}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] text-cream/55">
                  {previewRecipe.totalTimeMinutes} min · {previewRecipe.heatLevel} heat
                </p>
              </Link>
            ) : null}
            {previewReview ? (
              <Link
                href={`/reviews/${previewReview.slug}`}
                className="panel block p-6 transition hover:border-white/20"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-ember">Review sample</p>
                <h3 className="mt-3 font-display text-2xl text-cream">{previewReview.title}</h3>
                <p className="mt-3 text-sm leading-7 text-cream/75">{previewReview.description}</p>
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="container-shell pb-12 sm:pb-20">
        <div className="panel mx-auto max-w-3xl p-6 sm:p-10">
          <p className="eyebrow text-center">Why people stay subscribed</p>
          <blockquote className="mt-5 text-center font-display text-2xl leading-snug text-cream sm:text-3xl">
            “The only food newsletter I open every week. Real recipes I actually cook,
            and reviews that don&apos;t read like ad copy.”
          </blockquote>
          <p className="mt-4 text-center text-xs uppercase tracking-[0.22em] text-cream/55">
            — Flame Club member
          </p>
        </div>
      </section>

      <section className="container-shell pb-12 sm:pb-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="eyebrow">Common questions</p>
            <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
              Before you sign up.
            </h2>
          </div>
          <div className="mt-8 grid gap-4">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="panel group p-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-left font-display text-lg text-cream">
                  {item.q}
                  <span className="text-ember transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-7 text-cream/75">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell pb-16 sm:pb-24">
        <div className="panel relative overflow-hidden px-5 py-10 sm:px-10 sm:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,99,30,0.22),transparent_45%)]" />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl text-cream sm:text-5xl">
              Friday&apos;s recipe is already in the oven.
            </h2>
            <p className="mt-4 text-sm leading-7 text-cream/75 sm:text-base">
              Drop your email below to get it. No spam, no stunts, no newsletter sludge.
            </p>
            <div className="mt-8">
              <Suspense fallback={<div className="h-[120px]" />}>
                <FlameClubSignup source="flame-club-footer" />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
