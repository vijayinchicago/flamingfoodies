import { createNewsletterCampaignAction } from "@/lib/actions/admin-newsletter";
import { AdminPage } from "@/components/admin/admin-page";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

export default function AdminNewCampaignPage({
  searchParams
}: {
  searchParams?: { created?: string; error?: string };
}) {
  return (
    <AdminPage
      title="Compose campaign"
      description="Draft a manual newsletter blast or review the next weekly digest before it goes out."
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
            <option value="scheduled">scheduled</option>
          </select>
          <input
            name="sendAt"
            type="datetime-local"
            className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
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
