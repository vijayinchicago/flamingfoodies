import { requireCronAuthorization } from "@/lib/cron";
import { queueSocialScheduler } from "@/lib/services/automation";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function handleRequest(request: Request) {
  const unauthorized = requireCronAuthorization(request);
  if (unauthorized) {
    return unauthorized;
  }

  const result = await queueSocialScheduler();
  return jsonResponse({ ok: true, ...result });
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
