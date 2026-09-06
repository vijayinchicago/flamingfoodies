import { flags } from "@/lib/env";
import { getCurrentMemberProfile } from "@/lib/supabase/auth";

import { HeaderClient } from "@/components/layout/header-client";

export async function Header() {
  const profile = await getCurrentMemberProfile();
  const profileHref = profile?.username ? `/profile/${profile.username}` : undefined;

  return (
    <HeaderClient
      profileHref={profileHref}
      showLogin={flags.memberAuthEnabled && !profile}
    />
  );
}
