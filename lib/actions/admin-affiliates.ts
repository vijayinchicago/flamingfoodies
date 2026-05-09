"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  AFFILIATE_LINK_OVERRIDE_SETTING_KEY,
  getAffiliateLinkOverrides
} from "@/lib/services/affiliate-link-overrides";
import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const affiliateOverrideSchema = z.object({
  affiliateKey: z.string().min(1),
  overrideUrl: z.string().url(),
  partnerOverride: z.string().trim().max(80).optional(),
  productOverride: z.string().trim().max(160).optional(),
  note: z.string().trim().max(240).optional()
});

const clearOverrideSchema = z.object({
  affiliateKey: z.string().min(1)
});

async function writeAuditLog(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  payload: {
    adminId: string;
    action: string;
    targetId: string;
    metadata?: Record<string, unknown>;
  }
) {
  await supabase?.from("admin_audit_log").insert({
    admin_id: payload.adminId,
    action: payload.action,
    target_type: "affiliate_link_override",
    target_id: payload.targetId,
    metadata: payload.metadata ?? {}
  });
}

function affiliateRedirect(search: string): never {
  redirect(`/admin/settings/affiliates${search}`);
}

export async function saveAffiliateLinkOverrideAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = affiliateOverrideSchema.safeParse({
    affiliateKey: String(formData.get("affiliateKey") || ""),
    overrideUrl: String(formData.get("overrideUrl") || ""),
    partnerOverride: String(formData.get("partnerOverride") || "").trim() || undefined,
    productOverride: String(formData.get("productOverride") || "").trim() || undefined,
    note: String(formData.get("note") || "").trim() || undefined
  });

  if (!parsed.success) {
    affiliateRedirect("?error=Invalid%20affiliate%20override");
  }
  const data = parsed.data;

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    affiliateRedirect("?error=Supabase%20admin%20is%20not%20configured");
  }
  const adminSupabase = supabase;

  const overrides = await getAffiliateLinkOverrides();
  overrides[data.affiliateKey] = {
    url: data.overrideUrl,
    partner: data.partnerOverride,
    product: data.productOverride,
    note: data.note,
    updatedAt: new Date().toISOString(),
    updatedBy: admin.id
  };

  const { error } = await adminSupabase.from("site_settings").upsert({
    key: AFFILIATE_LINK_OVERRIDE_SETTING_KEY,
    value: overrides,
    updated_by: admin.id,
    updated_at: new Date().toISOString()
  });

  if (error) {
    affiliateRedirect(`?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(adminSupabase, {
    adminId: admin.id,
    action: "save_affiliate_link_override",
    targetId: data.affiliateKey,
    metadata: {
      url: data.overrideUrl,
      partner: data.partnerOverride ?? null,
      product: data.productOverride ?? null,
      note: data.note ?? null
    }
  });

  revalidatePath("/admin/settings/affiliates");
  affiliateRedirect("?updated=1");
}

export async function clearAffiliateLinkOverrideAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = clearOverrideSchema.safeParse({
    affiliateKey: String(formData.get("affiliateKey") || "")
  });

  if (!parsed.success) {
    affiliateRedirect("?error=Invalid%20affiliate%20override");
  }
  const data = parsed.data;

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    affiliateRedirect("?error=Supabase%20admin%20is%20not%20configured");
  }
  const adminSupabase = supabase;

  const overrides = await getAffiliateLinkOverrides();
  delete overrides[data.affiliateKey];

  const { error } = await adminSupabase.from("site_settings").upsert({
    key: AFFILIATE_LINK_OVERRIDE_SETTING_KEY,
    value: overrides,
    updated_by: admin.id,
    updated_at: new Date().toISOString()
  });

  if (error) {
    affiliateRedirect(`?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(adminSupabase, {
    adminId: admin.id,
    action: "clear_affiliate_link_override",
    targetId: data.affiliateKey
  });

  revalidatePath("/admin/settings/affiliates");
  affiliateRedirect("?cleared=1");
}
