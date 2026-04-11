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
import { getGenerationJobs } from "@/lib/services/admin";

const triggers = [
  {
    id: "recipe",
    label: "Recipe draft",
    type: "recipe",
    qty: 3,
    copy: "Generate recipe drafts that land in editorial review."
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
    copy: "Create a product review draft with ratings and notes."
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
  const initialJobs = await getGenerationJobs();

  return (
    <AdminPage
      title="Manual trigger"
      description="Fire generation runs on demand during QA or editorial planning."
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
