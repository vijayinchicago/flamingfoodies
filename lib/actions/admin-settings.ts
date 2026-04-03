"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { parseSettingValue } from "@/lib/admin-utils";
import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const settingSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  redirectPath: z.string().startsWith("/admin").optional()
});

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

export async function updateSiteSettingAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = settingSchema.safeParse({
    key: String(formData.get("key") || ""),
    value: String(formData.get("value") || ""),
    redirectPath: String(formData.get("redirectPath") || "") || undefined
  });

  if (!parsed.success) {
    redirect("/admin/settings/general?error=Invalid%20setting%20update");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    redirect(`${parsed.data.redirectPath || "/admin/settings/general"}?updated=mock`);
  }

  const parsedValue = parseSettingValue(parsed.data.value);

  const { error } = await supabase.from("site_settings").upsert({
    key: parsed.data.key,
    value: parsedValue,
    updated_by: admin.id,
    updated_at: new Date().toISOString()
  });

  if (error) {
    redirect(
      `${parsed.data.redirectPath || "/admin/settings/general"}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  await writeAuditLog(supabase, {
    adminId: admin.id,
    action: "update_site_setting",
    targetType: "site_setting",
    targetId: parsed.data.key,
    metadata: {
      value: parsedValue
    }
  });

  revalidatePath("/admin/settings/general");
  revalidatePath("/admin/social/templates");
  redirect(`${parsed.data.redirectPath || "/admin/settings/general"}?updated=1`);
}
