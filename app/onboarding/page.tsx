import { completeOnboardingAction } from "@/lib/actions/profile";
import { SimpleFormShell } from "@/components/forms/simple-form-shell";
import { buildMetadata } from "@/lib/seo";
import { requireUser } from "@/lib/supabase/auth";

export const metadata = buildMetadata({
  title: "Complete Onboarding | FlamingFoodies",
  description: "Finish setting up your FlamingFoodies account so saves, comments, and picks feel like yours.",
  path: "/onboarding",
  noIndex: true
});

export default async function OnboardingPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  const profile = await requireUser();

  return (
    <SimpleFormShell
      title="Set up your profile"
      copy="Claim your public username and choose the display name that will show up anywhere you save, comment, or share."
    >
      <form action={completeOnboardingAction} className="space-y-5">
        <input
          name="username"
          defaultValue={profile.username}
          placeholder="ghostpeppergabe"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <input
          name="displayName"
          defaultValue={profile.displayName}
          placeholder="Display name"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        {searchParams?.error ? (
          <p className="text-sm text-rose-600">{searchParams.error}</p>
        ) : null}
        <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
          Complete onboarding
        </button>
      </form>
    </SimpleFormShell>
  );
}
