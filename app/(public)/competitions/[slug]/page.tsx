import Link from "next/link";
import { notFound } from "next/navigation";

import { voteCompetitionEntryAction } from "@/lib/actions/competitions";
import { buildMetadata } from "@/lib/seo";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { getCompetition, getCompetitionVoteIdsForUser } from "@/lib/services/content";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}) {
  const competition = await getCompetition(params.slug);

  return buildMetadata({
    title:
      competition?.title
        ? `${competition.title} | FlamingFoodies`
        : "Competition | FlamingFoodies",
    description:
      competition?.description
        || "Join spicy cooking competitions, community voting, and heat-driven challenges on FlamingFoodies.",
    path: `/competitions/${params.slug}`,
    images: competition?.imageUrl ? [competition.imageUrl] : undefined
  });
}

export default async function CompetitionPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams?: { submitted?: string; voted?: string; error?: string };
}) {
  const [competition, profile] = await Promise.all([
    getCompetition(params.slug),
    getCurrentProfile()
  ]);

  if (!competition) notFound();

  const votedEntryIds = await getCompetitionVoteIdsForUser(
    competition.id,
    profile?.id
  );

  return (
    <section className="container-shell py-16">
      <div className="panel px-8 py-10">
        <p className="eyebrow">{competition.status}</p>
        <h1 className="mt-4 font-display text-6xl text-cream">{competition.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-cream/75">
          {competition.description}
        </p>
        <div className="mt-6 flex flex-wrap gap-6 text-sm text-cream/60">
          <span>Theme: {competition.theme}</span>
          <span>Closes: {formatDate(competition.endDate)}</span>
          <span>{competition.entries.length} published entries</span>
        </div>
        {searchParams?.submitted ? (
          <p className="mt-5 text-sm text-emerald-300">
            Entry submitted. It will appear here after admin approval.
          </p>
        ) : null}
        {searchParams?.voted ? (
          <p className="mt-5 text-sm text-emerald-300">
            Vote recorded. Nice choice.
          </p>
        ) : null}
        {searchParams?.error ? (
          <p className="mt-5 text-sm text-rose-300">{searchParams.error}</p>
        ) : null}
        <Link
          href={`/competitions/${competition.slug}/enter`}
          className="mt-8 inline-flex rounded-full bg-gradient-to-r from-flame to-ember px-6 py-3 font-semibold text-white"
        >
          Enter competition
        </Link>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {competition.entries.map((entry) => (
          <article key={entry.id} className="panel overflow-hidden">
            {entry.mediaUrl ? (
              <div
                className="h-64 bg-cover bg-center"
                style={{ backgroundImage: `url(${entry.mediaUrl})` }}
              />
            ) : null}
            <div className="p-6">
              <h2 className="font-display text-4xl text-cream">{entry.title}</h2>
              <p className="mt-3 text-sm leading-7 text-cream/75">{entry.caption}</p>
              <div className="mt-4 flex justify-between text-sm text-cream/60">
                <span>{entry.user.displayName}</span>
                <span>{entry.voteCount} votes</span>
              </div>
              <div className="mt-5">
                {profile ? (
                  votedEntryIds.has(entry.id) ? (
                    <div className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream/70">
                      You voted for this entry
                    </div>
                  ) : (
                    <form action={voteCompetitionEntryAction}>
                      <input type="hidden" name="entryId" value={entry.id} />
                      <input
                        type="hidden"
                        name="competitionId"
                        value={competition.id}
                      />
                      <input
                        type="hidden"
                        name="competitionSlug"
                        value={competition.slug}
                      />
                      <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-charcoal">
                        Vote for this entry
                      </button>
                    </form>
                  )
                ) : (
                  <Link
                    href="/login"
                    className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                  >
                    Log in to vote
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
