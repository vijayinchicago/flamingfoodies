import { describe, expect, it } from "vitest";

import { buildShareUrls } from "@/lib/share";

describe("share url builders", () => {
  it("adds tracking params to shared destinations", () => {
    const shareUrls = buildShareUrls({
      url: "https://flamingfoodies.com/recipes/birria-quesatacos-with-arbol-salsa",
      title: "Birria Quesatacos with Arbol Salsa",
      description: "A deep chile-braised taco project with a bright finish.",
      imageUrl: "https://flamingfoodies.com/images/birria.jpg"
    });

    expect(shareUrls.tracked.facebook).toContain("utm_source=facebook");
    expect(shareUrls.tracked.facebook).toContain("utm_medium=social");
    expect(shareUrls.tracked.facebook).toContain("utm_campaign=organic_share");
    expect(shareUrls.network.pinterest).toContain("media=https%3A%2F%2Fflamingfoodies.com%2Fimages%2Fbirria.jpg");
    expect(shareUrls.network.x).toContain("twitter.com/intent/tweet");
    expect(shareUrls.network.whatsapp).toContain("utm_source%3Dwhatsapp");
  });

  it("keeps existing query params while adding share tracking", () => {
    const shareUrls = buildShareUrls({
      url: "https://flamingfoodies.com/reviews/hot-ones?ref=nav",
      title: "Hot Ones review"
    });

    expect(shareUrls.tracked.x).toContain("ref=nav");
    expect(shareUrls.tracked.x).toContain("utm_source=x");
  });
});
