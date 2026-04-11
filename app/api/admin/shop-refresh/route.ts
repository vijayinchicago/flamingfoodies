import { requireCronAuthorization } from "@/lib/cron";
import { runShopCatalogRefresh } from "@/lib/services/shop-automation";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function handleRequest(request: Request) {
  const unauthorized = requireCronAuthorization(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { searchParams } = new URL(request.url);
  const windowDaysParam = searchParams.get("windowDays");
  const windowDays = windowDaysParam ? Number(windowDaysParam) : undefined;
  const result = await runShopCatalogRefresh({
    source: "cron",
    windowDays
  });

  return jsonResponse({ ok: true, ...result });
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
