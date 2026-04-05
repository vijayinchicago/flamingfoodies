import { describe, expect, it } from "vitest";

import {
  buildArticleStructuredData,
  buildFaqStructuredData,
  buildItemListStructuredData,
  buildRecipeStructuredData
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

  it("builds recipe structured data with cuisine, keywords, and step urls", () => {
    const schema = buildRecipeStructuredData({
      id: 1,
      type: "recipe",
      slug: "birria-quesatacos",
      title: "Birria Quesatacos",
      description: "Chile-rich tacos with crisp edges and melty cheese.",
      intro: "A deeply savory taco project with consome on the side.",
      heroSummary: "Crisp tacos, melty cheese, and rich chile broth.",
      authorName: "FlamingFoodies Test Kitchen",
      heatLevel: "hot",
      cuisineType: "mexican",
      prepTimeMinutes: 35,
      cookTimeMinutes: 180,
      totalTimeMinutes: 215,
      activeTimeMinutes: 45,
      servings: 6,
      difficulty: "intermediate",
      ingredients: [
        { amount: "3", unit: "lb", item: "beef chuck roast" },
        { amount: "8", unit: "", item: "corn tortillas" }
      ],
      ingredientSections: [
        {
          title: "For the tacos",
          items: [
            { amount: "3", unit: "lb", item: "beef chuck roast" },
            { amount: "8", unit: "", item: "corn tortillas" }
          ]
        }
      ],
      instructions: [
        { step: 1, text: "Braise the beef until shreddable." },
        { step: 2, text: "Dip tortillas and griddle with beef and cheese." }
      ],
      methodSteps: [
        {
          step: 1,
          title: "Braise the beef",
          body: "Cook the beef in the chile broth until tender enough to shred.",
          imageUrl: "https://flamingfoodies.com/images/birria-step-1.jpg"
        },
        {
          step: 2,
          title: "Griddle the tacos",
          body: "Dip tortillas in broth, then griddle with shredded beef and cheese."
        }
      ],
      tips: ["Make the birria a day ahead."],
      variations: ["Use lamb shoulder for a richer version."],
      equipment: ["Dutch oven", "griddle"],
      tags: ["tacos", "birria", "weekend"],
      imageUrl: "https://flamingfoodies.com/images/birria.jpg",
      imageAlt: "Birria quesatacos with consome",
      featured: false,
      source: "editorial",
      status: "published",
      publishedAt: "2026-04-04T00:00:00.000Z",
      viewCount: 0,
      likeCount: 0,
      ratingCount: 12,
      ratingAvg: 4.8,
      saveCount: 4
    });

    expect(schema["@type"]).toBe("Recipe");
    expect(schema.recipeCuisine).toBe("Mexican");
    expect(schema.keywords).toContain("tacos");
    expect(schema.recipeInstructions[0]?.url).toContain("#recipe-step-1");
    expect(schema.recipeInstructions[0]?.image).toContain("birria-step-1.jpg");
    expect(schema.recipeInstructions[1]?.image).toContain("/api/og?");
  });
});
