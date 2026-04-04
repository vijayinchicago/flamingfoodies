import { env } from "@/lib/env";
import { jsonResponse } from "@/lib/utils";

export function requireCronAuthorization(request: Request) {
  if (!env.CRON_SECRET) {
    return jsonResponse(
      {
        ok: false,
        error: "CRON_SECRET is not configured"
      },
      { status: 503 }
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
