import { describe, expect, it } from "vitest";

import { calculateReadTime, slugify } from "@/lib/utils";

describe("utils", () => {
  it("slugifies titles into URL-safe strings", () => {
    expect(slugify("Spicy Korean Gochujang Noodles!!!")).toBe(
      "spicy-korean-gochujang-noodles"
    );
  });

  it("calculates a minimum read time of one minute", () => {
    expect(calculateReadTime("heat")).toBe(1);
  });
});
