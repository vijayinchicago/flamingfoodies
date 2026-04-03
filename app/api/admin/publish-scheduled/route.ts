import { revalidatePath } from "next/cache";

import { env } from "@/lib/env";
import { publishScheduledContent } from "@/lib/services/automation";
import { jsonResponse } from "@/lib/utils";

function authorize(request: Request) {
  if (!env.CRON_SECRET) return true;
  return request.headers.get("authorization") === `Bearer ${env.CRON_SECRET}`;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await publishScheduledContent();

  revalidatePath("/blog");
  revalidatePath("/recipes");
  revalidatePath("/reviews");

  for (const item of result.published) {
    if (item.type === "blog_post") revalidatePath(`/blog/${item.slug}`);
    if (item.type === "recipe") revalidatePath(`/recipes/${item.slug}`);
    if (item.type === "review") revalidatePath(`/reviews/${item.slug}`);
  }

  return jsonResponse({ ok: true, ...result });
}
