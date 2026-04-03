import {
  toggleUserBanAction,
  updateUserRoleAction
} from "@/lib/actions/admin-community";
import { AdminPage } from "@/components/admin/admin-page";
import { ContentTable } from "@/components/admin/content-table";
import { getAdminUsers } from "@/lib/services/content";

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams?: { updated?: string; error?: string };
}) {
  const users = await getAdminUsers();

  return (
    <AdminPage
      title="Community users"
      description="Searchable members table with heat scores and role state."
    >
      {searchParams?.updated ? (
        <p className="text-sm text-emerald-700">User updated successfully.</p>
      ) : null}
      {searchParams?.error ? (
        <p className="text-sm text-rose-600">{searchParams.error}</p>
      ) : null}
      <ContentTable
        title="Users"
        rows={users.map((user) => ({
          displayName: user.displayName,
          username: user.username,
          role: user.role,
          heatScore: user.heatScore,
          banned: user.isBanned
        }))}
      />
      <div className="grid gap-4">
        {users.map((user) => (
          <article key={user.id} className="panel-light p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl text-charcoal">{user.displayName}</h2>
                <p className="mt-1 text-sm text-charcoal/60">@{user.username}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-charcoal/55">
                  <span>Role: {user.role}</span>
                  <span>Heat score: {user.heatScore}</span>
                  <span>Followers: {user.followerCount || 0}</span>
                  <span>Banned: {user.isBanned ? "Yes" : "No"}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <form action={updateUserRoleAction} className="flex items-center gap-3">
                  <input type="hidden" name="userId" value={user.id} />
                  <select
                    name="role"
                    defaultValue={user.role}
                    className="rounded-full border border-charcoal/10 px-4 py-2 text-sm"
                  >
                    <option value="user">user</option>
                    <option value="contributor">contributor</option>
                    <option value="moderator">moderator</option>
                    <option value="admin">admin</option>
                  </select>
                  <button className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal">
                    Update role
                  </button>
                </form>
                <form action={toggleUserBanAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="username" value={user.username} />
                  <button
                    name="intent"
                    value={user.isBanned ? "unban" : "ban"}
                    className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${
                      user.isBanned ? "bg-emerald-600" : "bg-rose-600"
                    }`}
                  >
                    {user.isBanned ? "Unban" : "Ban user"}
                  </button>
                </form>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AdminPage>
  );
}
