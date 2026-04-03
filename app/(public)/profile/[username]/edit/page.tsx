import Image from "next/image";
import { redirect } from "next/navigation";

import { updateProfileAction } from "@/lib/actions/profile";
import { SimpleFormShell } from "@/components/forms/simple-form-shell";
import { requireUser } from "@/lib/supabase/auth";

export default async function EditProfilePage({
  params,
  searchParams
}: {
  params: { username: string };
  searchParams?: { error?: string };
}) {
  const profile = await requireUser();

  if (params.username !== profile.username) {
    redirect(`/profile/${profile.username}/edit`);
  }

  return (
    <SimpleFormShell
      title="Edit profile"
      copy="This page now updates the current member profile through a real server action, including avatar uploads into the profile bucket."
    >
      <form action={updateProfileAction} encType="multipart/form-data" className="space-y-5">
        <div className="flex items-center gap-4">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.displayName}
              width={88}
              height={88}
              className="h-22 w-22 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-22 w-22 items-center justify-center rounded-full bg-charcoal text-2xl font-semibold text-white">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="text-sm text-charcoal/65">
            <p className="font-medium text-charcoal">Avatar</p>
            <p>Upload a square image or paste an external image URL.</p>
          </div>
        </div>
        <input
          name="displayName"
          defaultValue={profile.displayName}
          placeholder="Display name"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <input
            name="avatarUrl"
            defaultValue={profile.avatarUrl}
            placeholder="Avatar URL"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <input
            name="avatarFile"
            type="file"
            accept="image/*"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-full file:border-0 file:bg-charcoal file:px-4 file:py-2 file:text-white"
          />
        </div>
        <input
          name="websiteUrl"
          defaultValue={profile.websiteUrl}
          placeholder="Website URL"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <textarea
          name="bio"
          rows={5}
          defaultValue={profile.bio}
          placeholder="Bio"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        {searchParams?.error ? (
          <p className="text-sm text-rose-600">{searchParams.error}</p>
        ) : null}
        <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
          Save profile
        </button>
      </form>
    </SimpleFormShell>
  );
}
