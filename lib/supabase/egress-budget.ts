import { AsyncLocalStorage } from "node:async_hooks";

// Decoded response bytes are a conservative application-side estimate, not
// Supabase's billing meter. Scope is one worker execution, never a public render.
const runs = new AsyncLocalStorage<{ label: string; bytes: number; requests: number; limit: number }>();
export const AGENT_DATABASE_BYTE_LIMIT = 1024 * 1024;

export async function withDatabaseBudget<T>(label: string, execute: () => Promise<T>, limit = AGENT_DATABASE_BYTE_LIMIT) {
  const state = { label, bytes: 0, requests: 0, limit };
  return runs.run(state, async () => {
    try {
      const result = await execute();
      if (state.bytes > state.limit) throw new Error("Agent database download budget exceeded; narrow queries before retrying.");
      return result;
    } finally {
      console.info(JSON.stringify({ event: "agent_database_usage", ...state, exceeded: state.bytes > state.limit }));
    }
  });
}

export const budgetedDatabaseFetch: typeof fetch = async (input, init) => {
  const state = runs.getStore();
  if (state && state.bytes > state.limit) throw new Error("Agent database download budget exceeded.");
  const response = await fetch(input, init);
  if (!state) return response;
  state.requests++;
  // PostgREST consumes text. Instrument other body readers too, without cloning
  // or reading responses twice. Parallel queries share their own run's counter.
  const text = response.text.bind(response);
  const buffer = response.arrayBuffer.bind(response);
  response.text = async () => {
    const value = await text();
    state.bytes += Buffer.byteLength(value, "utf8");
    return value;
  };
  response.json = async () => JSON.parse(await response.text());
  response.arrayBuffer = async () => {
    const value = await buffer();
    state.bytes += value.byteLength;
    return value;
  };
  return response;
};
