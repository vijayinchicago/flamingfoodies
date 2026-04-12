import { getCurrentProfile } from "@/lib/supabase/auth";

import { HeaderClient } from "@/components/layout/header-client";

export async function Header() {
  const profile = await getCurrentProfile();
  const profileHref = profile?.username ? `/profile/${profile.username}` : undefined;

  return (
    <HeaderClient
      profileHref={profileHref}
      showLogin={!profile}
      showAdmin={profile?.role === "admin"}
    />
  );
}
