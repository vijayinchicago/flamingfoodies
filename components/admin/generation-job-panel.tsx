import Link from "next/link";

import {
  getGenerationJobDiagnostic,
  getGenerationJobTiming
} from "@/lib/services/run-diagnostics";
import type { GenerationJob } from "@/lib/types";

function formatJobTypeLabel(jobType: GenerationJob["jobType"]) {
  if (jobType === "blog_post") {
    return "blog post";
  }

  if (jobType === "merch_product") {
    return "shop pick";
  }

  return jobType.replace(/_/g, " ");
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "America/New_York"
  }).format(new Date(value))} ET`;
}

function formatDuration(value?: number | null) {
  if (value === null || value === undefined || value < 0) {
    return "Not recorded";
  }

  if (value < 1000) {
    return `${value}ms`;
  }

  const seconds = Math.round(value / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

function statusClasses(status: GenerationJob["status"]) {
  if (status === "completed") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "failed") {
    return "bg-rose-100 text-rose-800";
  }

  if (status === "generating") {
    return "bg-sky-100 text-sky-800";
  }

  if (status === "skipped") {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-charcoal/5 text-charcoal/70";
}

function getResultHref(job: GenerationJob) {
  if (!job.resultId) {
    return null;
  }

  if (job.resultType === "recipe") {
    return `/admin/content/recipes/${job.resultId}`;
  }

  if (job.resultType === "blog_post") {
    return `/admin/content/blog/${job.resultId}`;
  }

  if (job.resultType === "review") {
    return `/admin/content/reviews/${job.resultId}`;
  }

  if (job.resultType === "merch_product") {
    return `/admin/content/merch/${job.resultId}`;
  }

  return null;
}

export function GenerationJobPanel({ job }: { job: GenerationJob }) {
  const timing = getGenerationJobTiming(job);
  const diagnostic = getGenerationJobDiagnostic(job);
  const maxAttempts = job.jobType === "recipe" ? 2 : 1;
  const resultHref = getResultHref(job);

  return (
    <article id={`job-${job.id}`} className="panel-light scroll-mt-24 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-[0.24em] text-ember">
              {formatJobTypeLabel(job.jobType)}
            </p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusClasses(job.status)}`}
            >
              {job.status}
            </span>
            {diagnostic ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                {diagnostic.label}
              </span>
            ) : null}
          </div>
          <h2 className="mt-3 font-display text-3xl text-charcoal">Job #{job.id}</h2>
          <p className="mt-3 text-sm text-charcoal/65">
            {job.promptTemplate || "No prompt template recorded"}
          </p>
        </div>
        {resultHref ? (
          <Link
            href={resultHref}
            className="inline-flex rounded-full border border-charcoal/10 bg-white px-4 py-2 text-sm font-semibold text-charcoal transition hover:bg-charcoal/5"
          >
            Open {formatJobTypeLabel(job.jobType)} #{job.resultId}
          </Link>
        ) : job.resultId ? (
          <span className="rounded-full bg-charcoal/5 px-4 py-2 text-sm text-charcoal/65">
            Result {job.resultType || "content"} #{job.resultId}
          </span>
        ) : null}
      </div>

      {diagnostic ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
            What happened
          </p>
          <p className="mt-2 text-sm leading-7 text-amber-950/80">{diagnostic.message}</p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-charcoal/[0.04] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ember">Queued</p>
          <p className="mt-2 text-sm font-semibold text-charcoal">{formatDateTime(job.queuedAt)}</p>
          <p className="mt-2 text-xs text-charcoal/55">
            Queue wait: {formatDuration(timing.queueDelayMs)}
          </p>
        </div>
        <div className="rounded-2xl bg-charcoal/[0.04] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ember">Execution</p>
          <p className="mt-2 text-sm font-semibold text-charcoal">{formatDateTime(job.startedAt)}</p>
          <p className="mt-2 text-xs text-charcoal/55">
            Recorded time: {formatDuration(timing.processingMs)}
          </p>
        </div>
        <div className="rounded-2xl bg-charcoal/[0.04] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ember">Completed</p>
          <p className="mt-2 text-sm font-semibold text-charcoal">
            {formatDateTime(job.completedAt)}
          </p>
          <p className="mt-2 text-xs text-charcoal/55">
            Total elapsed: {formatDuration(timing.totalMs)}
          </p>
        </div>
        <div className="rounded-2xl bg-charcoal/[0.04] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ember">Usage</p>
          <p className="mt-2 text-sm font-semibold text-charcoal">
            {new Intl.NumberFormat("en-US").format(job.tokensUsed ?? 0)} tokens
          </p>
          <p className="mt-2 text-xs text-charcoal/55">
            Attempt {job.attempts} of {maxAttempts}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-charcoal/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
            Provider and model
          </p>
          <p className="mt-3 text-sm font-semibold text-charcoal">
            {job.modelUsed?.startsWith("claude") ? "Anthropic" : "Not recorded"}
          </p>
          <p className="mt-1 break-all font-mono text-xs text-charcoal/60">
            {job.modelUsed || "No model recorded"}
          </p>
        </div>
        <details className="rounded-2xl border border-charcoal/10 p-4">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.18em] text-ember">
            Generation parameters
          </summary>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-charcoal px-4 py-4 text-xs leading-6 text-cream">
            {JSON.stringify(job.parameters || {}, null, 2)}
          </pre>
        </details>
      </div>

      {job.errorMessage ? (
        <details className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4" open>
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
            Saved error
          </summary>
          <p className="mt-3 break-words text-sm leading-7 text-rose-800">{job.errorMessage}</p>
        </details>
      ) : null}
    </article>
  );
}
