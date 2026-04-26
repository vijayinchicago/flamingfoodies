import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { EmailCapture } from "@/components/forms/email-capture";
import { getAffiliateCtaLabel, resolveAffiliateLink } from "@/lib/affiliates";
import { buildMetadata } from "@/lib/seo";

const resultCopy: Record<
  string,
  {
    title: string;
    description: string;
    tag: string;
    recipeHref: string;
    recipeLabel: string;
    shopHref: string;
    shopLabel: string;
    emailDescription: string;
  }
> = {
  "mild-adventurer": {
    title: "Mild Adventurer",
    description:
      "You want warmth with flavor leading the way. Start with forgiving dinners and bottles that make tacos, eggs, and bowls better without turning every meal into a dare.",
    tag: "quiz-mild-adventurer",
    recipeHref: "/recipes?heat=mild&maxTime=45&sort=quickest",
    recipeLabel: "See mild weeknight recipes",
    shopHref: "/hot-sauces/under-15",
    shopLabel: "Start with affordable bottles",
    emailDescription:
      "Weekly recipe and bottle picks that stay flavorful, practical, and easy to live with."
  },
  "balanced-burn": {
    title: "Balanced Burn",
    description:
      "You want a real kick, but only when it still respects the dish. Fermented sauces, layered spice blends, and versatile pours are your sweet spot.",
    tag: "quiz-balanced-burn",
    recipeHref: "/recipes?heat=medium&maxTime=60",
    recipeLabel: "Find balanced-burn recipes",
    shopHref: "/hot-sauces",
    shopLabel: "Browse everyday bottles",
    emailDescription:
      "Weekly dinners and sauce picks with enough heat to stay exciting without making everything a challenge."
  },
  "heat-hunter": {
    title: "Heat Hunter",
    description:
      "You want intensity and complexity. You are ready for the recipes that flirt with sweat, the bolder wing-night bottles, and the shelf upgrades that still earn repeat use.",
    tag: "quiz-heat-hunter",
    recipeHref: "/recipes?heat=hot",
    recipeLabel: "Open hotter recipe picks",
    shopHref: "/hot-sauces/best-for-wings",
    shopLabel: "See bolder bottle picks",
    emailDescription:
      "Weekly hot-side recipes and bottle recommendations with more bite, more personality, and fewer novelty picks."
  },
  "reaper-chaser": {
    title: "Reaper Chaser",
    description:
      "You are here for max-end heat, rare peppers, and bottles that make the whole table pay attention. You still want flavor, but you are not here to play it safe.",
    tag: "quiz-reaper-chaser",
    recipeHref: "/recipes?heat=reaper&sort=hottest",
    recipeLabel: "Go straight to max-heat recipes",
    shopHref: "/hot-sauces/compare",
    shopLabel: "Compare serious-heat sauces",
    emailDescription:
      "Weekly high-heat recipes, bottle comparisons, and spicy finds for people who actually want the bigger hit."
  }
};

export function generateMetadata({
  params
}: {
  params: { type: string };
}) {
  const result = resultCopy[params.type] || resultCopy["balanced-burn"];

  return buildMetadata({
    title: `${result.title} Quiz Result | FlamingFoodies`,
    description: result.description,
    path: `/quiz/results/${params.type}`,
    noIndex: true
  });
}

const quizAffiliateMap: Record<string, string> = {
  "mild-adventurer": "amazon-cholula-original",
  "balanced-burn": "heatonist-los-calientes-rojo",
  "heat-hunter": "amazon-torchbearer-garlic-reaper",
  "reaper-chaser": "heatonist-hot-ones-season-22"
};

const quizProductNames: Record<string, string> = {
  "mild-adventurer": "Cholula Original Hot Sauce",
  "balanced-burn": "Heatonist Los Calientes Rojo",
  "heat-hunter": "Torchbearer Garlic Reaper",
  "reaper-chaser": "Hot Ones Lineup Collection"
};

export default function QuizResultPage({
  params
}: {
  params: { type: string };
}) {
  const result = resultCopy[params.type] || resultCopy["balanced-burn"];
  const affiliateKey = quizAffiliateMap[params.type] || quizAffiliateMap["balanced-burn"];
  const productName = quizProductNames[params.type] || quizProductNames["balanced-burn"];
  const resolvedOffer = resolveAffiliateLink(affiliateKey, {
    sourcePage: `/quiz/results/${params.type}`,
    position: "quiz-result"
  });

  return (
    <section className="container-shell py-16">
      <div className="panel mx-auto max-w-3xl px-8 py-12 text-center">
        <p className="eyebrow">Quiz result</p>
        <h1 className="mt-4 font-display text-6xl text-cream">{result.title}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-cream/75">
          {result.description}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href={result.recipeHref}
            className="rounded-full bg-gradient-to-r from-flame to-ember px-6 py-3 font-semibold text-white"
          >
            {result.recipeLabel}
          </Link>
          <Link
            href={result.shopHref}
            className="rounded-full border border-white/15 px-6 py-3 font-semibold text-cream"
          >
            {result.shopLabel}
          </Link>
        </div>
        {resolvedOffer ? (
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-xs uppercase tracking-[0.18em] text-ember">Our pick for you</p>
            <AffiliateLink
              href={resolvedOffer.href}
              partnerKey={resolvedOffer.key}
              trackingMode={resolvedOffer.trackingMode}
              sourcePage={`/quiz/results/${params.type}`}
              position="quiz-result"
              className="rounded-full border border-white/15 px-6 py-3 font-semibold text-cream"
            >
              {productName} — {getAffiliateCtaLabel(resolvedOffer)}
            </AffiliateLink>
          </div>
        ) : null}
        <AffiliateDisclosure className="mx-auto mt-8 max-w-2xl text-left" compact />
        <div className="mt-8 grid gap-4 text-left md:grid-cols-2">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="eyebrow">Start here</p>
            <h2 className="mt-3 font-display text-3xl text-cream">Pick one dinner, then one bottle.</h2>
            <p className="mt-4 text-sm leading-7 text-cream/75">
              The easiest way to build confidence is to cook one recipe in your lane and pair it
              with one bottle you will actually reach for again next week.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="eyebrow">Buying for someone else?</p>
            <h2 className="mt-3 font-display text-3xl text-cream">Start with gifts, not guesses.</h2>
            <p className="mt-4 text-sm leading-7 text-cream/75">
              If this quiz was really about another person, skip the guesswork and start with the
              safer gift-set and under-$50 lanes first.
            </p>
            <Link
              href="/hot-sauces/gifts-under-50"
              className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
            >
              Open gift-friendly picks
            </Link>
          </div>
        </div>
        <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-8 text-left">
          <EmailCapture
            source="quiz-result"
            tag={result.tag}
            defaultSegments={["recipe-club"]}
            heading={`Get ${result.title} recipes every week.`}
            description={result.emailDescription}
          />
        </div>
      </div>
    </section>
  );
}
