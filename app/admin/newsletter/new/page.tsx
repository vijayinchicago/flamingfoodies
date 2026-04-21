import { createNewsletterCampaignAction } from "@/lib/actions/admin-newsletter";
import { AdminPage } from "@/components/admin/admin-page";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { NEWSLETTER_SEGMENTS } from "@/lib/newsletter-segments";

export default function AdminNewCampaignPage({
  searchParams
}: {
  searchParams?: { created?: string; error?: string };
}) {
  return (
    <AdminPage
      title="Compose campaign"
      description="Draft a manual newsletter blast or queue the next weekly digest for approval before anything goes to subscribers."
    >
      <form action={createNewsletterCampaignAction} className="panel-light space-y-4 p-6">
        <input
          name="subject"
          placeholder="Subject line"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <input
          name="previewText"
          placeholder="Preview text"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <select
            name="status"
            defaultValue="draft"
            className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          >
            <option value="draft">draft</option>
            <option value="scheduled">queue for approval</option>
          </select>
          <input
            name="sendAt"
            type="datetime-local"
            className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
        </div>
        <p className="text-sm text-charcoal/60">
          Choosing <strong>queue for approval</strong> creates or refreshes a send proposal in the
          automation approval queue. The campaign stays blocked until an admin approves it.
        </p>
        <div className="rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.03] p-5">
          <p className="eyebrow">Audience</p>
          <h2 className="mt-3 font-display text-3xl text-charcoal">Choose who this is for</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {NEWSLETTER_SEGMENTS.map((segment) => (
              <label
                key={segment.tag}
                className="flex items-start gap-3 rounded-2xl border border-charcoal/10 bg-white p-4 text-sm text-charcoal/72"
              >
                <input
                  type="checkbox"
                  name="audienceTags"
                  value={segment.tag}
                  className="mt-1"
                />
                <span>
                  <span className="block font-semibold text-charcoal">{segment.label}</span>
                  <span className="mt-1 block">{segment.description}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-4 text-sm text-charcoal/60">
            Leave everything unchecked to send to all active subscribers.
          </p>
        </div>
        <RichTextEditor
          name="htmlContent"
          label="Campaign body"
          content="<h2>This Week in Heat</h2><p>Lead with the strongest recipe, then the sharpest review, then the community hook.</p>"
        />
        <textarea
          name="textContent"
          rows={6}
          placeholder="Plain text fallback"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        {searchParams?.error ? (
          <p className="text-sm text-rose-600">{searchParams.error}</p>
        ) : null}
        {searchParams?.created ? (
          <p className="text-sm text-emerald-700">Campaign created successfully.</p>
        ) : null}
        <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
          Save campaign
        </button>
      </form>
    </AdminPage>
  );
}
