import Link from "next/link";
import { randomUUID } from "node:crypto";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import { AffiliateReviewStatus, reviewJobStatus, reviewTime } from "@/components/admin/affiliate-review-status";
import { triggerAffiliateReviewAction, updateAffiliateReviewerSettingsAction } from "@/lib/actions/admin-affiliate-reviews";
import { AFFILIATE_REVIEW_AGENT, AFFILIATE_REVIEW_PATH } from "@/lib/affiliate-review";
import { getAutomationAgent } from "@/lib/services/automation-control";
import { getAffiliateReviewCatalog, listAffiliateReviewJobs } from "@/lib/services/affiliate-reviews";
import { requireAdmin } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export default async function AffiliateReviewsPage({ searchParams }: { searchParams?: { error?: string; notice?: string } }) {
  await requireAdmin();
  let data;
  try {
    const [agent, jobs, catalog] = await Promise.all([getAutomationAgent(AFFILIATE_REVIEW_AGENT), listAffiliateReviewJobs(), getAffiliateReviewCatalog()]);
    data = { agent, jobs, catalog };
  } catch (error) {
    return <AdminPage title="Affiliate Product Reviewer" description="Private research drafts from your existing affiliate catalog.">
      <p className="panel-light p-6">Reviewer setup is incomplete or the database is unavailable. No generation has been started.</p>
      <p className="mt-4 text-sm text-rose-700">{error instanceof Error ? error.message : "Unable to load reviewer data"}</p>
    </AdminPage>;
  }
  const { agent, jobs, catalog } = data;
  const eligible = catalog.filter((entry) => !entry.reason);
  const running = jobs.some((job) => ["researching", "writing", "checking"].includes(reviewJobStatus(job)));
  return <AdminPage title="Affiliate Product Reviewer" description="Source-backed buying advice in the Miles Hart voice. Private drafts only—nothing here publishes automatically.">
    <div className="grid gap-6">
      {searchParams?.error && <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-rose-800">{searchParams.error}</p>}
      {searchParams?.notice && <p role="status" className="rounded-2xl bg-emerald-50 p-4 text-emerald-800">{searchParams.notice}</p>}
      <section className="panel-light p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl">Two research drafts a week</h2>
            <p className="mt-3 text-sm leading-6 text-charcoal/70">Monday and Thursday at 08:00 UTC (4am EDT / 3am EST). Each run selects one unreviewed product with an exact affiliate link. Failed jobs do not retry automatically.</p>
            <p className="mt-2 text-sm leading-6 text-charcoal/70">Research → writing → QA → your review. We preserve source citations, every model response and usage. An exact-product image and a human fact-check are still required.</p>
          </div>
          <div className="grid gap-3">
            <form action={triggerAffiliateReviewAction}>
              <input type="hidden" name="requestId" value={randomUUID()} />
              {agent?.isEnabled && eligible.length > 0 && !running ?
                <AdminSubmitButton idleLabel="Generate one draft" pendingLabel="Researching & writing…" className="button-primary w-full" /> :
                <button className="button-primary w-full opacity-50" disabled>{running ? "Review running" : !agent?.isEnabled ? "Reviewer paused" : "No eligible products"}</button>}
            </form>
            <Link className="text-sm underline" href="/admin/automation/runs?agent=affiliate-product-reviewer">View run history</Link>
            <Link className="text-sm underline" href={AFFILIATE_REVIEW_PATH}>Refresh queue</Link>
          </div>
        </div>
      </section>
      <section className="panel-light p-6">
        <h2 className="font-display text-2xl">Independent controls</h2>
        <form action={updateAffiliateReviewerSettingsAction} className="mt-4 flex flex-wrap items-end gap-5">
          <label className="flex items-center gap-2 pb-3 text-sm"><input type="checkbox" name="isEnabled" defaultChecked={agent?.isEnabled ?? false} /> Reviewer enabled</label>
          <label className="grid gap-2 text-sm">Daily attempt cap (ET)<input className="input w-28" type="number" name="dailyRunCap" min={1} max={6} required defaultValue={agent?.dailyRunCap ?? 2} /></label>
          <label className="grid gap-2 text-sm">Daily draft cap (ET)<input className="input w-28" type="number" name="dailyDraftCap" min={1} max={3} required defaultValue={agent?.dailyMutationCap ?? 1} /></label>
          <AdminSubmitButton idleLabel="Save controls" className="button-secondary" />
        </form>
        <p className="mt-4 text-xs leading-5 text-charcoal/60">One product per invocation, at most three attempts per product. Raising a daily cap allows extra manual runs; it does not add cron runs or enable publishing. Site-wide pauses still apply.</p>
      </section>
      <section className="panel-light overflow-hidden">
        <div className="p-6"><h2 className="font-display text-2xl">Draft queue</h2><p className="mt-2 text-sm text-charcoal/60">Newest 100 products. Open a row for sources, draft text, QA and all attempts.</p></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="bg-charcoal/5"><tr>{["Product", "Stage", "Attempts", "Details", "Updated"].map((heading) => <th key={heading} className="p-4">{heading}</th>)}</tr></thead>
          <tbody>{jobs.map((job) => <tr key={job.id} className="border-t border-charcoal/10">
            <td className="p-4"><Link prefetch={false} className="font-semibold underline" href={`${AFFILIATE_REVIEW_PATH}/${job.id}`}>{job.product.product}</Link><p className="mt-1 text-xs text-charcoal/60">{job.product.category.replaceAll("_", " ")}</p></td>
            <td className="p-4"><AffiliateReviewStatus job={job} /></td><td className="p-4">{job.attempt_count} / 3</td>
            <td className="max-w-sm p-4 text-xs leading-5">{job.error_message || job.qa?.blockers[0] || (job.draft ? "Human fact-check and exact image required" : "Stage output saved as each call completes")}</td>
            <td className="whitespace-nowrap p-4 text-xs">{reviewTime(job.updated_at)}</td>
          </tr>)}</tbody>
        </table></div>
        {!jobs.length && <p className="p-6 text-sm text-charcoal/60">No drafts yet. Generate the first one above, or wait for the next scheduled run.</p>}
      </section>
      <details className="panel-light p-6" open>
        <summary className="cursor-pointer font-display text-2xl">Product selection · {eligible.length} eligible / {catalog.length} catalog entries</summary>
        <p className="mt-3 text-sm text-charcoal/60">Existing reviews, queued products and aliases are excluded. Category rotation adds variety. Search-only affiliate destinations need an exact link in <Link className="underline" href="/admin/settings/affiliates">Affiliate settings</Link>.</p>
        <ul className="mt-4 divide-y divide-charcoal/10">{catalog.map((entry) => <li key={entry.key} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
          <span>{entry.product} <span className="text-charcoal/50">({entry.category.replaceAll("_", " ")})</span></span>
          <span className={entry.reason ? "text-charcoal/60" : "text-emerald-700"}>{entry.reason || "Eligible"}</span>
        </li>)}</ul>
      </details>
    </div>
  </AdminPage>;
}
