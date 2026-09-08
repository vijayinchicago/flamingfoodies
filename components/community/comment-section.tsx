import Link from "next/link";

import { submitCommentAction } from "@/lib/actions/engagement";
import { flags } from "@/lib/env";
import { getCurrentMemberProfile } from "@/lib/supabase/auth";
import { getCommentsForContent } from "@/lib/services/content";
import { formatDate } from "@/lib/utils";

export async function CommentSection({
  contentType,
  contentId,
  contentPath,
  title = "Comments"
}: {
  contentType: string;
  contentId: number;
  contentPath: string;
  title?: string;
}) {
  const [comments, profile] = await Promise.all([
    getCommentsForContent(contentType, contentId),
    getCurrentMemberProfile()
  ]);

  return (
    <section id="comments" className="space-y-6">
      <div className="panel p-6">
        <h2 className="font-display text-3xl text-charcoal">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-charcoal/70">
          Reader discussion is shared across recipes, reviews, and editorial pieces.
        </p>
        {profile ? (
          <form action={submitCommentAction} className="mt-6 space-y-4">
            <input type="hidden" name="contentType" value={contentType} />
            <input type="hidden" name="contentId" value={contentId} />
            <input type="hidden" name="contentPath" value={contentPath} />
            <textarea
              name="body"
              rows={4}
              placeholder="Add a useful note, tweak, question, or warning."
              className="w-full rounded-2xl border border-charcoal/15 bg-white px-4 py-3 text-charcoal outline-none placeholder:text-charcoal/45 focus:border-ember"
            />
            <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
              Post comment
            </button>
          </form>
        ) : flags.memberAuthEnabled ? (
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-full border border-charcoal/15 px-4 py-2 text-sm font-semibold text-charcoal"
          >
            Log in to comment
          </Link>
        ) : (
          <p className="mt-6 text-sm text-charcoal/60">
            Comments are read-only while member sign-in is paused.
          </p>
        )}
      </div>

      <div className="space-y-4">
        {comments.length ? (
          comments.map((comment) => (
            <article key={comment.id} className="panel p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-charcoal">
                    {comment.user.displayName}
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-charcoal/45">
                    @{comment.user.username}
                  </p>
                </div>
                <p className="text-xs text-charcoal/55">{formatDate(comment.createdAt)}</p>
              </div>
              <p className="mt-4 text-sm leading-7 text-charcoal/75">{comment.body}</p>
            </article>
          ))
        ) : (
          <div className="panel p-6 text-sm text-charcoal/55">
            No comments yet.
          </div>
        )}
      </div>
    </section>
  );
}
