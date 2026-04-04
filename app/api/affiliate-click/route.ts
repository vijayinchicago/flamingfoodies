import { NextResponse } from "next/server";
import { z } from "zod";

import { logAffiliateClick } from "@/lib/services/affiliates";

const affiliateClickSchema = z
  .object({
    partnerKey: z.string().min(1).optional(),
    partnerName: z.string().min(1).optional(),
    productName: z.string().min(1).optional(),
    url: z.string().url().optional(),
    sourcePage: z.string().optional(),
    position: z.string().optional()
  })
  .refine(
    (payload) =>
      Boolean(payload.partnerKey)
      || Boolean(payload.partnerName && payload.productName && payload.url),
    "Provide either a partnerKey or a partnerName/productName/url combination."
  );

export async function POST(request: Request) {
  try {
    const payload = affiliateClickSchema.parse(await request.json());

    await logAffiliateClick({
      partnerKey: payload.partnerKey,
      partnerName: payload.partnerName,
      productName: payload.productName,
      url: payload.url,
      sourcePage: payload.sourcePage,
      position: payload.position
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Affiliate click logging failed."
      },
      { status: 400 }
    );
  }
}
