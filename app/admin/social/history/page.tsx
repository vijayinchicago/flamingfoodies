import { AdminPage } from "@/components/admin/admin-page";
import { getSocialQueue } from "@/lib/services/admin";

export default async function AdminSocialHistoryPage() {
  const socialPosts = await getSocialQueue("published");

  return (
    <AdminPage
      title="Social history"
      description="Published content with synced engagement snapshots."
    >
      <div className="grid gap-4">
        {socialPosts.map((post) => (
          <article key={post.id} className="panel-light p-5">
            <h2 className="font-display text-3xl text-charcoal">{post.platform}</h2>
            <p className="mt-3 text-sm text-charcoal/70">{post.caption}</p>
            <p className="mt-3 text-sm text-charcoal/55">
              Impressions: {post.engagement?.impressions || 0}
            </p>
            {post.platformPostId ? (
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-charcoal/45">
                Provider post: {post.platformPostId}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </AdminPage>
  );
}
