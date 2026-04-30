import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buildBlogQaReport, getBlogQaPublishError } from "@/lib/blog-qa";
import { updateBlogPostAction, updateBlogPostStateAction } from "@/lib/actions/admin-content";
import { AdminPage } from "@/components/admin/admin-page";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { getAdminBlogPostById } from "@/lib/services/content";

export default async function AdminBlogEditPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { updated?: string; error?: string };
}) {
  const post = await getAdminBlogPostById(Number(params.id));

  if (!post) {
    notFound();
  }

  const qaReport = buildBlogQaReport(post);
  const publishError = getBlogQaPublishError(qaReport);

  return (
    <AdminPage
      title="Edit Blog Post"
      description="Update copy, metadata, and media without losing the publish trail."
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Link
          href="/admin/content/blog"
          className="inline-flex rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
        >
          Back to blog content
        </Link>
        {post.status !== "published" ? (
          publishError ? (
            <div className="rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
              Complete editorial pass to publish
            </div>
          ) : (
            <form action={updateBlogPostStateAction}>
              <input type="hidden" name="id" value={post.id} />
              <input type="hidden" name="redirectTo" value={`/admin/content/blog/${post.id}`} />
              <button
                name="intent"
                value="publish"
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Publish now
              </button>
            </form>
          )
        ) : (
          <div className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            Published
          </div>
        )}
      </div>
      <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.03] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Cover review</p>
              <h2 className="mt-2 font-display text-3xl text-charcoal">Check the story cover</h2>
            </div>
            <span className="rounded-full bg-charcoal px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
              {post.imageUrl ? "Current cover" : "Cover still needed"}
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-charcoal/10 bg-white">
            {post.imageUrl ? (
              <div className="relative aspect-[4/3] bg-charcoal/5">
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
                <p className="font-display text-3xl leading-tight text-charcoal">{post.title}</p>
              </div>
            )}
            <div className="border-t border-charcoal/10 p-4">
              <p className="text-sm leading-7 text-charcoal/68">
                Review the current cover and body together before publishing. Story drafts need a
                strong structure and a reader-friendly lead, not just a finished status.
              </p>
              <p className="mt-3 text-xs leading-6 text-charcoal/55">
                Alt text: {post.imageAlt || "Add descriptive alt text before publishing."}
              </p>
            </div>
          </div>
        </aside>
        <section className="rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.03] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Editorial QA</p>
              <h2 className="mt-2 font-display text-3xl text-charcoal">
                Story QA {qaReport.status} · {qaReport.score}/100
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-charcoal/65">
                Publishing is blocked while the blocker list is non-empty. Warnings are polish
                tasks that can still improve search and reader trust.
              </p>
            </div>
            <div className="rounded-full bg-charcoal/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/70">
              {qaReport.blockers.length} blockers · {qaReport.warnings.length} warnings
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">Blockers</p>
              {qaReport.blockers.length ? (
                <ul className="mt-3 space-y-2 text-sm leading-7 text-rose-700">
                  {qaReport.blockers.map((issue) => (
                    <li key={issue.code}>• {issue.message}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-emerald-700">No blocker-level issues right now.</p>
              )}
            </div>
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Warnings</p>
              {qaReport.warnings.length ? (
                <ul className="mt-3 space-y-2 text-sm leading-7 text-amber-700">
                  {qaReport.warnings.map((issue) => (
                    <li key={issue.code}>• {issue.message}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-emerald-700">No warning-level issues right now.</p>
              )}
            </div>
          </div>
        </section>
      </section>
      <form action={updateBlogPostAction} encType="multipart/form-data" className="panel-light mt-6 space-y-4 p-6">
        <input type="hidden" name="id" value={post.id} />
        <input type="hidden" name="redirectTo" value={`/admin/content/blog/${post.id}`} />
        <input
          name="title"
          defaultValue={post.title}
          placeholder="Title"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <textarea
          name="description"
          defaultValue={post.description}
          placeholder="Short description"
          rows={3}
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <div className="grid gap-4 md:grid-cols-3">
          <input
            name="category"
            defaultValue={post.category}
            placeholder="Category"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <input
            name="tags"
            defaultValue={post.tags.join(", ")}
            placeholder="Tags, comma separated"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <select
            name="status"
            defaultValue={post.status}
            className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          >
            <option value="draft">draft</option>
            <option value="pending_review">pending review</option>
            <option value="needs_review">needs review</option>
            <option value="published">published</option>
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <input
            name="imageUrl"
            defaultValue={post.imageUrl}
            placeholder="Image URL"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <input
            name="imageAlt"
            defaultValue={post.imageAlt}
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
        <RichTextEditor name="content" label="Body" content={post.content} />
        <label className="flex items-center gap-3 text-sm text-charcoal/70">
          <input type="checkbox" name="featured" defaultChecked={post.featured} />
          Featured post
        </label>
        {searchParams?.error ? <p className="text-sm text-rose-600">{searchParams.error}</p> : null}
        {searchParams?.updated ? <p className="text-sm text-emerald-700">Blog post updated successfully.</p> : null}
        <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
          Save changes
        </button>
      </form>
    </AdminPage>
  );
}
