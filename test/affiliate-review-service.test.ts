import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  writes: [] as { table: string; op: string; value: any }[],
  create: vi.fn(), claim: vi.fn(), leaseValid: true, policyUnavailable: false, policyPaused: false, reviews: [] as any[], jobs: [] as any[], legacy: [] as any[]
}));
vi.mock("@/lib/env", () => ({ env: { ANTHROPIC_API_KEY: "test-not-a-real-key" }, flags: { hasSupabaseAdmin: true } }));
vi.mock("@anthropic-ai/sdk", () => ({ default: class { messages = { create: state.create }; } }));
vi.mock("@/lib/services/automation-control", () => ({ appendAutomationRunEvent: vi.fn(), getAutomationPolicyState: async () => ({ source: state.policyUnavailable ? "fallback" : "site_settings", globalPause: state.policyPaused, draftCreationPause: false }) }));
vi.mock("@/lib/services/affiliate-link-overrides", () => ({ getAffiliateRegistryWithOverrides: async () => [{
  key: "test-product", product: "Test Pepper Sauce", baseProduct: "Test Pepper Sauce", category: "hot_sauce",
  exactAmazonProduct: true, destinationUrl: "https://www.amazon.com/dp/B012345678?tag=existing-20"
}] }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: () => ({
  rpc: state.claim,
  from(table: string) {
    let op = "read";
    const query: any = {};
    for (const method of ["select", "eq", "in", "gt", "order", "limit", "range", "maybeSingle"]) query[method] = () => query;
    for (const method of ["insert", "update"]) query[method] = (value: any) => { op = method; state.writes.push({ table, op, value }); return query; };
    query.then = (resolve: (value: any) => void) => resolve({ error: null, data: op !== "read" ?
      table === "affiliate_review_jobs" && !state.leaseValid ? [] : [{ id: "job" }] :
      table === "reviews" ? state.reviews : table === "affiliate_review_jobs" ? state.jobs : table === "content_generation_jobs" ? state.legacy : [] });
    return query;
  }
}) }));

import { getAffiliateReviewCatalog, runAffiliateProductReviewer } from "@/lib/services/affiliate-reviews";

const urls = ["https://maker.example/product", "https://shop.example/product"];
const draft = {
  title: "Test Pepper Sauce: ingredients and buying considerations",
  description: "A source-backed look at the listed ingredients, documented specifications and buying considerations for this sauce.",
  sections: ["Ingredients", "Buying considerations", "Limitations"].map((heading) => ({ heading,
    body: "The manufacturer lists vinegar and peppers. Readers should check the ingredient label for their own requirements.", sourceUrls: urls })),
  pros: ["A complete ingredient list is available."], cons: ["Individual heat preference remains unknown."], unknowns: []
};
function response(text: string, citations = false) {
  return { model: "claude-haiku-4-5-20251001", stop_reason: "end_turn", usage: { input_tokens: 100, output_tokens: 200, server_tool_use: { web_search_requests: citations ? 2 : 0 } },
    content: [{ type: "text", text, ...(citations ? { citations: urls.map((url) => ({ type: "web_search_result_location", url, title: "Product evidence", cited_text: "The manufacturer lists vinegar and peppers." })) } : {}) }] };
}

beforeEach(() => {
  state.writes = []; state.create.mockReset(); state.claim.mockReset(); state.leaseValid = true;
  state.policyUnavailable = false; state.policyPaused = false;
  state.reviews = []; state.jobs = []; state.legacy = [];
  state.claim.mockResolvedValue({ error: null, data: { attemptId: "attempt", job: { id: "job", product: { key: "test-product", product: "Test Pepper Sauce", trackedUrl: "/go/test-product" } } } });
  state.create.mockResolvedValueOnce(response("Cited manufacturer and retailer evidence.", true))
    .mockResolvedValueOnce(response(JSON.stringify(draft)))
    .mockResolvedValueOnce(response(JSON.stringify({ identityConfirmed: true, sourcesAdequate: true, issues: [] })));
});

describe("affiliate reviewer pipeline", () => {
  it("fails closed if site-wide pause settings cannot be verified", async () => {
    state.policyUnavailable = true;
    await expect(runAffiliateProductReviewer({ invocationKey: "test" })).rejects.toThrow("Cannot verify automation pause");
    expect(state.claim).not.toHaveBeenCalled(); expect(state.create).not.toHaveBeenCalled();
  });
  it("honors site-wide pauses even when called directly", async () => {
    state.policyPaused = true;
    await expect(runAffiliateProductReviewer({ invocationKey: "test" })).rejects.toThrow("paused by site-wide");
    expect(state.claim).not.toHaveBeenCalled(); expect(state.create).not.toHaveBeenCalled();
  });
  it("persists three calls, usage and a private draft without touching public reviews", async () => {
    const result = await runAffiliateProductReviewer({ invocationKey: "manual:test" });
    expect(result.status).toBe("awaiting_review");
    expect(state.writes.filter((write) => write.table === "affiliate_review_generations" && write.op === "insert")).toHaveLength(3);
    expect(state.writes.filter((write) => write.value.raw_response)).toHaveLength(3);
    expect(state.writes.some((write) => write.table === "reviews")).toBe(false);
    const saved = state.writes.find((write) => write.value.status === "awaiting_review");
    expect(saved?.value.qa.manualChecks.length).toBeGreaterThan(0);
    expect(state.create.mock.calls[0][0].tools[0].max_uses).toBe(3);
    expect(state.writes.some((write) => write.value.input_payload?.apiKey)).toBe(false);
  });
  it("skips duplicate claims before making any paid calls", async () => {
    state.claim.mockResolvedValue({ error: null, data: { skipped: "Already claimed" } });
    expect((await runAffiliateProductReviewer({ invocationKey: "cron:duplicate" })).status).toBe("skipped");
    expect(state.create).not.toHaveBeenCalled();
  });
  it("preserves response and usage when research lacks citations", async () => {
    state.create.mockReset().mockResolvedValue(response("Uncited prose"));
    await expect(runAffiliateProductReviewer({ invocationKey: "test" })).rejects.toThrow("two cited product sources");
    expect(state.create).toHaveBeenCalledTimes(1);
    expect(state.writes.some((write) => write.value.raw_response && write.value.input_tokens === 100)).toBe(true);
    expect(state.writes.at(-1)?.value.status).toBe("failed");
  });
  it("preserves malformed writer output before reporting failure", async () => {
    state.create.mockReset().mockResolvedValueOnce(response("Evidence", true)).mockResolvedValueOnce(response("{bad json"));
    await expect(runAffiliateProductReviewer({ invocationKey: "test" })).rejects.toThrow();
    expect(state.writes.some((write) => write.value.raw_response?.content[0].text === "{bad json")).toBe(true);
    expect(state.create).toHaveBeenCalledTimes(2);
  });
  it("retains a QA-blocked draft rather than publishing or losing it", async () => {
    state.create.mockReset().mockResolvedValueOnce(response("Evidence", true)).mockResolvedValueOnce(response(JSON.stringify(draft)))
      .mockResolvedValueOnce(response(JSON.stringify({ identityConfirmed: false, sourcesAdequate: false, issues: ["Wrong product variant"] })));
    expect((await runAffiliateProductReviewer({ invocationKey: "test" })).status).toBe("blocked");
    expect(state.writes.some((write) => write.value.draft)).toBe(true);
    expect(state.writes.at(-1)?.value.qa.blockers).toContain("Wrong product variant");
  });
  it("records a provider timeout as failed, without pretending token usage was zero", async () => {
    state.create.mockReset().mockRejectedValue(new Error("Request timed out"));
    await expect(runAffiliateProductReviewer({ invocationKey: "test" })).rejects.toThrow("timed out");
    const failure = state.writes.find((write) => write.table === "affiliate_review_generations" && write.value.status === "failed");
    expect(failure?.value.input_tokens).toBeUndefined();
  });
  it("rejects a lost worker lease before generating the next stage", async () => {
    state.leaseValid = false;
    await expect(runAffiliateProductReviewer({ invocationKey: "test" })).rejects.toThrow("lease expired");
    expect(state.create).toHaveBeenCalledTimes(1);
  });
  it("excludes published/draft aliases and pauses behind active legacy jobs", async () => {
    state.reviews = [{ product_name: "TEST Pepper-Sauce", affiliate_url: "https://example.com/old" }];
    expect((await getAffiliateReviewCatalog())[0].reason).toContain("Existing review");
    state.reviews = []; state.legacy = [{ parameters: {} }];
    expect((await getAffiliateReviewCatalog())[0].reason).toContain("legacy");
  });
  it("fails closed on database claim errors", async () => {
    state.claim.mockResolvedValue({ error: { message: "daily cap" }, data: null });
    await expect(runAffiliateProductReviewer({ invocationKey: "test" })).rejects.toThrow("daily cap");
    expect(state.create).not.toHaveBeenCalled();
  });
});
