import type { Profile } from "@/lib/types";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { jsonResponse } from "@/lib/utils";

export async function requireAdminApiAccess(): Promise<Profile | Response> {
  const profile = await getCurrentProfile();

  if (!profile) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (profile.role !== "admin") {
    return jsonResponse({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  return profile;
}

export async function writeAdminAuditLog(payload: {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return;
  }

  await supabase.from("admin_audit_log").insert({
    admin_id: payload.adminId,
    action: payload.action,
    target_type: payload.targetType,
    target_id: payload.targetId,
    metadata: payload.metadata ?? {}
  });
}
