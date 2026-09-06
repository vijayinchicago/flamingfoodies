import Link from "next/link";

import { CommunityFeedClient } from "@/components/community/community-feed-client";
import { SectionHeading } from "@/components/layout/section-heading";
import { flags } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import { getCommunityPosts } from "@/lib/services/content";
import { getCurrentMemberProfile } from "@/lib/supabase/auth";

export const metadata = buildMetadata({
  title: "Spicy Food Community | FlamingFoodies",
  description:
    "Community posts, spicy recipe submissions, and heat-chasing members sharing what they cooked.",
  path: "/community"
});

export default async function CommunityPage() {
  const [posts, profile] = await Promise.all([
    getCommunityPosts(),
    getCurrentMemberProfile()
  ]);

  const totalLikes = posts.reduce((sum, p) => sum + p.likeCount, 0);
  const recipeCount = posts.filter((p) => p.type === "recipe").length;

  return (
    <section className="container-shell py-16">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="Community"
          title="Real cooks. Real heat. Real food."
          copy="Photos, recipes, and challenge entries from the people who actually cook this stuff. Browse by what's trending or newest, filter by post type."
        />
        {flags.memberAuthEnabled ? (
          <Link
            href="/community/submit"
            className="shrink-0 rounded-full bg-gradient-to-r from-flame to-ember px-6 py-3 text-center font-semibold text-white"
          >
            Share your cook
          </Link>
        ) : null}
      </div>

      {/* Stats strip */}
      <div className="mt-8 grid grid-cols-3 gap-4 sm:grid-cols-3">
        <div className="rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.04] p-5 text-center">
          <p className="font-display text-4xl text-charcoal">{posts.length}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-charcoal/55">Posts</p>
        </div>
        <div className="rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.04] p-5 text-center">
          <p className="font-display text-4xl text-charcoal">{recipeCount}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-charcoal/55">Recipes shared</p>
        </div>
        <div className="rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.04] p-5 text-center">
          <p className="font-display text-4xl text-charcoal">{totalLikes.toLocaleString()}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-charcoal/55">Total likes</p>
        </div>
      </div>

      {/* Feed with tabs */}
      <CommunityFeedClient
        posts={posts}
        isLoggedIn={Boolean(profile)}
        memberAuthEnabled={flags.memberAuthEnabled}
      />

      {/* Bottom CTA */}
      <div className="mt-16 rounded-[2rem] border border-charcoal/10 bg-charcoal/[0.04] p-8 text-center sm:p-12">
        <p className="eyebrow">
          {flags.memberAuthEnabled ? "Join the community" : "Community archive"}
        </p>
        <h2 className="mt-4 font-display text-4xl text-charcoal sm:text-5xl">
          {flags.memberAuthEnabled ? "Share what you cooked." : "Member posting is paused."}
        </h2>
        <p className="mt-4 mx-auto max-w-xl text-sm leading-7 text-charcoal/70">
          {flags.memberAuthEnabled
            ? "Post a photo, submit a spicy recipe, or drop a video. Heat scores go up with every cook you share and every like you earn."
            : "You can still browse existing community recipes and posts while new member sign-ins and submissions are paused."}
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {flags.memberAuthEnabled ? (
            <>
              <Link
                href="/community/submit"
                className="rounded-full bg-gradient-to-r from-flame to-ember px-8 py-3 font-semibold text-white"
              >
                Submit a post or recipe
              </Link>
              {!profile ? (
                <Link
                  href="/signup"
                  className="rounded-full border border-charcoal/15 px-8 py-3 font-semibold text-charcoal"
                >
                  Create an account
                </Link>
              ) : null}
            </>
          ) : null}
          {flags.memberAuthEnabled && profile ? (
            <Link
              href="/recipes"
              className="rounded-full border border-charcoal/15 px-8 py-3 font-semibold text-charcoal"
            >
              Browse recipes
            </Link>
          ) : null}
          {!flags.memberAuthEnabled ? (
            <Link
              href="/recipes"
              className="rounded-full border border-charcoal/15 px-8 py-3 font-semibold text-charcoal"
            >
              Browse recipes
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
