"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-flame px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-ember"
    >
      Save as PDF / Print
    </button>
  );
}
