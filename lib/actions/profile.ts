"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { flags } from "@/lib/env";
import { getCurrentAuthUser, requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

const onboardingSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-z0-9-]+$/, "Username may only contain lowercase letters, numbers, and hyphens."),
  displayName: z.string().min(2).max(60)
});

const profileSchema = z.object({
  displayName: z.string().min(2).max(60),
  avatarUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => !value || /^https?:\/\//.test(value), {
      message: "Avatar URL must start with http:// or https://"
    }),
  websiteUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => !value || /^https?:\/\//.test(value), {
      message: "Website URL must start with http:// or https://"
    }),
  bio: z.string().max(280).optional()
});

function normalizeUsername(value: string) {
  return slugify(value).slice(0, 24);
}

function getOptionalFile(formData: FormData, key: string) {
  const file = formData.get(key);
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }
  return file;
}

async function uploadAvatar(
  supabase: NonNullable<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  file: File
) {
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "bin";
  const path = `${userId}/avatar-${Date.now()}.${extension || "bin"}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from("avatars").upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: true
  });

  if (error) {
    throw new Error(error.message);
  }

  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

async function ensureAvailableUsername(userId: string, username: string) {
  const supabase = createSupabaseServerClient();
  if (!supabase) return true;

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", userId)
    .maybeSingle();

  return !existing;
}

export async function completeOnboardingAction(formData: FormData) {
  const user = await getCurrentAuthUser();

  if (!user) {
    redirect("/login");
  }

  const username = normalizeUsername(String(formData.get("username") || ""));
  const parsed = onboardingSchema.safeParse({
    username,
    displayName: String(formData.get("displayName") || "").trim()
  });

  if (!parsed.success) {
    redirect(`/onboarding?error=${encodeURIComponent(parsed.error.issues[0]?.message || "Invalid input")}`);
  }

  if (!flags.hasSupabase) {
    redirect("/profile/firekeeper");
  }

  const isAvailable = await ensureAvailableUsername(user.id, parsed.data.username);
  if (!isAvailable) {
    redirect("/onboarding?error=Username%20is%20already%20taken");
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    redirect("/onboarding?error=Supabase%20is%20not%20configured");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username: parsed.data.username,
      display_name: parsed.data.displayName
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath(`/profile/${parsed.data.username}`);
  redirect(`/profile/${parsed.data.username}?updated=1`);
}

export async function updateProfileAction(formData: FormData) {
  const currentProfile = await requireUser();

  const parsed = profileSchema.safeParse({
    displayName: String(formData.get("displayName") || "").trim(),
    avatarUrl: String(formData.get("avatarUrl") || "").trim(),
    websiteUrl: String(formData.get("websiteUrl") || "").trim(),
    bio: String(formData.get("bio") || "").trim()
  });

  if (!parsed.success) {
    redirect(
      `/profile/${currentProfile.username}/edit?error=${encodeURIComponent(
        parsed.error.issues[0]?.message || "Invalid profile update"
      )}`
    );
  }

  if (!flags.hasSupabase) {
    redirect(`/profile/${currentProfile.username}?updated=1`);
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    redirect(`/profile/${currentProfile.username}/edit?error=Supabase%20is%20not%20configured`);
  }

  const avatarFile = getOptionalFile(formData, "avatarFile");
  let avatarUrl = parsed.data.avatarUrl ?? currentProfile.avatarUrl ?? null;

  if (avatarFile) {
    try {
      avatarUrl = await uploadAvatar(supabase, currentProfile.id, avatarFile);
    } catch (error) {
      redirect(
        `/profile/${currentProfile.username}/edit?error=${encodeURIComponent(
          error instanceof Error ? error.message : "Avatar upload failed"
        )}`
      );
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      avatar_url: avatarUrl,
      website_url: parsed.data.websiteUrl ?? null,
      bio: parsed.data.bio || null
    })
    .eq("id", currentProfile.id);

  if (error) {
    redirect(`/profile/${currentProfile.username}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/profile/${currentProfile.username}`);
  redirect(`/profile/${currentProfile.username}?updated=1`);
}
