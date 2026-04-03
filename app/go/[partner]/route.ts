import { NextResponse } from "next/server";

import { AFFILIATE_LINKS } from "@/lib/affiliates";
import { logAffiliateClick } from "@/lib/services/affiliates";

export async function GET(
  request: Request,
  { params }: { params: { partner: string } }
) {
  const url = new URL(request.url);
  const link = AFFILIATE_LINKS[params.partner];

  if (!link) {
    return NextResponse.redirect(new URL("/", url.origin), 307);
  }

  await logAffiliateClick({
    partnerKey: params.partner,
    sourcePage: url.searchParams.get("source"),
    position: url.searchParams.get("position")
  });

  return NextResponse.redirect(link.url, {
    status: 307,
    headers: {
      "Referrer-Policy": "no-referrer"
    }
  });
}
