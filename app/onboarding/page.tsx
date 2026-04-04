import { completeOnboardingAction } from "@/lib/actions/profile";
import { SimpleFormShell } from "@/components/forms/simple-form-shell";
import { buildMetadata } from "@/lib/seo";
import { requireUser } from "@/lib/supabase/auth";

export const metadata = buildMetadata({
  title: "Complete Onboarding | FlamingFoodies",
  description: "Finish setting up your FlamingFoodies account by choosing your public username.",
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
      title="Pick your username"
      copy="Complete the first-login flow by claiming a public username and setting the display name that will appear across the site."
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
