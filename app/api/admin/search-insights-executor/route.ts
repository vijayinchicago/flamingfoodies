import { revalidatePath } from "next/cache";

import { requireAdminApiAccess, writeAdminAuditLog } from "@/lib/admin-api";
import { runSearchRecommendationExecutor } from "@/lib/services/search-insights";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

function revalidateSearchInsightSurfaces() {
  revalidatePath("/admin/automation/agents");
  revalidatePath("/admin/automation/trigger");
  revalidatePath("/admin/analytics/search-console");
  revalidatePath("/blog");
  revalidatePath("/recipes");
  revalidatePath("/hot-sauces");
  revalidatePath("/hot-sauces/best-for-wings");
  revalidatePath("/hot-sauces/best-for-seafood");
  revalidatePath("/hot-sauces/best-for-fried-chicken");
  revalidatePath("/blog/how-to-choose-a-hot-sauce-for-seafood");
  revalidatePath("/recipes/nashville-hot-chicken-sandwiches");
}

async function handleRequest() {
  const admin = await requireAdminApiAccess();
  if (admin instanceof Response) {
    return admin;
  }

  try {
    const result = await runSearchRecommendationExecutor();

    await writeAdminAuditLog({
      adminId: admin.id,
      action: "run_search_recommendation_executor",
      targetType: "search_console",
      targetId: "manual_executor_api",
      metadata: result
    });

    if (result.ok) {
      revalidateSearchInsightSurfaces();
      return jsonResponse(result);
    }

    return jsonResponse(result, { status: 503 });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Search recommendation executor failed"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return handleRequest();
}

export async function POST() {
  return handleRequest();
}
