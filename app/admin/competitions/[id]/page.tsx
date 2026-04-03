import Image from "next/image";
import { notFound } from "next/navigation";

import { AdminPage } from "@/components/admin/admin-page";
import { updateCompetitionAction } from "@/lib/actions/competitions";
import { getAdminCompetitionById } from "@/lib/services/content";

function toDateTimeLocal(value?: string) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 16);
}

export default async function AdminCompetitionEditPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { updated?: string; error?: string };
}) {
  const competition = await getAdminCompetitionById(Number(params.id));

  if (!competition) {
    notFound();
  }

  return (
    <AdminPage
      title={`Edit ${competition.title}`}
      description="Update competition timing, imagery, and lifecycle settings without recreating the challenge."
    >
      <form
        action={updateCompetitionAction}
        encType="multipart/form-data"
        className="panel-light space-y-5 p-6"
      >
        <input type="hidden" name="id" value={competition.id} />
        <input type="hidden" name="redirectTo" value={`/admin/competitions/${competition.id}`} />
        <input
          name="title"
          defaultValue={competition.title}
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3"
          placeholder="Competition title"
        />
        <textarea
          name="description"
          defaultValue={competition.description}
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3"
          rows={4}
          placeholder="Description"
        />
        <input
          name="theme"
          defaultValue={competition.theme}
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3"
          placeholder="Theme"
        />
        <textarea
          name="rules"
          defaultValue={competition.rules}
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3"
          rows={4}
          placeholder="Rules"
        />
        <input
          name="prizeDescription"
          defaultValue={competition.prizeDescription}
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3"
          placeholder="Prize description"
        />
        <input
          name="imageUrl"
          defaultValue={competition.imageUrl}
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3"
          placeholder="Image URL"
        />
        <input
          name="imageFile"
          type="file"
          accept="image/*"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-charcoal file:px-4 file:py-2 file:text-white"
        />
        {competition.imageUrl ? (
          <div className="relative h-56 overflow-hidden rounded-[1.5rem]">
            <Image
              src={competition.imageUrl}
              alt={competition.title}
              fill
              className="object-cover"
            />
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-3">
          <select
            name="submissionType"
            defaultValue={competition.submissionType}
            className="rounded-2xl border border-charcoal/10 px-4 py-3"
          >
            <option value="photo">photo</option>
            <option value="recipe">recipe</option>
            <option value="video_url">video_url</option>
          </select>
          <select
            name="status"
            defaultValue={competition.status}
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
            defaultValue={competition.maxSubmissionsPerUser}
            className="rounded-2xl border border-charcoal/10 px-4 py-3"
            placeholder="Max submissions"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <input
            name="startDate"
            type="datetime-local"
            defaultValue={toDateTimeLocal(competition.startDate)}
            className="rounded-2xl border border-charcoal/10 px-4 py-3"
          />
          <input
            name="endDate"
            type="datetime-local"
            defaultValue={toDateTimeLocal(competition.endDate)}
            className="rounded-2xl border border-charcoal/10 px-4 py-3"
          />
          <input
            name="votingEndDate"
            type="datetime-local"
            defaultValue={toDateTimeLocal(competition.votingEndDate)}
            className="rounded-2xl border border-charcoal/10 px-4 py-3"
          />
        </div>
        {searchParams?.error ? (
          <p className="text-sm text-rose-600">{searchParams.error}</p>
        ) : null}
        {searchParams?.updated ? (
          <p className="text-sm text-emerald-700">Competition updated successfully.</p>
        ) : null}
        <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
          Save changes
        </button>
      </form>
    </AdminPage>
  );
}
