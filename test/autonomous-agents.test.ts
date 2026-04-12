import { describe, expect, it } from "vitest";

import { getAutonomousAgents } from "@/lib/autonomous-agents";

describe("autonomous agents", () => {
  it("marks the full autonomous stack live when publishing and distribution are configured", () => {
    const agents = getAutonomousAgents({
      autoPublishEnabled: true,
      hasBuffer: true,
      hasPinterestProfile: true,
      hasConvertKit: true
    });

    expect(agents.every((agent) => agent.status === "live")).toBe(true);
  });

  it("flags the right missing dependencies when config is incomplete", () => {
    const agents = getAutonomousAgents({
      autoPublishEnabled: false,
      hasBuffer: false,
      hasPinterestProfile: false,
      hasConvertKit: false
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
    expect(agents.find((agent) => agent.id === "shop-shelf-curator")?.status).toBe("live");
    expect(agents.find((agent) => agent.id === "newsletter-digest-agent")?.status).toBe(
      "needs_config"
    );
  });
});
