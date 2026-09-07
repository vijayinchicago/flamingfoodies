import type { AffiliateReviewJob } from "@/lib/services/affiliate-reviews";

export function reviewJobStatus(job: AffiliateReviewJob) {
  return ["researching", "writing", "checking"].includes(job.status) && job.lease_expires_at &&
    new Date(job.lease_expires_at).getTime() < Date.now() ? "timed_out" : job.status;
}

export function AffiliateReviewStatus({ job }: { job: AffiliateReviewJob }) {
  const status = reviewJobStatus(job);
  const tone = status === "awaiting_review" ? "bg-emerald-50 text-emerald-800" :
    ["blocked", "failed", "timed_out"].includes(status) ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-900";
  return <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{status.replaceAll("_", " ")}</span>;
}

export function reviewTime(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(new Date(value)) + " ET" : "—";
}
