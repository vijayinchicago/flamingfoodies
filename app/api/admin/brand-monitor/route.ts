import { revalidatePath } from "next/cache";
import { requireCronAuthorization } from "@/lib/cron";
import { runBrandMonitor } from "@/lib/services/brand-monitor";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

async function handleRequest(request: Request) {
  const unauthorized = requireCronAuthorization(request);
  if (unauthorized) return unauthorized;
  const result = await runBrandMonitor();
  if (result.releasesInserted > 0) revalidatePath("/new-releases");
  return jsonResponse({ ok: true, ...result });
}

export async function GET(request: Request) { return handleRequest(request); }
export async function POST(request: Request) { return handleRequest(request); }
