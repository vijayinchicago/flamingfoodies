// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { budgetedDatabaseFetch, withDatabaseBudget } from "@/lib/supabase/egress-budget";

afterEach(() => vi.unstubAllGlobals());
describe("agent database download budget", () => {
  it("stops subsequent queries after an oversized response even if a worker swallows the error", async () => {
    const fetcher = vi.fn(async () => new Response("abcdefgh"));
    vi.stubGlobal("fetch", fetcher);
    await expect(withDatabaseBudget("test", async () => {
      await (await budgetedDatabaseFetch("https://test.invalid")).text();
      await expect(budgetedDatabaseFetch("https://test.invalid")).rejects.toThrow("budget exceeded");
      return "swallowed";
    }, 4)).rejects.toThrow("budget exceeded");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("isolates concurrent runs and leaves public reads unbounded", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("1234")));
    await Promise.all(["a", "b"].map(label => withDatabaseBudget(label, async () => {
      expect(await (await budgetedDatabaseFetch("https://test.invalid")).text()).toBe("1234");
    }, 4)));
    expect(await (await budgetedDatabaseFetch("https://test.invalid")).text()).toBe("1234");
  });
  it("counts multibyte JSON and logs byte/request totals on failed runs", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ value: "é" }))));
    await expect(withDatabaseBudget("json-test", async () => {
      await (await budgetedDatabaseFetch("https://test.invalid")).json();
      throw new Error("worker failed");
    })).rejects.toThrow("worker failed");
    expect(JSON.parse(log.mock.calls[0][0])).toMatchObject({ label: "json-test", requests: 1, bytes: 14 });
    log.mockRestore();
  });
});
