import { afterEach, describe, expect, it, vi } from "vitest";

async function importGenerateRoute({
  runGenerationPipeline = vi.fn().mockResolvedValue({ mode: "live", createdJobs: [] }),
  runShopPickAutomation = vi.fn().mockResolvedValue({ mode: "catalog", createdJobs: [] })
} = {}) {
  vi.resetModules();
  vi.doMock("@/lib/services/automation", () => ({
    runGenerationPipeline
  }));
  vi.doMock("@/lib/services/shop-automation", () => ({
    runShopPickAutomation
  }));

  const route = await import("@/app/api/admin/generate/route");
  return {
    route,
    runGenerationPipeline,
    runShopPickAutomation
  };
}

async function importNewsletterRoute({
  createWeeklyDigest = vi.fn().mockResolvedValue({ mode: "mock", subject: "Digest" }),
  processScheduledNewsletterCampaigns = vi
    .fn()
    .mockResolvedValue({ mode: "mock", processed: 0, sent: 0, failures: 0 })
} = {}) {
  vi.resetModules();
  vi.doMock("@/lib/services/automation", () => ({
    createWeeklyDigest
  }));
  vi.doMock("@/lib/services/newsletter", () => ({
    processScheduledNewsletterCampaigns
  }));

  const route = await import("@/app/api/admin/newsletter-digest/route");
  return {
    route,
    createWeeklyDigest,
    processScheduledNewsletterCampaigns
  };
}

async function importSocialRoute({
  queueSocialScheduler = vi.fn().mockResolvedValue({ queued: 2, published: 1 })
} = {}) {
  vi.resetModules();
  vi.doMock("@/lib/services/automation", () => ({
    queueSocialScheduler
  }));

  const route = await import("@/app/api/admin/social-scheduler/route");
  return {
    route,
    queueSocialScheduler
  };
}

async function importGrowthLoopRoute({
  queueGrowthLoopPromotions = vi
    .fn()
    .mockResolvedValue({ queuedContent: 1, queuedPosts: 3, skipped: [] })
} = {}) {
  vi.resetModules();
  vi.doMock("@/lib/services/growth-loop", () => ({
    queueGrowthLoopPromotions
  }));

  const route = await import("@/app/api/admin/growth-loop/route");
  return {
    route,
    queueGrowthLoopPromotions
  };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("newsletter digest cron route", () => {
  it("fails closed when the cron secret is not configured", async () => {
    const { route, createWeeklyDigest, processScheduledNewsletterCampaigns } =
      await importNewsletterRoute();

    const response = await route.POST(
      new Request("https://flamingfoodies.com/api/admin/newsletter-digest", {
        method: "POST"
      })
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      error: "CRON_SECRET is not configured"
    });
    expect(createWeeklyDigest).not.toHaveBeenCalled();
    expect(processScheduledNewsletterCampaigns).not.toHaveBeenCalled();
  });

  it("rejects unauthorized requests when CRON_SECRET is set", async () => {
    vi.stubEnv("CRON_SECRET", "topsecret");
    const { route, createWeeklyDigest, processScheduledNewsletterCampaigns } =
      await importNewsletterRoute();

    const response = await route.POST(
      new Request("https://flamingfoodies.com/api/admin/newsletter-digest")
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false, error: "Unauthorized" });
    expect(createWeeklyDigest).not.toHaveBeenCalled();
    expect(processScheduledNewsletterCampaigns).not.toHaveBeenCalled();
  });

  it("creates a digest by default when authorized", async () => {
    vi.stubEnv("CRON_SECRET", "topsecret");
    const { route, createWeeklyDigest, processScheduledNewsletterCampaigns } =
      await importNewsletterRoute({
        createWeeklyDigest: vi.fn().mockResolvedValue({
          mode: "mock",
          subject: "This Week's Heat",
          draftCount: 1
        })
      });

    const response = await route.POST(
      new Request(
        "https://flamingfoodies.com/api/admin/newsletter-digest",
        {
          method: "POST",
          headers: {
            authorization: "Bearer topsecret"
          }
        }
      )
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      requestMode: "draft",
      mode: "mock",
      subject: "This Week's Heat",
      draftCount: 1
    });
    expect(createWeeklyDigest).toHaveBeenCalledTimes(1);
    expect(processScheduledNewsletterCampaigns).not.toHaveBeenCalled();
  });

  it("processes due scheduled newsletters when requested", async () => {
    vi.stubEnv("CRON_SECRET", "topsecret");
    const processScheduledNewsletterCampaigns = vi.fn().mockResolvedValue({
      mode: "mock",
      processed: 3,
      sent: 2,
      failures: 1
    });
    const { route, createWeeklyDigest } = await importNewsletterRoute({
      processScheduledNewsletterCampaigns
    });

    const response = await route.POST(
      new Request(
        "https://flamingfoodies.com/api/admin/newsletter-digest?mode=send_due",
        {
          method: "POST",
          headers: {
            authorization: "Bearer topsecret"
          }
        }
      )
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      requestMode: "send_due",
      mode: "mock",
      processed: 3,
      sent: 2,
      failures: 1
    });
    expect(createWeeklyDigest).not.toHaveBeenCalled();
    expect(processScheduledNewsletterCampaigns).toHaveBeenCalledTimes(1);
  });

  it("can draft and process due newsletters in one request", async () => {
    vi.stubEnv("CRON_SECRET", "topsecret");
    const createWeeklyDigest = vi.fn().mockResolvedValue({
      mode: "live",
      subject: "Weekend Heat",
      draftCount: 1
    });
    const processScheduledNewsletterCampaigns = vi.fn().mockResolvedValue({
      mode: "mock",
      processed: 2,
      sent: 2,
      failures: 0
    });
    const { route } = await importNewsletterRoute({
      createWeeklyDigest,
      processScheduledNewsletterCampaigns
    });

    const response = await route.POST(
      new Request(
        "https://flamingfoodies.com/api/admin/newsletter-digest?mode=draft_and_send_due",
        {
          method: "POST",
          headers: {
            authorization: "Bearer topsecret"
          }
        }
      )
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      requestMode: "draft_and_send_due",
      digest: {
        mode: "live",
        subject: "Weekend Heat",
        draftCount: 1
      },
      sending: {
        mode: "mock",
        processed: 2,
        sent: 2,
        failures: 0
      }
    });
    expect(createWeeklyDigest).toHaveBeenCalledTimes(1);
    expect(processScheduledNewsletterCampaigns).toHaveBeenCalledTimes(1);
  });
});

describe("content generation cron route", () => {
  it("rejects unauthorized GET requests when CRON_SECRET is set", async () => {
    vi.stubEnv("CRON_SECRET", "topsecret");
    const { route, runGenerationPipeline } = await importGenerateRoute();

    const response = await route.GET(
      new Request("https://flamingfoodies.com/api/admin/generate?type=recipe")
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false, error: "Unauthorized" });
    expect(runGenerationPipeline).not.toHaveBeenCalled();
  });

  it("runs scheduled generation through GET when authorized", async () => {
    vi.stubEnv("CRON_SECRET", "topsecret");
    const runGenerationPipeline = vi.fn().mockResolvedValue({
      mode: "live",
      createdJobs: [{ id: 12, type: "recipe", slug: "daily-fire-noodles" }]
    });
    const { route } = await importGenerateRoute({
      runGenerationPipeline
    });

    const response = await route.GET(
      new Request("https://flamingfoodies.com/api/admin/generate?type=recipe", {
        headers: {
          authorization: "Bearer topsecret"
        }
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      mode: "live",
      createdJobs: [{ id: 12, type: "recipe", slug: "daily-fire-noodles" }]
    });
    expect(runGenerationPipeline).toHaveBeenCalledWith("recipe", undefined, {
      source: "cron"
    });
  });

  it("passes the hot sauce recipe profile through cron requests", async () => {
    vi.stubEnv("CRON_SECRET", "topsecret");
    const runGenerationPipeline = vi.fn().mockResolvedValue({
      mode: "live",
      createdJobs: [{ id: 15, type: "recipe", slug: "weekly-hot-sauce-recipe" }]
    });
    const { route } = await importGenerateRoute({
      runGenerationPipeline
    });

    const response = await route.GET(
      new Request(
        "https://flamingfoodies.com/api/admin/generate?type=recipe&qty=1&profile=hot_sauce_recipe",
        {
          headers: {
            authorization: "Bearer topsecret"
          }
        }
      )
    );

    expect(response.status).toBe(200);
    expect(runGenerationPipeline).toHaveBeenCalledWith("recipe", 1, {
      source: "cron",
      profile: "hot_sauce_recipe"
    });
  });

  it("runs daily shop-pick automation through the same cron route", async () => {
    vi.stubEnv("CRON_SECRET", "topsecret");
    const runShopPickAutomation = vi.fn().mockResolvedValue({
      mode: "catalog",
      createdJobs: [{ id: 21, type: "merch_product", slug: "shop-pick-amazon-yellowbird-habanero" }]
    });
    const { route, runGenerationPipeline } = await importGenerateRoute({
      runShopPickAutomation
    });

    const response = await route.GET(
      new Request("https://flamingfoodies.com/api/admin/generate?type=merch_product&qty=1", {
        headers: {
          authorization: "Bearer topsecret"
        }
      })
    );

    expect(response.status).toBe(200);
    expect(runShopPickAutomation).toHaveBeenCalledWith(1, {
      source: "cron"
    });
    expect(runGenerationPipeline).not.toHaveBeenCalled();
  });
});

describe("growth loop cron route", () => {
  it("rejects unauthorized requests when CRON_SECRET is set", async () => {
    vi.stubEnv("CRON_SECRET", "topsecret");
    const { route, queueGrowthLoopPromotions } = await importGrowthLoopRoute();

    const response = await route.GET(
      new Request("https://flamingfoodies.com/api/admin/growth-loop")
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false, error: "Unauthorized" });
    expect(queueGrowthLoopPromotions).not.toHaveBeenCalled();
  });

  it("queues winner promotions when authorized", async () => {
    vi.stubEnv("CRON_SECRET", "topsecret");
    const queueGrowthLoopPromotions = vi.fn().mockResolvedValue({
      mode: "mock",
      windowDays: 30,
      candidatesConsidered: 2,
      queuedContent: 1,
      queuedPosts: 3,
      promoted: [
        {
          title: "Yellowbird Habanero Review",
          path: "/reviews/yellowbird-habanero-hot-sauce-review",
          contentType: "review",
          reason: "Already converts.",
          postsCreated: 3
        }
      ],
      skipped: []
    });
    const { route } = await importGrowthLoopRoute({
      queueGrowthLoopPromotions
    });

    const response = await route.POST(
      new Request("https://flamingfoodies.com/api/admin/growth-loop", {
        method: "POST",
        headers: {
          authorization: "Bearer topsecret"
        }
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      mode: "mock",
      windowDays: 30,
      candidatesConsidered: 2,
      queuedContent: 1,
      queuedPosts: 3,
      promoted: [
        {
          title: "Yellowbird Habanero Review",
          path: "/reviews/yellowbird-habanero-hot-sauce-review",
          contentType: "review",
          reason: "Already converts.",
          postsCreated: 3
        }
      ],
      skipped: []
    });
    expect(queueGrowthLoopPromotions).toHaveBeenCalledWith(30);
  });
});

describe("social scheduler cron route", () => {
  it("fails closed when the cron secret is not configured", async () => {
    const { route, queueSocialScheduler } = await importSocialRoute();

    const response = await route.POST(
      new Request("https://flamingfoodies.com/api/admin/social-scheduler", {
        method: "POST"
      })
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      error: "CRON_SECRET is not configured"
    });
    expect(queueSocialScheduler).not.toHaveBeenCalled();
  });

  it("runs the scheduler when authorized", async () => {
    vi.stubEnv("CRON_SECRET", "shh");
    const { route, queueSocialScheduler } = await importSocialRoute({
      queueSocialScheduler: vi.fn().mockResolvedValue({
        queued: 4,
        published: 2,
        platforms: ["instagram", "facebook"]
      })
    });

    const response = await route.POST(
      new Request("https://flamingfoodies.com/api/admin/social-scheduler", {
        method: "POST",
        headers: {
          authorization: "Bearer shh"
        }
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      queued: 4,
      published: 2,
      platforms: ["instagram", "facebook"]
    });
    expect(queueSocialScheduler).toHaveBeenCalledTimes(1);
  });
});
