import Link from "next/link";

import { AdminPage } from "@/components/admin/admin-page";
import { updateFestivalStateAction } from "@/lib/actions/admin-festivals";
import {
  estimateFestivalEndDay,
  getAdminFestivals,
  getFestivalStatus,
  getMonthName,
  type AdminFestival
} from "@/lib/festivals";

export const dynamic = "force-dynamic";

const REDIRECT_TO = "/admin/content/festivals";

function StatusPill({ status }: { status: "draft" | "published" }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
        Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-800">
      Draft
    </span>
  );
}

function SourcePill({ source }: { source: string }) {
  const label = source === "ai_discovered" ? "AI discovered" : source === "editorial" ? "Editorial" : source;
  const cls =
    source === "ai_discovered"
      ? "bg-violet-100 text-violet-800"
      : "bg-charcoal/[0.06] text-charcoal/70";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
}

function ActionButton({
  slug,
  intent,
  label,
  className
}: {
  slug: string;
  intent: "publish" | "unpublish" | "delete";
  label: string;
  className: string;
}) {
  return (
    <form action={updateFestivalStateAction} className="inline">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="redirectTo" value={REDIRECT_TO} />
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}

function FestivalRow({ festival }: { festival: AdminFestival }) {
  const now = new Date();
  const status = getFestivalStatus(festival, now);
  const endDay = estimateFestivalEndDay(festival, now.getFullYear());
  const hasExplicitDays = typeof festival.startDay === "number" && typeof festival.endDay === "number";

  return (
    <tr className="border-b border-charcoal/10 align-top">
      <td className="px-3 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/festivals/${festival.slug}`}
              className="font-display text-lg text-charcoal hover:text-ember"
            >
              {festival.name}
            </Link>
            <StatusPill status={festival.status} />
            <SourcePill source={festival.source} />
          </div>
          <p className="text-xs text-charcoal/55">
            {festival.city}, {festival.stateCode} · {getMonthName(festival.month)} · {festival.dateRange}
          </p>
          {!hasExplicitDays ? (
            <p className="text-[11px] text-amber-700">
              Missing explicit start_day / end_day — runtime falls back to dateRange parsing
              {status === "happening-now"
                ? " (currently flagged as happening this month — verify before publishing)"
                : ""}.
            </p>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-4 text-xs text-charcoal/65">
        <div>{status}</div>
        {hasExplicitDays ? (
          <div className="text-charcoal/45">
            {festival.startDay}–{festival.endDay} (end day {endDay})
          </div>
        ) : (
          <div className="text-charcoal/45">est. end day {endDay}</div>
        )}
      </td>
      <td className="px-3 py-4 text-xs text-charcoal/55">
        {festival.createdAt ? new Date(festival.createdAt).toLocaleDateString() : "—"}
      </td>
      <td className="px-3 py-4">
        <div className="flex flex-wrap gap-2">
          {festival.status === "draft" ? (
            <ActionButton
              slug={festival.slug}
              intent="publish"
              label="Publish"
              className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            />
          ) : (
            <ActionButton
              slug={festival.slug}
              intent="unpublish"
              label="Unpublish"
              className="rounded-full border border-charcoal/15 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal hover:border-charcoal/30"
            />
          )}
          <ActionButton
            slug={festival.slug}
            intent="delete"
            label="Delete"
            className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          />
        </div>
      </td>
    </tr>
  );
}

export default async function AdminFestivalsPage({
  searchParams
}: {
  searchParams?: { published?: string; unpublished?: string; deleted?: string; error?: string };
}) {
  const festivals = await getAdminFestivals();
  const drafts = festivals.filter((f) => f.status === "draft");
  const published = festivals.filter((f) => f.status === "published");
  const aiDrafts = drafts.filter((f) => f.source === "ai_discovered");

  return (
    <AdminPage
      title="Festivals"
      description="Review and publish festival entries. AI-discovered drafts come in from the nightly festival-discovery agent and need editorial review before they appear on the public site."
    >
      {/* Flash messages */}
      {searchParams?.published ? (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
          Published <strong>{searchParams.published}</strong>.
        </div>
      ) : null}
      {searchParams?.unpublished ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Moved <strong>{searchParams.unpublished}</strong> back to draft.
        </div>
      ) : null}
      {searchParams?.deleted ? (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
          Deleted <strong>{searchParams.deleted}</strong>.
        </div>
      ) : null}
      {searchParams?.error ? (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
          {searchParams.error}
        </div>
      ) : null}

      {/* Counts */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-charcoal/10 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-charcoal/55">Total</p>
          <p className="mt-1 font-display text-3xl text-charcoal">{festivals.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-800">Published</p>
          <p className="mt-1 font-display text-3xl text-emerald-900">{published.length}</p>
        </div>
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-800">
            Drafts awaiting review
          </p>
          <p className="mt-1 font-display text-3xl text-amber-900">{drafts.length}</p>
          {aiDrafts.length > 0 ? (
            <p className="mt-2 text-xs text-amber-800">
              {aiDrafts.length} from the discovery agent
            </p>
          ) : null}
        </div>
      </div>

      {/* Drafts section first — these need attention */}
      {drafts.length > 0 ? (
        <section>
          <h2 className="font-display text-2xl text-charcoal">Drafts awaiting review</h2>
          <p className="mt-1 text-sm text-charcoal/65">
            These won&apos;t appear on /festivals until promoted to Published.
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-charcoal/10 bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal/10 bg-charcoal/[0.04] text-left">
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal/55">Festival</th>
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal/55">Status / days</th>
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal/55">Created</th>
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal/55">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((f) => <FestivalRow key={f.slug} festival={f} />)}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="font-display text-2xl text-charcoal">Published festivals</h2>
        <p className="mt-1 text-sm text-charcoal/65">
          {published.length === 0 ? "Nothing published yet from Supabase — the public site is falling back to the static FESTIVALS array." : "Live on /festivals."}
        </p>
        {published.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-charcoal/10 bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal/10 bg-charcoal/[0.04] text-left">
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal/55">Festival</th>
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal/55">Status / days</th>
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal/55">Created</th>
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal/55">Actions</th>
                </tr>
              </thead>
              <tbody>
                {published.map((f) => <FestivalRow key={f.slug} festival={f} />)}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <div className="rounded-2xl border border-charcoal/10 bg-charcoal/[0.04] p-5 text-sm leading-7 text-charcoal/70">
        <p className="font-semibold text-charcoal">How drafts arrive</p>
        <p className="mt-2">
          The <code className="rounded bg-white px-1.5 py-0.5 text-xs">festival-discovery</code> agent
          runs nightly at 02:00 UTC, using Claude with web search to find new US hot sauce
          festivals. New entries are inserted with{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-xs">status = &apos;draft&apos;</code> and{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-xs">source = &apos;ai_discovered&apos;</code>
          . Review each draft above and promote to Published when it&apos;s accurate.
        </p>
        <p className="mt-3">
          See agent run history in{" "}
          <Link
            href="/admin/automation/runs"
            className="font-semibold text-charcoal underline underline-offset-4"
          >
            /admin/automation/runs
          </Link>
          .
        </p>
      </div>
    </AdminPage>
  );
}
