import type { GenerationJob } from "@/lib/types";

export function GenerationJobPanel({ job }: { job: GenerationJob }) {
  return (
    <article className="panel-light p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-ember">{job.jobType}</p>
          <h2 className="mt-2 font-display text-3xl text-charcoal">
            Job #{job.id}
          </h2>
        </div>
        <span className="rounded-full bg-charcoal/5 px-3 py-1 text-xs font-semibold text-charcoal/70">
          {job.status}
        </span>
      </div>
      <pre className="mt-4 overflow-x-auto rounded-2xl bg-charcoal px-4 py-4 text-xs text-cream">
        {JSON.stringify(job.parameters || {}, null, 2)}
      </pre>
      <div className="mt-4 flex flex-wrap gap-3 text-sm text-charcoal/60">
        <span>Attempts: {job.attempts}</span>
        <span>Model: {job.modelUsed || "mock"}</span>
        <span>Tokens: {job.tokensUsed || 0}</span>
      </div>
      {job.errorMessage ? (
        <p className="mt-3 text-sm text-rose-600">{job.errorMessage}</p>
      ) : null}
    </article>
  );
}
