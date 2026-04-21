import Link from "next/link";

import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import { AdminPage } from "@/components/admin/admin-page";
import {
  escalateAutomationRunAction,
  markAutomationRunKeepAction,
  rollbackAutomationRunAction
} from "@/lib/actions/admin-automation";
import {
  getAutomationRun,
  listAutomationEvaluations,
  listAutomationStateSnapshots,
  listAutomationAgents,
  listAutomationRunEvents,
  listAutomationRuns,
  type AutomationEvaluationRecord,
  type AutomationEvaluationVerdict,
  summarizeAutomationRuns,
  type AutomationAgentId,
  type AutomationRunDetailRecord,
  type AutomationRunEventRecord,
  type AutomationRunRecord,
  type AutomationRunStatus,
  type AutomationStateSnapshotRecord
} from "@/lib/services/automation-control";

type RunsSearchParams = {
  agent?: string;
  status?: string;
  window?: string;
  runId?: string;
  notice?: string;
  error?: string;
};

const RUN_STATUS_OPTIONS: Array<AutomationRunStatus> = [
  "started",
  "succeeded",
  "failed",
  "blocked",
  "cancelled",
  "rolled_back"
];

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York"
  }).format(new Date(value))} ET`;
}

function formatDuration(durationMs?: number | null) {
  if (!durationMs || durationMs < 1000) {
    return durationMs === 0 ? "0s" : "Not recorded";
  }

  const totalSeconds = Math.round(durationMs / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function formatLabel(value: string) {
  return value.replace(/[-_]/g, " ");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function statusClasses(status: AutomationRunStatus) {
  if (status === "succeeded") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "failed") {
    return "bg-rose-100 text-rose-800";
  }

  if (status === "blocked") {
    return "bg-amber-100 text-amber-800";
  }

  if (status === "rolled_back") {
    return "bg-sky-100 text-sky-800";
  }

  return "bg-charcoal/10 text-charcoal/70";
}

function eventLevelClasses(level: AutomationRunEventRecord["level"]) {
  if (level === "error") {
    return "bg-rose-100 text-rose-800";
  }

  if (level === "warning") {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-sky-100 text-sky-800";
}

function verdictClasses(verdict: AutomationEvaluationVerdict) {
  if (verdict === "keep") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (verdict === "revert") {
    return "bg-sky-100 text-sky-800";
  }

  return "bg-amber-100 text-amber-800";
}

function getWindowSince(windowValue: string | undefined) {
  if (windowValue === "1d") {
    return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  }

  if (windowValue === "30d") {
    return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  if (windowValue === "all") {
    return undefined;
  }

  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

function parseRunStatus(value: string | undefined): AutomationRunStatus | undefined {
  if (!value) {
    return undefined;
  }

  return RUN_STATUS_OPTIONS.find((status) => status === value);
}

function stringifyPayload(payload: unknown) {
  return JSON.stringify(payload ?? {}, null, 2);
}

function buildRunsHref(
  searchParams: RunsSearchParams | undefined,
  overrides: Partial<Record<keyof RunsSearchParams, string | undefined>>
) {
  const params = new URLSearchParams();
  const values: RunsSearchParams = {
    agent: searchParams?.agent,
    status: searchParams?.status,
    window: searchParams?.window,
      runId: searchParams?.runId,
      notice: undefined,
      error: undefined,
      ...overrides
  };

  if (values.agent) {
    params.set("agent", values.agent);
  }

  if (values.status) {
    params.set("status", values.status);
  }

  if (values.window) {
    params.set("window", values.window);
  }

  if (values.runId) {
    params.set("runId", values.runId);
  }

  const query = params.toString();
  return query ? `/admin/automation/runs?${query}` : "/admin/automation/runs";
}

function supportedRollbackScopeForRun(run: AutomationRunDetailRecord) {
  if (run.agentId === "search-recommendation-executor") {
    return "site_settings.search_runtime_optimizations";
  }

  if (run.agentId === "shop-shelf-curator") {
    return "merch_products.shop_shelf";
  }

  return null;
}

function SnapshotPanel({ snapshots }: { snapshots: AutomationStateSnapshotRecord[] }) {
  return (
    <article className="mt-6 rounded-[1.5rem] border border-charcoal/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
        Captured state
      </p>
      {snapshots.length ? (
        <div className="mt-4 grid gap-4">
          {snapshots.map((snapshot) => (
            <div key={snapshot.id} className="rounded-2xl border border-charcoal/10 p-4">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800">
                  Snapshot
                </span>
                <span className="rounded-full bg-charcoal/5 px-3 py-1 text-charcoal/70">
                  {formatLabel(snapshot.scope)}
                </span>
                <span className="text-sm normal-case tracking-normal text-charcoal/55">
                  {formatDateTime(snapshot.createdAt)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-charcoal/70">
                Subject key: <span className="font-mono text-xs">{snapshot.subjectKey}</span>
              </p>
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                    Before
                  </p>
                  <pre className="mt-3 overflow-x-auto rounded-2xl bg-charcoal/[0.04] p-4 text-xs leading-6 text-charcoal/80">
                    {stringifyPayload(snapshot.beforePayload)}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                    After
                  </p>
                  <pre className="mt-3 overflow-x-auto rounded-2xl bg-charcoal/[0.04] p-4 text-xs leading-6 text-charcoal/80">
                    {stringifyPayload(snapshot.afterPayload)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-7 text-charcoal/65">
          No state snapshots were captured for this run.
        </p>
      )}
    </article>
  );
}

function EvaluationPanel({ evaluations }: { evaluations: AutomationEvaluationRecord[] }) {
  return (
    <article className="mt-6 rounded-[1.5rem] border border-charcoal/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">Evaluations</p>
      {evaluations.length ? (
        <div className="mt-4 grid gap-3">
          {evaluations.map((evaluation) => (
            <div key={evaluation.id} className="rounded-2xl border border-charcoal/10 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${verdictClasses(evaluation.verdict)}`}
                >
                  {formatLabel(evaluation.verdict)}
                </span>
                <span className="rounded-full bg-charcoal/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/70">
                  {formatLabel(evaluation.subjectType)}
                </span>
                <span className="text-sm text-charcoal/55">
                  {formatDateTime(evaluation.createdAt)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-charcoal/70">
                Subject key: <span className="font-mono text-xs">{evaluation.subjectKey}</span>
              </p>
              {evaluation.notes ? (
                <p className="mt-3 text-sm leading-7 text-charcoal/70">{evaluation.notes}</p>
              ) : null}
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                    Baseline
                  </p>
                  <pre className="mt-3 overflow-x-auto rounded-2xl bg-charcoal/[0.04] p-4 text-xs leading-6 text-charcoal/80">
                    {stringifyPayload(evaluation.baselinePayload)}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                    Observed
                  </p>
                  <pre className="mt-3 overflow-x-auto rounded-2xl bg-charcoal/[0.04] p-4 text-xs leading-6 text-charcoal/80">
                    {stringifyPayload(evaluation.observedPayload)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-7 text-charcoal/65">
          No evaluations have been recorded for this run yet.
        </p>
      )}
    </article>
  );
}

function RunDetailPanel({
  run,
  events,
  snapshots,
  evaluations,
  clearHref,
  returnTo
}: {
  run: AutomationRunDetailRecord;
  events: AutomationRunEventRecord[];
  snapshots: AutomationStateSnapshotRecord[];
  evaluations: AutomationEvaluationRecord[];
  clearHref: string;
  returnTo: string;
}) {
  const rollbackScope = supportedRollbackScopeForRun(run);
  const hasRollbackSnapshot = Boolean(
    rollbackScope && snapshots.some((snapshot) => snapshot.scope === rollbackScope)
  );
  const canRollback = run.status === "succeeded" && !run.rollbackRunId && hasRollbackSnapshot;

  return (
    <section className="panel-light p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="eyebrow">Run detail</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">
            {formatLabel(run.agentId)} · run #{run.id}
          </h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/70">
            This panel is the run-ledger drill-in: trigger context, result summary, structured
            payloads, and the event trail written by the control plane wrapper.
          </p>
        </div>
        <Link
          href={clearHref}
          className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal transition hover:bg-charcoal/5"
        >
          Close detail
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">Status</p>
          <div className="mt-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusClasses(run.status)}`}>
              {formatLabel(run.status)}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-charcoal/70">
            Trigger: {formatLabel(run.triggerSource)}
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">Started</p>
          <p className="mt-3 font-semibold text-charcoal">{formatDateTime(run.startedAt)}</p>
          <p className="mt-3 text-sm leading-6 text-charcoal/70">
            Completed: {formatDateTime(run.completedAt)}
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">Duration</p>
          <p className="mt-3 font-display text-3xl text-charcoal">
            {formatDuration(run.durationMs)}
          </p>
          <p className="mt-3 text-sm leading-6 text-charcoal/70">
            Environment: {run.environment}
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">Mutations</p>
          <p className="mt-3 text-sm leading-7 text-charcoal/70">
            Created {formatNumber(run.rowsCreated)}, updated {formatNumber(run.rowsUpdated)},
            published {formatNumber(run.rowsPublished)}, sent {formatNumber(run.rowsSent)}.
          </p>
        </article>
      </div>

      <article className="mt-6 rounded-[1.5rem] border border-charcoal/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
          Operator actions
        </p>
        <p className="mt-3 text-sm leading-7 text-charcoal/70">
          Record whether this run should be kept, escalated, or reverted. Rollback is available
          only for snapshot-backed bounded-live runs.
        </p>
        {run.rollbackRunId ? (
          <p className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            This run has already been rolled back. Inspect rollback run #{run.rollbackRunId} for the
            restoration trail.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          {run.status !== "started" ? (
            <>
              <form action={markAutomationRunKeepAction}>
                <input type="hidden" name="runId" value={run.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <AdminSubmitButton
                  idleLabel="Mark keep"
                  pendingLabel="Saving..."
                  className="rounded-full border border-charcoal/10 bg-white px-4 py-2 text-sm font-semibold text-charcoal transition hover:bg-charcoal/5"
                />
              </form>
              <form action={escalateAutomationRunAction}>
                <input type="hidden" name="runId" value={run.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <AdminSubmitButton
                  idleLabel="Escalate"
                  pendingLabel="Saving..."
                  className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                />
              </form>
            </>
          ) : null}
          {canRollback ? (
            <form action={rollbackAutomationRunAction}>
              <input type="hidden" name="runId" value={run.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <AdminSubmitButton
                idleLabel="Roll back run"
                pendingLabel="Rolling back..."
                className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
              />
            </form>
          ) : null}
        </div>
      </article>

      {run.summary || run.errorMessage ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {run.summary ? (
            <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                Summary
              </p>
              <p className="mt-3 text-sm leading-7 text-charcoal/70">{run.summary}</p>
            </article>
          ) : null}
          {run.errorMessage ? (
            <article className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                Error
              </p>
              <p className="mt-3 text-sm leading-7 text-rose-800">{run.errorMessage}</p>
            </article>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
            Input payload
          </p>
          <pre className="mt-3 overflow-x-auto rounded-2xl bg-charcoal p-4 text-xs leading-6 text-white">
            {stringifyPayload(run.inputPayload)}
          </pre>
        </article>
        <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
            Result payload
          </p>
          <pre className="mt-3 overflow-x-auto rounded-2xl bg-charcoal p-4 text-xs leading-6 text-white">
            {stringifyPayload(run.resultPayload)}
          </pre>
        </article>
      </div>

      <article className="mt-6 rounded-[1.5rem] border border-charcoal/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">Event log</p>
        {events.length ? (
          <div className="mt-4 grid gap-3">
            {events.map((event) => (
              <div key={event.id} className="rounded-2xl border border-charcoal/10 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${eventLevelClasses(event.level)}`}>
                    {event.level}
                  </span>
                  <span className="rounded-full bg-charcoal/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/70">
                    {formatLabel(event.code)}
                  </span>
                  <span className="text-sm text-charcoal/55">
                    {formatDateTime(event.createdAt)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-charcoal/70">{event.message}</p>
                <pre className="mt-3 overflow-x-auto rounded-2xl bg-charcoal/[0.04] p-4 text-xs leading-6 text-charcoal/80">
                  {stringifyPayload(event.payload)}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-7 text-charcoal/65">
            No structured events were recorded for this run.
          </p>
        )}
      </article>

      <SnapshotPanel snapshots={snapshots} />
      <EvaluationPanel evaluations={evaluations} />
    </section>
  );
}

function RunsList({
  runs,
  searchParams
}: {
  runs: AutomationRunRecord[];
  searchParams?: RunsSearchParams;
}) {
  return (
    <section className="grid gap-4">
      {runs.map((run) => (
        <article key={run.id} className="panel-light p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                <span className={`rounded-full px-3 py-1 ${statusClasses(run.status)}`}>
                  {formatLabel(run.status)}
                </span>
                <span className="rounded-full bg-charcoal/5 px-3 py-1 text-charcoal/70">
                  {formatLabel(run.triggerSource)}
                </span>
                <span className="rounded-full bg-charcoal/5 px-3 py-1 text-charcoal/70">
                  {formatLabel(run.agentId)}
                </span>
              </div>
              <h2 className="mt-4 font-display text-3xl text-charcoal">
                Run #{run.id} · {formatLabel(run.agentId)}
              </h2>
              <p className="mt-3 text-sm leading-7 text-charcoal/70">
                {run.summary || run.errorMessage || "No summary recorded for this run yet."}
              </p>
              {run.triggerReference ? (
                <p className="mt-3 font-mono text-xs text-charcoal/55">{run.triggerReference}</p>
              ) : null}
            </div>
            <div className="rounded-[1.5rem] bg-charcoal/5 px-5 py-4 text-sm text-charcoal/65 lg:min-w-[300px]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                Started
              </p>
              <p className="mt-2 font-semibold text-charcoal">{formatDateTime(run.startedAt)}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                Duration
              </p>
              <p className="mt-2 font-semibold text-charcoal">{formatDuration(run.durationMs)}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                Mutation totals
              </p>
              <p className="mt-2 leading-7">
                Created {formatNumber(run.rowsCreated)}, updated {formatNumber(run.rowsUpdated)},
                published {formatNumber(run.rowsPublished)}, sent {formatNumber(run.rowsSent)}.
              </p>
              <Link
                href={buildRunsHref(searchParams, { runId: String(run.id) })}
                className="mt-4 inline-flex rounded-full border border-charcoal/10 bg-white px-4 py-2 text-sm font-semibold text-charcoal transition hover:bg-charcoal/5"
              >
                Inspect run
              </Link>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

export default async function AdminAutomationRunsPage({
  searchParams
}: {
  searchParams?: RunsSearchParams;
}) {
  const selectedAgent = searchParams?.agent as AutomationAgentId | undefined;
  const selectedStatus = parseRunStatus(searchParams?.status);
  const selectedWindow = searchParams?.window || "7d";
  const selectedRunId =
    typeof searchParams?.runId === "string" && searchParams.runId.trim().length
      ? Number(searchParams.runId)
      : null;

  const [agents, runs, selectedRun, selectedRunEvents, selectedRunSnapshots, selectedRunEvaluations] =
    await Promise.all([
      listAutomationAgents(),
      listAutomationRuns({
        limit: 200,
        since: getWindowSince(selectedWindow),
        agentId: selectedAgent,
        status: selectedStatus
      }),
      selectedRunId && Number.isFinite(selectedRunId) ? getAutomationRun(selectedRunId) : null,
      selectedRunId && Number.isFinite(selectedRunId)
        ? listAutomationRunEvents({ runId: selectedRunId, limit: 100 })
        : Promise.resolve([]),
      selectedRunId && Number.isFinite(selectedRunId)
        ? listAutomationStateSnapshots({ runId: selectedRunId, limit: 10 })
        : Promise.resolve([]),
      selectedRunId && Number.isFinite(selectedRunId)
        ? listAutomationEvaluations({ sourceRunId: selectedRunId, limit: 20 })
        : Promise.resolve([])
    ]);
  const summary = summarizeAutomationRuns(runs);
  const selectedRunHref = buildRunsHref(searchParams, {
    runId: selectedRun ? String(selectedRun.id) : undefined
  });

  return (
    <AdminPage
      title="Automation runs"
      description="Use the run ledger as the source of truth for what actually executed, what it changed, what got blocked, and why. This is the operator view for inspecting automation history instead of inferring behavior from content tables."
    >
      {searchParams?.error ? (
        <p className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {searchParams.error}
        </p>
      ) : null}
      {searchParams?.notice ? (
        <p className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {searchParams.notice}
        </p>
      ) : null}

      <section className="panel-light p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow">Run ledger</p>
            <h2 className="mt-3 font-display text-4xl text-charcoal">
              Every cron and manual lane should leave a readable trail here.
            </h2>
            <p className="mt-4 text-sm leading-7 text-charcoal/70">
              Filter by lane, status, and time window, then open any run for payload and event
              detail. This is the surface that makes the automation system inspectable instead of
              magical.
            </p>
          </div>
          <form method="GET" className="grid gap-3 md:grid-cols-4">
            <select
              name="agent"
              defaultValue={selectedAgent ?? ""}
              className="rounded-2xl border border-charcoal/10 px-4 py-3 text-sm outline-none focus:border-ember"
            >
              <option value="">All agents</option>
              {agents.map((agent) => (
                <option key={agent.agentId} value={agent.agentId}>
                  {agent.name}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={selectedStatus ?? ""}
              className="rounded-2xl border border-charcoal/10 px-4 py-3 text-sm outline-none focus:border-ember"
            >
              <option value="">All statuses</option>
              {RUN_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
            <select
              name="window"
              defaultValue={selectedWindow}
              className="rounded-2xl border border-charcoal/10 px-4 py-3 text-sm outline-none focus:border-ember"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All available</option>
            </select>
            <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 text-sm font-semibold text-white">
              Apply filters
            </button>
          </form>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
              Runs in view
            </p>
            <p className="mt-3 font-display text-3xl text-charcoal">{summary.total}</p>
            <p className="mt-3 text-sm leading-6 text-charcoal/70">
              Filtered automation runs currently visible in this ledger window.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
              Succeeded
            </p>
            <p className="mt-3 font-display text-3xl text-charcoal">
              {summary.succeededCount}
            </p>
            <p className="mt-3 text-sm leading-6 text-charcoal/70">
              Failed {summary.failedCount} and blocked {summary.blockedCount} in the same window.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
              Mutations
            </p>
            <p className="mt-3 text-sm leading-7 text-charcoal/70">
              Created {formatNumber(summary.rowsCreated)}, updated {formatNumber(summary.rowsUpdated)},
              and published {formatNumber(summary.rowsPublished)} rows across these runs.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
              External sends
            </p>
            <p className="mt-3 font-display text-3xl text-charcoal">{summary.rowsSent}</p>
            <p className="mt-3 text-sm leading-6 text-charcoal/70">
              Recorded send count written by the filtered automation runs.
            </p>
          </article>
        </div>
      </section>

      {selectedRun ? (
        <RunDetailPanel
          run={selectedRun}
          events={selectedRunEvents}
          snapshots={selectedRunSnapshots}
          evaluations={selectedRunEvaluations}
          clearHref={buildRunsHref(searchParams, { runId: undefined })}
          returnTo={selectedRunHref}
        />
      ) : selectedRunId ? (
        <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
            Run not found
          </p>
          <p className="mt-3 text-sm leading-7 text-amber-900/80">
            Run #{selectedRunId} could not be loaded. It may have been filtered out, deleted, or
            the automation control tables may not be available in this environment.
          </p>
        </section>
      ) : null}

      {runs.length ? (
        <RunsList runs={runs} searchParams={searchParams} />
      ) : (
        <section className="panel-light p-6">
          <p className="eyebrow">No runs yet</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Nothing matched this filter</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-charcoal/70">
            No automation runs matched the current filters. Try widening the time window or
            clearing the agent and status filters.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin/automation/runs"
              className="inline-flex rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white"
            >
              Clear filters
            </Link>
            <Link
              href="/admin/automation/agents"
              className="inline-flex rounded-full border border-charcoal/10 px-5 py-3 text-sm font-semibold text-charcoal transition hover:bg-charcoal/5"
            >
              Open agent runs
            </Link>
          </div>
        </section>
      )}
    </AdminPage>
  );
}
