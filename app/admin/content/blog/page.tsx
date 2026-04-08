import Link from "next/link";

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

  return (
    <AdminPage
      title="Blog content"
      description="Manage the blog inventory, including drafts, published stories, filters, and editor access."
    >
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
        {posts.map((post) => (
          <article key={post.id} className="panel-light p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{post.category}</p>
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
              <span>Source: {formatContentSourceLabel(post.source)}</span>
            </div>
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
        ))}
      </div>
    </AdminPage>
  );
}
