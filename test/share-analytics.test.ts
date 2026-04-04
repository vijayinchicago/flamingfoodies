import { describe, expect, it } from "vitest";

import { buildShareAnalytics } from "@/lib/share-analytics";

describe("share analytics", () => {
  it("aggregates share events and share-attributed traffic", () => {
    const analytics = buildShareAnalytics([
      {
        eventName: "recipe_share",
        path: "/recipes/birria-quesatacos-with-arbol-salsa",
        contentType: "recipe",
        contentSlug: "birria-quesatacos-with-arbol-salsa",
        sessionId: "share-session-1",
        occurredAt: "2026-04-03T12:00:00.000Z",
        metadata: {
          platform: "pinterest",
          shareAction: "saved_image"
        }
      },
      {
        eventName: "recipe_share",
        path: "/blog/best-hot-sauces-for-taco-night",
        contentType: "blog_post",
        contentSlug: "best-hot-sauces-for-taco-night",
        sessionId: "share-session-2",
        occurredAt: "2026-04-03T13:00:00.000Z",
        metadata: {
          platform: "copy",
          shareAction: "copied"
        }
      },
      {
        eventName: "page_view",
        path: "/recipes/birria-quesatacos-with-arbol-salsa",
        sessionId: "landing-session-1",
        occurredAt: "2026-04-04T10:00:00.000Z",
        utmSource: "pinterest",
        utmCampaign: "organic_share"
      },
      {
        eventName: "page_view",
        path: "/recipes/birria-quesatacos-with-arbol-salsa",
        sessionId: "landing-session-1",
        occurredAt: "2026-04-04T10:05:00.000Z",
        utmSource: "pinterest",
        utmCampaign: "organic_share"
      }
    ]);

    expect(analytics.totals.shareEvents).toBe(2);
    expect(analytics.totals.shareAttributedSessions).toBe(1);
    expect(analytics.totals.shareAttributedPageViews).toBe(2);
    expect(analytics.totals.copyShares).toBe(1);
    expect(analytics.totals.pinterestSaves).toBe(1);
    expect(analytics.platforms[0]).toEqual({ platform: "pinterest", count: 1 });
    expect(analytics.actions.some((item) => item.action === "saved_image")).toBe(true);
    expect(analytics.topContent[0]?.path).toBe("/recipes/birria-quesatacos-with-arbol-salsa");
    expect(analytics.shareTrafficSources[0]).toEqual({ source: "pinterest", count: 1 });
  });
});
