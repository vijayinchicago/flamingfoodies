import { describe, expect, it } from "vitest";

import { buildSocialCaption, buildSocialHashtags } from "@/lib/services/social";

describe("social captions", () => {
  it("writes recipe captions in a warm family-table voice", () => {
    const caption = buildSocialCaption({
      title: "Naga Chicken Curry",
      contentType: "recipe",
      platform: "instagram"
    });

    expect(caption).toContain("mixed table");
    expect(caption).toContain("Save it");
    expect(caption).not.toContain("Bring your appetite");
  });

  it("writes review captions around product usefulness instead of generic launch copy", () => {
    const caption = buildSocialCaption({
      title: "Yellowbird Habanero review",
      contentType: "review",
      platform: "facebook"
    });

    expect(caption).toContain("Yellowbird Habanero");
    expect(caption).toContain("what the bottle actually tastes like");
    expect(caption).not.toContain("is up on FlamingFoodies");
  });

  it("builds stable content-aware hashtags", () => {
    const hashtags = buildSocialHashtags("How to Build a Better Starter Hot Sauce Shelf", "blog_post");

    expect(hashtags).toContain("#flamingfoodies");
    expect(hashtags).toContain("#hotsauceguide");
    expect(new Set(hashtags).size).toBe(hashtags.length);
  });
});
