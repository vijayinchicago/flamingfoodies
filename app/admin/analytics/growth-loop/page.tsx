import Link from "next/link";

import { AdminPage } from "@/components/admin/admin-page";
import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import { runGrowthLoopAction } from "@/lib/actions/admin-growth";
import { getGrowthLoopReport } from "@/lib/services/growth-loop";

export default async function AdminGrowthLoopPage({
  searchParams
}: {
  searchParams?: {
    queued?: string;
    posts?: string;
    skipped?: string;
  };
}) {
  const report = await getGrowthLoopReport(30);
  const hasWinners =
    report.winners.acquisition.length ||
    report.winners.activation.length ||
    report.winners.referral.length ||
    report.winners.revenue.length;

  return (
    <AdminPage
      title="Growth loop"
      description="Live winners, auto-briefs, and daily re-promotion candidates pulled from real traffic, share, and affiliate signals."
    >
      {searchParams?.queued ? (
        <article className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Queued {searchParams.queued} winner page(s) and {searchParams.posts ?? "0"} social post(s).
          {searchParams.skipped ? ` Skipped ${searchParams.skipped} recent duplicate(s).` : null}
        </article>
      ) : null}

      <div className="grid gap-6 md:grid-cols-5">
        <article className="panel-light p-6">
          <p className="eyebrow">Tracked pages</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{report.totals.trackedPages}</h2>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">Visitors</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{report.pirateSummary.acquisitionVisitors}</h2>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">Activation</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{report.pirateSummary.activationRate}</h2>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">Shares</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{report.pirateSummary.shareEvents}</h2>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">Affiliate clicks</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{report.pirateSummary.affiliateClicks}</h2>
        </article>
      </div>

      <div className="panel-light p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Winner promotion</p>
            <h2 className="mt-3 font-display text-3xl text-charcoal">
              Re-promote pages that are already proving something.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-charcoal/65">
              The daily growth-loop cron queues up to two published winner pages for social when they
              have not been promoted in the last 7 days. This keeps us redistributing proven pages
              instead of only chasing brand-new content.
            </p>
          </div>
          <form action={runGrowthLoopAction}>
            <AdminSubmitButton
              idleLabel="Queue winner promotion"
              pendingLabel="Queueing..."
              className="rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white"
            />
          </form>
        </div>
      </div>

      {hasWinners ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {([
            ["Acquisition winners", report.winners.acquisition],
            ["Activation winners", report.winners.activation],
            ["Referral winners", report.winners.referral],
            ["Revenue winners", report.winners.revenue]
          ] as const).map(([title, items]) => (
            <article key={title} className="panel-light p-6">
              <p className="eyebrow">{title}</p>
              <div className="mt-4 grid gap-4">
                {items.length ? (
                  items.map((item) => (
                    <article key={`${title}-${item.path}`} className="rounded-[1.5rem] border border-charcoal/10 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h2 className="font-display text-3xl text-charcoal">{item.label}</h2>
                          <p className="mt-2 text-sm text-charcoal/60">{item.path}</p>
                        </div>
                        <Link
                          href={item.path}
                          className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
                        >
                          Open page
                        </Link>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                        <span>{item.views} views</span>
                        <span>{item.interactions} interactions</span>
                        <span>{item.shares} shares</span>
                        <span>{item.affiliateClicks} clicks</span>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-charcoal/65">{item.reason}</p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-charcoal/60">
                    No live winners have been recorded for this stage in the current window yet.
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <article className="panel-light p-6">
          <p className="text-sm text-charcoal/60">
            No real winner pages have surfaced yet. As soon as traffic, shares, or affiliate clicks
            accumulate, this page will turn them into briefs and re-promotion candidates.
          </p>
        </article>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="panel-light p-6">
          <p className="eyebrow">Auto-briefs</p>
          <div className="mt-4 grid gap-4">
            {report.briefs.length ? (
              report.briefs.map((brief) => (
                <article key={`${brief.stage}-${brief.targetPath}`} className="rounded-[1.5rem] border border-charcoal/10 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-3xl text-charcoal">{brief.title}</h2>
                      <p className="mt-2 text-sm text-charcoal/60">{brief.targetPath}</p>
                    </div>
                    <span className="rounded-full bg-charcoal/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal/60">
                      {brief.stage}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-charcoal/65">{brief.whyNow}</p>
                  <div className="mt-4 space-y-2 text-sm text-charcoal/70">
                    {brief.moves.map((move) => (
                      <p key={move}>• {move}</p>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-charcoal/60">
                Auto-briefs will appear once the site has enough live signal to tell us where to
                double down.
              </p>
            )}
          </div>
        </article>

        <article className="panel-light p-6">
          <p className="eyebrow">Auto-promotion candidates</p>
          <div className="mt-4 grid gap-4">
            {report.autoPromotionCandidates.length ? (
              report.autoPromotionCandidates.map((candidate) => (
                <article key={candidate.path} className="rounded-[1.5rem] border border-charcoal/10 p-4">
                  <h2 className="font-display text-3xl text-charcoal">{candidate.label}</h2>
                  <p className="mt-2 text-sm text-charcoal/60">{candidate.path}</p>
                  <p className="mt-4 text-sm leading-7 text-charcoal/65">{candidate.reason}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                    <span>{candidate.views} views</span>
                    <span>{candidate.shares} shares</span>
                    <span>{candidate.affiliateClicks} clicks</span>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-charcoal/60">
                No promotion candidates yet. Once a published recipe, review, or post proves it can
                pull traffic or clicks, it will show up here.
              </p>
            )}
          </div>
        </article>
      </div>
    </AdminPage>
  );
}
