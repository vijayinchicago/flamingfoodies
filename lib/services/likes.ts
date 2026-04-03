import { flags, env } from "@/lib/env";

async function callUpstash(path: string, options?: RequestInit) {
  if (!flags.hasUpstash) return null;

  const response = await fetch(`${env.KV_REST_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.KV_REST_API_TOKEN}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Upstash request failed.");
  }

  return response.json();
}

export async function getLikeCount(type: string, id: string) {
  const key = `flamingfoodies:likes:${type}:${id}`;

  const data = await callUpstash(`/get/${key}`);
  return Number(data?.result || 0);
}

export async function incrementLikeCount(type: string, id: string) {
  const key = `flamingfoodies:likes:${type}:${id}`;

  await callUpstash(`/incr/${key}`, { method: "POST" });
  return getLikeCount(type, id);
}
