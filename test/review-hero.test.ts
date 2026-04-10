import { describe, expect, it } from "vitest";

import {
  buildReviewHeroImageAlt,
  buildReviewProductImageAlt,
  getReviewHeroFields,
  hasTrustedReviewProductImage,
  isGeneratedReviewHeroCardImageUrl,
  isLikelyGenericStockReviewImageUrl
} from "@/lib/review-hero";

describe("review hero fallbacks", () => {
  it("replaces generic stock hot sauce imagery with a branded review card", () => {
    const hero = getReviewHeroFields({
      title: "Yellowbird Habanero Hot Sauce Review",
      productName: "Yellowbird Habanero Hot Sauce",
      brand: "Yellowbird",
      category: "hot-sauce",
      heatLevel: "hot",
      imageUrl: "https://images.unsplash.com/photo-123",
      imageAlt: "Orange bottle near tacos"
    });

    expect(hero.imageUrl).toContain("/api/review-hero?");
    expect(hero.imageUrl).toContain("Yellowbird+Habanero+Hot+Sauce");
    expect(hero.usesGeneratedHeroCard).toBe(true);
    expect(hero.imageAlt).toBe(
      buildReviewHeroImageAlt(
        "Yellowbird Habanero Hot Sauce Review",
        "Yellowbird Habanero Hot Sauce"
      )
    );
  });

  it("preserves a trusted review image while backfilling alt text", () => {
    const hero = getReviewHeroFields({
      title: "Torchbearer Garlic Reaper Review",
      productName: "Torchbearer Garlic Reaper",
      brand: "Torchbearer",
      category: "hot-sauce",
      heatLevel: "reaper",
      imageUrl: "https://cdn.example.com/torchbearer-bottle.jpg",
      imageAlt: ""
    });

    expect(hero.imageUrl).toBe("https://cdn.example.com/torchbearer-bottle.jpg");
    expect(hero.usesGeneratedHeroCard).toBe(false);
    expect(hero.usesTrustedProductImage).toBe(true);
    expect(hero.imageAlt).toBe(
      buildReviewProductImageAlt("Torchbearer Garlic Reaper", "Torchbearer")
    );
  });

  it("detects stock-photo providers and generated review cards correctly", () => {
    expect(isLikelyGenericStockReviewImageUrl("https://images.unsplash.com/photo-123")).toBe(
      true
    );
    expect(
      isGeneratedReviewHeroCardImageUrl(
        "https://flamingfoodies.com/api/review-hero?title=Yellowbird"
      )
    ).toBe(true);
    expect(hasTrustedReviewProductImage("https://cdn.example.com/product.jpg")).toBe(true);
    expect(isLikelyGenericStockReviewImageUrl("https://cdn.example.com/product.jpg")).toBe(
      false
    );
  });
});
