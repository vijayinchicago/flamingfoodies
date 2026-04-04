import { buildAdsTxtContent } from "@/lib/ads";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  const content =
    buildAdsTxtContent(env.NEXT_PUBLIC_ADSENSE_ID, env.ADS_TXT_EXTRA_LINES) ||
    "# AdSense publisher ID not configured yet.";

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
