import { updateSiteSettingAction } from "@/lib/actions/admin-settings";
import { AdminPage } from "@/components/admin/admin-page";
import { getSiteSettings } from "@/lib/services/admin";

export default async function AdminSocialTemplatesPage({
  searchParams
}: {
  searchParams?: { updated?: string };
}) {
  const settings = await getSiteSettings();
  const templates = settings.filter((setting) => setting.key.startsWith("social_template_"));

  return (
    <AdminPage
      title="Caption templates"
      description="Platform-specific tone prompts for the automation pipeline."
    >
      {searchParams?.updated ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Template updated.
        </p>
      ) : null}
      <div className="grid gap-4">
        {templates.map((template) => (
          <form key={template.key} action={updateSiteSettingAction} className="panel-light p-6">
            <input type="hidden" name="key" value={template.key} />
            <input type="hidden" name="redirectPath" value="/admin/social/templates" />
            <p className="eyebrow">Template</p>
            <h2 className="mt-2 font-display text-4xl text-charcoal">{template.key}</h2>
            <textarea
              name="value"
              rows={5}
              defaultValue={
                typeof template.value === "string"
                  ? template.value
                  : JSON.stringify(template.value, null, 2)
              }
              className="mt-4 w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            />
            <button className="mt-4 rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 text-sm font-semibold text-white">
              Save template
            </button>
          </form>
        ))}
      </div>
    </AdminPage>
  );
}
