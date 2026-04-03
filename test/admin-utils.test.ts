import { describe, expect, it } from "vitest";

import { parseSettingValue } from "@/lib/admin-utils";

describe("parseSettingValue", () => {
  it("parses booleans and numbers", () => {
    expect(parseSettingValue("true")).toBe(true);
    expect(parseSettingValue("42")).toBe(42);
    expect(parseSettingValue("3.5")).toBe(3.5);
  });

  it("parses JSON objects and falls back to strings", () => {
    expect(parseSettingValue('{"enabled":true}')).toEqual({ enabled: true });
    expect(parseSettingValue("caption template")).toBe("caption template");
  });
});
