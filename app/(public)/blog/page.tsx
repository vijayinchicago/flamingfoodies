import { AdScript } from "@/components/ads/ad-script";
import { AdSlot } from "@/components/ads/ad-slot";
import { ContentCard } from "@/components/cards/content-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import { getAdRuntimeConfig } from "@/lib/ads";
import { buildMetadata } from "@/lib/seo";
import { getBlogPosts } from "@/lib/services/content";
import { absoluteUrl } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Spicy Food Blog | FlamingFoodies",
  description:
    "Editorial coverage on spicy food culture, hot sauce gear, chili techniques, and heat-forward cooking.",
  path: "/blog"
});

export default async function BlogIndexPage() {
  const posts = await getBlogPosts();
  const ads = await getAdRuntimeConfig();

  return (
    <section className="container-shell py-16">
      {ads.enabled && ads.clientId && ads.slotIds.blogArchive ? (
        <AdScript clientId={ads.clientId} />
      ) : null}
      <ItemListSchema
        name="FlamingFoodies blog archive"
        items={posts.map((post) => ({
          name: post.title,
          url: absoluteUrl(`/blog/${post.slug}`),
          image: post.imageUrl
        }))}
      />
      <SectionHeading
        eyebrow="Blog"
        title="Culture, gear, and sauce intelligence."
        copy="This layer carries the editorial voice, long-tail SEO, and authority-building content that feeds the rest of the platform."
      />
      {ads.enabled && ads.clientId && ads.slotIds.blogArchive && posts.length ? (
        <div className="mt-10 max-w-4xl">
          <AdSlot
            clientId={ads.clientId}
            slotId={ads.slotIds.blogArchive}
            slotName="blog_archive_feature"
            placement="blog_archive"
            className="bg-white/[0.04]"
          />
        </div>
      ) : null}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {posts.length ? (
          posts.map((post) => (
            <ContentCard
              key={post.id}
              href={`/blog/${post.slug}`}
              image={post.imageUrl}
              imageAlt={post.imageAlt}
              eyebrow={`${post.category} · ${post.source}`}
              title={post.title}
              description={post.description}
              meta={post.publishedAt}
            />
          ))
        ) : (
          <div className="panel p-8 lg:col-span-2">
            <p className="eyebrow">Editorial queue</p>
            <h3 className="mt-3 font-display text-4xl text-cream">
              No published blog posts are live yet.
            </h3>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-cream/72">
              The archive is wired and schema-ready, but it still needs published posts in Supabase.
              Use the catalog bootstrap or the admin editor to push the first articles live.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
