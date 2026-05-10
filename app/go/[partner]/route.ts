import { NextResponse } from "next/server";

import { AFFILIATE_LINKS, buildAffiliateDestinationUrl } from "@/lib/affiliates";
import { getAffiliateLinkEntryWithOverride } from "@/lib/services/affiliate-link-overrides";
import { logAffiliateClick } from "@/lib/services/affiliates";

export async function GET(
  request: Request,
  { params }: { params: { partner: string } }
) {
  const url = new URL(request.url);
  const staticLink = AFFILIATE_LINKS[params.partner];

  if (!staticLink) {
    return NextResponse.redirect(new URL("/", url.origin), 307);
  }

  const link = (await getAffiliateLinkEntryWithOverride(params.partner)) ?? {
    key: params.partner,
    ...staticLink
  };

  await logAffiliateClick({
    partnerKey: params.partner,
    sourcePage: url.searchParams.get("source"),
    position: url.searchParams.get("position"),
    sessionId: url.searchParams.get("sid")
  });

  return NextResponse.redirect(buildAffiliateDestinationUrl(link), {
    status: 307,
    headers: {
      "Referrer-Policy": "no-referrer"
    }
  });
}
