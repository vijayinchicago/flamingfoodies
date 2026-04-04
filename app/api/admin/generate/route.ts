import { runGenerationPipeline } from "@/lib/services/automation";
import { requireCronAuthorization } from "@/lib/cron";
import { jsonResponse } from "@/lib/utils";

export async function POST(request: Request) {
  const unauthorized = requireCronAuthorization(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "recipe";
  const qty = Number(searchParams.get("qty") || "1");

  const result = await runGenerationPipeline(type, qty);
  return jsonResponse({ ok: true, ...result });
}
