import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  AFFILIATE_REVIEW_AGENT, AFFILIATE_REVIEW_PATH, estimateReviewCost,
  extractResearchCitations, normalizeProductName, productIdentity,
  reviewDraftBlockers, reviewDraftSchema, type AffiliateReviewDraft, type ResearchCitation
} from "@/lib/affiliate-review";
import { env } from "@/lib/env";
import {
  AFFILIATE_QA_INSTRUCTIONS, AFFILIATE_RESEARCH_INSTRUCTIONS,
  AFFILIATE_REVIEW_SYSTEM, AFFILIATE_WRITING_INSTRUCTIONS
} from "@/lib/generation/affiliate-review-prompts";
import { getAffiliateRegistryWithOverrides } from "@/lib/services/affiliate-link-overrides";
import { appendAutomationRunEvent, getAutomationPolicyState, type AutomationRunRecord } from "@/lib/services/automation-control";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type ReviewProduct = {
  key: string; product: string; category: string; destinationUrl: string;
  identity: string; normalizedName: string; trackedUrl: string;
};
export type AffiliateReviewJob = {
  id: string; affiliate_key: string; product: ReviewProduct;
  status: "researching" | "writing" | "checking" | "awaiting_review" | "blocked" | "failed" | "timed_out" | "dismissed";
  attempt_count: number; lease_token: string | null; lease_expires_at: string | null;
  research: { brief: string; citations: ResearchCitation[] } | null;
  draft: AffiliateReviewDraft | null;
  qa: { blockers: string[]; manualChecks: string[]; identityConfirmed: boolean; sourcesAdequate: boolean } | null;
  error_message: string | null; review_note: string | null; reviewed_at: string | null;
  created_at: string; updated_at: string;
};
export type AffiliateReviewGeneration = {
  id: string; attempt_id: string; stage: string; model: string; status: string;
  input_payload: unknown; raw_response: unknown; input_tokens: number | null; output_tokens: number | null;
  search_requests: number | null; estimated_cost_usd: number | null; error_message: string | null;
  started_at: string; completed_at: string | null;
};
type RunHandle = Pick<AutomationRunRecord, "id" | "agentId" | "startedAt">;
type Stage = "research" | "writing" | "qa";

function db() {
  const client = createSupabaseAdminClient();
  if (!client) throw new Error("Supabase admin access is required for affiliate reviews.");
  return client;
}

function checked<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data;
}

async function allRows(table: string, columns: string) {
  const rows: Record<string, any>[] = [];
  for (let start = 0; ; start += 1000) {
    const page = checked(await db().from(table).select(columns).order("id").range(start, start + 999)) ?? [];
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

export async function listAffiliateReviewJobs() {
  return checked(await db().from("affiliate_review_jobs").select("*").order("created_at", { ascending: false }).limit(100)) as AffiliateReviewJob[];
}

export async function getAffiliateReviewJob(id: string) {
  if (!z.string().uuid().safeParse(id).success) return null;
  const job = checked(await db().from("affiliate_review_jobs").select("*").eq("id", id).maybeSingle()) as AffiliateReviewJob | null;
  if (!job) return null;
  const attempts = checked(await db().from("affiliate_review_attempts").select("*").eq("job_id", id).order("started_at", { ascending: false })) ?? [];
  const generations = attempts.length ? checked(await db().from("affiliate_review_generations").select("*")
    .in("attempt_id", attempts.map((attempt) => attempt.id)).order("started_at", { ascending: true })) ?? [] : [];
  return { job, attempts, generations: generations as AffiliateReviewGeneration[] };
}

export async function getAffiliateReviewCatalog() {
  const [registry, reviews, jobs, legacyJobs] = await Promise.all([
    getAffiliateRegistryWithOverrides(true),
    allRows("reviews", "id, product_name, affiliate_url"),
    allRows("affiliate_review_jobs", "id, affiliate_key, product_identity, product_name_normalized, product, status, created_at"),
    db().from("content_generation_jobs").select("parameters").eq("job_type", "review").in("status", ["queued", "generating"])
  ]);
  const activeLegacy = checked(legacyJobs) ?? [];
  // Fail closed while a legacy worker may still be creating a review.
  const legacyRunning = activeLegacy.length > 0;
  const latestCategory = [...jobs].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.product?.category;
  return registry.map((entry) => {
    const product: ReviewProduct = {
      key: entry.key, product: entry.product, category: entry.category,
      destinationUrl: entry.destinationUrl, identity: productIdentity(entry.product, entry.destinationUrl),
      normalizedName: normalizeProductName(entry.product), trackedUrl: `/go/${entry.key}`
    };
    const terms = [entry.product, entry.baseProduct, ...(entry.searchTerms ?? [])].map(normalizeProductName).filter((term) => term.length >= 8);
    const reviewed = reviews.some((review) => {
      const name = normalizeProductName(review.product_name);
      return productIdentity(review.product_name, review.affiliate_url) === product.identity ||
        review.affiliate_url.includes(`/go/${entry.key}`) ||
        terms.some((term) => name === term || name.includes(term) || term.includes(name) && name.length >= 8);
    });
    const queued = jobs.find((job) => job.affiliate_key === product.key || job.product_identity === product.identity || job.product_name_normalized === product.normalizedName);
    const reason = reviewed ? "Existing review (published or draft)" : queued ? `Already in queue: ${queued.status.replaceAll("_", " ")}` :
      !entry.exactAmazonProduct ? "Needs an exact product affiliate link" : legacyRunning ? "Waiting for legacy review worker to finish" : null;
    return { ...product, reason, jobId: queued?.id as string | undefined, reviewed, exactLink: entry.exactAmazonProduct, legacyRunning };
  }).sort((a, b) => Number(Boolean(a.reason)) - Number(Boolean(b.reason)) ||
    Number(a.category === latestCategory) - Number(b.category === latestCategory) || a.product.localeCompare(b.product));
}

function parseJson(text: string) {
  return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
}

const qaSchema = z.object({ identityConfirmed: z.boolean(), sourcesAdequate: z.boolean(), issues: z.array(z.string().max(800)).max(20) }).strict();

export async function runAffiliateProductReviewer(input: {
  invocationKey: string; run?: RunHandle | null; retryId?: string;
}) {
  if (!env.ANTHROPIC_API_KEY) throw new Error("The existing Claude API key is not configured.");
  const supabase = db();
  const policy = await getAutomationPolicyState();
  if (policy.source !== "site_settings") throw new Error("Cannot verify automation pause settings. No review was started.");
  if (policy.globalPause || policy.draftCreationPause) throw new Error("Affiliate reviews are paused by site-wide automation policy.");
  const catalog = await getAffiliateReviewCatalog();
  // Retries must still reference a current exact affiliate product with no existing review.
  const candidates = catalog.filter((product) => !product.reason ||
    input.retryId && product.jobId === input.retryId && !product.reviewed && product.exactLink && !product.legacyRunning);
  const claim = checked(await supabase.rpc("claim_affiliate_review", {
    p_candidates: candidates.map(({ key, product, category, destinationUrl, identity, normalizedName, trackedUrl }) =>
      ({ key, product, category, destinationUrl, identity, normalizedName, trackedUrl })),
    p_invocation_key: input.invocationKey, p_run_id: input.run?.id ?? null, p_retry_id: input.retryId ?? null
  })) as { skipped?: string; job?: AffiliateReviewJob; attemptId?: string };
  if (claim.skipped) return { skipped: claim.skipped, jobId: null, status: "skipped", draftsCreated: 0 };
  if (!claim.job || !claim.attemptId) throw new Error("No product review claim was returned.");
  const job = claim.job;
  const attemptId = claim.attemptId;
  const model = env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 75_000 });

  async function updateJob(values: Record<string, unknown>) {
    const changed = checked(await supabase.from("affiliate_review_jobs").update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", job.id).eq("lease_token", attemptId).gt("lease_expires_at", new Date().toISOString())
      .in("status", ["researching", "writing", "checking"]).select("id"));
    if (!changed?.length) throw new Error("The review worker lease expired or was replaced; no draft was overwritten.");
  }

  async function generate(stage: Stage, prompt: string, search = false) {
    const generationId = randomUUID();
    const request = {
      model, max_tokens: stage === "writing" ? 2400 : stage === "research" ? 2000 : 1100,
      system: AFFILIATE_REVIEW_SYSTEM, messages: [{ role: "user" as const, content: prompt }],
      ...(search ? { tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }] } : {})
    };
    checked(await supabase.from("affiliate_review_generations").insert({
      id: generationId, attempt_id: attemptId, stage, model, status: "started", input_payload: request
    }));
    await appendAutomationRunEvent(input.run ?? null, { level: "info", code: `affiliate_review_${stage}`,
      message: `${job.product.product}: ${stage} started.`, payload: { jobId: job.id, generationId, detailUrl: `${AFFILIATE_REVIEW_PATH}/${job.id}#generation-${generationId}` } });
    try {
      // SDK 0.39 predates the server-side web search tool, but the Messages API supports it.
      const response = await client.messages.create(request as unknown as Anthropic.MessageCreateParamsNonStreaming);
      const usage = response.usage as typeof response.usage & { server_tool_use?: { web_search_requests?: number } };
      const searches = usage.server_tool_use?.web_search_requests ?? 0;
      checked(await supabase.from("affiliate_review_generations").update({
        status: "completed", raw_response: response, input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens, search_requests: searches,
        estimated_cost_usd: estimateReviewCost(response.model, usage.input_tokens, usage.output_tokens, searches),
        completed_at: new Date().toISOString()
      }).eq("id", generationId));
      // Preserve the raw response and usage before validating stop reason or generated JSON.
      if (response.stop_reason !== "end_turn") throw new Error(`${stage} stopped with ${response.stop_reason}; inspect saved response before retrying.`);
      const text = response.content.filter((block) => block.type === "text").map((block) => (block as Anthropic.TextBlock).text).join("\n");
      return { text, content: response.content };
    } catch (error) {
      checked(await supabase.from("affiliate_review_generations").update({
        status: "failed", error_message: error instanceof Error ? error.message : "Generation failed",
        completed_at: new Date().toISOString()
      }).eq("id", generationId));
      throw error;
    }
  }

  try {
    const researched = await generate("research", `${AFFILIATE_RESEARCH_INSTRUCTIONS}\nProduct data:\n${JSON.stringify(job.product)}`, true);
    const research = { brief: researched.text, citations: extractResearchCitations(researched.content) };
    await updateJob({ research, status: "writing" });
    if (new Set(research.citations.map((citation) => citation.url)).size < 2) {
      throw new Error("Research did not return two cited product sources. No draft was fabricated. Check web-search access and saved research.");
    }
    const written = await generate("writing", `${AFFILIATE_WRITING_INSTRUCTIONS}\nProduct:\n${JSON.stringify(job.product)}\nEvidence:\n${JSON.stringify(research)}`);
    const draft = reviewDraftSchema.parse(parseJson(written.text));
    await updateJob({ draft, status: "checking" });
    const audited = await generate("qa", `${AFFILIATE_QA_INSTRUCTIONS}\nProduct:\n${JSON.stringify(job.product)}\nEvidence:\n${JSON.stringify(research)}\nDraft:\n${JSON.stringify(draft)}`);
    const qa = qaSchema.parse(parseJson(audited.text));
    const blockers = [...reviewDraftBlockers(draft, research.citations), ...qa.issues,
      ...(!qa.identityConfirmed ? ["QA could not confirm the exact product identity."] : []),
      ...(!qa.sourcesAdequate ? ["QA found the source evidence insufficient."] : [])];
    const status = blockers.length ? "blocked" : "awaiting_review";
    await updateJob({ status, lease_token: null, qa: { ...qa, blockers, manualChecks: [
      "Human fact-check and editorial approval are required. Nothing is scheduled for publication.",
      "An exact-product image and its usage rights must be checked before publication.",
      "Verify the affiliate destination matches the product, size and variant.",
      "No star rating has been assigned; this is not a hands-on test."
    ] } });
    await appendAutomationRunEvent(input.run ?? null, { level: blockers.length ? "warning" : "info", code: "affiliate_review_draft_saved",
      message: `${job.product.product}: ${status.replaceAll("_", " ")}.`, payload: { jobId: job.id, blockers, detailUrl: `${AFFILIATE_REVIEW_PATH}/${job.id}` } });
    return { jobId: job.id, status, draftsCreated: 1, blockers, skipped: null };
  } catch (error) {
    // Conditional update prevents late failures from overwriting a replacement attempt.
    checked(await supabase.from("affiliate_review_jobs").update({ status: "failed", lease_token: null,
      error_message: error instanceof Error ? error.message : "Affiliate review failed", updated_at: new Date().toISOString()
    }).eq("id", job.id).eq("lease_token", attemptId));
    throw error;
  }
}

export function summarizeAffiliateReview(result: Awaited<ReturnType<typeof runAffiliateProductReviewer>>) {
  return {
    summary: result.skipped || `Affiliate review ${result.status.replaceAll("_", " ")}; manual approval required.`,
    rowsCreated: result.draftsCreated, rowsPublished: 0,
    resultPayload: { ...result, agentId: AFFILIATE_REVIEW_AGENT, detailUrl: result.jobId ? `${AFFILIATE_REVIEW_PATH}/${result.jobId}` : AFFILIATE_REVIEW_PATH }
  };
}
