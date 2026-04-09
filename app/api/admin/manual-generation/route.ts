import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminApiAccess, writeAdminAuditLog } from "@/lib/admin-api";
import { runGenerationPipeline } from "@/lib/services/automation";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  type: z.enum(["recipe", "blog_post", "review"]),
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

function revalidateGeneratedType(type: "recipe" | "blog_post" | "review") {
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
    const result = await runGenerationPipeline(parsed.data.type, parsed.data.qty, {
      source: "manual",
      profile: parsed.data.profile
    });

    if ("skippedReason" in result && result.skippedReason) {
      return jsonResponse(
        {
          ok: false,
          error: result.skippedReason,
          ...result
        },
        { status: 409 }
      );
    }

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

    revalidateGeneratedType(parsed.data.type);

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
