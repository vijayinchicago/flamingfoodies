"use client";

import { useEffect, useState } from "react";

export function RecipeDisplayControls({ targetId }: { targetId: string }) {
  const [cookMode, setCookMode] = useState(false);

  useEffect(() => {
    const container = document.getElementById(targetId);
    if (!container) {
      return;
    }

    if (cookMode) {
      container.setAttribute("data-cook-mode", "true");
    } else {
      container.removeAttribute("data-cook-mode");
    }
  }, [cookMode, targetId]);

  return (
    <div className="flex flex-wrap gap-3 print-hidden">
      <button
        type="button"
        onClick={() => setCookMode((value) => !value)}
        className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
      >
        {cookMode ? "Exit cook mode" : "Cook mode"}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
      >
        Print recipe
      </button>
    </div>
  );
}
