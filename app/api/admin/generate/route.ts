import { runGenerationPipeline } from "@/lib/services/automation";
import { requireCronAuthorization } from "@/lib/cron";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function handleRequest(request: Request) {
  const unauthorized = requireCronAuthorization(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "recipe";
  const qtyParam = searchParams.get("qty");
  const qty = qtyParam ? Number(qtyParam) : undefined;

  const result = await runGenerationPipeline(type, qty, {
    source: "cron"
  });
  return jsonResponse({ ok: true, ...result });
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
