import { revalidatePath } from "next/cache";

import { requireCronAuthorization } from "@/lib/cron";
import { publishScheduledContent } from "@/lib/services/automation";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function handleRequest(request: Request) {
  const unauthorized = requireCronAuthorization(request);
  if (unauthorized) {
    return unauthorized;
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

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
