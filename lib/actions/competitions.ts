"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { flags } from "@/lib/env";
import { requireAdmin, requireUser } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

const createCompetitionSchema = z.object({
  title: z.string().min(6).max(120),
  description: z.string().min(20).max(400),
  theme: z.string().min(4).max(120),
  rules: z.string().optional(),
  prizeDescription: z.string().optional(),
  imageUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => !value || /^https?:\/\//.test(value), {
      message: "Image URL must start with http:// or https://"
    }),
  submissionType: z.enum(["photo", "recipe", "video_url"]),
  status: z.enum(["upcoming", "active", "voting", "closed"]),
  maxSubmissionsPerUser: z.coerce.number().int().min(1).max(10),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  votingEndDate: z.string().optional()
});

const updateCompetitionSchema = createCompetitionSchema.extend({
  id: z.coerce.number().int().positive(),
  redirectTo: z.string().optional()
});

const submitEntrySchema = z.object({
  competitionId: z.coerce.number(),
  competitionSlug: z.string().min(1),
  title: z.string().max(120).optional(),
  caption: z.string().min(10).max(500),
  mediaUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => !value || /^https?:\/\//.test(value), {
      message: "Media URL must start with http:// or https://"
    }),
  videoUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => !value || /^https?:\/\//.test(value), {
      message: "Video URL must start with http:// or https://"
    })
});

const voteSchema = z.object({
  entryId: z.coerce.number(),
  competitionId: z.coerce.number(),
  competitionSlug: z.string().min(1)
});

const entryStateSchema = z.object({
  entryId: z.coerce.number(),
  competitionId: z.coerce.number(),
  intent: z.enum(["approve", "reject", "winner", "unwinner"])
});

function getOptionalFile(formData: FormData, key: string) {
  const file = formData.get(key);
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }
  return file;
}

function getOptionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  return value || undefined;
}

async function uploadCompetitionMedia(
  supabase: AdminClient,
  userId: string,
  competitionId: number,
  file: File
) {
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "bin";
  const basename =
    file.name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "entry";
  const path = `${userId}/competitions/${competitionId}/${Date.now()}-${basename}.${extension || "bin"}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from("community-media").upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: true
  });

  if (error) {
    throw new Error(error.message);
  }

  return supabase.storage.from("community-media").getPublicUrl(path).data.publicUrl;
}

async function uploadCompetitionImage(supabase: AdminClient, file: File) {
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "bin";
  const basename =
    file.name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "competition";
  const path = `competitions/${Date.now()}-${basename}.${extension || "bin"}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from("admin-media").upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: true
  });

  if (error) {
    throw new Error(error.message);
  }

  return supabase.storage.from("admin-media").getPublicUrl(path).data.publicUrl;
}

async function resolveCompetitionImage(
  supabase: AdminClient,
  formData: FormData,
  existingImageUrl?: string | null
) {
  const manualUrl = getOptionalText(formData, "imageUrl");
  const uploadedFile = getOptionalFile(formData, "imageFile");

  if (uploadedFile) {
    return uploadCompetitionImage(supabase, uploadedFile);
  }

  return manualUrl ?? existingImageUrl ?? null;
}

async function writeAuditLog(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  payload: {
    adminId: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: Record<string, unknown>;
  }
) {
  await supabase?.from("admin_audit_log").insert({
    admin_id: payload.adminId,
    action: payload.action,
    target_type: payload.targetType,
    target_id: payload.targetId,
    metadata: payload.metadata ?? {}
  });
}

async function makeUniqueCompetitionSlug(
  supabase: AdminClient,
  title: string,
  excludeId?: number
) {
  const base = slugify(title);
  let candidate = base;
  let suffix = 1;

  while (true) {
    const { data } = await supabase
      .from("competitions")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data || data.id === excludeId) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function createCompetitionAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = createCompetitionSchema.safeParse({
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    theme: String(formData.get("theme") || "").trim(),
    rules: String(formData.get("rules") || "").trim() || undefined,
    prizeDescription:
      String(formData.get("prizeDescription") || "").trim() || undefined,
    imageUrl: String(formData.get("imageUrl") || "").trim() || undefined,
    submissionType: String(formData.get("submissionType") || "photo"),
    status: String(formData.get("status") || "upcoming"),
    maxSubmissionsPerUser: formData.get("maxSubmissionsPerUser") || 1,
    startDate: String(formData.get("startDate") || ""),
    endDate: String(formData.get("endDate") || ""),
    votingEndDate: String(formData.get("votingEndDate") || "").trim() || undefined
  });

  if (!parsed.success) {
    redirect(
      `/admin/competitions/new?error=${encodeURIComponent(
        parsed.error.issues[0]?.message || "Invalid competition"
      )}`
    );
  }

  if (!flags.hasSupabaseAdmin) {
    redirect("/admin/competitions/new?created=mock");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect("/admin/competitions/new?error=Supabase%20admin%20is%20not%20configured");
  }

  const slug = await makeUniqueCompetitionSlug(supabase, parsed.data.title);
  let imageUrl: string | null;

  try {
    imageUrl = await resolveCompetitionImage(supabase, formData);
  } catch (imageError) {
    redirect(
      `/admin/competitions/new?error=${encodeURIComponent(
        imageError instanceof Error ? imageError.message : "Competition image upload failed"
      )}`
    );
  }

  const { data, error } = await supabase
    .from("competitions")
    .insert({
      slug,
      title: parsed.data.title,
      description: parsed.data.description,
      theme: parsed.data.theme,
      rules: parsed.data.rules ?? null,
      prize_description: parsed.data.prizeDescription ?? null,
      image_url: imageUrl,
      submission_type: parsed.data.submissionType,
      status: parsed.data.status,
      max_submissions_per_user: parsed.data.maxSubmissionsPerUser,
      start_date: new Date(parsed.data.startDate).toISOString(),
      end_date: new Date(parsed.data.endDate).toISOString(),
      voting_end_date: parsed.data.votingEndDate
        ? new Date(parsed.data.votingEndDate).toISOString()
        : null
    })
    .select("id, slug")
    .single();

  if (error) {
    redirect(`/admin/competitions/new?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "create_competition",
    targetType: "competition",
    targetId: String(data.id),
    metadata: { slug: data.slug, status: parsed.data.status }
  });

  revalidatePath("/admin/competitions/list");
  revalidatePath("/competitions");
  revalidatePath(`/competitions/${data.slug}`);
  redirect("/admin/competitions/new?created=1");
}

export async function updateCompetitionAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = updateCompetitionSchema.safeParse({
    id: formData.get("id"),
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    theme: String(formData.get("theme") || "").trim(),
    rules: String(formData.get("rules") || "").trim() || undefined,
    prizeDescription:
      String(formData.get("prizeDescription") || "").trim() || undefined,
    imageUrl: String(formData.get("imageUrl") || "").trim() || undefined,
    submissionType: String(formData.get("submissionType") || "photo"),
    status: String(formData.get("status") || "upcoming"),
    maxSubmissionsPerUser: formData.get("maxSubmissionsPerUser") || 1,
    startDate: String(formData.get("startDate") || ""),
    endDate: String(formData.get("endDate") || ""),
    votingEndDate: String(formData.get("votingEndDate") || "").trim() || undefined,
    redirectTo: String(formData.get("redirectTo") || "").trim() || undefined
  });

  const redirectTo = parsed.success
    ? parsed.data.redirectTo || `/admin/competitions/${parsed.data.id}`
    : `/admin/competitions/${String(formData.get("id") || "")}`;

  if (!parsed.success) {
    redirect(
      `${redirectTo}?error=${encodeURIComponent(
        parsed.error.issues[0]?.message || "Invalid competition"
      )}`
    );
  }

  if (!flags.hasSupabaseAdmin) {
    redirect(`${redirectTo}?updated=mock`);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect(`${redirectTo}?error=Supabase%20admin%20is%20not%20configured`);
  }

  const { data: existing, error: existingError } = await supabase
    .from("competitions")
    .select("id, slug, title, image_url")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (existingError || !existing) {
    redirect(
      `${redirectTo}?error=${encodeURIComponent(
        existingError?.message || "Competition not found"
      )}`
    );
  }

  const slug =
    existing.title === parsed.data.title
      ? existing.slug
      : await makeUniqueCompetitionSlug(supabase, parsed.data.title, existing.id);
  let imageUrl: string | null;

  try {
    imageUrl = await resolveCompetitionImage(supabase, formData, existing.image_url);
  } catch (imageError) {
    redirect(
      `${redirectTo}?error=${encodeURIComponent(
        imageError instanceof Error ? imageError.message : "Competition image upload failed"
      )}`
    );
  }

  const { error } = await supabase
    .from("competitions")
    .update({
      slug,
      title: parsed.data.title,
      description: parsed.data.description,
      theme: parsed.data.theme,
      rules: parsed.data.rules ?? null,
      prize_description: parsed.data.prizeDescription ?? null,
      image_url: imageUrl,
      submission_type: parsed.data.submissionType,
      status: parsed.data.status,
      max_submissions_per_user: parsed.data.maxSubmissionsPerUser,
      start_date: new Date(parsed.data.startDate).toISOString(),
      end_date: new Date(parsed.data.endDate).toISOString(),
      voting_end_date: parsed.data.votingEndDate
        ? new Date(parsed.data.votingEndDate).toISOString()
        : null
    })
    .eq("id", parsed.data.id);

  if (error) {
    redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "update_competition",
    targetType: "competition",
    targetId: String(parsed.data.id),
    metadata: {
      slug,
      status: parsed.data.status
    }
  });

  revalidatePath("/admin/competitions/list");
  revalidatePath(`/admin/competitions/${parsed.data.id}`);
  revalidatePath(`/admin/competitions/${parsed.data.id}/entries`);
  revalidatePath("/competitions");
  if (existing.slug && existing.slug !== slug) {
    revalidatePath(`/competitions/${existing.slug}`);
  }
  revalidatePath(`/competitions/${slug}`);
  redirect(`${redirectTo}?updated=1`);
}

export async function submitCompetitionEntryAction(formData: FormData) {
  const profile = await requireUser();

  const parsed = submitEntrySchema.safeParse({
    competitionId: formData.get("competitionId"),
    competitionSlug: String(formData.get("competitionSlug") || ""),
    title: String(formData.get("title") || "").trim() || undefined,
    caption: String(formData.get("caption") || "").trim(),
    mediaUrl: String(formData.get("mediaUrl") || "").trim() || undefined,
    videoUrl: String(formData.get("videoUrl") || "").trim() || undefined
  });

  if (!parsed.success) {
    redirect(
      `/competitions/${formData.get("competitionSlug")}/enter?error=${encodeURIComponent(
        parsed.error.issues[0]?.message || "Invalid entry"
      )}`
    );
  }

  if (!flags.hasSupabaseAdmin) {
    redirect(`/competitions/${parsed.data.competitionSlug}?submitted=mock`);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect(
      `/competitions/${parsed.data.competitionSlug}/enter?error=Supabase%20admin%20is%20not%20configured`
    );
  }

  const mediaFile = getOptionalFile(formData, "mediaFile");
  let mediaUrl = parsed.data.mediaUrl ?? null;

  if (mediaFile) {
    try {
      mediaUrl = await uploadCompetitionMedia(
        supabase,
        profile.id,
        parsed.data.competitionId,
        mediaFile
      );
    } catch (error) {
      redirect(
        `/competitions/${parsed.data.competitionSlug}/enter?error=${encodeURIComponent(
          error instanceof Error ? error.message : "Media upload failed"
        )}`
      );
    }
  }

  const { error } = await supabase.from("competition_entries").insert({
    competition_id: parsed.data.competitionId,
    user_id: profile.id,
    title: parsed.data.title ?? null,
    caption: parsed.data.caption,
    media_url: mediaUrl,
    video_url: parsed.data.videoUrl ?? null,
    status: "pending_review"
  });

  if (error) {
    const message =
      error.message.toLowerCase().includes("duplicate") ||
      error.message.toLowerCase().includes("unique")
        ? "You have already submitted an entry for this competition."
        : error.message;

    redirect(
      `/competitions/${parsed.data.competitionSlug}/enter?error=${encodeURIComponent(message)}`
    );
  }

  revalidatePath(`/competitions/${parsed.data.competitionSlug}`);
  redirect(`/competitions/${parsed.data.competitionSlug}?submitted=1`);
}

export async function voteCompetitionEntryAction(formData: FormData) {
  const profile = await requireUser();

  const parsed = voteSchema.safeParse({
    entryId: formData.get("entryId"),
    competitionId: formData.get("competitionId"),
    competitionSlug: String(formData.get("competitionSlug") || "")
  });

  if (!parsed.success) {
    redirect("/competitions?error=Invalid%20vote");
  }

  if (!flags.hasSupabaseAdmin) {
    redirect(`/competitions/${parsed.data.competitionSlug}?voted=mock`);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect(
      `/competitions/${parsed.data.competitionSlug}?error=Supabase%20admin%20is%20not%20configured`
    );
  }

  const { data: competition } = await supabase
    .from("competitions")
    .select("status")
    .eq("id", parsed.data.competitionId)
    .maybeSingle();

  if (!competition || !["active", "voting"].includes(competition.status)) {
    redirect(
      `/competitions/${parsed.data.competitionSlug}?error=Voting%20is%20not%20open%20for%20this%20competition`
    );
  }

  const { error } = await supabase.from("competition_votes").insert({
    user_id: profile.id,
    entry_id: parsed.data.entryId
  });

  if (error) {
    const message =
      error.message.toLowerCase().includes("duplicate") ||
      error.message.toLowerCase().includes("unique")
        ? "You have already voted for this entry."
        : error.message;

    redirect(
      `/competitions/${parsed.data.competitionSlug}?error=${encodeURIComponent(message)}`
    );
  }

  const { data: entry } = await supabase
    .from("competition_entries")
    .select("vote_count")
    .eq("id", parsed.data.entryId)
    .single();

  await supabase
    .from("competition_entries")
    .update({ vote_count: (entry?.vote_count ?? 0) + 1 })
    .eq("id", parsed.data.entryId);

  revalidatePath(`/competitions/${parsed.data.competitionSlug}`);
  redirect(`/competitions/${parsed.data.competitionSlug}?voted=1`);
}

export async function updateCompetitionEntryStateAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = entryStateSchema.safeParse({
    entryId: formData.get("entryId"),
    competitionId: formData.get("competitionId"),
    intent: formData.get("intent")
  });

  if (!parsed.success) {
    redirect("/admin/competitions/list?error=Invalid%20entry%20action");
  }

  if (!flags.hasSupabaseAdmin) {
    redirect(`/admin/competitions/${parsed.data.competitionId}/entries?updated=mock`);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect(
      `/admin/competitions/${parsed.data.competitionId}/entries?error=Supabase%20admin%20is%20not%20configured`
    );
  }

  if (parsed.data.intent === "winner") {
    await supabase
      .from("competition_entries")
      .update({ is_winner: false })
      .eq("competition_id", parsed.data.competitionId);
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.intent === "approve") updates.status = "published";
  if (parsed.data.intent === "reject") updates.status = "archived";
  if (parsed.data.intent === "winner") {
    updates.is_winner = true;
    updates.status = "published";
  }
  if (parsed.data.intent === "unwinner") {
    updates.is_winner = false;
  }

  const { data, error } = await supabase
    .from("competition_entries")
    .update(updates)
    .eq("id", parsed.data.entryId)
    .select("id")
    .single();

  if (error) {
    redirect(
      `/admin/competitions/${parsed.data.competitionId}/entries?error=${encodeURIComponent(error.message)}`
    );
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "update_competition_entry",
    targetType: "competition_entry",
    targetId: String(data.id),
    metadata: { intent: parsed.data.intent, competitionId: parsed.data.competitionId }
  });

  const { data: competition } = await supabase
    .from("competitions")
    .select("slug")
    .eq("id", parsed.data.competitionId)
    .maybeSingle();

  revalidatePath("/competitions");
  if (competition?.slug) {
    revalidatePath(`/competitions/${competition.slug}`);
  }
  revalidatePath(`/admin/competitions/${parsed.data.competitionId}/entries`);
  redirect(`/admin/competitions/${parsed.data.competitionId}/entries?updated=1`);
}
