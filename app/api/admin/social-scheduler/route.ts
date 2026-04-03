import { env } from "@/lib/env";
import { queueSocialScheduler } from "@/lib/services/automation";
import { jsonResponse } from "@/lib/utils";

function authorize(request: Request) {
  if (!env.CRON_SECRET) return true;
  return request.headers.get("authorization") === `Bearer ${env.CRON_SECRET}`;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await queueSocialScheduler();
  return jsonResponse({ ok: true, ...result });
}
