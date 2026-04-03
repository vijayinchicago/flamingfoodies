import matter from "gray-matter";
import { marked } from "marked";
import { clsx } from "clsx";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function calculateReadTime(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function formatDate(value?: string) {
  if (!value) return "Draft";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function absoluteUrl(path = "/") {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://flamingfoodies.com");
  return new URL(path, base).toString();
}

export function parseFrontmatter(fileContents: string) {
  return matter(fileContents);
}

export async function markdownToHtml(markdown: string) {
  return marked.parse(markdown) as Promise<string>;
}

export function jsonResponse<T>(data: T, init?: ResponseInit) {
  return Response.json(data, init);
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
