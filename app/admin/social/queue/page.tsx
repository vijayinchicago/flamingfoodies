import {
  createCustomSocialPostAction,
  publishPinterestBacklogNowAction,
  updateSocialPostStateAction
} from "@/lib/actions/admin-social";
import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import { AdminPage } from "@/components/admin/admin-page";
import { getSocialQueue } from "@/lib/services/admin";

export const dynamic = "force-dynamic";

export default async function AdminSocialQueuePage({
  searchParams
}: {
  searchParams?: {
    created?: string;
    updated?: string;
    error?: string;
    bulkPublished?: string;
    bulkFailed?: string;
  };
}) {
  const socialPosts = await getSocialQueue();

  return (
    <AdminPage
      title="Social queue"
      description="Review scheduled posts and keep the last human approval in the loop."
    >
      <form action={createCustomSocialPostAction} className="panel-light space-y-4 p-6">
        <h2 className="font-display text-4xl text-charcoal">Create a custom post</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <select
            name="platform"
            className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          >
            <option value="instagram">instagram</option>
            <option value="pinterest">pinterest</option>
            <option value="facebook">facebook</option>
            <option value="twitter">twitter</option>
            <option value="tiktok">tiktok</option>
          </select>
          <select
            name="status"
            defaultValue="pending"
            className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          >
            <option value="pending">pending</option>
            <option value="scheduled">scheduled</option>
            <option value="published">published</option>
          </select>
          <input
            name="scheduledAt"
            type="datetime-local"
            className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
        </div>
        <textarea
          name="caption"
          rows={4}
          placeholder="Caption"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <input
            name="hashtags"
            placeholder="spicyfood, hotsauce"
            className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <input
            name="linkUrl"
            placeholder="https://flamingfoodies.com/recipes/..."
            className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
        </div>
        <input
          name="imageUrl"
          placeholder="Image URL"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        {searchParams?.error ? (
          <p className="text-sm text-rose-600">{searchParams.error}</p>
        ) : null}
        {searchParams?.created ? (
          <p className="text-sm text-emerald-700">Social post created.</p>
        ) : null}
        {searchParams?.updated ? (
          <p className="text-sm text-emerald-700">Social queue updated.</p>
        ) : null}
        {searchParams?.bulkPublished ? (
          <p className="text-sm text-emerald-700">
            Published {searchParams.bulkPublished} Pinterest backlog post(s). Failed:{" "}
            {searchParams.bulkFailed || "0"}.
          </p>
        ) : null}
        <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
          Save social post
        </button>
      </form>
      <form action={publishPinterestBacklogNowAction} className="panel-light p-6">
        <h2 className="font-display text-4xl text-charcoal">Pinterest backlog</h2>
        <p className="mt-3 text-sm leading-7 text-charcoal/70">
          Publish up to 25 pending or scheduled Pinterest posts immediately through Buffer.
        </p>
        <AdminSubmitButton
          idleLabel="Publish Pinterest backlog now"
          pendingLabel="Publishing Pinterest backlog..."
          className="mt-6 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
        />
      </form>
      <div className="grid gap-4">
        {socialPosts.map((post) => (
          <article key={post.id} className="panel-light p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-ember">{post.platform}</p>
                <h2 className="mt-2 font-display text-3xl text-charcoal">{post.status}</h2>
              </div>
              <span className="text-sm text-charcoal/60">{post.scheduledAt || "TBD"}</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-charcoal/70">{post.caption}</p>
            <form action={updateSocialPostStateAction} className="mt-5 flex flex-wrap gap-3">
              <input type="hidden" name="id" value={post.id} />
              {post.status !== "scheduled" ? (
                <>
                  <input
                    name="scheduledAt"
                    type="datetime-local"
                    className="rounded-full border border-charcoal/10 px-4 py-2 text-sm outline-none focus:border-ember"
                  />
                  <button
                    name="intent"
                    value="schedule"
                    className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
                  >
                    Schedule
                  </button>
                </>
              ) : null}
              {post.status !== "published" ? (
                <button
                  name="intent"
                  value="publish"
                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Publish now
                </button>
              ) : null}
              {post.status !== "pending" ? (
                <button
                  name="intent"
                  value="pending"
                  className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
                >
                  Reset to pending
                </button>
              ) : null}
              {post.status !== "failed" ? (
                <button
                  name="intent"
                  value="fail"
                  className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Mark failed
                </button>
              ) : null}
            </form>
          </article>
        ))}
      </div>
    </AdminPage>
  );
}
