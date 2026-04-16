import { revalidatePath } from "next/cache";

import { requireCronAuthorization } from "@/lib/cron";
import { runFestivalDiscovery } from "@/lib/services/festival-discovery";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handleRequest(request: Request) {
  const unauthorized = requireCronAuthorization(request);
  if (unauthorized) return unauthorized;

  const result = await runFestivalDiscovery();

  // If new festivals were discovered, revalidate the hub page so the
  // draft count is visible in the admin dashboard.
  if (result.inserted > 0) {
    revalidatePath("/festivals");
  }

  return jsonResponse({ ok: true, ...result });
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
