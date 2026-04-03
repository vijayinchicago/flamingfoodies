import { updateSiteSettingAction } from "@/lib/actions/admin-settings";
import { AdminPage } from "@/components/admin/admin-page";
import { getSiteSettings } from "@/lib/services/admin";

export default async function AdminSettingsGeneralPage({
  searchParams
}: {
  searchParams?: { updated?: string; error?: string };
}) {
  const settings = await getSiteSettings();

  return (
    <AdminPage
      title="General settings"
      description="Feature flags and platform-wide runtime settings."
    >
      {searchParams?.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {searchParams.error}
        </p>
      ) : null}
      {searchParams?.updated ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Setting updated.
        </p>
      ) : null}
      <div className="grid gap-4">
        {settings.map((setting) => (
          <form key={setting.key} action={updateSiteSettingAction} className="panel-light p-5">
            <input type="hidden" name="key" value={setting.key} />
            <p className="text-xs uppercase tracking-[0.2em] text-ember">{setting.key}</p>
            <textarea
              name="value"
              rows={4}
              defaultValue={
                typeof setting.value === "string"
                  ? setting.value
                  : JSON.stringify(setting.value, null, 2)
              }
              className="mt-3 w-full rounded-2xl border border-charcoal/10 px-4 py-3 text-sm text-charcoal/70 outline-none focus:border-ember"
            />
            <button className="mt-4 rounded-full bg-charcoal px-4 py-2 text-sm font-semibold text-white">
              Save setting
            </button>
          </form>
        ))}
      </div>
    </AdminPage>
  );
}
