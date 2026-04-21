import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { EmailCapture } from "@/components/forms/email-capture";
import { resolveAffiliateLink } from "@/lib/affiliates";
import { buildMetadata } from "@/lib/seo";

const resultCopy: Record<string, { title: string; description: string; tag: string }> = {
  "mild-adventurer": {
    title: "Mild Adventurer",
    description: "You like warmth with flavor leadership. Start with balanced sauces and aromatic recipes, not punishment.",
    tag: "quiz-mild-adventurer"
  },
  "balanced-burn": {
    title: "Balanced Burn",
    description: "You want real heat, but only when it respects the dish. Fermented sauces and layered spice blends are your lane.",
    tag: "quiz-balanced-burn"
  },
  "heat-hunter": {
    title: "Heat Hunter",
    description: "You want intensity and complexity. You are ready for the recipes that flirt with sweat but still taste like dinner.",
    tag: "quiz-heat-hunter"
  },
  "reaper-chaser": {
    title: "Reaper Chaser",
    description: "You are here for max-end heat, rare peppers, and sauce flights that scare everyone else at the table.",
    tag: "quiz-reaper-chaser"
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
            href="/recipes"
            className="rounded-full bg-gradient-to-r from-flame to-ember px-6 py-3 font-semibold text-white"
          >
            Find matching recipes
          </Link>
          {resolvedOffer ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs uppercase tracking-[0.18em] text-ember">Our pick for you</p>
              <AffiliateLink
                href={resolvedOffer.href}
                partnerKey={resolvedOffer.key}
                trackingMode={resolvedOffer.trackingMode}
                sourcePage={`/quiz/results/${params.type}`}
                position="quiz-result"
                className="rounded-full border border-white/15 px-6 py-3 font-semibold text-cream"
              >
                {productName} — Check price
              </AffiliateLink>
            </div>
          ) : null}
        </div>
        <AffiliateDisclosure className="mx-auto mt-8 max-w-2xl text-left" compact />
        <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-8 text-left">
          <EmailCapture
            source="quiz-result"
            tag={result.tag}
            defaultSegments={["recipe-club"]}
            heading={`Get ${result.title} recipes every week.`}
            description="Weekly picks matched to your heat level. No fluff."
          />
        </div>
      </div>
    </section>
  );
}
