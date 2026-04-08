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
        copy="Longer reads on spicy food culture, gear, ingredients, and the ideas that make the rest of the site more useful."
      />
      {ads.manualSlotsEnabled && ads.clientId && ads.slotIds.blogArchive && posts.length ? (
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
              eyebrow={post.category}
              title={post.title}
              description={post.description}
              meta={post.publishedAt}
            />
          ))
        ) : (
          <div className="panel p-8 lg:col-span-2">
            <p className="eyebrow">Blog</p>
            <h3 className="mt-3 font-display text-4xl text-cream">
              Fresh blog posts are on the way.
            </h3>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-cream/72">
              Check back soon for more spicy food culture, gear, and hot sauce guides.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
