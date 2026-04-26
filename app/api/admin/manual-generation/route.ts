import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminApiAccess, writeAdminAuditLog } from "@/lib/admin-api";
import { runGenerationPipeline } from "@/lib/services/automation";
import { runManualAutomationTask } from "@/lib/services/automation-control";
import { runShopPickAutomation } from "@/lib/services/shop-automation";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const requestSchema = z.object({
  type: z.enum(["recipe", "blog_post", "review", "merch_product"]),
  qty: z.coerce.number().int().min(1).max(20),
  profile: z.enum(["default", "hot_sauce_recipe"]).optional()
}).superRefine((value, context) => {
  if (value.profile && value.profile !== "default" && value.type !== "recipe") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Only recipe generation supports profiles.",
      path: ["profile"]
    });
  }
});

function revalidateGeneratedType(type: "recipe" | "blog_post" | "review" | "merch_product") {
  revalidatePath("/admin/automation/jobs");
  revalidatePath("/admin/automation/trigger");
  revalidatePath("/admin");

  if (type === "recipe") {
    revalidatePath("/admin/content/recipes");
  }

  if (type === "blog_post") {
    revalidatePath("/admin/content/blog");
  }

  if (type === "review") {
    revalidatePath("/admin/content/reviews");
  }

  if (type === "merch_product") {
    revalidatePath("/admin/content/merch");
    revalidatePath("/shop");
  }
}

export async function POST(request: Request) {
  const admin = await requireAdminApiAccess();
  if (admin instanceof Response) {
    return admin;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return jsonResponse({ ok: false, error: "Invalid generation request" }, { status: 400 });
  }

  try {
    const task = await runManualAutomationTask({
      agentId:
        parsed.data.type === "merch_product" ? "shop-shelf-curator" : "editorial-autopublisher",
      adminId: admin.id,
      triggerReference: "api:/api/admin/manual-generation",
      inputPayload: {
        type: parsed.data.type,
        qty: parsed.data.qty,
        profile: parsed.data.profile ?? "default"
      },
      execute: async () => {
        const result =
          parsed.data.type === "merch_product"
            ? await runShopPickAutomation(parsed.data.qty, {
                source: "manual"
              })
            : await runGenerationPipeline(parsed.data.type, parsed.data.qty, {
                source: "manual",
                profile: parsed.data.profile
              });

        if ("skippedReason" in result && result.skippedReason) {
          throw new Error(result.skippedReason);
        }

        return result;
      },
      onSuccess: () => {
        revalidateGeneratedType(parsed.data.type);
      },
      summarize: (result) => ({
        summary: `Queued ${result.createdJobs.length} ${parsed.data.type} job(s).`,
        rowsCreated: result.createdJobs.length
      })
    });

    if (!task.ok) {
      const status =
        task.errorCode === "paused" || task.errorCode === "disabled"
          ? 423
          : task.errorCode === "failed" || task.errorCode === "failure_threshold"
            ? 409
            : 429;

      return jsonResponse(
        {
          ok: false,
          error: task.errorMessage
        },
        { status }
      );
    }

    const result = task.result;

    await writeAdminAuditLog({
      adminId: admin.id,
      action: "generate_content",
      targetType: parsed.data.type,
      targetId: String(parsed.data.qty),
      metadata: {
        qty: parsed.data.qty,
        profile: parsed.data.profile ?? "default",
        mode: result.mode,
        createdJobs: result.createdJobs.length,
        trigger: "manual_api"
      }
    });

    return jsonResponse({
      ok: true,
      ...result,
      triggeredAt: new Date().toISOString()
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Generation failed"
      },
      { status: 500 }
    );
  }
}
