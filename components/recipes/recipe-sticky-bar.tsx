"use client";

import { useEffect, useState } from "react";

export function RecipeStickyBar({ targetId }: { targetId: string }) {
  const [cookMode, setCookMode] = useState(false);

  useEffect(() => {
    const container = document.getElementById(targetId);
    if (!container) return;

    if (cookMode) {
      container.setAttribute("data-cook-mode", "true");
    } else {
      container.removeAttribute("data-cook-mode");
    }
  }, [cookMode, targetId]);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-charcoal/92 px-3 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-md print-hidden sm:hidden"
      role="navigation"
      aria-label="Recipe quick actions"
    >
      <div className="mx-auto flex max-w-3xl items-stretch gap-2 text-xs font-semibold text-cream">
        <a
          href="#ingredients"
          className="flex flex-1 items-center justify-center rounded-full bg-white px-3 py-3 text-charcoal"
        >
          Ingredients
        </a>
        <a
          href="#method"
          className="flex flex-1 items-center justify-center rounded-full border border-white/15 px-3 py-3"
        >
          Method
        </a>
        <button
          type="button"
          onClick={() => setCookMode((value) => !value)}
          aria-pressed={cookMode}
          className={`flex flex-1 items-center justify-center rounded-full px-3 py-3 ${
            cookMode
              ? "bg-gradient-to-r from-flame to-ember text-white"
              : "border border-white/15 text-cream"
          }`}
        >
          {cookMode ? "Exit cook" : "Cook mode"}
        </button>
      </div>
    </div>
  );
}
