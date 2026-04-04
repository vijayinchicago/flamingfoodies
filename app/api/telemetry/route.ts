import { z } from "zod";

import { recordTelemetryEvent } from "@/lib/services/telemetry";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonResponse } from "@/lib/utils";

const payloadSchema = z.object({
  eventName: z.string().min(1).max(64),
  anonymousId: z.string().max(120).optional(),
  sessionId: z.string().max(120).optional(),
  path: z.string().max(300).optional(),
  referrer: z.string().url().optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(120).optional(),
  contentType: z.string().max(64).optional(),
  contentId: z.coerce.number().optional(),
  contentSlug: z.string().max(160).optional(),
  value: z.coerce.number().optional(),
  metadata: z.record(z.unknown()).optional()
});

export async function POST(request: Request) {
  try {
    const payload = payloadSchema.parse(await request.json());
    const supabase = createSupabaseServerClient();
    const {
      data: { user }
    } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

    await recordTelemetryEvent({
      eventName: payload.eventName,
      anonymousId: payload.anonymousId,
      sessionId: payload.sessionId,
      userId: user?.id ?? undefined,
      path: payload.path,
      referrer: payload.referrer,
      utmSource: payload.utmSource,
      utmMedium: payload.utmMedium,
      utmCampaign: payload.utmCampaign,
      contentType: payload.contentType,
      contentId: payload.contentId,
      contentSlug: payload.contentSlug,
      value: payload.value,
      metadata: payload.metadata
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Telemetry capture failed."
      },
      { status: 400 }
    );
  }
}
