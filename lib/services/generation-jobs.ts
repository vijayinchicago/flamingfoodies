import { createSupabaseAdminClient } from "@/lib/supabase/server";

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

export const GENERATION_JOB_TIMEOUT_MINUTES = 45;
export const RETRYABLE_RECIPE_GENERATION_ATTEMPTS = 2;

const RETRYABLE_RECIPE_ERROR_PREFIXES = [
  "Draft generation returned an empty recipe payload.",
  "Draft generation returned an invalid recipe payload:"
] as const;

export function shouldRetryGenerationFailure(jobType: string, message: string) {
  if (jobType !== "recipe") {
    return false;
  }

  return RETRYABLE_RECIPE_ERROR_PREFIXES.some((prefix) => message.startsWith(prefix));
}

export function buildTimedOutGenerationJobMessage(timeoutMinutes = GENERATION_JOB_TIMEOUT_MINUTES) {
  return `Generation job timed out after ${timeoutMinutes} minutes and was marked failed automatically.`;
}

export async function expireTimedOutGenerationJobs(
  supabase: AdminClient,
  options?: {
    jobTypes?: string[];
    now?: Date;
    timeoutMinutes?: number;
  }
) {
  const timeoutMinutes = Math.max(5, options?.timeoutMinutes ?? GENERATION_JOB_TIMEOUT_MINUTES);
  const now = options?.now ?? new Date();
  const cutoffIso = new Date(now.getTime() - timeoutMinutes * 60 * 1000).toISOString();
  const updatePayload = {
    status: "failed",
    error_message: buildTimedOutGenerationJobMessage(timeoutMinutes),
    completed_at: now.toISOString()
  };

  let query = supabase
    .from("content_generation_jobs")
    .update(updatePayload)
    .eq("status", "generating")
    .not("started_at", "is", null)
    .lt("started_at", cutoffIso);

  if (options?.jobTypes?.length) {
    query = query.in("job_type", options.jobTypes);
  }

  const { data, error } = await query.select("id");

  if (error) {
    throw new Error(error.message);
  }

  return {
    count: data?.length ?? 0,
    timeoutMinutes,
    cutoffIso
  };
}
