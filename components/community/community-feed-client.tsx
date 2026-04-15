"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { CommunityPost } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type FeedTab = "trending" | "new";
type PostTypeFilter = "all" | "photo" | "recipe" | "video_url";

function getTrendingScore(post: CommunityPost) {
  return post.likeCount * 4 + post.commentCount * 6 + post.viewCount * 0.1;
}

function formatPostType(type: CommunityPost["type"]) {
  if (type === "video_url") return "Video";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatHeatLevel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function CommunityPostCard({ post }: { post: CommunityPost }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 transition hover:border-white/20">
      {/* Media */}
      {post.mediaUrl ? (
        <div className="relative h-64">
          <Image
            src={post.mediaUrl}
            alt={post.title || post.caption}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
          <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-charcoal/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cream/90 backdrop-blur-sm">
            {formatPostType(post.type)}
          </span>
          {post.isPinned ? (
            <span className="absolute right-4 top-4 rounded-full bg-ember px-3 py-1 text-xs font-semibold text-white">
              Pinned
            </span>
          ) : null}
        </div>
      ) : (
        <div className="relative flex h-20 items-center justify-between bg-gradient-to-br from-flame/20 via-ember/15 to-transparent px-6">
          <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cream/80">
            {formatPostType(post.type)}
          </span>
          {post.isPinned ? (
            <span className="rounded-full bg-ember px-3 py-1 text-xs font-semibold text-white">
              Pinned
            </span>
          ) : null}
        </div>
      )}

      <div className="space-y-4 p-6">
        {/* Author row */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/profile/${post.user.username}`}
            className="group flex min-w-0 items-center gap-3"
          >
            {post.user.avatarUrl ? (
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/15">
                <Image
                  src={post.user.avatarUrl}
                  alt={post.user.displayName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-flame/40 to-ember/40 text-sm font-bold text-cream">
                {post.user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-cream group-hover:text-white">
                {post.user.displayName}
              </p>
              <p className="truncate text-xs text-cream/50">
                @{post.user.username}
                {post.user.heatScore > 0 ? ` · ${post.user.heatScore} heat pts` : ""}
              </p>
            </div>
          </Link>
          <p className="shrink-0 text-xs text-cream/45">{formatDate(post.createdAt)}</p>
        </div>

        {/* Content */}
        <div>
          {post.title ? (
            <h3 className="font-display text-2xl leading-tight text-cream sm:text-3xl">
              {post.title}
            </h3>
          ) : null}
          <p className="mt-2 text-sm leading-7 text-cream/75 line-clamp-3">{post.caption}</p>
        </div>

        {/* Metadata badges */}
        {(post.heatLevel || post.cuisineType) ? (
          <div className="flex flex-wrap gap-2">
            {post.heatLevel ? (
              <span className="rounded-full border border-ember/30 bg-ember/10 px-3 py-1 text-xs font-semibold text-ember">
                {formatHeatLevel(post.heatLevel)} heat
              </span>
            ) : null}
            {post.cuisineType ? (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-cream/65">
                {post.cuisineType.replace(/_/g, " ")}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Structured recipe preview */}
        {post.structuredRecipe ? (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-cream/55">
              <span>Recipe</span>
              <span>{post.structuredRecipe.heatLevel}</span>
              <span>{post.structuredRecipe.cuisineType.replace(/_/g, " ")}</span>
              {post.structuredRecipe.prepTimeMinutes ? (
                <span>{post.structuredRecipe.prepTimeMinutes}min prep</span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-cream/70 line-clamp-2">
              {post.structuredRecipe.description}
            </p>
          </div>
        ) : null}

        {/* Tags */}
        {post.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-cream/60"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        {/* Stats + profile link */}
        <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-4">
          <div className="flex gap-5 text-sm text-cream/55">
            <span>{post.likeCount} likes</span>
            <span>{post.commentCount} notes</span>
            <span>{post.viewCount} views</span>
          </div>
          <Link
            href={`/profile/${post.user.username}`}
            className="rounded-full border border-white/12 px-3 py-1.5 text-xs font-semibold text-cream/70 hover:border-white/25 hover:text-white"
          >
            View profile
          </Link>
        </div>
      </div>
    </article>
  );
}

export function CommunityFeedClient({
  posts,
  isLoggedIn = false
}: {
  posts: CommunityPost[];
  isLoggedIn?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<FeedTab>("trending");
  const [typeFilter, setTypeFilter] = useState<PostTypeFilter>("all");

  const filtered = useMemo(() => {
    let result = posts;

    // Pinned always first regardless of tab
    const pinned = result.filter((p) => p.isPinned);
    const rest = result.filter((p) => !p.isPinned);

    if (typeFilter !== "all") {
      result = [...pinned, ...rest].filter((p) => p.type === typeFilter);
    } else {
      result = [...pinned, ...rest];
    }

    // Sort the non-pinned portion
    const pinnedSet = new Set(pinned.map((p) => p.id));
    const sortedRest = result
      .filter((p) => !pinnedSet.has(p.id))
      .sort((a, b) => {
        if (activeTab === "new") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // trending
        return getTrendingScore(b) - getTrendingScore(a);
      });

    return [
      ...result.filter((p) => pinnedSet.has(p.id)),
      ...sortedRest
    ];
  }, [posts, activeTab, typeFilter]);

  const tabs: Array<{ key: FeedTab; label: string }> = [
    { key: "trending", label: "Trending" },
    { key: "new", label: "New" }
  ];

  const typeFilters: Array<{ key: PostTypeFilter; label: string }> = [
    { key: "all", label: "All" },
    { key: "photo", label: "Photos" },
    { key: "recipe", label: "Recipes" },
    { key: "video_url", label: "Videos" }
  ];

  return (
    <div>
      {/* Tab + filter row */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-white text-charcoal shadow-sm"
                  : "text-cream/70 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
          {isLoggedIn ? (
            <button
              type="button"
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-cream/70 hover:text-white"
              onClick={() => {/* Following feed — requires social graph */}}
            >
              Following
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-cream/45 transition hover:text-cream/70"
              title="Log in to see posts from people you follow"
            >
              Following
            </Link>
          )}
        </div>

        {/* Type filters */}
        <div className="flex flex-wrap gap-2">
          {typeFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setTypeFilter(f.key)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                typeFilter === f.key
                  ? "border-ember bg-ember text-white"
                  : "border-white/15 text-cream/75 hover:border-white/30 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="mt-4 text-sm text-cream/50">
        {filtered.length} post{filtered.length === 1 ? "" : "s"}
        {typeFilter !== "all" ? ` · ${formatPostType(typeFilter as CommunityPost["type"])}s only` : ""}
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {filtered.map((post) => (
            <CommunityPostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.03] p-10 text-center">
          <p className="font-display text-3xl text-cream">Nothing here yet</p>
          <p className="mt-3 text-sm text-cream/60">
            {typeFilter !== "all"
              ? "Try a different post type or switch to All."
              : "Be the first to post in this feed."}
          </p>
        </div>
      )}
    </div>
  );
}
