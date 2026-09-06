import { flags } from "@/lib/env";
import { getAffiliateLinkEntryWithOverride } from "@/lib/services/affiliate-link-overrides";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const CLIENT_SESSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  // The public redirect URLs are routinely followed by crawlers. A session ID is
  // attached by the browser click handler, so rows without one are not evidence
  // of a person choosing an affiliate link.
  if (!normalizedSessionId || !CLIENT_SESSION_ID_PATTERN.test(normalizedSessionId)) {
    return;
  }

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

  await supabase.from("affiliate_clicks").insert({
    partner,
    product,
    url: targetUrl,
    source_page: normalizedSourcePage,
    position: normalizedPosition,
    session_id: normalizedSessionId
  });
}
