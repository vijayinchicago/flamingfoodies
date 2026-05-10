import { flags } from "@/lib/env";
import { getAffiliateLinkEntryWithOverride } from "@/lib/services/affiliate-link-overrides";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function logAffiliateClick({
  partnerKey,
  partnerName,
  productName,
  url,
  sourcePage,
  position,
  sessionId
}: {
  partnerKey?: string;
  partnerName?: string;
  productName?: string;
  url?: string;
  sourcePage?: string | null;
  position?: string | null;
  sessionId?: string | null;
}) {
  const link = partnerKey ? await getAffiliateLinkEntryWithOverride(partnerKey) : null;
  const partner = link?.partner || partnerName;
  const product = link?.product || productName;
  const targetUrl = link?.url || url;

  if (!partner || !product || !targetUrl) return;

  if (!flags.hasSupabaseAdmin) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  const normalizedSourcePage = sourcePage || null;
  const normalizedPosition = position || null;
  const normalizedSessionId = sessionId?.trim() || null;

  if (normalizedSessionId) {
    let existingQuery = supabase
      .from("affiliate_clicks")
      .select("id")
      .eq("session_id", normalizedSessionId)
      .eq("partner", partner)
      .eq("url", targetUrl)
      .gte("clicked_at", new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .limit(1);

    existingQuery = normalizedSourcePage
      ? existingQuery.eq("source_page", normalizedSourcePage)
      : existingQuery.is("source_page", null);
    existingQuery = normalizedPosition
      ? existingQuery.eq("position", normalizedPosition)
      : existingQuery.is("position", null);

    const { data: existingRows } = await existingQuery;
    if (existingRows?.length) {
      return;
    }
  }

  await supabase.from("affiliate_clicks").insert({
    partner,
    product,
    url: targetUrl,
    source_page: normalizedSourcePage,
    position: normalizedPosition,
    session_id: normalizedSessionId
  });
}
