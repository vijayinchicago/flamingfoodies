import Link from "next/link";

import { TrustPageShell } from "@/components/layout/trust-page-shell";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { OrganizationSchema } from "@/components/schema/organization-schema";
import {
  EDITORIAL_PERSONA_DISCLOSURE,
  getAllPublicAuthors
} from "@/lib/authors";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";

const LAST_UPDATED = "September 6, 2026";

export const metadata = buildMetadata({
  title: "About FlamingFoodies",
  description:
    "What FlamingFoodies covers, how we choose recipes and hot sauce picks, and the standards behind the editorial system.",
  path: "/about"
});

export default function AboutPage() {
  const authors = getAllPublicAuthors();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "About", item: absoluteUrl("/about") }
        ]}
      />
      <OrganizationSchema />
    <TrustPageShell
      eyebrow="About"
      title="Flavor-first spicy food for real kitchens and mixed tables."
      description="FlamingFoodies covers spicy recipes, hot sauce reviews, shopping guides, and practical kitchen advice for people who care about what is worth cooking, pouring, and buying."
      lastUpdated={LAST_UPDATED}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <article className="panel p-6">
          <p className="eyebrow">What we publish</p>
          <h2 className="mt-3 font-display text-3xl text-charcoal">Recipes that hold up in a real kitchen.</h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/75">
            FlamingFoodies focuses on spicy dinners, sauces, sides, and comfort-food lanes that
            still taste complete. The goal is not shock value. The goal is repeatable food with a
            real point of view.
          </p>
        </article>
        <article className="panel p-6">
          <p className="eyebrow">How we recommend</p>
          <h2 className="mt-3 font-display text-3xl text-charcoal">Usefulness beats empty hype.</h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/75">
            On the hot sauce side, we care about what a bottle is actually good on, how hot it
            feels in context, and whether it earns space on a real shelf. That is why our reviews
            lean on “best for,” “skip if,” and comparison language instead of generic praise.
          </p>
        </article>
        <article className="panel p-6">
          <p className="eyebrow">What guides it</p>
          <h2 className="mt-3 font-display text-3xl text-charcoal">Built around practical editorial standards.</h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/75">
            FlamingFoodies is steered with a simple bias: make the site useful to weeknight cooks,
            curious beginners, and gift shoppers, not only people chasing maximum heat. That
            standard shapes what gets published and what gets recommended.
          </p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-8">
          <p className="eyebrow">Editorial standards</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Warm, practical, and clear about what we know.</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <p className="text-sm leading-7 text-charcoal/75">
              We publish recipes, reviews, and food stories built around a family-table tone:
              welcoming, specific, and grounded in the decisions people make while cooking,
              serving, and shopping. We aim for work that is useful, not content-farm generic.
            </p>
            <p className="text-sm leading-7 text-charcoal/75">
              When we recommend products, we try to explain why a pick is strong, who it is for,
              and when a different bottle would be smarter. Where a draft needs extra review before
              publish, we use editorial checks to tighten imagery, clarity, and category fit.
            </p>
          </div>
        </div>

        <div className="panel p-8">
          <p className="eyebrow">How reviews get checked</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Method beats hype.</h2>
          <div className="mt-5 space-y-4 text-sm leading-7 text-charcoal/75">
            <p>We look for practical signals first: what a bottle is good on, where the heat actually lands, and whether the recommendation makes sense for the person clicking it.</p>
            <p>When a review or recipe carries QA notes, image review, or fact review, we surface that on-page so readers can see the confidence signals instead of guessing.</p>
            <p>Questions or corrections are welcome. If a claim changes or a better fit emerges, we would rather update the page than leave stale certainty in place.</p>
          </div>
        </div>
      </div>

      <section className="panel p-8">
        <p className="eyebrow">Editorial board &amp; voices</p>
        <h2 className="mt-3 max-w-4xl font-display text-4xl text-charcoal">
          Four distinct beats, with one accountable publisher.
        </h2>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-charcoal/75">
          {EDITORIAL_PERSONA_DISCLOSURE} FlamingFoodies owns the final publishing decision,
          corrections, and standards behind every one of these bylines.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {authors.map((author) => (
            <article
              key={author.slug}
              className="rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.04] p-6"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-ember">
                Editorial pen name
              </p>
              <h3 className="mt-3 font-display text-3xl text-charcoal">{author.displayName}</h3>
              <p className="mt-1 text-sm font-semibold text-charcoal/70">{author.role}</p>
              <p className="mt-4 text-sm italic leading-7 text-charcoal/70">
                {author.personality}
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-charcoal/70">
                {author.focusAreas.map((area) => (
                  <li key={area}>{area}</li>
                ))}
              </ul>
              <Link
                href={`/authors/${author.slug}`}
                className="mt-5 inline-flex font-semibold text-charcoal underline underline-offset-4 hover:text-ember"
              >
                Read this byline&apos;s profile
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="panel p-8">
          <p className="eyebrow">How automation is used</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">
            Tools can help make a draft. They do not become the author.
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-7 text-charcoal/75">
            <p>
              FlamingFoodies uses generative and rules-based tools for research organization,
              drafting, image selection or illustration, formatting, and pre-publication QA.
              Automated content is still subject to the same usefulness, clarity, and category-fit
              checks as manually entered content.
            </p>
            <p>
              A persona byline identifies the responsible editorial lane. It does not mean that a
              fictional individual personally cooked a recipe, tasted a bottle, attended an event,
              or holds credentials we have not documented. Hands-on testing is stated only when it
              was actually completed and recorded.
            </p>
          </div>
        </article>

        <article className="panel p-8">
          <p className="eyebrow">What the byline means</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">A routing rule, not a disguise.</h2>
          <p className="mt-5 text-sm leading-7 text-charcoal/75">
            Recipes are split between practical weeknight work and technique-heavy projects.
            Ingredient and culture stories, cooking-science explainers, and commercial reviews each
            have their own voice. New and existing pages are assigned by the same topic rules so a
            name remains meaningful across the archive.
          </p>
          <Link
            href="/editorial-policy"
            className="mt-6 inline-flex rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal"
          >
            Read the full editorial policy
          </Link>
        </article>
      </section>

      <div className="panel p-8">
        <p className="eyebrow">Our other publication</p>
        <h2 className="mt-3 font-display text-4xl text-charcoal">
          Bark &amp; Baste — our BBQ sister site.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-charcoal/75">
          FlamingFoodies covers spicy food; <a
            href="https://www.barkandbaste.com"
            rel="noopener"
            className="font-semibold text-charcoal underline underline-offset-4 hover:text-ember"
          >Bark &amp; Baste</a> is its sibling, focused on BBQ technique, rubs, and smoked
          cooking from the same editorial team. Some recipes and ingredient guides cross-reference
          between the two when a topic genuinely fits both kitchens — a chile pepper used in a
          BBQ rub, a hot sauce that finishes a brisket, a smoking technique that pairs with a
          fiery side. Cross-references are editorial decisions, not blanket links.
        </p>
        <div className="mt-6">
          <a
            href="https://www.barkandbaste.com"
            rel="noopener"
            className="inline-flex rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal hover:border-charcoal/30"
          >
            Visit Bark &amp; Baste
          </a>
        </div>
      </div>

      <div className="panel p-8">
        <p className="eyebrow">Keep in touch</p>
        <h2 className="mt-3 font-display text-4xl text-charcoal">Questions, corrections, and brand inquiries all have a place.</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-charcoal/75">
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
            href="/editorial-policy"
            className="rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal"
          >
            Editorial policy
          </Link>
          <Link
            href="/review-methodology"
            className="rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal"
          >
            Review methodology
          </Link>
          <Link
            href="/corrections"
            className="rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal"
          >
            Corrections policy
          </Link>
          <Link
            href="/subscriptions"
            className="rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal"
          >
            Choose newsletter lanes
          </Link>
        </div>
      </div>
    </TrustPageShell>
    </>
  );
}
