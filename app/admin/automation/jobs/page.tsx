import Link from "next/link";

import { AdminPage } from "@/components/admin/admin-page";
import { GenerationJobPanel } from "@/components/admin/generation-job-panel";
import { getGenerationJobs } from "@/lib/services/admin";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  const jobs = await getGenerationJobs();
  const completedCount = jobs.filter((job) => job.status === "completed").length;
  const failedCount = jobs.filter((job) => job.status === "failed").length;
  const activeCount = jobs.filter(
    (job) => job.status === "queued" || job.status === "generating"
  ).length;
  const tokensUsed = jobs.reduce((total, job) => total + (job.tokensUsed ?? 0), 0);

  return (
    <AdminPage
      title="Generation jobs"
      description="Review queue health, inspect parameters, and retry failed content runs."
    >
      <section className="panel-light p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow">Generation ledger</p>
            <h2 className="mt-3 font-display text-4xl text-charcoal">
              The 50 newest child jobs, with timing and provider evidence.
            </h2>
            <p className="mt-4 text-sm leading-7 text-charcoal/70">
              Each card now shows queue delay, execution time, attempts, model, token usage,
              failure diagnosis, raw parameters, and a direct link to generated content.
            </p>
          </div>
          <Link
            href="/admin/automation/runs"
            className="inline-flex rounded-full border border-charcoal/10 bg-white px-4 py-2 text-sm font-semibold text-charcoal transition hover:bg-charcoal/5"
          >
            Open parent runs
          </Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-charcoal/[0.04] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ember">Loaded</p>
            <p className="mt-2 font-display text-3xl text-charcoal">{jobs.length}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Completed
            </p>
            <p className="mt-2 font-display text-3xl text-charcoal">{completedCount}</p>
          </div>
          <div className="rounded-2xl bg-rose-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
              Failed / active
            </p>
            <p className="mt-2 font-display text-3xl text-charcoal">
              {failedCount} / {activeCount}
            </p>
          </div>
          <div className="rounded-2xl bg-charcoal/[0.04] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ember">
              Tokens recorded
            </p>
            <p className="mt-2 font-display text-3xl text-charcoal">
              {new Intl.NumberFormat("en-US", { notation: "compact" }).format(tokensUsed)}
            </p>
          </div>
        </div>
      </section>
      <div className="grid gap-6">
        {jobs.map((job) => (
          <GenerationJobPanel key={job.id} job={job} />
        ))}
      </div>
    </AdminPage>
  );
}
