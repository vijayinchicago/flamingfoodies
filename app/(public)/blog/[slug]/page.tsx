import { notFound } from "next/navigation";

import { CommentSection } from "@/components/community/comment-section";
import { ShareBar } from "@/components/content/share-bar";
import { ArticleSchema } from "@/components/schema/article-schema";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl, formatDate, markdownToHtml } from "@/lib/utils";
import { getBlogPost, getBlogPosts } from "@/lib/services/content";

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    return buildMetadata({
      title: "Blog | FlamingFoodies",
      description: "Spicy culture and editorial coverage."
    });
  }

  return buildMetadata({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.description,
    path: `/blog/${post.slug}`,
    images: post.imageUrl ? [post.imageUrl] : undefined
  });
}

export default async function BlogPostPage({
  params
}: {
  params: { slug: string };
}) {
  const post = await getBlogPost(params.slug);

  if (!post) notFound();

  const html = await markdownToHtml(post.content);

  return (
    <article className="container-shell py-16">
      <ArticleSchema post={post} />
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "Blog", item: absoluteUrl("/blog") },
          { name: post.title, item: absoluteUrl(`/blog/${post.slug}`) }
        ]}
      />
      <p className="eyebrow">{post.category}</p>
      <h1 className="mt-4 max-w-4xl font-display text-6xl leading-tight text-cream">
        {post.title}
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-cream/75">{post.description}</p>
      <div className="mt-4 flex gap-6 text-sm text-cream/55">
        <span>{post.authorName}</span>
        <span>{formatDate(post.publishedAt)}</span>
        <span>{post.readTimeMinutes || 4} min read</span>
      </div>
      <div className="mt-8 max-w-4xl">
        <ShareBar
          title={post.title}
          description={post.description}
          url={absoluteUrl(`/blog/${post.slug}`)}
          imageUrl={post.imageUrl}
          contentType="blog_post"
          contentId={post.id}
          contentSlug={post.slug}
        />
      </div>
      <div
        className="prose-guide mt-12"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="mt-12">
        <CommentSection
          contentType="blog_post"
          contentId={post.id}
          contentPath={`/blog/${post.slug}`}
        />
      </div>
    </article>
  );
}
