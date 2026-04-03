import { AFFILIATE_LINKS } from "@/lib/affiliates";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { flags } from "@/lib/env";

export async function logAffiliateClick({
  partnerKey,
  sourcePage,
  position
}: {
  partnerKey: string;
  sourcePage?: string | null;
  position?: string | null;
}) {
  const link = AFFILIATE_LINKS[partnerKey];
  if (!link) return;

  if (!flags.hasSupabaseAdmin) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from("affiliate_clicks").insert({
    partner: link.partner,
    product: link.product,
    url: link.url,
    source_page: sourcePage || null,
    position: position || null
  });
}
