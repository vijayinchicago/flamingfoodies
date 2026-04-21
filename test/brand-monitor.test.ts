import { describe, expect, it } from "vitest";

import { buildReleaseApprovalSubjectKey } from "@/lib/services/brand-monitor";

describe("release monitor approval keys", () => {
  it("builds stable keys from brand, title, and release type", () => {
    expect(
      buildReleaseApprovalSubjectKey({
        title: "Zombie Apocalypse: Reaper Reserve",
        brand: "Torchbearer Sauces",
        type: "limited-edition"
      })
    ).toBe("torchbearer-sauces:zombie-apocalypse-reaper-reserve:limited-edition");
  });
});
