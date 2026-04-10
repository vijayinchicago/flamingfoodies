"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { queueGrowthLoopPromotions } from "@/lib/services/growth-loop";
import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function runGrowthLoopAction() {
  const admin = await requireAdmin();
  const result = await queueGrowthLoopPromotions(30);
  const supabase = createSupabaseAdminClient();

  await supabase?.from("admin_audit_log").insert({
    admin_id: admin.id,
    action: "queue_growth_loop_promotions",
    target_type: "growth_loop",
    target_id: "winner_promotion",
    metadata: result
  });

  revalidatePath("/admin/analytics/growth-loop");
  revalidatePath("/admin/social/queue");
  redirect(
    `/admin/analytics/growth-loop?queued=${result.queuedContent}&posts=${result.queuedPosts}&skipped=${result.skipped.length}`
  );
}
