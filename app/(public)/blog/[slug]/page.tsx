import Image from "next/image";
import { notFound } from "next/navigation";

import { AdSlot } from "@/components/ads/ad-slot";
import { CommentSection } from "@/components/community/comment-section";
import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { PinterestSaveButton } from "@/components/content/pinterest-save-button";
import { ShareBar } from "@/components/content/share-bar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ArticleSchema } from "@/components/schema/article-schema";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { getAdRuntimeConfig } from "@/lib/ads";
import { injectInlineAffiliateLinks } from "@/lib/inline-affiliate-links";
import { getDynamicInlineTerms } from "@/lib/services/catalog-auto-grow";
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

  const [rawHtml, dynamicTerms, ads] = await Promise.all([
    markdownToHtml(post.content),
    getDynamicInlineTerms(),
    getAdRuntimeConfig()
  ]);
  const html = injectInlineAffiliateLinks(rawHtml, `/blog/${post.slug}`, dynamicTerms);

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
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: post.title }
        ]}
      />
      <p className="eyebrow mt-5">{post.category}</p>
      <h1 className="mt-4 max-w-4xl font-display text-4xl leading-tight text-cream sm:text-5xl lg:text-6xl">
        {post.title}
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-cream/75 sm:text-lg sm:leading-8">{post.description}</p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-cream/55">
        <span>{post.authorName}</span>
        <span>{formatDate(post.publishedAt)}</span>
        <span>{post.readTimeMinutes || 4} min read</span>
      </div>
      <div className="mt-5 max-w-3xl">
        <AffiliateDisclosure compact />
      </div>
      {post.imageUrl ? (
        <div className="relative mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05]">
          <PinterestSaveButton
            title={post.title}
            description={post.description}
            url={absoluteUrl(`/blog/${post.slug}`)}
            imageUrl={post.imageUrl}
            contentType="blog_post"
            contentId={post.id}
            contentSlug={post.slug}
            className="absolute right-4 top-4 z-10 inline-flex rounded-full border border-white/15 bg-charcoal/70 px-4 py-2 text-sm font-semibold text-cream backdrop-blur-md transition hover:border-white/30 hover:bg-charcoal/80"
          />
          <div className="relative h-[260px] sm:h-[360px]">
            <Image
              src={post.imageUrl}
              alt={post.imageAlt || post.title}
              fill
              unoptimized
              sizes="(min-width: 1280px) 960px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      ) : null}
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
      {ads.manualSlotsEnabled && ads.clientId && ads.slotIds.blogInline ? (
        <div className="mt-8 max-w-4xl">
          <AdSlot
            clientId={ads.clientId}
            slotId={ads.slotIds.blogInline}
            slotName="blog_post_inline"
            placement="blog_post"
            contentType="blog_post"
            contentId={post.id}
            contentSlug={post.slug}
          />
        </div>
      ) : null}
      <div
        className="prose-guide mt-12"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {ads.manualSlotsEnabled && ads.clientId && ads.slotIds.blogInArticle ? (
        <div className="mt-10 max-w-4xl">
          <AdSlot
            clientId={ads.clientId}
            slotId={ads.slotIds.blogInArticle}
            slotName="blog_post_in_article"
            placement="blog_post_body"
            format="in-article"
            contentType="blog_post"
            contentId={post.id}
            contentSlug={post.slug}
          />
        </div>
      ) : null}
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
