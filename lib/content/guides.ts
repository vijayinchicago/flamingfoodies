import fs from "node:fs/promises";
import path from "node:path";

import { markdownToHtml, parseFrontmatter } from "@/lib/utils";

const guidesDirectory = path.join(process.cwd(), "content", "guides");

export interface GuideSummary {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
}

export async function getGuides() {
  const files = await fs.readdir(guidesDirectory);
  const entries = await Promise.all(
    files
      .filter((file) => file.endsWith(".md"))
      .map(async (file) => {
        const slug = file.replace(/\.md$/, "");
        const raw = await fs.readFile(path.join(guidesDirectory, file), "utf8");
        const { data } = parseFrontmatter(raw);

        return {
          slug,
          title: String(data.title),
          description: String(data.description),
          publishedAt: String(data.publishedAt)
        } satisfies GuideSummary;
      })
  );

  return entries.sort((left, right) =>
    right.publishedAt.localeCompare(left.publishedAt)
  );
}

export async function getGuideBySlug(slug: string) {
  const raw = await fs.readFile(path.join(guidesDirectory, `${slug}.md`), "utf8");
  const { data, content } = parseFrontmatter(raw);
  const html = await markdownToHtml(content);

  return {
    slug,
    title: String(data.title),
    description: String(data.description),
    publishedAt: String(data.publishedAt),
    html
  };
}
