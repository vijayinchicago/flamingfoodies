import { z } from "zod";

import { requireAdminApiAccess } from "@/lib/admin-api";
import { getGenerationJobs } from "@/lib/services/admin";
import type { GenerationJob } from "@/lib/types";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

const searchSchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(12)
});

function isJobActive(job: GenerationJob) {
  return job.status === "queued" || job.status === "generating";
}

export async function GET(request: Request) {
  const admin = await requireAdminApiAccess();
  if (admin instanceof Response) {
    return admin;
  }

  const { searchParams } = new URL(request.url);
  const parsed = searchSchema.safeParse({
    limit: searchParams.get("limit") ?? "12"
  });

  if (!parsed.success) {
    return jsonResponse({ ok: false, error: "Invalid jobs query" }, { status: 400 });
  }

  const jobs = (await getGenerationJobs()).slice(0, parsed.data.limit);

  return jsonResponse({
    ok: true,
    jobs,
    activeCount: jobs.filter(isJobActive).length,
    fetchedAt: new Date().toISOString()
  });
}
