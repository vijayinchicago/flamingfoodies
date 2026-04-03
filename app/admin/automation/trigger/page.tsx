import {
  runDueNewsletterSendsAction,
  runNewsletterDigestAction,
  runPublishScheduledAction,
  runSocialSchedulerAction,
  triggerGenerationAction
} from "@/lib/actions/admin-automation";
import { AdminPage } from "@/components/admin/admin-page";

const triggers = [
  { type: "recipe", qty: 3, copy: "Generate recipe drafts that land in editorial review." },
  { type: "blog_post", qty: 2, copy: "Spin up blog ideas and full draft bodies for review." },
  { type: "review", qty: 1, copy: "Create a product review draft with ratings and notes." }
] as const;

export default function AdminTriggerPage({
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
    error?: string;
  };
}) {
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
      <div className="grid gap-4 md:grid-cols-2">
        {triggers.map((trigger) => (
          <form
            key={trigger.type}
            action={triggerGenerationAction}
            className="panel-light px-6 py-8 text-left"
          >
            <input type="hidden" name="type" value={trigger.type} />
            <p className="eyebrow">Trigger</p>
            <h2 className="mt-3 font-display text-4xl text-charcoal">{trigger.type}</h2>
            <p className="mt-3 text-sm text-charcoal/65">{trigger.copy}</p>
            <div className="mt-6 flex items-center gap-3">
              <input
                name="qty"
                type="number"
                min="1"
                max="20"
                defaultValue={trigger.qty}
                className="w-24 rounded-full border border-charcoal/10 px-4 py-2 text-sm outline-none focus:border-ember"
              />
              <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 text-sm font-semibold text-white">
                Generate now
              </button>
            </div>
          </form>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <form action={runPublishScheduledAction} className="panel-light p-6">
          <p className="eyebrow">Publish</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Scheduled content</h2>
          <p className="mt-3 text-sm text-charcoal/65">
            Promote AI drafts whose delayed publish window has elapsed.
          </p>
          <button className="mt-6 rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white">
            Publish due items
          </button>
        </form>
        <form action={runSocialSchedulerAction} className="panel-light p-6">
          <p className="eyebrow">Queue</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Social scheduler</h2>
          <p className="mt-3 text-sm text-charcoal/65">
            Move pending posts into the upcoming social queue.
          </p>
          <button className="mt-6 rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white">
            Queue social
          </button>
        </form>
        <form action={runNewsletterDigestAction} className="panel-light p-6">
          <p className="eyebrow">Digest</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Weekly newsletter</h2>
          <p className="mt-3 text-sm text-charcoal/65">
            Draft the weekly roundup from current published content.
          </p>
          <button className="mt-6 rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white">
            Draft digest
          </button>
        </form>
        <form action={runDueNewsletterSendsAction} className="panel-light p-6">
          <p className="eyebrow">Send</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Due newsletters</h2>
          <p className="mt-3 text-sm text-charcoal/65">
            Process scheduled campaigns whose send window has arrived.
          </p>
          <button className="mt-6 rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white">
            Send due campaigns
          </button>
        </form>
      </div>
    </AdminPage>
  );
}
