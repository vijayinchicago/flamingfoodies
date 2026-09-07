import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ unavailable: false, requireAdmin: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ requireAdmin: state.requireAdmin }));
// Static previews use inert URLs; real server actions are exercised separately.
vi.mock("@/lib/actions/admin-affiliate-reviews", () => ({ triggerAffiliateReviewAction: "/fixture/generate", updateAffiliateReviewerSettingsAction: "/fixture/settings", saveAffiliateReviewNoteAction: "/fixture/note" }));
vi.mock("@/components/admin/admin-submit-button", () => ({ AdminSubmitButton: ({ idleLabel, className }: any) => React.createElement("button", { className, type: "submit" }, idleLabel) }));
vi.mock("next/link", () => ({ default: ({ children, prefetch: _prefetch, ...props }: any) => React.createElement("a", props, children) }));
vi.mock("@/lib/services/automation-control", () => ({ getAutomationAgent: async () => ({ isEnabled: true, dailyRunCap: 2, dailyMutationCap: 1 }) }));
vi.mock("@/lib/services/affiliate-reviews", () => ({
  getAffiliateReviewCatalog: async () => [{ key: "test-product", product: "Example Pepper Sauce", category: "hot_sauce", reason: null }],
  listAffiliateReviewJobs: async () => { if (state.unavailable) throw new Error("Migration required"); return [fixtureJob]; },
  getAffiliateReviewJob: async () => ({ job: fixtureJob, attempts: [{ id: "attempt", run_id: 999, started_at: "2026-09-07T12:00:00Z" }], generations: [{ id: "generation", attempt_id: "attempt", stage: "research", model: "test-model", status: "completed", input_tokens: 1200, output_tokens: 600, search_requests: 2, estimated_cost_usd: 0.0242, started_at: "2026-09-07T12:00:00Z", completed_at: "2026-09-07T12:01:00Z", raw_response: { text: "Example saved response" }, input_payload: { text: "Example saved prompt" }, error_message: null }] })
}));

const fixtureJob = {
  id: "fb24a288-866d-4ec9-a048-ecf76d693325", affiliate_key: "example-sauce", status: "awaiting_review", attempt_count: 1,
  product: { product: "Example Pepper Sauce", category: "hot_sauce", trackedUrl: "/go/example-sauce", destinationUrl: "https://www.amazon.com/dp/B012345678" },
  lease_expires_at: null, updated_at: "2026-09-07T12:02:00Z", error_message: null, review_note: null,
  qa: { blockers: [], manualChecks: ["Human fact-check and editorial approval are required.", "Verify an exact-product image and its usage rights."] },
  research: { brief: "Example research brief, for UI testing only.", citations: [{ url: "https://example.com/product", title: "Example manufacturer source", citedText: "The label lists peppers and vinegar." }] },
  draft: { title: "Example Pepper Sauce: what to check before buying", description: "A research-based assessment of the listed ingredients and buying considerations. This preview uses test data, not a real review.",
    sections: [{ heading: "Ingredients and intended use", body: "The manufacturer lists peppers and vinegar. Check the label for your own dietary needs. We have not tasted this product.", sourceUrls: ["https://example.com/product"] }],
    pros: ["The manufacturer provides an ingredient list."], cons: ["Personal heat preference remains unknown."], unknowns: ["An exact image and usage rights still need review."] }
};

beforeEach(() => { vi.stubGlobal("React", React); state.unavailable = false; state.requireAdmin.mockReset().mockResolvedValue({ id: "admin" }); });

async function savePreview(name: string, html: string) {
  const directory = process.env.AFFILIATE_REVIEW_UI_DIR;
  if (!directory) return;
  const { AdminSidebar } = await import("@/components/admin/admin-sidebar");
  const sidebar = renderToStaticMarkup(<AdminSidebar />);
  writeFileSync(join(directory, `${name}.html`), `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"><title>Reviewer UI test fixture</title></head><body><div style="padding:8px;text-align:center;background:#fff1c2">UI test fixture — not a live generation</div><main class="container-shell py-12"><div class="admin-grid">${sidebar}<div>${html}</div></div></main></body></html>`);
}

describe("affiliate reviewer admin screens", () => {
  it("does not render the queue when admin authorization fails", async () => {
    state.requireAdmin.mockRejectedValue(new Error("Admin sign-in required"));
    const { default: Page } = await import("@/app/admin/automation/affiliate-reviews/page");
    await expect(Page({})).rejects.toThrow("Admin sign-in required");
  });
  it("renders independent controls, queue status and eligibility behind admin auth", async () => {
    const { default: Page } = await import("@/app/admin/automation/affiliate-reviews/page");
    const html = renderToStaticMarkup(await Page({}));
    expect(state.requireAdmin).toHaveBeenCalledOnce();
    for (const label of ["Generate one draft", "Daily attempt cap", "Daily draft cap", "awaiting review", "Eligible"]) expect(html).toContain(label);
    expect(html).toContain("nothing here publishes automatically");
    await savePreview("queue", html);
  });
  it("renders draft, evidence, usage, run link and review notes without a publish button", async () => {
    const { default: Page } = await import("@/app/admin/automation/affiliate-reviews/[id]/page");
    const html = renderToStaticMarkup(await Page({ params: { id: fixtureJob.id } }));
    for (const label of ["Research evidence", "Recorded tokens", "1,800", "Save review note", "Saved response", "runId=999", "not a hands-on test"]) expect(html).toContain(label);
    expect(html).not.toContain(">Publish<");
    expect(state.requireAdmin).toHaveBeenCalledOnce();
    await savePreview("detail", html);
  });
  it("shows setup failure without an active generation control", async () => {
    state.unavailable = true;
    const { default: Page } = await import("@/app/admin/automation/affiliate-reviews/page");
    const html = renderToStaticMarkup(await Page({}));
    expect(html).toContain("setup is incomplete");
    expect(html).not.toContain("Generate one draft");
  });
});
