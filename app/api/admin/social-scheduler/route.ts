import { requireCronAuthorization } from "@/lib/cron";
import { queueSocialScheduler } from "@/lib/services/automation";
import { jsonResponse } from "@/lib/utils";

export async function POST(request: Request) {
  const unauthorized = requireCronAuthorization(request);
  if (unauthorized) {
    return unauthorized;
  }

  const result = await queueSocialScheduler();
  return jsonResponse({ ok: true, ...result });
}
