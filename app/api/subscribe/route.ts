import { z } from "zod";

import { subscribeToNewsletter } from "@/lib/services/newsletter";
import { jsonResponse } from "@/lib/utils";

const bodySchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  source: z.string().optional(),
  tag: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const result = await subscribeToNewsletter(body);
    return jsonResponse({ ok: true, ...result });
  } catch (error) {
    return jsonResponse(
      { ok: false, error: error instanceof Error ? error.message : "Subscription failed." },
      { status: 400 }
    );
  }
}
