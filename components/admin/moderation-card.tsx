import type { CommunityPost } from "@/lib/types";

export function ModerationCard({ post }: { post: CommunityPost }) {
  return (
    <article className="panel-light p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-ember">{post.type}</p>
          <h2 className="mt-2 font-display text-3xl text-charcoal">
            {post.title || post.caption.slice(0, 32)}
          </h2>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          {post.status}
        </span>
      </div>
      <p className="mt-4 text-sm leading-7 text-charcoal/70">{post.caption}</p>
      <div className="mt-5 flex gap-3">
        <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
          Approve
        </button>
        <button className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
          Reject
        </button>
        <button className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal">
          Pin
        </button>
      </div>
    </article>
  );
}
