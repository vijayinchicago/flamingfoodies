"use client";

import { useMemo, useState } from "react";

type Row = Record<string, string | number | boolean | undefined>;

export function ContentTable({
  title,
  rows,
  filters
}: {
  title: string;
  rows: Row[];
  filters?: string[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        JSON.stringify(row).toLowerCase().includes(query.trim().toLowerCase())
      ),
    [query, rows]
  );

  return (
    <div className="panel-light overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-charcoal/10 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-4xl text-charcoal">{title}</h2>
          {filters?.length ? (
            <p className="mt-1 text-sm text-charcoal/55">Filters: {filters.join(", ")}</p>
          ) : null}
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search..."
          className="rounded-full border border-charcoal/10 px-4 py-2 text-sm outline-none focus:border-ember"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-charcoal/10">
          <thead className="bg-charcoal/[0.03]">
            <tr>
              {Object.keys(rows[0] || {}).map((key) => (
                <th
                  key={key}
                  className="px-5 py-4 text-left text-xs uppercase tracking-[0.2em] text-charcoal/45"
                >
                  {key.replace(/([A-Z])/g, " $1")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal/10">
            {filtered.map((row, index) => (
              <tr key={`${title}-${index}`}>
                {Object.values(row).map((value, valueIndex) => (
                  <td key={valueIndex} className="px-5 py-4 text-sm text-charcoal/75">
                    {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
