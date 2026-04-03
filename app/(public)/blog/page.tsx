import { ContentCard } from "@/components/cards/content-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { getBlogPosts } from "@/lib/services/content";

export default async function BlogIndexPage() {
  const posts = await getBlogPosts();

  return (
    <section className="container-shell py-16">
      <SectionHeading
        eyebrow="Blog"
        title="Culture, gear, and sauce intelligence."
        copy="This layer carries the editorial voice, long-tail SEO, and authority-building content that feeds the rest of the platform."
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {posts.map((post) => (
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
        ))}
      </div>
    </section>
  );
}
