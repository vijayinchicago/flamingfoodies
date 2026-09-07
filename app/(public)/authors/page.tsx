import Link from "next/link";

import { TrustPageShell } from "@/components/layout/trust-page-shell";
import {
  EDITORIAL_PERSONA_DISCLOSURE,
  getAllPublicAuthors
} from "@/lib/authors";
import { buildMetadata } from "@/lib/seo";

const LAST_UPDATED = "September 6, 2026";

export const metadata = buildMetadata({
  title: "FlamingFoodies Contributors",
  description:
    "Meet the disclosed editorial pen names behind FlamingFoodies recipes, stories, and reviews, and learn which subjects each covers.",
  path: "/authors"
});

export default function AuthorsPage() {
  const authors = getAllPublicAuthors();

  return (
    <TrustPageShell
      eyebrow="Editorial board"
      title="The voices behind FlamingFoodies."
      description={EDITORIAL_PERSONA_DISCLOSURE}
      lastUpdated={LAST_UPDATED}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {authors.map((author) => (
          <article key={author.slug} className="panel p-8">
            <p className="eyebrow">Editorial pen name</p>
            <h2 className="mt-3 font-display text-4xl text-charcoal">{author.displayName}</h2>
            <p className="mt-2 text-sm font-semibold text-charcoal/70">{author.role}</p>
            <p className="mt-4 text-sm italic leading-7 text-charcoal/70">
              {author.personality}
            </p>
            <p className="mt-4 text-sm leading-7 text-charcoal/75">{author.shortBio}</p>
            <ul className="mt-5 space-y-2 text-sm leading-7 text-charcoal/70">
              {author.focusAreas.map((area) => (
                <li key={area}>{area}</li>
              ))}
            </ul>
            <Link
              href={`/authors/${author.slug}`}
              className="mt-6 inline-flex rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal"
            >
              View byline profile
            </Link>
          </article>
        ))}
      </div>
    </TrustPageShell>
  );
}
