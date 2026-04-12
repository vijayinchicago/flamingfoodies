import {
  runDueNewsletterSendsAction,
  runNewsletterDigestAction,
  runPublishScheduledAction,
  runShopCatalogRefreshAction,
  runSocialSchedulerAction
} from "@/lib/actions/admin-automation";
import { ManualGenerationPanel } from "@/components/admin/manual-generation-panel";
import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import { AdminPage } from "@/components/admin/admin-page";
import { getAutonomousAgents } from "@/lib/autonomous-agents";
import { flags } from "@/lib/env";
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
    queued?: string;
    publishedSocial?: string;
    digest?: string;
    processedNewsletters?: string;
    sentNewsletters?: string;
    failedNewsletters?: string;
    shopRefreshReviewed?: string;
    shopRefreshCreated?: string;
    shopRefreshUpdated?: string;
    error?: string;
  };
}) {
  const [initialJobs, settings] = await Promise.all([getGenerationJobs(), getSiteSettings()]);
  const autoPublishEnabled =
    settings.find((setting) => setting.key === "auto_publish_ai_content")?.value !== false;
  const bufferProfiles = parseBufferProfileIds();
  const autonomousAgents = getAutonomousAgents({
    autoPublishEnabled,
    hasBuffer: flags.hasBuffer,
    hasPinterestProfile:
      bufferProfiles.has("pinterest") || bufferProfiles.has("all"),
    hasConvertKit: flags.hasConvertKit
  });

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
          Processed {searchParams.processedNewsletters} scheduled newsletter(s), sent{" "}
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
          These are the agents we can run in-project right now for publishing, Pinterest
          distribution, re-promotion, shop refreshes, and repeat traffic.
        </p>
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {autonomousAgents.map((agent) => (
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
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                    agent.status === "live"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {agent.status === "live" ? "Live" : "Needs config"}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-charcoal/70">{agent.purpose}</p>
              <p className="mt-4 text-sm leading-7 text-charcoal/60">{agent.outcome}</p>
              <p className="mt-4 rounded-2xl bg-charcoal/5 px-4 py-3 text-sm text-charcoal/65">
                {agent.dependencyNote}
              </p>
            </article>
          ))}
        </div>
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
            Process scheduled campaigns whose send window has arrived.
          </p>
          <AdminSubmitButton
            idleLabel="Send due campaigns"
            pendingLabel="Sending..."
            className="mt-6 rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white"
          />
        </form>
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
