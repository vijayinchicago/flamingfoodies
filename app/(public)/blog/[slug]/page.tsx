import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentCard } from "@/components/cards/content-card";
import { CommentSection } from "@/components/community/comment-section";
import { PinterestSaveButton } from "@/components/content/pinterest-save-button";
import { ShareBar } from "@/components/content/share-bar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ArticleSchema } from "@/components/schema/article-schema";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { getPublicAuthorByName, getPublicAuthorHref } from "@/lib/authors";
import { isReviewHoldBlogSlug, shouldPromoteBlogPost } from "@/lib/editorial-guards";
import { buildMetadata } from "@/lib/seo";
import { getBlogPost, getBlogPosts } from "@/lib/services/content";
import { absoluteUrl, formatDate, markdownToHtml } from "@/lib/utils";

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts
    .filter((post) => shouldPromoteBlogPost({ slug: post.slug, source: post.source }))
    .map((post) => ({ slug: post.slug }));
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
    images: post.imageUrl ? [post.imageUrl] : undefined,
    noIndex: isReviewHoldBlogSlug(post.slug)
  });
}

export default async function BlogPostPage({
  params
}: {
  params: { slug: string };
}) {
  const [post, allPosts] = await Promise.all([getBlogPost(params.slug), getBlogPosts()]);

  if (!post) notFound();

  const [html] = await Promise.all([markdownToHtml(post.content)]);
  const author = getPublicAuthorByName(post.authorName);
  const relatedPosts = allPosts
    .filter(
      (candidate) =>
        candidate.slug !== post.slug &&
        shouldPromoteBlogPost({ slug: candidate.slug, source: candidate.source })
    )
    .map((candidate) => {
      let score = 0;

      if (candidate.category === post.category) {
        score += 4;
      }

      if (candidate.cuisineType && candidate.cuisineType === post.cuisineType) {
        score += 2;
      }

      if (candidate.heatLevel && candidate.heatLevel === post.heatLevel) {
        score += 1;
      }

      return { candidate, score };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ candidate }) => candidate);

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
      {post.imageUrl ? (
        <div className="relative mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05]">
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
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-cream/55">
        {author ? (
          <Link href={getPublicAuthorHref(post.authorName)} className="underline underline-offset-4">
            By {author.displayName}
          </Link>
        ) : (
          <span>By {post.authorName}</span>
        )}
        <span>{formatDate(post.publishedAt)}</span>
        <span>{post.readTimeMinutes || 4} min read</span>
      </div>
      <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="max-w-4xl">
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
        <aside className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-cream/72">
          <p className="eyebrow">Editorial note</p>
          <p className="mt-3">
            Blog posts are meant to explain, contextualize, or report. They are kept separate from
            product-review scoring and buying-guide methodology.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/editorial-policy" className="font-semibold text-cream underline underline-offset-4">
              Editorial policy
            </Link>
            <Link href="/corrections" className="font-semibold text-cream underline underline-offset-4">
              Corrections
            </Link>
          </div>
        </aside>
      </div>
      <div
        className="prose-guide mt-12"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {relatedPosts.length ? (
        <div className="mt-14">
          <p className="eyebrow">Keep reading</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            More stories in this lane.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-cream/72">
            If this post helped, these are the next pieces most likely to keep the thread going.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {relatedPosts.map((candidate) => (
              <ContentCard
                key={candidate.slug}
                href={`/blog/${candidate.slug}`}
                image={candidate.imageUrl}
                imageAlt={candidate.imageAlt}
                eyebrow={candidate.category}
                title={candidate.title}
                description={candidate.description}
                meta={candidate.publishedAt}
              />
            ))}
          </div>
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
