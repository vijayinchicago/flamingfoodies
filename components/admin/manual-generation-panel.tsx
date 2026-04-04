"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { GenerationJob } from "@/lib/types";

type GenerationType = "recipe" | "blog_post" | "review";

type Trigger = {
  type: GenerationType;
  qty: number;
  copy: string;
};

type GeneratedJobSummary = {
  id: number;
  type: GenerationType;
  slug?: string;
  title?: string;
  scheduledCuisine?: string | null;
  publishAt?: string;
  error?: string;
};

type JobsResponse = {
  ok: boolean;
  jobs: GenerationJob[];
  activeCount: number;
  fetchedAt: string;
  error?: string;
};

type ManualGenerationResponse = {
  ok: boolean;
  createdJobs: GeneratedJobSummary[];
  mode?: string;
  triggeredAt?: string;
  error?: string;
};

const ACTIVE_JOB_STATUSES = new Set<GenerationJob["status"]>(["queued", "generating"]);

function formatJobType(type: GenerationType) {
  if (type === "blog_post") {
    return "blog post";
  }

  return type.replace(/_/g, " ");
}

function formatTimestamp(value?: string) {
  if (!value) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getStatusClasses(status: GenerationJob["status"]) {
  if (status === "completed") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }

  if (status === "failed") {
    return "bg-rose-50 text-rose-700 border border-rose-200";
  }

  if (status === "generating") {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }

  return "bg-charcoal/5 text-charcoal/70 border border-charcoal/10";
}

export function ManualGenerationPanel({
  triggers,
  initialJobs
}: {
  triggers: readonly Trigger[];
  initialJobs: GenerationJob[];
}) {
  const [jobs, setJobs] = useState<GenerationJob[]>(initialJobs);
  const [quantities, setQuantities] = useState<Record<GenerationType, number>>(() => ({
    recipe: triggers.find((trigger) => trigger.type === "recipe")?.qty ?? 1,
    blog_post: triggers.find((trigger) => trigger.type === "blog_post")?.qty ?? 1,
    review: triggers.find((trigger) => trigger.type === "review")?.qty ?? 1
  }));
  const [submittingType, setSubmittingType] = useState<GenerationType | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<GeneratedJobSummary[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const jobsRef = useRef<HTMLDivElement | null>(null);

  const activeJobCount = useMemo(
    () => jobs.filter((job) => ACTIVE_JOB_STATUSES.has(job.status)).length,
    [jobs]
  );

  const fetchJobs = useCallback(async () => {
    const response = await fetch("/api/admin/generation-jobs?limit=12", {
      method: "GET",
      cache: "no-store"
    });

    const payload = (await response.json()) as JobsResponse;

    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Unable to load generation jobs.");
    }

    setJobs(payload.jobs);
    setLastFetchedAt(payload.fetchedAt);
    return payload.jobs;
  }, []);

  useEffect(() => {
    const shouldPoll = isPolling || submittingType !== null || activeJobCount > 0;

    if (!shouldPoll) {
      return;
    }

    let disposed = false;

    const tick = async () => {
      try {
        const nextJobs = await fetchJobs();

        if (disposed) {
          return;
        }

        if (submittingType === null && !nextJobs.some((job) => ACTIVE_JOB_STATUSES.has(job.status))) {
          setIsPolling(false);
        }
      } catch (error) {
        if (!disposed) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to refresh generation progress."
          );
        }
      }
    };

    void tick();
    const intervalId = window.setInterval(() => {
      void tick();
    }, 2500);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
    };
  }, [activeJobCount, fetchJobs, isPolling, submittingType]);

  async function handleGenerate(type: GenerationType) {
    const qty = quantities[type] ?? 1;

    setSubmittingType(type);
    setIsPolling(true);
    setErrorMessage(null);
    setLastRun([]);
    setStatusMessage(
      `Starting ${qty} ${formatJobType(type)} job${qty === 1 ? "" : "s"}. Watching the live queue below.`
    );
    jobsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    try {
      const response = await fetch("/api/admin/manual-generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ type, qty })
      });

      const payload = (await response.json()) as ManualGenerationResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to start generation.");
      }

      setLastRun(payload.createdJobs || []);
      setStatusMessage(
        `Created ${payload.createdJobs.length} ${formatJobType(type)} job${
          payload.createdJobs.length === 1 ? "" : "s"
        }.`
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to start generation.");
      setStatusMessage(null);
    } finally {
      setSubmittingType(null);

      try {
        const nextJobs = await fetchJobs();
        setIsPolling(nextJobs.some((job) => ACTIVE_JOB_STATUSES.has(job.status)));
      } catch {
        setIsPolling(false);
      }
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        {triggers.map((trigger) => {
          const isSubmitting = submittingType === trigger.type;
          const qty = quantities[trigger.type];

          return (
            <form
              key={trigger.type}
              className="panel-light px-6 py-8 text-left"
              onSubmit={(event) => {
                event.preventDefault();
                void handleGenerate(trigger.type);
              }}
            >
              <p className="eyebrow">Trigger</p>
              <h2 className="mt-3 font-display text-4xl text-charcoal">{trigger.type}</h2>
              <p className="mt-3 text-sm text-charcoal/65">{trigger.copy}</p>
              <div className="mt-6 flex items-center gap-3">
                <input
                  name="qty"
                  type="number"
                  min="1"
                  max="20"
                  value={qty}
                  onChange={(event) =>
                    setQuantities((current) => ({
                      ...current,
                      [trigger.type]: Math.min(
                        Math.max(Number(event.target.value || trigger.qty), 1),
                        20
                      )
                    }))
                  }
                  className="w-24 rounded-full border border-charcoal/10 px-4 py-2 text-sm outline-none focus:border-ember"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-wait disabled:opacity-60"
                >
                  {isSubmitting ? "Starting..." : "Generate now"}
                </button>
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-charcoal/45">
                This page stays put while generation runs.
              </p>
            </form>
          );
        })}
      </div>

      <div ref={jobsRef} className="grid gap-4 lg:grid-cols-[1.3fr,0.7fr]">
        <section className="panel-light p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Live queue</p>
              <h2 className="mt-2 font-display text-4xl text-charcoal">Generation progress</h2>
              <p className="mt-3 text-sm text-charcoal/65">
                Latest jobs refresh automatically while work is queued or generating.
              </p>
            </div>
            <div className="rounded-2xl border border-charcoal/10 bg-cream px-4 py-3 text-sm text-charcoal/70">
              <div>Active jobs: {activeJobCount}</div>
              <div>Last refresh: {formatTimestamp(lastFetchedAt || undefined)}</div>
            </div>
          </div>

          {statusMessage ? (
            <p
              aria-live="polite"
              className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
              {statusMessage}
            </p>
          ) : null}

          {errorMessage ? (
            <p
              aria-live="polite"
              className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-6 grid gap-4">
            {jobs.length ? (
              jobs.map((job) => (
                <article key={job.id} className="rounded-[1.5rem] border border-charcoal/10 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-ember">
                        {job.jobType.replace(/_/g, " ")}
                      </p>
                      <h3 className="mt-2 font-display text-2xl text-charcoal">Job #{job.id}</h3>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(
                        job.status
                      )}`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-charcoal/60">
                    <span>Queued: {formatTimestamp(job.queuedAt)}</span>
                    <span>Attempts: {job.attempts}</span>
                    <span>Model: {job.modelUsed || "Claude"}</span>
                    <span>Tokens: {job.tokensUsed || 0}</span>
                  </div>
                  {job.parameters ? (
                    <pre className="mt-4 overflow-x-auto rounded-2xl bg-charcoal px-4 py-4 text-xs text-cream">
                      {JSON.stringify(job.parameters, null, 2)}
                    </pre>
                  ) : null}
                  {job.errorMessage ? (
                    <p className="mt-4 text-sm text-rose-600">{job.errorMessage}</p>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="rounded-2xl border border-charcoal/10 bg-white px-4 py-6 text-sm text-charcoal/65">
                No generation jobs yet.
              </p>
            )}
          </div>
        </section>

        <aside className="grid gap-4">
          <section className="panel-light p-6">
            <p className="eyebrow">Latest run</p>
            <h2 className="mt-2 font-display text-4xl text-charcoal">Result summary</h2>
            <p className="mt-3 text-sm text-charcoal/65">
              Generated items show up here first, then in the content admin lists.
            </p>
            <div className="mt-5 grid gap-3">
              {lastRun.length ? (
                lastRun.map((item) => (
                  <article
                    key={`${item.id}-${item.slug || item.title || item.error || "job"}`}
                    className="rounded-[1.5rem] border border-charcoal/10 bg-white p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-ember">
                      {formatJobType(item.type)}
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-charcoal">
                      {item.title || item.slug || `Job #${item.id}`}
                    </h3>
                    <p className="mt-2 text-sm text-charcoal/65">
                      {item.error
                        ? `Failed: ${item.error}`
                        : item.scheduledCuisine
                          ? `Cuisine: ${String(item.scheduledCuisine).replace(/_/g, " ")}`
                          : "Created successfully."}
                    </p>
                    {item.publishAt ? (
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-charcoal/45">
                        Scheduled for {formatTimestamp(item.publishAt)}
                      </p>
                    ) : null}
                  </article>
                ))
              ) : (
                <p className="rounded-2xl border border-charcoal/10 bg-white px-4 py-6 text-sm text-charcoal/65">
                  Start a run to see its generated items here.
                </p>
              )}
            </div>
          </section>
          <section className="panel-light p-6">
            <p className="eyebrow">Where to look</p>
            <h2 className="mt-2 font-display text-4xl text-charcoal">Next stops</h2>
            <div className="mt-4 grid gap-3 text-sm text-charcoal/70">
              <a href="/admin/automation/jobs" className="rounded-2xl border border-charcoal/10 bg-white px-4 py-4 font-semibold text-charcoal">
                Open full jobs queue
              </a>
              <a href="/admin/content/recipes" className="rounded-2xl border border-charcoal/10 bg-white px-4 py-4 font-semibold text-charcoal">
                Review recipe drafts
              </a>
              <a href="/admin/content/reviews" className="rounded-2xl border border-charcoal/10 bg-white px-4 py-4 font-semibold text-charcoal">
                Review product drafts
              </a>
              <a href="/admin/content/blog" className="rounded-2xl border border-charcoal/10 bg-white px-4 py-4 font-semibold text-charcoal">
                Review blog drafts
              </a>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
