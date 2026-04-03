import Link from "next/link";

import { AdminPage } from "@/components/admin/admin-page";
import { ContentTable } from "@/components/admin/content-table";
import { getAdminCompetitions } from "@/lib/services/content";

export default async function AdminCompetitionListPage() {
  const competitions = await getAdminCompetitions();

  return (
    <AdminPage
      title="Competitions"
      description="Lifecycle management for monthly community challenges."
    >
      <div className="flex justify-end">
        <Link
          href="/admin/competitions/new"
          className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white"
        >
          New competition
        </Link>
      </div>
      <ContentTable
        title="Competitions"
        rows={competitions.map((competition) => ({
          title: competition.title,
          status: competition.status,
          entries: competition.entries.length,
          theme: competition.theme
        }))}
      />
      <div className="grid gap-4">
        {competitions.map((competition) => (
          <article key={competition.id} className="panel-light p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{competition.status}</p>
                <h2 className="mt-2 font-display text-4xl text-charcoal">
                  {competition.title}
                </h2>
                <p className="mt-3 text-sm text-charcoal/65">{competition.description}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/admin/competitions/${competition.id}`}
                  className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
                >
                  Edit competition
                </Link>
                <Link
                  href={`/admin/competitions/${competition.id}/entries`}
                  className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
                >
                  Manage entries
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AdminPage>
  );
}
