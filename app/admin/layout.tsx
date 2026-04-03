import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/supabase/auth";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <section className="bg-cream">
      <div className="container-shell py-12">
        <div className="admin-grid">
          <AdminSidebar />
          <div>{children}</div>
        </div>
      </div>
    </section>
  );
}
