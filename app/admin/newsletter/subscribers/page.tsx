import { AdminPage } from "@/components/admin/admin-page";
import { ContentTable } from "@/components/admin/content-table";
import { getSubscribers } from "@/lib/services/admin";

export default async function AdminSubscribersPage() {
  const subscribers = await getSubscribers();

  return (
    <AdminPage
      title="Subscribers"
      description="Source-aware list for exports, tagging, and health checks."
    >
      <ContentTable
        title="Subscribers"
        rows={subscribers.map((subscriber) => ({
          email: subscriber.email,
          firstName: subscriber.firstName,
          source: subscriber.source,
          status: subscriber.status,
          tags: subscriber.tags.join(", ")
        }))}
      />
    </AdminPage>
  );
}
