import Link from "next/link";

import { TrustPageShell } from "@/components/layout/trust-page-shell";
import { buildMetadata } from "@/lib/seo";

const LAST_UPDATED = "April 10, 2026";

export const metadata = buildMetadata({
  title: "About FlamingFoodies",
  description:
    "What FlamingFoodies covers, how we choose recipes and hot sauce picks, and what the site is trying to build.",
  path: "/about"
});

export default function AboutPage() {
  return (
    <TrustPageShell
      eyebrow="About"
      title="FlamingFoodies is built for people who want flavor before flexing."
      description="We cover spicy recipes, hot sauce reviews, shopping guides, and practical kitchen advice for people who care about what is worth cooking, pouring, and buying."
      lastUpdated={LAST_UPDATED}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <article className="panel p-6">
          <p className="eyebrow">What we publish</p>
          <h2 className="mt-3 font-display text-3xl text-cream">Recipes that hold up in a real kitchen.</h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            FlamingFoodies focuses on spicy dinners, sauces, sides, and comfort-food lanes that
            still taste complete. The goal is not shock value. The goal is repeatable food with a
            real point of view.
          </p>
        </article>
        <article className="panel p-6">
          <p className="eyebrow">How we recommend</p>
          <h2 className="mt-3 font-display text-3xl text-cream">Usefulness beats empty hype.</h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            On the hot sauce side, we care about what a bottle is actually good on, how hot it
            feels in context, and whether it earns space on a real shelf. That is why our reviews
            lean on “best for,” “skip if,” and comparison language instead of generic praise.
          </p>
        </article>
        <article className="panel p-6">
          <p className="eyebrow">What the site is building</p>
          <h2 className="mt-3 font-display text-3xl text-cream">A sharper spicy-food home base.</h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            We want the site to be useful whether you are planning dinner, buying one better
            bottle, or trying to build a smarter spicy pantry over time. Search, saves, shares,
            and email all feed that loop.
          </p>
        </article>
      </div>

      <div className="panel p-8">
        <p className="eyebrow">Editorial standards</p>
        <h2 className="mt-3 font-display text-4xl text-cream">Warm, practical, and clear about what we know.</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <p className="text-sm leading-7 text-cream/75">
            We publish original recipes, reviews, and food stories built around a family-table
            tone: welcoming, specific, and grounded in what people actually cook and eat. We aim
            for a voice that feels generous and useful, not performative or content-farm generic.
          </p>
          <p className="text-sm leading-7 text-cream/75">
            When we recommend products, we try to explain why a pick is strong, who it is for, and
            when a different bottle would be smarter. Where a draft needs human review before
            publish, we use that editorial pass to check imagery, clarity, and category fit.
          </p>
        </div>
      </div>

      <div className="panel p-8">
        <p className="eyebrow">Keep in touch</p>
        <h2 className="mt-3 font-display text-4xl text-cream">Questions, corrections, and brand inquiries all have a place.</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-cream/75">
          If you need to reach FlamingFoodies directly, the contact page is the best place to
          start. If you just want the strongest recipes, bottle picks, and guides without hunting
          through the archive, the newsletter is the easier route.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
          >
            Contact FlamingFoodies
          </Link>
          <Link
            href="/subscriptions"
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
          >
            Choose newsletter lanes
          </Link>
        </div>
      </div>
    </TrustPageShell>
  );
}
