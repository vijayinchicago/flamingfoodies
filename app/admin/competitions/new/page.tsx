import { createCompetitionAction } from "@/lib/actions/competitions";
import { AdminPage } from "@/components/admin/admin-page";
import { SimpleFormShell } from "@/components/forms/simple-form-shell";

export default function AdminNewCompetitionPage({
  searchParams
}: {
  searchParams?: { created?: string; error?: string };
}) {
  return (
    <AdminPage
      title="New competition"
      description="Create a new challenge with dates, submission type, and prize details."
    >
      <SimpleFormShell
        title="Competition setup"
        copy="This now writes a real competition record when Supabase admin credentials are configured."
      >
        <form
          action={createCompetitionAction}
          encType="multipart/form-data"
          className="space-y-5"
        >
          <input
            name="title"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3"
            placeholder="Competition title"
          />
          <textarea
            name="description"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3"
            rows={4}
            placeholder="Description"
          />
          <input
            name="theme"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3"
            placeholder="Theme"
          />
          <textarea
            name="rules"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3"
            rows={4}
            placeholder="Rules"
          />
          <input
            name="prizeDescription"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3"
            placeholder="Prize description"
          />
          <input
            name="imageUrl"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3"
            placeholder="Image URL"
          />
          <input
            name="imageFile"
            type="file"
            accept="image/*"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-charcoal file:px-4 file:py-2 file:text-white"
          />
          <div className="grid gap-4 md:grid-cols-3">
            <select
              name="submissionType"
              className="rounded-2xl border border-charcoal/10 px-4 py-3"
            >
              <option value="photo">photo</option>
              <option value="recipe">recipe</option>
              <option value="video_url">video_url</option>
            </select>
            <select
              name="status"
              className="rounded-2xl border border-charcoal/10 px-4 py-3"
            >
              <option value="upcoming">upcoming</option>
              <option value="active">active</option>
              <option value="voting">voting</option>
              <option value="closed">closed</option>
            </select>
            <input
              name="maxSubmissionsPerUser"
              type="number"
              min="1"
              defaultValue="1"
              className="rounded-2xl border border-charcoal/10 px-4 py-3"
              placeholder="Max submissions"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <input
              name="startDate"
              type="datetime-local"
              className="rounded-2xl border border-charcoal/10 px-4 py-3"
            />
            <input
              name="endDate"
              type="datetime-local"
              className="rounded-2xl border border-charcoal/10 px-4 py-3"
            />
            <input
              name="votingEndDate"
              type="datetime-local"
              className="rounded-2xl border border-charcoal/10 px-4 py-3"
            />
          </div>
          {searchParams?.error ? (
            <p className="text-sm text-rose-600">{searchParams.error}</p>
          ) : null}
          {searchParams?.created ? (
            <p className="text-sm text-emerald-700">Competition created successfully.</p>
          ) : null}
          <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
            Save competition
          </button>
        </form>
      </SimpleFormShell>
    </AdminPage>
  );
}
