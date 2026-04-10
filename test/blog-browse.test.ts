import { describe, expect, it } from "vitest";

import {
  filterBlogPosts,
  getBlogBrowseOptions,
  paginateBlogPosts,
  sortBlogPosts
} from "@/lib/blog-browse";
import type { BlogPost } from "@/lib/types";

const posts: BlogPost[] = [
  {
    id: 1,
    type: "blog",
    slug: "hot-sauces-for-tacos",
    title: "How to Choose a Hot Sauce for Tacos",
    description: "A taco-night shelf guide.",
    imageUrl: "",
    imageAlt: "",
    featured: true,
    source: "editorial",
    status: "published",
    publishedAt: "2026-04-07T12:00:00.000Z",
    tags: ["tacos", "buying guide"],
    viewCount: 20,
    likeCount: 0,
    authorName: "FlamingFoodies",
    category: "guides",
    content: "Taco night deserves a brighter, spoonable sauce.",
    cuisineType: "mexican",
    heatLevel: "medium",
    readTimeMinutes: 5
  },
  {
    id: 2,
    type: "blog",
    slug: "ethiopian-spice-blends",
    title: "Why Ethiopian Spice Blends Are Having Their Moment Right Now",
    description: "A deeper culture story.",
    imageUrl: "",
    imageAlt: "",
    featured: false,
    source: "editorial",
    status: "published",
    publishedAt: "2026-04-09T12:00:00.000Z",
    tags: ["culture", "berbere"],
    viewCount: 10,
    likeCount: 0,
    authorName: "FlamingFoodies",
    category: "culture",
    content: "Berbere and mitmita are landing with home cooks for good reason.",
    cuisineType: "ethiopian",
    heatLevel: "hot",
    readTimeMinutes: 7
  }
];

describe("blog browse helpers", () => {
  it("collects category, cuisine, and heat browse options", () => {
    const options = getBlogBrowseOptions(posts);
    expect(options.categories).toEqual(["culture", "guides"]);
    expect(options.cuisines).toEqual(["ethiopian", "mexican"]);
    expect(options.heatLevels).toEqual(["medium", "hot"]);
  });

  it("filters blog posts by query and cuisine", () => {
    const result = filterBlogPosts(posts, {
      query: "berbere",
      cuisine: "ethiopian"
    });

    expect(result.map((post) => post.slug)).toEqual(["ethiopian-spice-blends"]);
  });

  it("sorts and paginates blog posts", () => {
    const sorted = sortBlogPosts(posts, "newest");
    expect(sorted[0]?.slug).toBe("ethiopian-spice-blends");

    const paginated = paginateBlogPosts(sorted, 1, 1);
    expect(paginated.items).toHaveLength(1);
    expect(paginated.totalPages).toBe(2);
  });
});
