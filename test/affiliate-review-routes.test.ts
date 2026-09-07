import { afterEach, describe, expect, it, vi } from "vitest";

async function loadRoutes(secret?: string) {
  vi.resetModules();
  vi.stubEnv("CRON_SECRET", secret ?? "");
  const reviewer = vi.fn().mockResolvedValue({ jobId: "test-job", status: "awaiting_review", draftsCreated: 1, skipped: null });
  const legacy = vi.fn();
  vi.doMock("@/lib/services/affiliate-reviews", () => ({ runAffiliateProductReviewer: reviewer, summarizeAffiliateReview: () => ({ rowsCreated: 1, rowsPublished: 0 }) }));
  vi.doMock("@/lib/services/automation", () => ({ runGenerationPipeline: legacy }));
  vi.doMock("@/lib/services/shop-automation", () => ({ runShopPickAutomation: vi.fn() }));
  const cron = await import("@/app/api/admin/affiliate-reviews/cron/route");
  const old = await import("@/app/api/admin/generate/route");
  return { cron, old, reviewer, legacy };
}

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe("affiliate reviewer route authorization", () => {
  it("retires the old manual review API without creating a legacy job", async () => {
    const { reviewer, legacy } = await loadRoutes();
    vi.doMock("@/lib/admin-api", () => ({ requireAdminApiAccess: async () => ({ id: "admin" }), writeAdminAuditLog: vi.fn() }));
    const manual = await import("@/app/api/admin/manual-generation/route");
    const response = await manual.POST(new Request("https://flamingfoodies.com/api/admin/manual-generation", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "review", qty: 20 })
    }));
    expect(response.status).toBe(409);
    expect((await response.json()).reviewerUrl).toBe("/admin/automation/affiliate-reviews");
    expect(reviewer).not.toHaveBeenCalled(); expect(legacy).not.toHaveBeenCalled();
  });
  it("fails closed when the cron secret is absent", async () => {
    const { cron, reviewer } = await loadRoutes();
    expect((await cron.GET(new Request("https://flamingfoodies.com/api/admin/affiliate-reviews/cron"))).status).toBe(503);
    expect(reviewer).not.toHaveBeenCalled();
  });
  it("requires cron authorization on both the new and legacy routes", async () => {
    const { cron, old, reviewer, legacy } = await loadRoutes("test-cron-secret");
    expect((await cron.GET(new Request("https://flamingfoodies.com/api/admin/affiliate-reviews/cron"))).status).toBe(401);
    expect((await old.GET(new Request("https://flamingfoodies.com/api/admin/generate?type=review"))).status).toBe(401);
    expect(reviewer).not.toHaveBeenCalled(); expect(legacy).not.toHaveBeenCalled();
  });
  it("routes an authorized legacy review request to the draft-only reviewer", async () => {
    const { old, reviewer, legacy } = await loadRoutes("test-cron-secret");
    const response = await old.GET(new Request("https://flamingfoodies.com/api/admin/generate?type=review&qty=20", { headers: { authorization: "Bearer test-cron-secret" } }));
    expect(response.status).toBe(200);
    expect(reviewer).toHaveBeenCalledTimes(1);
    expect(legacy).not.toHaveBeenCalled();
    expect(reviewer.mock.calls[0][0].invocationKey).toMatch(/^cron:\d{4}-\d{2}-\d{2}$/);
  });
});
