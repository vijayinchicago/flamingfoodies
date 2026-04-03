import { describe, expect, it } from "vitest";

import { extractKitBroadcastId } from "@/lib/services/newsletter";
import { parseBufferProfileIds } from "@/lib/services/social";

describe("provider utilities", () => {
  it("extracts Kit broadcast ids from nested and flat payloads", () => {
    expect(extractKitBroadcastId({ broadcast: { id: 42 } })).toBe("42");
    expect(extractKitBroadcastId({ id: "abc123" })).toBe("abc123");
    expect(extractKitBroadcastId({})).toBeUndefined();
  });

  it("parses buffer profile mappings with explicit and fallback entries", () => {
    const result = parseBufferProfileIds("instagram:ig-1,facebook:fb-2,shared-3");

    expect(result.get("instagram")).toEqual(["ig-1"]);
    expect(result.get("facebook")).toEqual(["fb-2"]);
    expect(result.get("all")).toEqual(["shared-3"]);
  });
});
