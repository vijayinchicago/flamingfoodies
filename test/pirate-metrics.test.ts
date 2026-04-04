import { describe, expect, it } from "vitest";

import { buildPirateMetrics, classifyAcquisitionSource, isSocialSource } from "@/lib/pirate-metrics";
import { ANALYTICS_EVENTS } from "@/lib/telemetry-events";

describe("pirate metrics helpers", () => {
  it("classifies acquisition sources from utm and referrer", () => {
    expect(
      classifyAcquisitionSource({
        utmSource: "newsletter",
        referrer: "https://google.com"
      })
    ).toBe("newsletter");

    expect(
      classifyAcquisitionSource({
        referrer: "https://www.pinterest.com/pin/123"
      })
    ).toBe("pinterest");
  });

  it("detects social sources", () => {
    expect(isSocialSource("pinterest")).toBe(true);
    expect(isSocialSource("whatsapp")).toBe(true);
    expect(isSocialSource("google")).toBe(false);
  });

  it("builds pirate metrics from telemetry and affiliate click rows", () => {
    const metrics = buildPirateMetrics(
      [
        {
          eventName: ANALYTICS_EVENTS.pageView,
          anonymousId: "anon-1",
          sessionId: "session-1",
          path: "/recipes/birria",
          referrer: "https://www.pinterest.com/pin/123",
          occurredAt: "2026-04-04T10:00:00.000Z"
        },
        {
          eventName: ANALYTICS_EVENTS.emailSignup,
          anonymousId: "anon-1",
          sessionId: "session-1",
          path: "/recipes/birria",
          occurredAt: "2026-04-04T10:03:00.000Z"
        },
        {
          eventName: ANALYTICS_EVENTS.pageView,
          anonymousId: "anon-1",
          sessionId: "session-2",
          path: "/reviews/hot-sauce",
          occurredAt: "2026-04-05T12:00:00.000Z"
        }
      ],
      [{ partner: "amazon", clickedAt: "2026-04-05T12:05:00.000Z" }],
      30
    );

    expect(metrics.acquisition.visitors).toBe(1);
    expect(metrics.acquisition.sessions).toBe(2);
    expect(metrics.activation.emailSignups).toBe(1);
    expect(metrics.retention.returningVisitors).toBe(1);
    expect(metrics.referral.socialSessions).toBe(1);
    expect(metrics.revenue.affiliateClicks).toBe(1);
  });
});
