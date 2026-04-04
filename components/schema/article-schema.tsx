import type { BlogPost } from "@/lib/types";
import { buildArticleStructuredData } from "@/lib/structured-data";

export function ArticleSchema({ post }: { post: BlogPost }) {
  const schema = buildArticleStructuredData(post);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
