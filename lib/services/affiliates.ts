import { AFFILIATE_LINKS } from "@/lib/affiliates";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { flags } from "@/lib/env";

export async function logAffiliateClick({
  partnerKey,
  partnerName,
  productName,
  url,
  sourcePage,
  position
}: {
  partnerKey?: string;
  partnerName?: string;
  productName?: string;
  url?: string;
  sourcePage?: string | null;
  position?: string | null;
}) {
  const link = partnerKey ? AFFILIATE_LINKS[partnerKey] : null;
  const partner = link?.partner || partnerName;
  const product = link?.product || productName;
  const targetUrl = link?.url || url;

  if (!partner || !product || !targetUrl) return;

  if (!flags.hasSupabaseAdmin) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from("affiliate_clicks").insert({
    partner,
    product,
    url: targetUrl,
    source_page: sourcePage || null,
    position: position || null
  });
}
