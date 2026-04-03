import Link from "next/link";
import { notFound } from "next/navigation";

import { updateBlogPostAction } from "@/lib/actions/admin-content";
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

  return (
    <AdminPage
      title="Edit Blog Post"
      description="Update copy, metadata, and media without losing the publish trail."
    >
      <Link
        href="/admin/content/blog"
        className="inline-flex rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
      >
        Back to blog content
      </Link>
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
