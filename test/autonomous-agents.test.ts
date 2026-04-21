import { describe, expect, it } from "vitest";

import { getAutonomousAgents } from "@/lib/autonomous-agents";

describe("autonomous agents", () => {
  it("marks the full autonomous stack live when publishing and distribution are configured", () => {
    const agents = getAutonomousAgents({
      autoPublishEnabled: true,
      hasBuffer: true,
      hasPinterestProfile: true,
      hasConvertKit: true,
      hasSearchConsole: true,
      hasAnthropic: true,
      hasSupabaseAdmin: true
    });

    expect(agents.every((agent) => agent.status === "live")).toBe(true);
    expect(agents.find((agent) => agent.id === "content-shop-sync")?.isSupport).toBe(true);
  });

  it("flags the right missing dependencies when config is incomplete", () => {
    const agents = getAutonomousAgents({
      autoPublishEnabled: false,
      hasBuffer: false,
      hasPinterestProfile: false,
      hasConvertKit: false,
      hasSearchConsole: false,
      hasAnthropic: false,
      hasSupabaseAdmin: false
    });

    expect(agents.find((agent) => agent.id === "editorial-autopublisher")?.status).toBe(
      "needs_config"
    );
    expect(agents.find((agent) => agent.id === "pinterest-distributor")?.status).toBe(
      "needs_config"
    );
    expect(agents.find((agent) => agent.id === "growth-loop-promoter")?.status).toBe(
      "needs_config"
    );
    expect(agents.find((agent) => agent.id === "shop-shelf-curator")?.status).toBe(
      "needs_config"
    );
    expect(agents.find((agent) => agent.id === "newsletter-digest-agent")?.status).toBe(
      "needs_config"
    );
    expect(agents.find((agent) => agent.id === "search-insights-analyst")?.status).toBe(
      "needs_config"
    );
    expect(agents.find((agent) => agent.id === "search-recommendation-executor")?.status).toBe(
      "needs_config"
    );
    expect(agents.find((agent) => agent.id === "festival-discovery")?.status).toBe(
      "needs_config"
    );
    expect(agents.find((agent) => agent.id === "brand-discovery")?.autonomyMode).toBe(
      "draft_only"
    );
    expect(agents.find((agent) => agent.id === "release-monitor")?.autonomyMode).toBe(
      "approval_required"
    );
    expect(agents.some((agent) => agent.id === "brand-monitor")).toBe(false);
    expect(agents.find((agent) => agent.id === "content-shop-sync")?.isSupport).toBe(true);
  });
});
