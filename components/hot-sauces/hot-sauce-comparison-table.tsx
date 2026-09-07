import Link from "next/link";

import { SectionHeading } from "@/components/layout/section-heading";
import type { HotSauceComparisonRow } from "@/lib/hot-sauces";

export function HotSauceComparisonTable({
  eyebrow,
  title,
  copy,
  rows
}: {
  eyebrow: string;
  title: string;
  copy: string;
  rows: HotSauceComparisonRow[];
}) {
  if (!rows.length) {
    return null;
  }

  return (
    <div className="mt-12">
      <SectionHeading eyebrow={eyebrow} title={title} copy={copy} />

      <div className="mt-8 grid gap-4 lg:hidden">
        {rows.map((row) => (
          <article key={row.href} className="panel p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Compare the short list</p>
                <h3 className="mt-3 font-display text-3xl text-charcoal">{row.name}</h3>
              </div>
              <span className="rounded-full border border-charcoal/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-ember">
                {row.heat}
              </span>
            </div>
            <dl className="mt-5 space-y-3 text-sm text-charcoal/75">
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-charcoal/45">Best for</dt>
                <dd className="mt-1">{row.bestFor}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-charcoal/45">Flavor</dt>
                <dd className="mt-1">{row.flavorLane}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-charcoal/45">Price</dt>
                <dd className="mt-1">{row.priceLabel}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm leading-7 text-charcoal/75">{row.whyBuy}</p>
            <Link
              href={row.href}
              className="mt-5 inline-flex rounded-full border border-charcoal/15 px-4 py-2 text-sm font-semibold text-charcoal"
            >
              Read review
            </Link>
          </article>
        ))}
      </div>

      <div className="panel mt-8 hidden overflow-hidden lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-charcoal/10 text-left">
            <thead className="bg-charcoal/[0.04] text-xs uppercase tracking-[0.22em] text-charcoal/55">
              <tr>
                <th className="px-6 py-4 font-medium">Bottle</th>
                <th className="px-6 py-4 font-medium">Best for</th>
                <th className="px-6 py-4 font-medium">Heat</th>
                <th className="px-6 py-4 font-medium">Flavor</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Why it makes the cut</th>
                <th className="px-6 py-4 font-medium sr-only">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/10 text-sm text-charcoal/75">
              {rows.map((row) => (
                <tr key={row.href} className="align-top">
                  <td className="px-6 py-5 font-semibold text-charcoal">{row.name}</td>
                  <td className="px-6 py-5">{row.bestFor}</td>
                  <td className="px-6 py-5">{row.heat}</td>
                  <td className="px-6 py-5">{row.flavorLane}</td>
                  <td className="px-6 py-5">{row.priceLabel}</td>
                  <td className="px-6 py-5 leading-7 text-charcoal/75">{row.whyBuy}</td>
                  <td className="px-6 py-5">
                    <Link
                      href={row.href}
                      className="inline-flex rounded-full border border-charcoal/15 px-4 py-2 text-sm font-semibold text-charcoal"
                    >
                      Read review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
