import { describe, expect, it } from "vitest";

import {
  EDITORIAL_PERSONA_DISCLOSURE,
  buildAuthorProfileStructuredData,
  buildAuthorStructuredData,
  getAllPublicAuthors,
  resolveEditorialAuthorName
} from "@/lib/authors";

describe("editorial author assignments", () => {
  it("assigns reviews and commercial guides to the reviews editor", () => {
    expect(
      resolveEditorialAuthorName({
        type: "review",
        title: "A Hot Sauce Review",
        category: "hot-sauce"
      })
    ).toBe("Miles Hart");

    expect(
      resolveEditorialAuthorName({
        type: "blog",
        title: "How to Choose a Hot Sauce for Seafood",
        category: "guides",
        tags: ["buying guide"]
      })
    ).toBe("Miles Hart");
  });

  it("splits recipes between practical and technique-heavy lanes", () => {
    expect(
      resolveEditorialAuthorName({
        type: "recipe",
        title: "Quick Gochujang Noodles",
        difficulty: "beginner",
        totalTimeMinutes: 25,
        tags: ["weeknight"]
      })
    ).toBe("Tess Calder");

    expect(
      resolveEditorialAuthorName({
        type: "recipe",
        title: "Slow-Cooked Chile Braised Short Ribs",
        difficulty: "intermediate",
        totalTimeMinutes: 180,
        tags: ["project"]
      })
    ).toBe("Rowan Flint");
  });

  it("routes science to technique and culture to context", () => {
    expect(
      resolveEditorialAuthorName({
        type: "blog",
        title: "Why Capsaicin Feels Hot",
        category: "science"
      })
    ).toBe("Rowan Flint");

    expect(
      resolveEditorialAuthorName({
        type: "blog",
        title: "Three Spice Styles Making Every Home Cook Sweat in the Best Way",
        category: "culture"
      })
    ).toBe("Mara Santiago");
  });

  it("does not treat incidental commerce words as a buying-guide signal", () => {
    expect(
      resolveEditorialAuthorName({
        type: "blog",
        title: "The Best Way to Understand a Regional Chile Tradition",
        category: "culture"
      })
    ).toBe("Mara Santiago");
  });

  it("preserves a non-placeholder contributor byline", () => {
    expect(
      resolveEditorialAuthorName({
        type: "blog",
        title: "Guest Story",
        category: "culture",
        currentAuthorName: "Guest Contributor"
      })
    ).toBe("Guest Contributor");
  });
});

describe("editorial persona profiles", () => {
  it("publishes four explicitly disclosed profiles", () => {
    const authors = getAllPublicAuthors();

    expect(authors.map((author) => author.displayName)).toEqual([
      "Mara Santiago",
      "Tess Calder",
      "Rowan Flint",
      "Miles Hart"
    ]);
    expect(authors.every((author) => author.profileType === "editorial_persona")).toBe(true);
    expect(EDITORIAL_PERSONA_DISCLOSURE).toContain("editorial pen names");
  });

  it("links Person and ProfilePage structured data to the visible profile", () => {
    const author = getAllPublicAuthors()[1];
    const person = buildAuthorStructuredData(author.displayName);
    const profile = buildAuthorProfileStructuredData(author);

    expect(person["@type"]).toBe("Person");
    expect(person.url).toContain(`/authors/${author.slug}`);
    expect(person.description).toContain("editorial pen names");
    expect(profile["@type"]).toBe("ProfilePage");
    expect(profile.mainEntity).toEqual(person);
  });
});
