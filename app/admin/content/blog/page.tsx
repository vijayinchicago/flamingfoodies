import Image from "next/image";
import Link from "next/link";

import { buildBlogQaReport, getBlogQaPublishError } from "@/lib/blog-qa";
import { createBlogPostAction, updateBlogPostStateAction } from "@/lib/actions/admin-content";
import { AdminPage } from "@/components/admin/admin-page";
import { ContentTable } from "@/components/admin/content-table";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { formatContentSourceLabel } from "@/lib/content-labels";
import { getAdminBlogPosts } from "@/lib/services/content";

export default async function AdminBlogPage({
  searchParams
}: {
  searchParams?: { created?: string; updated?: string; error?: string };
}) {
  const posts = await getAdminBlogPosts();
  const reviewQueue = posts.filter(
    (post) => (post.status === "pending_review" || post.source === "ai_generated") && post.status !== "published"
  );
  const queueEntries = reviewQueue.map((post) => {
    const qaReport = buildBlogQaReport(post);
    const publishError = getBlogQaPublishError(qaReport);

    return {
      post,
      qaReport,
      publishError,
      publishReady: !publishError
    };
  });
  const displayPosts = [
    ...reviewQueue,
    ...posts.filter((post) => !reviewQueue.some((queued) => queued.id === post.id))
  ];

  return (
    <AdminPage
      title="Blog content"
      description="Manage the blog inventory, including drafts, published stories, filters, and editor access."
    >
      {searchParams?.error ? (
        <section className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5 text-rose-900">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
            Publish blocked
          </p>
          <p className="mt-2 text-sm leading-7">{searchParams.error}</p>
        </section>
      ) : null}
      {searchParams?.updated ? (
        <section className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Updated
          </p>
          <p className="mt-2 text-sm leading-7">Blog post updated successfully.</p>
        </section>
      ) : null}
      {queueEntries.length ? (
        <section className="panel-light p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Review queue</p>
              <h2 className="mt-2 font-display text-4xl text-charcoal">Stories awaiting review</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-charcoal/65">
                New story drafts land here first. Open one, review the cover and structure, then
                publish once the blocker list is clear.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/admin/content/blog/${queueEntries[0].post.id}`}
                className="rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white"
              >
                Review latest draft
              </Link>
              <Link
                href={`/admin/content/blog/${queueEntries[0].post.id}`}
                className="rounded-full border border-charcoal/10 px-5 py-3 text-sm font-semibold text-charcoal"
              >
                Open editor
              </Link>
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            {queueEntries.slice(0, 6).map(({ post, qaReport, publishError, publishReady }) => (
              <article
                key={`queue-${post.id}`}
                className="rounded-[1.5rem] border border-charcoal/10 bg-white p-5"
              >
                <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
                  <div className="overflow-hidden rounded-[1.25rem] border border-charcoal/10 bg-charcoal/[0.03]">
                    {post.imageUrl ? (
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={post.imageUrl}
                          alt={post.imageAlt || post.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[4/3] items-end bg-gradient-to-br from-ember/25 via-gold/20 to-cream px-4 py-4">
                        <p className="font-display text-2xl leading-tight text-charcoal">
                          {post.title}
                        </p>
                      </div>
                    )}
                    <div className="border-t border-charcoal/10 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/60">
                        {post.imageUrl ? "Current cover" : "Cover still needed"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="eyebrow">
                          {formatContentSourceLabel(post.source)} · {post.category}
                        </p>
                        <h3 className="mt-2 font-display text-3xl text-charcoal">{post.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-charcoal/65">{post.description}</p>
                      </div>
                      <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                        {post.status}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-charcoal/55">
                      <span>Slug: {post.slug}</span>
                      <span>Read time: {post.readTimeMinutes ?? 0} min</span>
                      <span>QA score: {qaReport.score}/100</span>
                      <span>Views: {post.viewCount}</span>
                    </div>
                    {publishError ? (
                      <div className="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                          What is blocking publish
                        </p>
                        <p className="mt-2 text-sm leading-7 text-amber-950">{publishError}</p>
                        {qaReport.blockers.length > 1 ? (
                          <ul className="mt-3 space-y-2 text-sm leading-7 text-amber-900">
                            {qaReport.blockers.slice(1).map((issue) => (
                              <li key={issue.code}>• {issue.message}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                          Ready to publish
                        </p>
                        <p className="mt-2 text-sm leading-7 text-emerald-900">
                          The editorial blocker list is clear. You can publish this story now or
                          open it for one last polish pass.
                        </p>
                      </div>
                    )}
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href={`/admin/content/blog/${post.id}`}
                        className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
                      >
                        Open review
                      </Link>
                      {publishReady ? (
                        <form action={updateBlogPostStateAction} className="flex flex-wrap gap-3">
                          <input type="hidden" name="id" value={post.id} />
                          <button
                            name="intent"
                            value="publish"
                            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                          >
                            Publish now
                          </button>
                        </form>
                      ) : (
                        <Link
                          href={`/admin/content/blog/${post.id}`}
                          className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                          Complete editorial pass
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <ContentTable
        title="Blog posts"
        filters={["status", "source", "category"]}
        rows={posts.map((post) => ({
          title: post.title,
          category: post.category,
          source: formatContentSourceLabel(post.source),
          status: post.status,
          featured: post.featured,
          views: post.viewCount
        }))}
      />
      <div className="panel-light p-6">
        <h2 className="font-display text-4xl text-charcoal">Create a blog post</h2>
        <p className="mt-3 text-sm leading-7 text-charcoal/65">
          Draft and publish long-form posts, update the hero image, and keep the archive moving.
        </p>
        <form action={createBlogPostAction} encType="multipart/form-data" className="mt-6 space-y-4">
          <input
            name="title"
            placeholder="Title"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <textarea
            name="description"
            placeholder="Short description"
            rows={3}
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <div className="grid gap-4 md:grid-cols-3">
            <input
              name="category"
              placeholder="Category"
              className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            />
            <input
              name="tags"
              placeholder="Tags, comma separated"
              className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            />
            <select
              name="status"
              className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            >
              <option value="draft">draft</option>
              <option value="pending_review">pending review</option>
              <option value="published">published</option>
            </select>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <input
              name="imageUrl"
              placeholder="Image URL"
              className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            />
            <input
              name="imageAlt"
              placeholder="Image alt text"
              className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            />
            <input
              name="imageFile"
              type="file"
              accept="image/*"
              className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-full file:border-0 file:bg-charcoal file:px-4 file:py-2 file:text-white"
            />
          </div>
          <RichTextEditor
            name="content"
            label="Body"
            content="<h2>Feature story draft</h2><p>Use this editor for handcrafted updates.</p>"
          />
          <label className="flex items-center gap-3 text-sm text-charcoal/70">
            <input type="checkbox" name="featured" />
            Featured post
          </label>
          {searchParams?.error ? (
            <p className="text-sm text-rose-600">{searchParams.error}</p>
          ) : null}
          {searchParams?.created ? (
            <p className="text-sm text-emerald-700">Blog post created successfully.</p>
          ) : null}
          {searchParams?.updated ? (
            <p className="text-sm text-emerald-700">Blog post updated successfully.</p>
          ) : null}
          <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
            Save blog post
          </button>
        </form>
      </div>
      <div className="grid gap-4">
        {displayPosts.map((post) => {
          const qaReport = buildBlogQaReport(post);

          return (
            <article key={post.id} className="panel-light p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">
                    {formatContentSourceLabel(post.source)} · {post.category}
                  </p>
                  <h2 className="mt-2 font-display text-4xl text-charcoal">{post.title}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-charcoal/65">
                    {post.description}
                  </p>
                </div>
                <div className="rounded-full bg-charcoal/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/70">
                  {post.status}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-charcoal/55">
                <span>Slug: {post.slug}</span>
                <span>Views: {post.viewCount}</span>
                <span>Featured: {post.featured ? "Yes" : "No"}</span>
                <span>QA: {qaReport.status}</span>
                <span>Source: {formatContentSourceLabel(post.source)}</span>
              </div>
              {qaReport.blockers.length ? (
                <div className="mt-4 rounded-[1.5rem] border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
                  {qaReport.blockers[0]?.message}
                </div>
              ) : qaReport.warnings.length ? (
                <div className="mt-4 rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-700">
                  {qaReport.warnings[0]?.message}
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/admin/content/blog/${post.id}`}
                  className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
                >
                  Edit post
                </Link>
                <form action={updateBlogPostStateAction} className="flex flex-wrap gap-3">
                  <input type="hidden" name="id" value={post.id} />
                  {post.status !== "published" ? (
                    <button
                      name="intent"
                      value="publish"
                      className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Publish
                    </button>
                  ) : null}
                  {post.status !== "archived" ? (
                    <button
                      name="intent"
                      value="archive"
                      className="rounded-full bg-charcoal px-4 py-2 text-sm font-semibold text-white"
                    >
                      Archive
                    </button>
                  ) : null}
                  <button
                    name="intent"
                    value={post.featured ? "unfeature" : "feature"}
                    className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
                  >
                    {post.featured ? "Remove featured" : "Mark featured"}
                  </button>
                </form>
              </div>
            </article>
          );
        })}
      </div>
    </AdminPage>
  );
}
