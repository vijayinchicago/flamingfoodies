"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";

const stateSchema = z.object({
  slug: z.string().min(1),
  intent: z.enum(["publish", "unpublish", "delete"]),
  redirectTo: z.string().optional()
});

const REDIRECT_FALLBACK = "/admin/content/festivals";

function paths() {
  return ["/festivals", "/admin/content/festivals"];
}

export async function updateFestivalStateAction(formData: FormData) {
  await requireAdmin();

  const parsed = stateSchema.safeParse({
    slug: formData.get("slug"),
    intent: formData.get("intent"),
    redirectTo: formData.get("redirectTo") || undefined
  });

  const redirectTo = parsed.success
    ? parsed.data.redirectTo || REDIRECT_FALLBACK
    : REDIRECT_FALLBACK;

  if (!parsed.success) {
    redirect(`${redirectTo}?error=Invalid%20festival%20request`);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect(`${redirectTo}?error=Supabase%20admin%20unavailable`);
  }

  if (parsed.data.intent === "delete") {
    const { error } = await supabase
      .from("festivals")
      .delete()
      .eq("slug", parsed.data.slug);
    if (error) {
      redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
    }
    for (const p of paths()) revalidatePath(p);
    revalidatePath(`/festivals/${parsed.data.slug}`);
    redirect(`${redirectTo}?deleted=${encodeURIComponent(parsed.data.slug)}`);
  }

  const nextStatus = parsed.data.intent === "publish" ? "published" : "draft";
  const { error } = await supabase
    .from("festivals")
    .update({ status: nextStatus })
    .eq("slug", parsed.data.slug);

  if (error) {
    redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
  }

  for (const p of paths()) revalidatePath(p);
  revalidatePath(`/festivals/${parsed.data.slug}`);
  redirect(
    `${redirectTo}?${parsed.data.intent === "publish" ? "published" : "unpublished"}=${encodeURIComponent(parsed.data.slug)}`
  );
}
