import { describe, expect, it } from "vitest";

import {
  buildArticleStructuredData,
  buildFaqStructuredData,
  buildItemListStructuredData
} from "@/lib/structured-data";

describe("structured data builders", () => {
  it("builds article structured data for blog posts", () => {
    const schema = buildArticleStructuredData({
      id: 1,
      type: "blog",
      slug: "test-post",
      title: "Test Post",
      description: "A sharp post about spicy food systems.",
      source: "editorial",
      status: "published",
      tags: ["korean", "heat"],
      viewCount: 0,
      likeCount: 0,
      authorName: "Mara Santiago",
      category: "guides",
      content: "This is a test body with enough words to count.",
      publishedAt: "2026-04-04T00:00:00.000Z"
    });

    expect(schema["@type"]).toBe("BlogPosting");
    expect(schema.mainEntityOfPage).toContain("/blog/test-post");
    expect(schema.keywords).toBe("korean, heat");
    expect(schema.wordCount).toBeGreaterThan(5);
  });

  it("builds faq structured data only when faqs exist", () => {
    const schema = buildFaqStructuredData([
      {
        question: "Can I make this ahead?",
        answer: "Yes, and it improves overnight."
      }
    ]);

    expect(schema?.["@type"]).toBe("FAQPage");
    expect(schema?.mainEntity).toHaveLength(1);
    expect(buildFaqStructuredData([])).toBeNull();
  });

  it("builds item list structured data for index pages", () => {
    const schema = buildItemListStructuredData("Recipe archive", [
      {
        name: "Birria Quesatacos",
        url: "https://flamingfoodies.com/recipes/birria",
        image: "https://flamingfoodies.com/images/birria.jpg"
      }
    ]);

    expect(schema["@type"]).toBe("ItemList");
    expect(schema.itemListElement[0]?.position).toBe(1);
    expect(schema.itemListElement[0]?.url).toContain("/recipes/birria");
  });
});
