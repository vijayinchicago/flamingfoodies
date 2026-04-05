import Image from "next/image";
import { notFound } from "next/navigation";

import { CommunityCard } from "@/components/cards/community-card";
import { toggleFollowAction } from "@/lib/actions/engagement";
import { buildMetadata } from "@/lib/seo";
import { getCurrentProfile } from "@/lib/supabase/auth";
import {
  getCommunityPosts,
  getFollowState,
  getProfile
} from "@/lib/services/content";

export async function generateMetadata({
  params
}: {
  params: { username: string };
}) {
  const profile = await getProfile(params.username);

  return buildMetadata({
    title: profile ? `${profile.displayName} | FlamingFoodies` : "Member Profile | FlamingFoodies",
    description:
      profile?.bio || `See spicy posts and community stats for @${params.username}.`,
    path: `/profile/${params.username}`
  });
}

export default async function ProfilePage({
  params,
  searchParams
}: {
  params: { username: string };
  searchParams?: { followed?: string; error?: string };
}) {
  const [profile, posts, viewer] = await Promise.all([
    getProfile(params.username),
    getCommunityPosts(),
    getCurrentProfile()
  ]);

  if (!profile) notFound();

  const isOwnProfile = viewer?.id === profile.id;
  const isFollowing = await getFollowState(profile.id, viewer?.id);
  const authored = posts.filter((post) => post.user.username === profile.username);

  return (
    <section className="container-shell py-16">
      <div className="panel px-8 py-10">
        <div className="flex flex-wrap items-center gap-5">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.displayName}
              width={112}
              height={112}
              className="h-28 w-28 rounded-full object-cover ring-4 ring-white/10"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/10 text-4xl font-semibold text-cream">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="eyebrow">Profile</p>
            <h1 className="mt-4 font-display text-5xl text-cream">{profile.displayName}</h1>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-cream/75">{profile.bio}</p>
        <div className="mt-6 flex flex-wrap gap-6 text-sm text-cream/60">
          <span>Heat score: {profile.heatScore}</span>
          <span>Followers: {profile.followerCount || 0}</span>
          <span>Following: {profile.followingCount || 0}</span>
        </div>
        <div className="mt-6">
          {viewer && !isOwnProfile ? (
            <form action={toggleFollowAction}>
              <input type="hidden" name="targetUserId" value={profile.id} />
              <input type="hidden" name="targetUsername" value={profile.username} />
              <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
            </form>
          ) : null}
          {searchParams?.followed ? (
            <p className="mt-3 text-sm text-emerald-300">Follow state updated.</p>
          ) : null}
          {searchParams?.error ? (
            <p className="mt-3 text-sm text-rose-300">{searchParams.error}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {authored.map((post) => (
          <CommunityCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
