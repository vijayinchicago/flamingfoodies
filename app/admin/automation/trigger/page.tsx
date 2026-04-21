import Link from "next/link";

import {
  pauseAutomationAgentAction,
  runBrandDiscoveryAction,
  runReevaluatePendingAiDraftsAction,
  runDueNewsletterSendsAction,
  runNewsletterDigestAction,
  runPublishScheduledAction,
  runReleaseMonitorAction,
  runSearchInsightsExecutorAction,
  runSearchInsightsSyncAction,
  resumeAutomationAgentAction,
  runShopCatalogRefreshAction,
  runSocialSchedulerAction
} from "@/lib/actions/admin-automation";
import { ManualGenerationPanel } from "@/components/admin/manual-generation-panel";
import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import { AdminPage } from "@/components/admin/admin-page";
import { getAutonomousAgents } from "@/lib/autonomous-agents";
import { flags } from "@/lib/env";
import { listAutomationAgents } from "@/lib/services/automation-control";
import { hasSearchConsoleConnection } from "@/lib/services/search-insights";
import { getGenerationJobs, getSiteSettings } from "@/lib/services/admin";
import { parseBufferProfileIds } from "@/lib/services/social";

const triggers = [
  {
    id: "recipe",
    label: "Recipe draft",
    type: "recipe",
    qty: 3,
    copy: "Generate recipe drafts that can auto-schedule publish once the automated QA gate clears."
  },
  {
    id: "hot_sauce_recipe",
    label: "Hot sauce recipe",
    type: "recipe",
    profile: "hot_sauce_recipe",
    qty: 1,
    copy:
      "Generate one weekly recipe built around a published hot sauce. It will auto-schedule publish when recipe QA clears."
  },
  {
    id: "blog_post",
    label: "Blog post",
    type: "blog_post",
    qty: 1,
    copy: "Generate one blog draft that can auto-schedule publish when editorial QA clears."
  },
  {
    id: "review",
    label: "Review draft",
    type: "review",
    qty: 1,
    copy:
      "Create a product review draft with ratings and notes. Exact-image reviews can now auto-schedule publish too."
  },
  {
    id: "merch_product",
    label: "Shop pick",
    type: "merch_product",
    qty: 1,
    copy:
      "Publish one daily FlamingFoodies shop pick from the affiliate catalog so the store keeps growing without manual entry."
  }
] as const;

export default async function AdminTriggerPage({
  searchParams
}: {
  searchParams?: {
    created?: string;
    published?: string;
    reevaluated?: string;
    promoted?: string;
    backfillPublished?: string;
    queued?: string;
    publishedSocial?: string;
    digest?: string;
    processedNewsletters?: string;
    sentNewsletters?: string;
    failedNewsletters?: string;
    shopRefreshReviewed?: string;
    shopRefreshCreated?: string;
    shopRefreshUpdated?: string;
    notice?: string;
    error?: string;
  };
}) {
  const [initialJobs, settings, hasSearchConsole, controlAgents] = await Promise.all([
    getGenerationJobs(),
    getSiteSettings(),
    hasSearchConsoleConnection(),
    listAutomationAgents()
  ]);
  const autoPublishEnabled =
    settings.find((setting) => setting.key === "auto_publish_ai_content")?.value !== false;
  const bufferProfiles = parseBufferProfileIds();
  const autonomousAgents = getAutonomousAgents({
    autoPublishEnabled,
    hasBuffer: flags.hasBuffer,
    hasPinterestProfile:
      bufferProfiles.has("pinterest") || bufferProfiles.has("all"),
    hasConvertKit: flags.hasConvertKit,
    hasSearchConsole,
    hasAnthropic: flags.hasAnthropic,
    hasSupabaseAdmin: flags.hasSupabaseAdmin
  });
  const controlsById = new Map(controlAgents.map((agent) => [agent.agentId, agent]));
  const headlineAgents = autonomousAgents.filter((agent) => !agent.isSupport);
  const supportAgents = autonomousAgents.filter((agent) => agent.isSupport);

  return (
    <AdminPage
      title="Manual trigger"
    description="Fire generation runs on demand, inspect the autonomous agents, and keep the hands-off publishing loop healthy."
    >
      {searchParams?.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {searchParams.error}
        </p>
      ) : null}
      {searchParams?.notice ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {searchParams.notice}
        </p>
      ) : null}
      {searchParams?.created ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Created {searchParams.created} generation job(s).
        </p>
      ) : null}
      {searchParams?.published ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Published {searchParams.published} scheduled item(s).
        </p>
      ) : null}
      {searchParams?.reevaluated ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Re-evaluated {searchParams.reevaluated} stuck AI draft(s), promoted{" "}
          {searchParams.promoted || "0"}, and published {searchParams.backfillPublished || "0"}.
        </p>
      ) : null}
      {searchParams?.queued ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Queued {searchParams.queued} social post(s) and published{" "}
          {searchParams.publishedSocial || "0"} due item(s).
        </p>
      ) : null}
      {searchParams?.digest ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Created digest draft: {searchParams.digest}
        </p>
      ) : null}
      {searchParams?.processedNewsletters ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Processed {searchParams.processedNewsletters} due newsletter(s), sent{" "}
          {searchParams.sentNewsletters || "0"}, failed{" "}
          {searchParams.failedNewsletters || "0"}.
        </p>
      ) : null}
      {searchParams?.shopRefreshReviewed ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Refreshed {searchParams.shopRefreshReviewed} shop picks, created{" "}
          {searchParams.shopRefreshCreated || "0"}, updated{" "}
          {searchParams.shopRefreshUpdated || "0"}.
        </p>
      ) : null}
      <div className="panel-light p-6">
        <p className="eyebrow">Autonomous agents</p>
        <h2 className="mt-3 font-display text-4xl text-charcoal">
          The hands-off loop that can run this site day after day.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-charcoal/65">
          These are the autonomous lanes we can operate in-project right now, now with explicit
          risk labels and direct pause or resume controls from the control plane.
        </p>
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {headlineAgents.map((agent) => {
            const control = controlsById.get(agent.id);
            const isEnabled = control?.isEnabled ?? true;

            return (
              <article
                key={agent.id}
                className="rounded-[1.5rem] border border-charcoal/10 p-5"
              >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                    {agent.cadence}
                  </p>
                  <h3 className="mt-2 font-display text-3xl text-charcoal">{agent.name}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                      agent.status === "live"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {agent.status === "live" ? "Configured" : "Needs config"}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                      isEnabled ? "bg-sky-100 text-sky-800" : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {isEnabled ? "Enabled" : "Paused"}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/65">
                <span className="rounded-full bg-charcoal/5 px-3 py-1">
                  Risk: {agent.riskClass.replace(/_/g, " ")}
                </span>
                <span className="rounded-full bg-charcoal/5 px-3 py-1">
                  Mode: {agent.autonomyMode.replace(/_/g, " ")}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-charcoal/70">{agent.purpose}</p>
              <p className="mt-4 text-sm leading-7 text-charcoal/60">{agent.outcome}</p>
              <p className="mt-4 rounded-2xl bg-charcoal/5 px-4 py-3 text-sm text-charcoal/65">
                {agent.dependencyNote}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <form action={isEnabled ? pauseAutomationAgentAction : resumeAutomationAgentAction}>
                  <input type="hidden" name="agentId" value={agent.id} />
                  <input type="hidden" name="returnTo" value="/admin/automation/trigger" />
                  <AdminSubmitButton
                    idleLabel={isEnabled ? "Pause lane" : "Resume lane"}
                    pendingLabel={isEnabled ? "Pausing..." : "Resuming..."}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      isEnabled
                        ? "bg-charcoal text-white"
                        : "border border-charcoal/10 bg-white text-charcoal"
                    }`}
                  />
                </form>
              </div>
              </article>
            );
          })}
        </div>
        {supportAgents.length ? (
          <div className="mt-6 rounded-[1.5rem] border border-charcoal/10 p-5">
            <p className="eyebrow">Support jobs</p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-charcoal/65">
              These jobs are part of the automation system too, but they are internal support
              loops rather than public-facing autonomous publishers.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {supportAgents.map((agent) => {
                const control = controlsById.get(agent.id);
                const isEnabled = control?.isEnabled ?? true;

                return (
                  <div
                    key={agent.id}
                    className="rounded-full border border-charcoal/10 px-4 py-3 text-sm text-charcoal/70"
                  >
                    <span className="font-semibold text-charcoal">{agent.name}</span>
                    <span className="ml-2 text-charcoal/55">
                      {isEnabled ? "Enabled" : "Paused"} · {agent.autonomyMode.replace(/_/g, " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      <ManualGenerationPanel triggers={triggers} initialJobs={initialJobs} />
      <div className="grid gap-4 lg:grid-cols-3">
        <form action={runPublishScheduledAction} className="panel-light p-6">
          <p className="eyebrow">Publish</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Scheduled content</h2>
          <p className="mt-3 text-sm text-charcoal/65">
            Promote scheduled drafts whose delayed publish window has elapsed.
          </p>
          <AdminSubmitButton
            idleLabel="Publish due items"
            pendingLabel="Publishing..."
            className="mt-6 rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white"
          />
        </form>
        <form action={runReevaluatePendingAiDraftsAction} className="panel-light p-6">
          <p className="eyebrow">Recover</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Stuck AI drafts</h2>
          <p className="mt-3 text-sm text-charcoal/65">
            Re-run editorial QA on recent pending AI drafts, promote the ones that now clear the
            autonomous gate, and publish anything already due.
          </p>
          <AdminSubmitButton
            idleLabel="Re-evaluate stuck drafts"
            pendingLabel="Re-evaluating..."
            className="mt-6 rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white"
          />
        </form>
        <form action={runSocialSchedulerAction} className="panel-light p-6">
          <p className="eyebrow">Queue</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Social scheduler</h2>
          <p className="mt-3 text-sm text-charcoal/65">
            Move pending posts into the upcoming social queue.
          </p>
          <AdminSubmitButton
            idleLabel="Queue social"
            pendingLabel="Queueing..."
            className="mt-6 rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white"
          />
        </form>
        <form action={runNewsletterDigestAction} className="panel-light p-6">
          <p className="eyebrow">Digest</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Weekly newsletter</h2>
          <p className="mt-3 text-sm text-charcoal/65">
            Draft the weekly roundup from current published content.
          </p>
          <AdminSubmitButton
            idleLabel="Draft digest"
            pendingLabel="Drafting..."
            className="mt-6 rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white"
          />
        </form>
        <form action={runDueNewsletterSendsAction} className="panel-light p-6">
          <p className="eyebrow">Send</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Due newsletters</h2>
          <p className="mt-3 text-sm text-charcoal/65">
            Check approved campaigns whose send window has arrived, and queue legacy scheduled
            items for approval instead of sending them blindly.
          </p>
          <AdminSubmitButton
            idleLabel="Send due campaigns"
            pendingLabel="Sending..."
            className="mt-6 rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white"
          />
        </form>
        <div className="panel-light p-6">
          <p className="eyebrow">Search</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Search Console workflow</h2>
          <p className="mt-3 text-sm text-charcoal/65">
            Refresh the Search Console recommendation queue, then separately run the executor to
            rebuild only the approved runtime overlays.
          </p>
          {hasSearchConsole ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <form action={runSearchInsightsSyncAction}>
                <AdminSubmitButton
                  idleLabel="Run Search Console sync"
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
              <Link
                href="/admin/analytics/search-console"
                className="inline-flex rounded-full border border-charcoal/10 px-5 py-3 text-sm font-semibold text-charcoal transition hover:bg-charcoal/5"
              >
                Open Search Console
              </Link>
            </div>
          ) : (
            <Link
              href="/api/admin/google-search-console/auth"
              className="mt-6 inline-flex rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white"
            >
              Connect Search Console
            </Link>
          )}
        </div>
        <div className="panel-light p-6">
          <p className="eyebrow">Discovery</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Brand discovery</h2>
          <p className="mt-3 text-sm text-charcoal/65">
            Research under-covered hot sauce brands and add only draft brand rows so discovery can
            keep running without publishing live pages.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={runBrandDiscoveryAction}>
              <AdminSubmitButton
                idleLabel="Run brand discovery"
                pendingLabel="Researching..."
                className="rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white"
              />
            </form>
            <Link
              href="/brands"
              className="inline-flex rounded-full border border-charcoal/10 px-5 py-3 text-sm font-semibold text-charcoal transition hover:bg-charcoal/5"
            >
              Open brand directory
            </Link>
          </div>
        </div>
        <div className="panel-light p-6">
          <p className="eyebrow">Approvals</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Release monitor</h2>
          <p className="mt-3 text-sm text-charcoal/65">
            Scan for launch and restock signals, then stop those proposals in the approval queue
            instead of auto-publishing them to the public releases page.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={runReleaseMonitorAction}>
              <AdminSubmitButton
                idleLabel="Run release monitor"
                pendingLabel="Scanning..."
                className="rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white"
              />
            </form>
            <Link
              href="/admin/automation/approvals"
              className="inline-flex rounded-full border border-charcoal/10 px-5 py-3 text-sm font-semibold text-charcoal transition hover:bg-charcoal/5"
            >
              Open approvals
            </Link>
          </div>
        </div>
        <form action={runShopCatalogRefreshAction} className="panel-light p-6">
          <p className="eyebrow">Refresh</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Shop catalog</h2>
          <p className="mt-3 text-sm text-charcoal/65">
            Review every automated shop pick against real click data, refresh the shelf, and
            surface the strongest products.
          </p>
          <AdminSubmitButton
            idleLabel="Refresh shop picks"
            pendingLabel="Refreshing..."
            className="mt-6 rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white"
          />
        </form>
      </div>
    </AdminPage>
  );
}
