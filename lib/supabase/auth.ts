import { redirect } from "next/navigation";

import { flags } from "@/lib/env";
import { sampleProfiles } from "@/lib/sample-data";
import type { Profile } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentAuthUser() {
  if (!flags.hasSupabase) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!flags.hasSupabase) {
    return flags.mockAdminEnabled ? sampleProfiles[0] : null;
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) return null;

  const user = await getCurrentAuthUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url ?? undefined,
    bio: profile.bio ?? undefined,
    websiteUrl: profile.website_url ?? undefined,
    heatScore: profile.heat_score ?? 0,
    role: profile.role,
    isBanned: profile.is_banned ?? false
  };
}

export async function requireUser() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return profile;
}

export async function requireAdmin() {
  const profile = await requireUser();

  if (profile.role !== "admin") {
    redirect("/");
  }

  return profile;
}
