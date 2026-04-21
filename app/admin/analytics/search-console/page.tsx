import Link from "next/link";

import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import { AdminPage } from "@/components/admin/admin-page";
import {
  approveSearchRecommendationAction,
  dismissSearchRecommendationAction,
  markSearchRecommendationManualAction,
  runSearchInsightsExecutorAction,
  runSearchInsightsSyncAction
} from "@/lib/actions/admin-automation";
import {
  getSearchInsightsDashboard,
  hasSearchConsoleBaseConfig,
  type SearchQueuedRecommendation
} from "@/lib/services/search-insights";

function formatDateTime(value?: string) {
  if (!value) {
    return "Not yet";
  }

  return `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York"
  }).format(new Date(value))} ET`;
}

function formatDateOnly(value?: string) {
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDecimal(value?: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(1)
    : "Not tracked";
}

function statusClasses(status: SearchQueuedRecommendation["status"]) {
  if (status === "approved") {
    return "bg-sky-100 text-sky-800";
  }

  if (status === "applied") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "manual_review") {
    return "bg-amber-100 text-amber-800";
  }

  if (status === "dismissed") {
    return "bg-charcoal/10 text-charcoal/70";
  }

  return "bg-violet-100 text-violet-800";
}

function priorityClasses(priority: SearchQueuedRecommendation["priority"]) {
  return priority === "high"
    ? "bg-rose-100 text-rose-800"
    : "bg-amber-100 text-amber-800";
}

function actionLabel(action: SearchQueuedRecommendation["action"]) {
  if (action === "retune_existing_page") {
    return "Retune existing page";
  }

  if (action === "add_supporting_page") {
    return "Add supporting page";
  }

  return "Verify technical";
}

function implementationLabel(recommendation: SearchQueuedRecommendation) {
  if (recommendation.implementationStrategy === "manual_only") {
    return "Manual only";
  }

  const operationKinds = [...new Set(recommendation.implementationPayload.operations.map((entry) => entry.kind))];
  const label = operationKinds.length ? operationKinds.join(" + ") : "runtime";
  return `Supported runtime overlay (${label})`;
}

function buildRuntimeTargets(
  runtime: Awaited<ReturnType<typeof getSearchInsightsDashboard>>["currentRuntime"]
) {
  if (!runtime) {
    return [];
  }

  return [
    ...Object.entries(runtime.pages).map(([target, fields]) => ({
      kind: "Page",
      target,
      title:
        fields.metadataTitle ??
        fields.heroTitle ??
        fields.faqTitle ??
        target
    })),
    ...Object.entries(runtime.blog).map(([target, fields]) => ({
      kind: "Blog",
      target: `/blog/${target}`,
      title: fields.seoTitle ?? fields.title ?? target
    })),
    ...Object.entries(runtime.recipes).map(([target, fields]) => ({
      kind: "Recipe",
      target: `/recipes/${target}`,
      title: fields.seoTitle ?? target
    }))
  ];
}

function RecommendationActions({ recommendationKey, status }: {
  recommendationKey: string;
  status: SearchQueuedRecommendation["status"];
}) {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      {status !== "approved" ? (
        <form action={approveSearchRecommendationAction}>
          <input type="hidden" name="recommendationKey" value={recommendationKey} />
          <AdminSubmitButton
            idleLabel="Approve"
            pendingLabel="Approving..."
            className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800"
          />
        </form>
      ) : null}
      {status !== "manual_review" ? (
        <form action={markSearchRecommendationManualAction}>
          <input type="hidden" name="recommendationKey" value={recommendationKey} />
          <AdminSubmitButton
            idleLabel="Mark manual"
            pendingLabel="Updating..."
            className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800"
          />
        </form>
      ) : null}
      {status !== "dismissed" ? (
        <form action={dismissSearchRecommendationAction}>
          <input type="hidden" name="recommendationKey" value={recommendationKey} />
          <AdminSubmitButton
            idleLabel="Dismiss"
            pendingLabel="Dismissing..."
            className="rounded-full border border-charcoal/10 bg-white px-4 py-2 text-sm font-semibold text-charcoal"
          />
        </form>
      ) : null}
    </div>
  );
}

export default async function AdminSearchConsolePage({
  searchParams
}: {
  searchParams?: {
    error?: string;
    synced?: string;
    recommendations?: string;
    new?: string;
    approved?: string;
    applied?: string;
    latest?: string;
    executed?: string;
    executorApplied?: string;
    executorManual?: string;
    runtimeTargets?: string;
    updated?: string;
    notice?: string;
  };
}) {
  const dashboard = await getSearchInsightsDashboard();
  const hasBaseConfig = hasSearchConsoleBaseConfig();
  const backlogCount =
    dashboard.queueSummary.newCount +
    dashboard.queueSummary.approvedCount +
    dashboard.queueSummary.manualReviewCount;
  const runtimeTargets = buildRuntimeTargets(dashboard.currentRuntime);

  return (
    <AdminPage
      title="Search Console"
      description="Run the analyst sync, review the recommendation queue, approve what is safe, and let the executor rebuild only the live runtime overlays we actually want."
    >
      {searchParams?.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {searchParams.error}
        </p>
      ) : null}
      {searchParams?.synced ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Sync finished. Detected {searchParams.recommendations || "0"} recommendation(s), with{" "}
          {searchParams.new || "0"} new, {searchParams.approved || "0"} already approved, and{" "}
          {searchParams.applied || "0"} already applied in the queue. Latest Search Console data:{" "}
          {searchParams.latest || "unknown"}.
        </p>
      ) : null}
      {searchParams?.executed ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Executor finished. Applied {searchParams.executorApplied || "0"} recommendation(s), sent{" "}
          {searchParams.executorManual || "0"} to manual review, and rebuilt{" "}
          {searchParams.runtimeTargets || "0"} live runtime target(s).
        </p>
      ) : null}
      {searchParams?.updated && searchParams.notice ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {searchParams.notice}
        </p>
      ) : null}

      {!hasBaseConfig ? (
        <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
            Setup needed
          </p>
          <p className="mt-3 text-sm leading-7 text-amber-900/80">
            Search Console OAuth is not fully configured yet. Add the documented Google OAuth and
            Search Console environment variables before trying to connect the property.
          </p>
        </section>
      ) : null}

      <section className="panel-light p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow">Two-agent workflow</p>
            <h2 className="mt-3 font-display text-4xl text-charcoal">
              Analyst finds the work. Executor only ships approved work.
            </h2>
            <p className="mt-4 text-sm leading-7 text-charcoal/70">
              The analyst sync now refreshes a durable recommendation queue. Nothing becomes live
              until an admin approves it and the executor rebuilds the runtime overlays from the
              applied queue.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {dashboard.connection ? (
              <>
                <form action={runSearchInsightsSyncAction}>
                  <AdminSubmitButton
                    idleLabel="Run sync now"
                    pendingLabel="Syncing..."
                    className="rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white"
                  />
                </form>
                <form action={runSearchInsightsExecutorAction}>
                  <AdminSubmitButton
                    idleLabel="Run executor now"
                    pendingLabel="Executing..."
                    className="rounded-full border border-charcoal/10 bg-white px-5 py-3 text-sm font-semibold text-charcoal"
                  />
                </form>
              </>
            ) : hasBaseConfig ? (
              <Link
                href="/api/admin/google-search-console/auth"
                className="inline-flex rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white"
              >
                Connect Search Console
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
              Connection
            </p>
            <p className="mt-3 font-display text-3xl text-charcoal">
              {dashboard.connection ? "Live" : hasBaseConfig ? "Ready to connect" : "Not configured"}
            </p>
            <p className="mt-3 text-sm leading-6 text-charcoal/70">
              {dashboard.connection
                ? `${dashboard.connection.property}${dashboard.connection.connectedEmail ? ` · ${dashboard.connection.connectedEmail}` : ""}`
                : hasBaseConfig
                  ? "OAuth is configured in code but no refresh token has been saved yet."
                  : "OAuth env vars are missing, so the analyst cannot connect yet."}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
              Active backlog
            </p>
            <p className="mt-3 font-display text-3xl text-charcoal">{backlogCount}</p>
            <p className="mt-3 text-sm leading-6 text-charcoal/70">
              {dashboard.queueSummary.newCount} new, {dashboard.queueSummary.approvedCount} approved,
              and {dashboard.queueSummary.manualReviewCount} in manual review.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
              Applied queue
            </p>
            <p className="mt-3 font-display text-3xl text-charcoal">
              {dashboard.queueSummary.appliedCount}
            </p>
            <p className="mt-3 text-sm leading-6 text-charcoal/70">
              Recommendations currently marked applied by the executor and eligible to shape runtime
              SEO overlays.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
              Runtime targets
            </p>
            <p className="mt-3 font-display text-3xl text-charcoal">{runtimeTargets.length}</p>
            <p className="mt-3 text-sm leading-6 text-charcoal/70">
              Live page, blog, and recipe targets currently being overridden at runtime by the
              executor-owned overlay layer.
            </p>
          </article>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-[1.5rem] bg-charcoal/5 p-5 text-sm text-charcoal/70">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
              Latest sync
            </p>
            <p className="mt-3 font-semibold text-charcoal">
              {dashboard.latestRun ? formatDateTime(dashboard.latestRun.createdAt) : "No sync yet"}
            </p>
            <p className="mt-3 leading-7">
              {dashboard.latestRun
                ? `Window ${dashboard.latestRun.startDate} to ${dashboard.latestRun.endDate}, with Search Console data current through ${dashboard.latestRun.latestAvailableDate}.`
                : "Run the analyst once to seed the queue from Search Console data."}
            </p>
          </article>
          <article className="rounded-[1.5rem] bg-charcoal/5 p-5 text-sm text-charcoal/70">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
              Latest runtime rebuild
            </p>
            <p className="mt-3 font-semibold text-charcoal">
              {dashboard.currentRuntime
                ? formatDateTime(dashboard.currentRuntime.generatedAt)
                : "No runtime overlay yet"}
            </p>
            <p className="mt-3 leading-7">
              {dashboard.currentRuntime
                ? `${dashboard.currentRuntime.appliedRecommendationIds.length} applied recommendation(s) are feeding the current runtime overlay snapshot.`
                : "The executor has not rebuilt runtime overlays yet."}
            </p>
          </article>
        </div>
      </section>

      <section className="panel-light p-6">
        <div className="max-w-3xl">
          <p className="eyebrow">Queue</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">
            Recommendation queue
          </h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/70">
            Review the current Search Console backlog here before anything becomes live. The
            executor only acts on approved and still-active items, and unsupported or technical
            recommendations stay in manual review with a recorded reason.
          </p>
        </div>

        {dashboard.queue.length ? (
          <div className="mt-6 grid gap-4">
            {dashboard.queue.map((recommendation) => (
              <article
                key={recommendation.recommendationKey}
                className={`rounded-[1.5rem] border p-5 ${
                  recommendation.isActive
                    ? "border-charcoal/10 bg-white"
                    : "border-charcoal/10 bg-charcoal/5 opacity-80"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${priorityClasses(
                          recommendation.priority
                        )}`}
                      >
                        {recommendation.priority}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusClasses(
                          recommendation.status
                        )}`}
                      >
                        {recommendation.status.replace("_", " ")}
                      </span>
                      <span className="rounded-full bg-charcoal/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/70">
                        {implementationLabel(recommendation)}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-3xl text-charcoal">
                      {recommendation.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-charcoal/70">
                      {recommendation.summary}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] bg-charcoal/5 px-4 py-4 text-sm text-charcoal/70 lg:min-w-[260px]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Target
                    </p>
                    <p className="mt-2 font-semibold text-charcoal">
                      {recommendation.targetPath ?? "Cross-path or technical recommendation"}
                    </p>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Action
                    </p>
                    <p className="mt-2 font-semibold text-charcoal">
                      {actionLabel(recommendation.action)}
                    </p>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Last seen
                    </p>
                    <p className="mt-2 font-semibold text-charcoal">
                      {formatDateOnly(recommendation.lastSeenAt)}
                    </p>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Metrics
                    </p>
                    <p className="mt-2 font-semibold text-charcoal">
                      {formatNumber(recommendation.totalImpressions)} impressions · avg position{" "}
                      {formatDecimal(recommendation.avgPosition)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-[1.25rem] bg-charcoal/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Suggested changes
                    </p>
                    {recommendation.suggestedTitle ? (
                      <p className="mt-3 text-sm text-charcoal/70">
                        Suggested title:{" "}
                        <span className="font-semibold text-charcoal">
                          {recommendation.suggestedTitle}
                        </span>
                      </p>
                    ) : null}
                    <ul className="mt-3 grid gap-2 text-sm leading-6 text-charcoal/75">
                      {recommendation.suggestedChanges.map((change) => (
                        <li key={change} className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3">
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-[1.25rem] bg-charcoal/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Paths and supporting queries
                    </p>
                    {recommendation.relatedPaths.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {recommendation.relatedPaths.map((path) => (
                          <span
                            key={path}
                            className="rounded-full border border-charcoal/10 bg-white px-3 py-2 text-xs font-semibold text-charcoal/75"
                          >
                            Related: {path}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-charcoal/60">
                        No related paths recorded for this recommendation.
                      </p>
                    )}
                    {recommendation.supportingQueries.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {recommendation.supportingQueries.slice(0, 8).map((query) => (
                          <span
                            key={query}
                            className="rounded-full border border-charcoal/10 bg-white px-3 py-2 text-xs text-charcoal/75"
                          >
                            {query}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {recommendation.decisionReason ? (
                  <p className="mt-5 rounded-[1.25rem] border border-charcoal/10 bg-charcoal/5 px-4 py-4 text-sm text-charcoal/70">
                    <span className="font-semibold text-charcoal">Decision reason:</span>{" "}
                    {recommendation.decisionReason}
                  </p>
                ) : null}

                {!recommendation.isActive ? (
                  <p className="mt-5 rounded-[1.25rem] border border-charcoal/10 bg-charcoal/5 px-4 py-4 text-sm text-charcoal/65">
                    This recommendation was not seen in the latest analyst sync, so it is inactive
                    and the executor will ignore it unless it returns in a future run.
                  </p>
                ) : null}

                <RecommendationActions
                  recommendationKey={recommendation.recommendationKey}
                  status={recommendation.status}
                />
              </article>
            ))}
          </div>
        ) : (
          <article className="mt-6 rounded-[1.5rem] border border-charcoal/10 p-5 text-sm leading-7 text-charcoal/65">
            {dashboard.connection
              ? "No queue rows yet. Run the analyst sync to seed the first recommendation queue from Search Console."
              : "Connect Search Console and run the analyst sync to create the first recommendation queue."}
          </article>
        )}
      </section>

      <section className="panel-light p-6">
        <div className="max-w-3xl">
          <p className="eyebrow">Applied runtime</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">
            Executor-owned runtime overlays
          </h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/70">
            This layer is rebuilt only from recommendations currently marked applied. The checked-in
            page defaults still remain the base SEO copy underneath.
          </p>
        </div>

        {dashboard.currentRuntime ? (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                  Generated
                </p>
                <p className="mt-3 font-semibold text-charcoal">
                  {formatDateTime(dashboard.currentRuntime.generatedAt)}
                </p>
              </article>
              <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                  Source window
                </p>
                <p className="mt-3 font-semibold text-charcoal">
                  {dashboard.currentRuntime.sourceWindow.startDate} to{" "}
                  {dashboard.currentRuntime.sourceWindow.endDate}
                </p>
              </article>
              <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                  Latest data
                </p>
                <p className="mt-3 font-semibold text-charcoal">
                  {dashboard.currentRuntime.sourceWindow.latestAvailableDate}
                </p>
              </article>
              <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                  Applied recommendations
                </p>
                <p className="mt-3 font-display text-3xl text-charcoal">
                  {dashboard.currentRuntime.appliedRecommendationIds.length}
                </p>
              </article>
            </div>

            {runtimeTargets.length ? (
              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {runtimeTargets.map((target) => (
                  <article
                    key={`${target.kind}-${target.target}`}
                    className="rounded-[1.5rem] border border-charcoal/10 p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      {target.kind}
                    </p>
                    <h3 className="mt-3 font-semibold text-charcoal">{target.title}</h3>
                    <p className="mt-3 text-sm text-charcoal/65">{target.target}</p>
                  </article>
                ))}
              </div>
            ) : (
              <article className="mt-6 rounded-[1.5rem] border border-charcoal/10 p-5 text-sm text-charcoal/65">
                The executor has not written any live runtime targets yet.
              </article>
            )}
          </>
        ) : (
          <article className="mt-6 rounded-[1.5rem] border border-charcoal/10 p-5 text-sm leading-7 text-charcoal/65">
            No runtime overlay snapshot exists yet. Approve supported queue items, then run the
            executor to rebuild the live overlay layer.
          </article>
        )}
      </section>

      <section className="panel-light p-6">
        <div className="max-w-3xl">
          <p className="eyebrow">Run history</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Recent analyst syncs</h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/70">
            These are the recent Search Console snapshots. Each run stores what the analyst saw and
            the runtime overlay snapshot that was live at sync time.
          </p>
        </div>

        {dashboard.recentRuns.length ? (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {dashboard.recentRuns.map((run) => (
              <article key={run.id} className="rounded-[1.5rem] border border-charcoal/10 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Run #{run.id}
                    </p>
                    <h3 className="mt-2 font-semibold text-charcoal">
                      {formatDateTime(run.createdAt)}
                    </h3>
                  </div>
                  <span className="rounded-full bg-charcoal/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/70">
                    Latest data {run.latestAvailableDate}
                  </span>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[1.25rem] bg-charcoal/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Recommendations
                    </p>
                    <p className="mt-3 font-display text-3xl text-charcoal">
                      {run.recommendationCount}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] bg-charcoal/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Runtime snapshot
                    </p>
                    <p className="mt-3 font-display text-3xl text-charcoal">
                      {run.appliedRecommendationIds.length}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] bg-charcoal/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Window
                    </p>
                    <p className="mt-3 text-sm font-semibold text-charcoal">
                      {run.startDate} to {run.endDate}
                    </p>
                  </div>
                </div>
                {run.detectedRecommendationIds.length ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {run.detectedRecommendationIds.map((recommendationId) => (
                      <span
                        key={`${run.id}-${recommendationId}`}
                        className="rounded-full border border-charcoal/10 px-3 py-2 text-xs text-charcoal/70"
                      >
                        {recommendationId}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <article className="mt-6 rounded-[1.5rem] border border-charcoal/10 p-5 text-sm leading-7 text-charcoal/65">
            No Search Console sync has been saved yet.
          </article>
        )}
      </section>
    </AdminPage>
  );
}
