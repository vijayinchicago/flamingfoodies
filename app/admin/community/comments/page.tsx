import { moderateCommentAction } from "@/lib/actions/engagement";
import { AdminPage } from "@/components/admin/admin-page";
import { getAdminComments } from "@/lib/services/content";

export default async function AdminCommentsPage({
  searchParams
}: {
  searchParams?: { updated?: string; error?: string };
}) {
  const comments = await getAdminComments();

  return (
    <AdminPage
      title="Comments"
      description="Flag review queue for threaded discussion across content types."
    >
      {searchParams?.updated ? (
        <p className="text-sm text-emerald-700">Comment updated successfully.</p>
      ) : null}
      {searchParams?.error ? (
        <p className="text-sm text-rose-600">{searchParams.error}</p>
      ) : null}
      <div className="grid gap-4">
        {comments.map((comment) => (
          <article key={comment.id} className="panel-light p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-charcoal">
                  {comment.user.displayName}
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-ember">
                  {comment.contentType}
                </p>
              </div>
              <span className="rounded-full bg-charcoal/5 px-3 py-1 text-xs font-semibold text-charcoal/70">
                {comment.isApproved
                  ? comment.isFlagged
                    ? "flagged"
                    : "approved"
                  : "hidden"}
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-charcoal/70">{comment.body}</p>
            <form action={moderateCommentAction} className="mt-5 flex flex-wrap gap-3">
              <input type="hidden" name="commentId" value={comment.id} />
              {!comment.isApproved ? (
                <button
                  name="intent"
                  value="approve"
                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Approve
                </button>
              ) : (
                <button
                  name="intent"
                  value="hide"
                  className="rounded-full bg-charcoal px-4 py-2 text-sm font-semibold text-white"
                >
                  Hide
                </button>
              )}
              <button
                name="intent"
                value={comment.isFlagged ? "unflag" : "flag"}
                className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
              >
                {comment.isFlagged ? "Remove flag" : "Flag"}
              </button>
            </form>
          </article>
        ))}
      </div>
    </AdminPage>
  );
}
