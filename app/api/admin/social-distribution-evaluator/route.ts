import { revalidatePath } from "next/cache";

import { requireAdminApiAccess, writeAdminAuditLog } from "@/lib/admin-api";
import { runSocialDistributionEvaluator } from "@/lib/services/social-distribution-evaluator";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

function revalidateSocialEvaluationSurfaces() {
  revalidatePath("/admin/automation/agents");
  revalidatePath("/admin/automation/runs");
  revalidatePath("/admin/automation/trigger");
}

async function handleRequest(request: Request) {
  const admin = await requireAdminApiAccess();
  if (admin instanceof Response) {
    return admin;
  }

  const { searchParams } = new URL(request.url);
  const rawWindowDays = Number(searchParams.get("windowDays") ?? "7");
  const evaluationWindowDays = Number.isFinite(rawWindowDays) ? Math.max(0, rawWindowDays) : 7;
  const allowImmatureRuns = searchParams.get("allowImmatureRuns") === "1";

  try {
    const result = await runSocialDistributionEvaluator({
      evaluationWindowDays,
      allowImmatureRuns
    });

    await writeAdminAuditLog({
      adminId: admin.id,
      action: "run_social_distribution_evaluator",
      targetType: "social_distribution",
      targetId: "manual_evaluator_api",
      metadata: result
    });

    if (result.ok) {
      revalidateSocialEvaluationSurfaces();
      return jsonResponse(result);
    }

    return jsonResponse(result, { status: 503 });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Social distribution evaluator failed"
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
