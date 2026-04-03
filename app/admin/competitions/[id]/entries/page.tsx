import Link from "next/link";
import { notFound } from "next/navigation";

import { updateCompetitionEntryStateAction } from "@/lib/actions/competitions";
import { AdminPage } from "@/components/admin/admin-page";
import { getAdminCompetitionById } from "@/lib/services/content";

export default async function AdminCompetitionEntriesPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { updated?: string; error?: string };
}) {
  const competition = await getAdminCompetitionById(Number(params.id));

  if (!competition) notFound();

  return (
    <AdminPage
      title={`${competition.title} entries`}
      description="Approve entries, view engagement, and mark a winner when the round closes."
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-charcoal/60">
          {competition.entries.length} total entries across all moderation states.
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/competitions/${competition.id}`}
            className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
          >
            Edit competition
          </Link>
          <Link
            href="/admin/competitions/list"
            className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
          >
            Back to competitions
          </Link>
        </div>
      </div>
      {searchParams?.updated ? (
        <p className="text-sm text-emerald-700">Entry updated successfully.</p>
      ) : null}
      {searchParams?.error ? (
        <p className="text-sm text-rose-600">{searchParams.error}</p>
      ) : null}
      <div className="grid gap-6">
        {competition.entries.map((entry) => (
          <article key={entry.id} className="panel-light p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-3xl text-charcoal">{entry.title}</h2>
              <span className="rounded-full bg-charcoal/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/70">
                {entry.status}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-charcoal/70">{entry.caption}</p>
            <div className="mt-4 flex gap-4 text-sm text-charcoal/60">
              <span>{entry.user.displayName}</span>
              <span>{entry.voteCount} votes</span>
              <span>{entry.isWinner ? "Winner" : "Not winner"}</span>
            </div>
            <form action={updateCompetitionEntryStateAction} className="mt-5 flex flex-wrap gap-3">
              <input type="hidden" name="entryId" value={entry.id} />
              <input type="hidden" name="competitionId" value={competition.id} />
              {entry.status !== "published" ? (
                <button
                  name="intent"
                  value="approve"
                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Approve
                </button>
              ) : null}
              {entry.status !== "archived" ? (
                <button
                  name="intent"
                  value="reject"
                  className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Reject
                </button>
              ) : null}
              <button
                name="intent"
                value={entry.isWinner ? "unwinner" : "winner"}
                className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
              >
                {entry.isWinner ? "Remove winner" : "Mark winner"}
              </button>
            </form>
          </article>
        ))}
      </div>
    </AdminPage>
  );
}
