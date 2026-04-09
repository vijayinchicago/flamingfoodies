import { describe, expect, it } from "vitest";

import { getBlogHeroFields, isGeneratedBlogHeroImageUrl } from "@/lib/blog-hero";

describe("blog hero helpers", () => {
  it("builds a branded fallback cover when a blog post has no stored image", () => {
    const hero = getBlogHeroFields({
      title: "Why Ethiopian Heat Is Having a Moment",
      category: "culture",
      cuisineType: "ethiopian",
      heatLevel: "hot",
      imageUrl: undefined,
      imageAlt: undefined
    });

    expect(hero.imageUrl).toContain("/api/og?");
    expect(hero.imageAlt).toContain("Why Ethiopian Heat Is Having a Moment");
    expect(hero.usesGeneratedHeroCard).toBe(true);
  });

  it("preserves a sourced image when one already exists", () => {
    const hero = getBlogHeroFields({
      title: "A story with a real photo",
      category: "guides",
      cuisineType: "other",
      heatLevel: "medium",
      imageUrl: "https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg",
      imageAlt: "A bowl of fiery stew"
    });

    expect(hero.imageUrl).toBe("https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg");
    expect(hero.imageAlt).toBe("A bowl of fiery stew");
    expect(hero.usesGeneratedHeroCard).toBe(false);
  });

  it("detects generated blog hero cards", () => {
    expect(isGeneratedBlogHeroImageUrl("https://flamingfoodies.com/api/og?title=Hello")).toBe(true);
  });
});
