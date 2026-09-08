import { vi } from "vitest";

// Next supplies React's server cache export in RSC builds. jsdom uses the stable
// browser React build; emulate its no-dispatcher behavior, not a global memoizer.
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return { ...react, cache: react.cache ?? ((fn: (...args: any[]) => any) => fn) };
});
