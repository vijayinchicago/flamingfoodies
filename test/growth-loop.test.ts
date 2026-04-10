import { describe, expect, it } from "vitest";

import { buildGrowthLoopReport, getGrowthLoopContentTypeFromPath } from "@/lib/growth-loop";

describe("growth loop helpers", () => {
  it("detects promotable content types from public paths", () => {
    expect(getGrowthLoopContentTypeFromPath("/recipes/naga-chicken-curry")).toBe("recipe");
    expect(getGrowthLoopContentTypeFromPath("/blog/hot-sauce-shelf")).toBe("blog_post");
    expect(getGrowthLoopContentTypeFromPath("/reviews/yellowbird-review")).toBe("review");
    expect(getGrowthLoopContentTypeFromPath("/hot-sauces/best")).toBeNull();
  });

  it("builds winner lists, briefs, and promotion candidates from live signals", () => {
    const report = buildGrowthLoopReport({
      windowDays: 30,
      trafficPages: [
        {
          label: "Best Hot Sauces for Tacos",
          path: "/hot-sauces/best-for-tacos",
          section: "hot-sauces",
          views: 140
        },
        {
          label: "Naga Chicken Curry",
          path: "/recipes/naga-chicken-curry",
          section: "recipes",
          views: 92
        },
        {
          label: "Yellowbird Habanero Review",
          path: "/reviews/yellowbird-habanero-hot-sauce-review",
          section: "reviews",
          views: 75
        }
      ],
      contentPages: [
        {
          label: "Naga Chicken Curry",
          path: "/recipes/naga-chicken-curry",
          source: "flamingfoodies",
          views: 92,
          saves: 7,
          ratings: 3,
          comments: 1,
          interactions: 11
        },
        {
          label: "Yellowbird Habanero Review",
          path: "/reviews/yellowbird-habanero-hot-sauce-review",
          source: "flamingfoodies",
          views: 75,
          saves: 0,
          ratings: 0,
          comments: 2,
          interactions: 2
        }
      ],
      sharePages: [
        {
          label: "Naga Chicken Curry",
          path: "/recipes/naga-chicken-curry",
          contentType: "recipe",
          shares: 9
        }
      ],
      shareLandingPages: [
        {
          path: "/hot-sauces/best-for-tacos",
          count: 4
        }
      ],
      affiliatePages: [
        {
          path: "/reviews/yellowbird-habanero-hot-sauce-review",
          clicks: 8
        },
        {
          path: "/hot-sauces/best-for-tacos",
          clicks: 5
        }
      ]
    });

    expect(report.winners.acquisition[0]?.path).toBe("/hot-sauces/best-for-tacos");
    expect(report.winners.activation[0]?.path).toBe("/recipes/naga-chicken-curry");
    expect(report.winners.referral[0]?.path).toBe("/recipes/naga-chicken-curry");
    expect(report.winners.revenue[0]?.path).toBe(
      "/reviews/yellowbird-habanero-hot-sauce-review"
    );
    expect(report.briefs[0]?.title).toContain("Double down on");
    expect(report.autoPromotionCandidates[0]?.path).toBe(
      "/reviews/yellowbird-habanero-hot-sauce-review"
    );
  });
});
