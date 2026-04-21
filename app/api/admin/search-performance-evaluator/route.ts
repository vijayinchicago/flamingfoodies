import { revalidatePath } from "next/cache";

import { requireAdminApiAccess, writeAdminAuditLog } from "@/lib/admin-api";
import { runSearchPerformanceEvaluator } from "@/lib/services/search-insights";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

function revalidateSearchEvaluationSurfaces() {
  revalidatePath("/admin/automation/agents");
  revalidatePath("/admin/automation/runs");
  revalidatePath("/admin/automation/trigger");
  revalidatePath("/admin/analytics/search-console");
}

async function handleRequest(request: Request) {
  const admin = await requireAdminApiAccess();
  if (admin instanceof Response) {
    return admin;
  }

  const { searchParams } = new URL(request.url);
  const rawWindowDays = Number(searchParams.get("windowDays") ?? "0");
  const evaluationWindowDays = Number.isFinite(rawWindowDays) ? Math.max(0, rawWindowDays) : 0;
  const includeExistingApplied = searchParams.get("includeExistingApplied") === "1";

  try {
    const result = await runSearchPerformanceEvaluator({
      evaluationWindowDays,
      includeExistingApplied
    });

    await writeAdminAuditLog({
      adminId: admin.id,
      action: "run_search_performance_evaluator",
      targetType: "search_console",
      targetId: "manual_evaluator_api",
      metadata: result
    });

    if (result.ok) {
      revalidateSearchEvaluationSurfaces();
      return jsonResponse(result);
    }

    return jsonResponse(result, { status: 503 });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Search performance evaluator failed"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
