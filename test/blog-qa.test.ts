import { describe, expect, it } from "vitest";

import { buildBlogQaReport } from "@/lib/blog-qa";
import type { BlogPost } from "@/lib/types";

function makeBlogPost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: 1,
    type: "blog",
    slug: "starter-hot-sauce-guide",
    title: "How to Build a Better Starter Hot Sauce Shelf at Home",
    description:
      "A practical guide to building a useful hot sauce shelf with everyday bottles, a few specialty picks, and enough range to cover tacos, eggs, pizza, and wings.",
    authorName: "FlamingFoodies AI Desk",
    category: "guides",
    content: [
      "Intro paragraph about what makes a useful hot sauce shelf and why random bottle buying usually leads to clutter. A strong starter shelf should make weekday cooking easier, not just impress people on social media. The point is range, repeat use, and enough contrast that each bottle solves a different problem in the kitchen.",
      "## Start with an everyday bottle",
      "Choose something balanced enough for tacos, eggs, roasted vegetables, and quick lunches. The goal is frequency, not bravado. If the bottle only works on one food or only feels exciting when you want punishment-level heat, it probably does not deserve the first slot on the shelf. A good everyday sauce has enough acid to wake up rich food, enough pepper flavor to feel intentional, and enough restraint that you can use it more than once in a day without fatigue.",
      "## Add one brighter sauce",
      "A brighter, tangier sauce helps keep fried foods, seafood, and grain bowls from tasting heavy. Think about acidity as much as heat. This is the bottle that rescues leftovers, sharpens brunch, and keeps fried foods from turning dull. On a starter shelf, brightness matters because not every problem is solved by moving up the Scoville ladder. Sometimes the right answer is a more vivid sauce, not a harsher one.",
      "- Look for vinegar balance",
      "- Look for pepper clarity",
      "- Look for repeat-use versatility",
      "## Save the heavy hitter for specific nights",
      "A high-heat bottle should still be useful. It needs enough flavor to justify its shelf space and enough focus to fit specific meals. This is where a lot of new buyers go wrong: they buy the loudest bottle first, then discover it only makes sense when they specifically want to show off. A better heavy hitter has purpose. It might be a wings-night sauce, a pizza sauce, or a grilling sauce with a clean pepper finish. The heat can be serious, but the bottle still needs a real lane in the kitchen.",
      "## Build around actual cooking habits",
      "If you cook breakfast tacos, pizza, wings, or rice bowls more than anything else, buy for those lanes first and let the shelf expand from there. That is how a useful shelf forms. Instead of collecting random novelty bottles, you create a working set that maps to the foods you already cook. The starter shelf becomes much easier to maintain when every bottle earns its keep at least once a week.",
      "## What to buy first",
      "Start with the bottle you will use tonight, not the one that looks best in a lineup photo. Then add contrast: one everyday sauce, one brighter sauce, and one bigger-heat bottle with a clear purpose. That three-bottle framework covers more real meals than most overbuilt collections. Once you know which foods you reach for most, the next additions become obvious instead of impulsive.",
      "Wrap up with a practical paragraph that helps the reader decide what to buy first and why. The best starter hot sauce shelf is not the hottest shelf. It is the one that makes breakfast, lunch, dinner, and takeout leftovers more fun to eat all week long."
    ].join("\n\n"),
    imageUrl: "https://flamingfoodies.com/api/og?title=Starter+Shelf",
    imageAlt: "FlamingFoodies story card for starter hot sauce shelf",
    featured: false,
    source: "ai_generated",
    status: "draft",
    publishedAt: undefined,
    tags: ["hot-sauce", "starter-kit", "shopping"],
    viewCount: 0,
    likeCount: 0,
    seoTitle: "How to Build a Better Starter Hot Sauce Shelf | FlamingFoodies",
    seoDescription:
      "Build a smarter starter hot sauce shelf with everyday bottles, brighter sauces, and one serious heat option that actually earns its place.",
    cuisineType: "other",
    heatLevel: "medium",
    scovilleRating: 6,
    readTimeMinutes: 6,
    ...overrides
  };
}

describe("buildBlogQaReport", () => {
  it("passes a structured, useful blog draft", () => {
    const report = buildBlogQaReport(makeBlogPost());

    expect(report.blockers).toHaveLength(0);
    expect(report.score).toBeGreaterThanOrEqual(85);
  });

  it("blocks thin blog drafts with weak structure", () => {
    const report = buildBlogQaReport(
      makeBlogPost({
        content:
          "This is a very short post.\n\n## One section\n\nAs an AI, I think heat is subjective.",
        tags: ["hot-sauce"]
      })
    );

    expect(report.blockers.some((issue) => issue.code === "blog-word-count")).toBe(true);
    expect(report.blockers.some((issue) => issue.code === "blog-structure")).toBe(true);
    expect(report.blockers.some((issue) => issue.code === "blog-ai-disclosure")).toBe(true);
  });

  it("warns when blog voice relies on formulaic content phrases", () => {
    const report = buildBlogQaReport(
      makeBlogPost({
        description:
          "A guide packed with flavor and perfect for busy weeknights, built to take your shelf to the next level.",
        content: [
          "This guide is packed with flavor and perfect for busy weeknights.",
          "## Start here",
          "Whether you're just getting started or looking for something new, this shelf takes things to the next level in all the right ways.",
          "## Keep it practical",
          "The result is a setup that comes together quickly and gives you bottles you'll love.",
          "- One everyday bottle",
          "- One brighter bottle",
          "- One bigger heat bottle",
          "## Buy with purpose",
          "Instead of random shopping, buy around the foods you actually cook."
        ].join("\n\n")
      })
    );

    expect(report.warnings.some((issue) => issue.code === "blog-formulaic-voice")).toBe(true);
  });
});
