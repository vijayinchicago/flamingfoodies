import { requireCronAuthorization } from "@/lib/cron";
import { runPepperDiscovery } from "@/lib/services/pepper-discovery";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handleRequest(request: Request) {
  const unauthorized = requireCronAuthorization(request);
  if (unauthorized) return unauthorized;
  const result = await runPepperDiscovery();
  return jsonResponse({ ok: true, ...result });
}

export async function GET(request: Request) { return handleRequest(request); }
export async function POST(request: Request) { return handleRequest(request); }
