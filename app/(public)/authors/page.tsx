import Link from "next/link";

import { TrustPageShell } from "@/components/layout/trust-page-shell";
import { getAllPublicAuthors } from "@/lib/authors";
import { buildMetadata } from "@/lib/seo";

const LAST_UPDATED = "April 27, 2026";

export const metadata = buildMetadata({
  title: "FlamingFoodies Contributors",
  description:
    "Contributor and editorial team pages for the people and desks behind FlamingFoodies coverage.",
  path: "/authors"
});

export default function AuthorsPage() {
  const authors = getAllPublicAuthors();

  return (
    <TrustPageShell
      eyebrow="Contributors"
      title="Who writes, edits, and steers the site."
      description="FlamingFoodies uses contributor, team, and desk pages to make it clearer which lane of the site a byline belongs to."
      lastUpdated={LAST_UPDATED}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {authors.map((author) => (
          <article key={author.slug} className="panel p-8">
            <p className="eyebrow">{author.role}</p>
            <h2 className="mt-3 font-display text-4xl text-cream">{author.displayName}</h2>
            <p className="mt-4 text-sm leading-7 text-cream/75">{author.shortBio}</p>
            <ul className="mt-5 space-y-2 text-sm leading-7 text-cream/70">
              {author.focusAreas.map((area) => (
                <li key={area}>{area}</li>
              ))}
            </ul>
            <Link
              href={`/authors/${author.slug}`}
              className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              View contributor page
            </Link>
          </article>
        ))}
      </div>
    </TrustPageShell>
  );
}
