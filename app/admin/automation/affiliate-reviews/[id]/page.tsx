import Link from "next/link";
import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import { AffiliateReviewStatus, reviewJobStatus, reviewTime } from "@/components/admin/affiliate-review-status";
import { saveAffiliateReviewNoteAction, triggerAffiliateReviewAction } from "@/lib/actions/admin-affiliate-reviews";
import { AFFILIATE_REVIEW_PATH, REVIEW_DISCLOSURE, REVIEW_METHOD, safeSourceUrl } from "@/lib/affiliate-review";
import { getAffiliateReviewJob } from "@/lib/services/affiliate-reviews";
import { requireAdmin } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export default async function AffiliateReviewDetail({ params, searchParams }: { params: { id: string }; searchParams?: { saved?: string } }) {
  await requireAdmin();
  const result = await getAffiliateReviewJob(params.id);
  if (!result) notFound();
  const { job, attempts, generations } = result;
  const status = reviewJobStatus(job);
  const active = ["researching", "writing", "checking"].includes(status);
  const knownTokens = generations.reduce((total, generation) => total + (generation.input_tokens ?? 0) + (generation.output_tokens ?? 0), 0);
  const cost = generations.reduce((total, generation) => total + Number(generation.estimated_cost_usd ?? 0), 0);
  const partialUsage = generations.some((generation) => generation.input_tokens === null);
  return <AdminPage title={job.product.product} description="Private affiliate review draft · Miles Hart · not scheduled for publication">
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-4"><Link className="text-sm underline" href={AFFILIATE_REVIEW_PATH}>← Product review queue</Link><AffiliateReviewStatus job={job} /><Link className="text-sm underline" href={`${AFFILIATE_REVIEW_PATH}/${job.id}`}>Refresh details</Link></div>
      {searchParams?.saved && <p role="status" className="rounded-2xl bg-emerald-50 p-4">Review note saved. Nothing has been published.</p>}
      <section className="panel-light p-6">
        <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-charcoal/60">Attempts</p><p className="mt-1 font-semibold">{job.attempt_count} / 3</p></div>
          <div><p className="text-charcoal/60">Recorded tokens</p><p className="mt-1 font-semibold">{knownTokens.toLocaleString()}{partialUsage ? " (partial)" : ""}</p></div>
          <div><p className="text-charcoal/60">Estimated recorded cost</p><p className="mt-1 font-semibold">${cost.toFixed(4)}{partialUsage || generations.some((g) => g.estimated_cost_usd === null) ? " (partial)" : ""}</p></div>
          <div><p className="text-charcoal/60">Updated</p><p className="mt-1">{reviewTime(job.updated_at)}</p></div>
        </div>
        <p className="mt-4 break-all text-xs text-charcoal/60">Product key: {job.affiliate_key} · Job: {job.id}</p>
        <p className="mt-3 text-sm">Tracked link: <Link prefetch={false} className="underline" href={job.product.trackedUrl} target="_blank" rel="sponsored noopener">{job.product.trackedUrl}</Link></p>
        <p className="mt-2 break-all text-xs text-charcoal/60">Destination snapshot: {job.product.destinationUrl}</p>
        {active && <p role="status" className="mt-4 text-sm">Worker is {status}. Each stage has a 75-second request limit. Refresh to see newly saved stages.</p>}
        {status === "timed_out" && <p role="alert" className="mt-4 text-rose-700">The worker lease expired. Inspect the saved stages before retrying; unreported provider usage is unknown, not zero.</p>}
        {job.error_message && <p role="alert" className="mt-4 whitespace-pre-wrap text-sm text-rose-700">{job.error_message}</p>}
        {["failed", "timed_out", "blocked"].includes(status) && job.attempt_count < 3 && <form action={triggerAffiliateReviewAction} className="mt-4">
          <input type="hidden" name="requestId" value={randomUUID()} /><input type="hidden" name="retryId" value={job.id} />
          <AdminSubmitButton idleLabel="Retry this product" pendingLabel="Retrying research…" className="button-secondary" />
          <p className="mt-2 text-xs text-charcoal/60">Daily caps still apply. Earlier stage responses remain in the history below.</p>
        </form>}
      </section>
      <section className="panel-light p-6">
        <h2 className="font-display text-2xl">QA & required human checks</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6">
          {(job.qa?.blockers ?? []).map((issue, index) => <li key={index} className="text-rose-700">{issue}</li>)}
          {(job.qa?.manualChecks ?? ["Human fact-check, exact-product image rights and editorial approval are required. No automatic publication."]).map((issue, index) => <li key={`manual-${index}`}>{issue}</li>)}
        </ul>
      </section>
      {job.draft && <article className="panel-light p-6 sm:p-8">
        {active && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">A retry is running. This preview may still be from an earlier attempt; check the stage history below.</p>}
        <p className="eyebrow">Draft preview · Miles Hart</p><h2 className="mt-3 font-display text-3xl">{job.draft.title}</h2>
        <p className="mt-4 leading-7">{job.draft.description}</p>
        <p className="mt-4 text-sm text-charcoal/65">{REVIEW_DISCLOSURE}</p><p className="mt-2 text-sm text-charcoal/65">{REVIEW_METHOD}</p>
        {job.draft.sections.map((section, index) => <section className="mt-7" key={index}>
          <h3 className="font-display text-2xl">{section.heading}</h3><p className="mt-3 whitespace-pre-wrap leading-7">{section.body}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">{section.sourceUrls.filter(safeSourceUrl).map((url, sourceIndex) => <a className="underline" key={url} href={url} target="_blank" rel="noopener noreferrer">Source {sourceIndex + 1}</a>)}</div>
        </section>)}
        <div className="mt-7 grid gap-6 sm:grid-cols-2">{[{ title: "Potential advantages", items: job.draft.pros }, { title: "Limitations & tradeoffs", items: job.draft.cons }].map((group) => <section key={group.title}><h3 className="font-display text-xl">{group.title}</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">{group.items.map((item) => <li key={item}>{item}</li>)}</ul></section>)}</div>
        {job.draft.unknowns.length > 0 && <section className="mt-7"><h3 className="font-display text-xl">Still to verify</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{job.draft.unknowns.map((item) => <li key={item}>{item}</li>)}</ul></section>}
      </article>}
      {job.research && <section className="panel-light p-6">
        <h2 className="font-display text-2xl">Research evidence</h2>
        <p className="mt-3 text-xs text-charcoal/60">Provider-returned citations, not independently verified by a human. Confirm model, variant and claims before using this draft.</p>
        <div className="mt-4 space-y-4">{job.research.citations.map((citation, index) => <div className="rounded-xl border border-charcoal/10 p-4" key={index}>
          {safeSourceUrl(citation.url) && <a className="text-sm font-semibold underline" href={citation.url} target="_blank" rel="noopener noreferrer">{citation.title}</a>}
          <p className="mt-2 break-all text-xs text-charcoal/50">{citation.url}</p><blockquote className="mt-2 text-sm leading-6">{citation.citedText}</blockquote>
        </div>)}</div>
        <details className="mt-5"><summary className="cursor-pointer text-sm font-semibold">Full research brief</summary><pre className="mt-3 whitespace-pre-wrap break-words text-xs leading-6">{job.research.brief}</pre></details>
      </section>}
      <section className="panel-light p-6">
        <h2 className="font-display text-2xl">Stage history & usage</h2>
        <p className="mt-3 text-xs leading-5 text-charcoal/60">Each call is saved before it starts. Raw responses survive invalid JSON, QA failure and retries. Cost is an estimate, not an invoice; failed requests may have unreported usage.</p>
        {attempts.map((attempt) => <div key={attempt.id} className="mt-5 border-t border-charcoal/10 pt-4">
          <p className="text-sm font-semibold">Attempt · {reviewTime(attempt.started_at)} {attempt.run_id && <Link className="ml-2 underline" href={`/admin/automation/runs?agent=affiliate-product-reviewer&runId=${attempt.run_id}`}>Run #{attempt.run_id}</Link>}</p>
          {generations.filter((generation) => generation.attempt_id === attempt.id).map((generation) => <details id={`generation-${generation.id}`} key={generation.id} className="mt-3 rounded-xl bg-charcoal/5 p-4">
            <summary className="cursor-pointer text-sm">{generation.stage} · {generation.status} · {generation.input_tokens ?? "?"} in / {generation.output_tokens ?? "?"} out · {generation.search_requests ?? "?"} searches</summary>
            <p className="mt-3 text-xs">{generation.model} · {generation.id}</p><p className="mt-2 text-xs">{reviewTime(generation.started_at)} → {reviewTime(generation.completed_at)}</p>
            {generation.error_message && <p className="mt-3 text-sm text-rose-700">{generation.error_message}</p>}
            <details className="mt-3"><summary className="cursor-pointer text-xs">Saved response</summary><pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(generation.raw_response, null, 2)}</pre></details>
            <details className="mt-3"><summary className="cursor-pointer text-xs">Saved prompt</summary><pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(generation.input_payload, null, 2)}</pre></details>
          </details>)}
        </div>)}
      </section>
      {!active && <section className="panel-light p-6"><h2 className="font-display text-2xl">Your review notes</h2>
        <p className="mt-3 text-sm text-charcoal/60">Saving a note does not approve or publish the draft. Publishing is intentionally unavailable during this initial review period.</p>
        <form action={saveAffiliateReviewNoteAction} className="mt-4 grid gap-4"><input type="hidden" name="id" value={job.id} />
          <label className="grid gap-2 text-sm">Corrections, source checks or feedback<textarea name="note" className="input min-h-32" maxLength={5000} defaultValue={job.review_note ?? ""} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="dismiss" defaultChecked={job.status === "dismissed"} /> Dismiss this draft (keeps history and duplicate protection)</label>
          <div><AdminSubmitButton idleLabel="Save review note" className="button-secondary" /></div>
        </form>
      </section>}
    </div>
  </AdminPage>;
}
