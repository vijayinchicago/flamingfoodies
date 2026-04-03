import { runGenerationPipeline } from "@/lib/services/automation";
import { env } from "@/lib/env";
import { jsonResponse } from "@/lib/utils";

function authorize(request: Request) {
  if (!env.CRON_SECRET) return true;
  return request.headers.get("authorization") === `Bearer ${env.CRON_SECRET}`;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "recipe";
  const qty = Number(searchParams.get("qty") || "1");

  const result = await runGenerationPipeline(type, qty);
  return jsonResponse({ ok: true, ...result });
}
