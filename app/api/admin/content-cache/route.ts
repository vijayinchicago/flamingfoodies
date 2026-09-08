import { requireCronAuthorization } from "@/lib/cron";
import {
  EDITORIAL_TABLES,
  invalidatePublishedContent,
  invalidatePublicSearchRuntime
} from "@/lib/services/published-content-cache";

export const dynamic = "force-dynamic";

// Maintenance scripts may purge after direct database writes. Never expose a
// public GET purge: crawlers and anonymous traffic must not cause origin reads.
export async function POST(request: Request) {
  const unauthorized = requireCronAuthorization(request);
  if (unauthorized) return unauthorized;
  for (const table of EDITORIAL_TABLES) invalidatePublishedContent(table);
  invalidatePublicSearchRuntime();
  return Response.json({ ok: true, invalidated: [...EDITORIAL_TABLES, "search_runtime_optimizations"] });
}
