import { notFound } from "next/navigation";

import { submitCompetitionEntryAction } from "@/lib/actions/competitions";
import { SimpleFormShell } from "@/components/forms/simple-form-shell";
import { buildMetadata } from "@/lib/seo";
import { requireUser } from "@/lib/supabase/auth";
import { getCompetition } from "@/lib/services/content";

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}) {
  const competition = await getCompetition(params.slug);

  return buildMetadata({
    title: competition ? `Enter ${competition.title} | FlamingFoodies` : "Enter Competition | FlamingFoodies",
    description:
      competition
        ? `Submit your entry for ${competition.title} on FlamingFoodies.`
        : "Submit your competition entry on FlamingFoodies.",
    path: `/competitions/${params.slug}/enter`,
    noIndex: true
  });
}

export default async function CompetitionEntryPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams?: { error?: string };
}) {
  await requireUser();
  const competition = await getCompetition(params.slug);

  if (!competition) notFound();

  return (
    <SimpleFormShell
      title="Enter the competition"
      copy={`Submit your entry for ${competition.title}. New entries are stored as pending review until an admin approves them, and you can upload your media directly from this form.`}
    >
      <form action={submitCompetitionEntryAction} encType="multipart/form-data" className="space-y-5">
        <input type="hidden" name="competitionId" value={competition.id} />
        <input type="hidden" name="competitionSlug" value={competition.slug} />
        <input
          name="title"
          placeholder="Entry title"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <textarea
          name="caption"
          rows={5}
          placeholder="Tell the community what makes your entry dangerous."
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <input
          name="mediaUrl"
          placeholder="Hosted image URL"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <input
          name="mediaFile"
          type="file"
          accept="image/*"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-full file:border-0 file:bg-charcoal file:px-4 file:py-2 file:text-white"
        />
        <input
          name="videoUrl"
          placeholder="Video URL"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        {searchParams?.error ? (
          <p className="text-sm text-rose-600">{searchParams.error}</p>
        ) : null}
        <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
          Submit entry
        </button>
      </form>
    </SimpleFormShell>
  );
}
