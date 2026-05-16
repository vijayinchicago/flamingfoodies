"use client";

import Link from "next/link";
import { useState } from "react";

interface PickerPepper {
  slug: string;
  name: string;
}

export function ComparePicker({ peppers }: { peppers: PickerPepper[] }) {
  const [a, setA] = useState<string>(peppers[0]?.slug ?? "");
  const [b, setB] = useState<string>(peppers[1]?.slug ?? "");

  const selectClass =
    "w-full rounded-2xl border border-charcoal/15 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/15";

  const canCompare = a && b && a !== b;

  return (
    <div className="panel p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Pepper A</span>
          <select value={a} onChange={(e) => setA(e.target.value)} className={`${selectClass} mt-2`}>
            {peppers.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>
        </label>
        <div className="self-center text-center text-sm font-semibold uppercase tracking-[0.2em] text-charcoal/45">
          vs
        </div>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">Pepper B</span>
          <select value={b} onChange={(e) => setB(e.target.value)} className={`${selectClass} mt-2`}>
            {peppers.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {canCompare ? (
          <Link
            href={`/peppers/compare/${a}/${b}`}
            className="inline-flex rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-cream"
          >
            Compare →
          </Link>
        ) : (
          <span className="text-sm text-charcoal/55">Pick two different peppers to compare.</span>
        )}
      </div>
    </div>
  );
}
