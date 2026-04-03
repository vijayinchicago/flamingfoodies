import { AdminPage } from "@/components/admin/admin-page";
import { moderateCommunityPostAction } from "@/lib/actions/admin-community";
import { updateCompetitionEntryStateAction } from "@/lib/actions/competitions";
import {
  getAdminCommunityPosts,
  getAdminCompetitions
} from "@/lib/services/content";

export default async function ModerationPage({
  searchParams
}: {
  searchParams?: { updated?: string; error?: string };
}) {
  const [posts, competitions] = await Promise.all([
    getAdminCommunityPosts("pending_review"),
    getAdminCompetitions()
  ]);

  const pendingCompetitionEntries = competitions.flatMap((competition) =>
    competition.entries
      .filter((entry) => entry.status === "pending_review")
      .map((entry) => ({ competition, entry }))
  );

  return (
    <AdminPage
      title="Moderation queue"
      description="Approve, reject, or pin community posts before they hit the main feed."
    >
      {searchParams?.updated ? (
        <p className="text-sm text-emerald-700">Moderation update saved.</p>
      ) : null}
      {searchParams?.error ? (
        <p className="text-sm text-rose-600">{searchParams.error}</p>
      ) : null}
      <div className="space-y-4">
        <h2 className="font-display text-4xl text-charcoal">Community posts</h2>
        {posts.length ? (
          <div className="grid gap-6">
            {posts.map((post) => (
              <article key={post.id} className="panel-light p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-ember">
                      {post.type}
                    </p>
                    <h3 className="mt-2 font-display text-3xl text-charcoal">
                      {post.title || post.caption.slice(0, 32)}
                    </h3>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {post.status}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-charcoal/70">{post.caption}</p>
                {post.structuredRecipe ? (
                  <div className="mt-4 rounded-[1.5rem] border border-charcoal/10 bg-charcoal/[0.03] p-4">
                    <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.18em] text-charcoal/55">
                      <span>Structured recipe</span>
                      <span>{post.structuredRecipe.heatLevel}</span>
                      <span>{post.structuredRecipe.cuisineType.replace(/_/g, " ")}</span>
                      {post.structuredRecipe.servings ? (
                        <span>{post.structuredRecipe.servings} servings</span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-charcoal/70">
                      {post.structuredRecipe.description}
                    </p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-charcoal/55">
                          Ingredients
                        </p>
                        <ul className="mt-2 space-y-2 text-sm text-charcoal/70">
                          {post.structuredRecipe.ingredients.slice(0, 5).map((ingredient, index) => (
                            <li key={`${ingredient.item}-${index}`}>
                              {ingredient.amount} {ingredient.unit} {ingredient.item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-charcoal/55">
                          Instructions
                        </p>
                        <ol className="mt-2 space-y-2 text-sm text-charcoal/70">
                          {post.structuredRecipe.instructions.slice(0, 3).map((instruction) => (
                            <li key={instruction.step}>
                              {instruction.step}. {instruction.text}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="mt-4 text-sm text-charcoal/55">
                  Submitted by {post.user.displayName}
                </div>
                <form action={moderateCommunityPostAction} className="mt-5 flex flex-wrap gap-3">
                  <input type="hidden" name="postId" value={post.id} />
                  <button
                    name="intent"
                    value="approve"
                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Approve
                  </button>
                  <button
                    name="intent"
                    value="reject"
                    className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Reject
                  </button>
                  <button
                    name="intent"
                    value={post.isPinned ? "unpin" : "pin"}
                    className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
                  >
                    {post.isPinned ? "Unpin" : "Pin"}
                  </button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <div className="panel-light p-5 text-sm text-charcoal/60">
            No pending community posts right now.
          </div>
        )}
      </div>
      <div className="space-y-4">
        <h2 className="font-display text-4xl text-charcoal">Competition entries</h2>
        {pendingCompetitionEntries.length ? (
          <div className="grid gap-6">
            {pendingCompetitionEntries.map(({ competition, entry }) => (
              <article key={entry.id} className="panel-light p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-ember">
                      {competition.title}
                    </p>
                    <h3 className="mt-2 font-display text-3xl text-charcoal">
                      {entry.title || "Untitled entry"}
                    </h3>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {entry.status}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-charcoal/70">{entry.caption}</p>
                <div className="mt-4 text-sm text-charcoal/55">
                  Submitted by {entry.user.displayName}
                </div>
                <form action={updateCompetitionEntryStateAction} className="mt-5 flex flex-wrap gap-3">
                  <input type="hidden" name="entryId" value={entry.id} />
                  <input type="hidden" name="competitionId" value={competition.id} />
                  <button
                    name="intent"
                    value="approve"
                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Approve
                  </button>
                  <button
                    name="intent"
                    value="reject"
                    className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Reject
                  </button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <div className="panel-light p-5 text-sm text-charcoal/60">
            No pending competition entries right now.
          </div>
        )}
      </div>
    </AdminPage>
  );
}
