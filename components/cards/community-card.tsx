import Image from "next/image";

import type { CommunityPost } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function CommunityCard({ post }: { post: CommunityPost }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
      {post.mediaUrl ? (
        <div className="relative h-72">
          <Image
            src={post.mediaUrl}
            alt={post.title || post.caption}
            fill
            className="object-cover"
          />
        </div>
      ) : null}
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-cream">{post.user.displayName}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-cream/45">
              @{post.user.username}
            </p>
          </div>
          <p className="text-xs text-cream/55">{formatDate(post.createdAt)}</p>
        </div>
        <div>
          {post.title ? (
            <h3 className="font-display text-3xl text-cream">{post.title}</h3>
          ) : null}
          <p className="mt-2 text-sm leading-7 text-cream/75">{post.caption}</p>
        </div>
        {post.structuredRecipe ? (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.18em] text-cream/55">
              <span>Recipe submission</span>
              <span>{post.structuredRecipe.heatLevel}</span>
              <span>{post.structuredRecipe.cuisineType.replace(/_/g, " ")}</span>
              {post.structuredRecipe.prepTimeMinutes ? (
                <span>{post.structuredRecipe.prepTimeMinutes} min prep</span>
              ) : null}
              {post.structuredRecipe.cookTimeMinutes ? (
                <span>{post.structuredRecipe.cookTimeMinutes} min cook</span>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-7 text-cream/70">
              {post.structuredRecipe.description}
            </p>
            <div className="mt-4 grid gap-4 text-sm text-cream/70 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cream/45">
                  Ingredients
                </p>
                <ul className="mt-2 space-y-2">
                  {post.structuredRecipe.ingredients.slice(0, 4).map((ingredient, index) => (
                    <li key={`${ingredient.item}-${index}`}>
                      {ingredient.amount} {ingredient.unit} {ingredient.item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cream/45">Method</p>
                <ol className="mt-2 space-y-2">
                  {post.structuredRecipe.instructions.slice(0, 2).map((instruction) => (
                    <li key={instruction.step}>
                      {instruction.step}. {instruction.text}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-cream/70"
            >
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex gap-6 text-sm text-cream/60">
          <span>{post.likeCount} likes</span>
          <span>{post.commentCount} comments</span>
          <span>{post.viewCount} views</span>
        </div>
      </div>
    </article>
  );
}
