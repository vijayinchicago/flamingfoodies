import Link from "next/link";

import { CommunityCard } from "@/components/cards/community-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { getCommunityPosts } from "@/lib/services/content";

export default async function CommunityPage() {
  const posts = await getCommunityPosts();

  return (
    <section className="container-shell py-16">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="Community"
          title="UGC that feels more like a movement than a comment thread."
          copy="Photos, recipes, and challenges funnel into moderation, heat scores, and recurring visits."
        />
        <Link
          href="/community/submit"
          className="rounded-full bg-gradient-to-r from-flame to-ember px-6 py-3 text-center font-semibold text-white"
        >
          Submit a post or recipe
        </Link>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {posts.map((post) => (
          <CommunityCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
