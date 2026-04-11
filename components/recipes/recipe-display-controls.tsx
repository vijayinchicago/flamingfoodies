"use client";

import { useEffect, useState } from "react";

import { trackEvent } from "@/lib/analytics";
import { ANALYTICS_EVENTS } from "@/lib/telemetry-events";

export function RecipeDisplayControls({
  targetId,
  recipeTitle,
  recipeUrl,
  contentId,
  contentSlug
}: {
  targetId: string;
  recipeTitle: string;
  recipeUrl: string;
  contentId: number;
  contentSlug: string;
}) {
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

  function emailRecipeToSelf() {
    const subject = encodeURIComponent(`Email me this recipe: ${recipeTitle}`);
    const body = encodeURIComponent(
      `Save this FlamingFoodies recipe for later:\n\n${recipeTitle}\n${recipeUrl}`
    );

    trackEvent(ANALYTICS_EVENTS.recipeShare, {
      path: window.location.pathname,
      contentType: "recipe",
      contentId,
      contentSlug,
      platform: "email",
      shareAction: "mailto"
    });

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <div className="flex w-full flex-col gap-3 print-hidden sm:w-auto sm:flex-row sm:flex-wrap">
      <button
        type="button"
        onClick={() => setCookMode((value) => !value)}
        className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream sm:w-auto"
      >
        {cookMode ? "Exit cook mode" : "Cook mode"}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream sm:w-auto"
      >
        Print recipe
      </button>
      <button
        type="button"
        onClick={emailRecipeToSelf}
        className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream sm:w-auto"
      >
        Email this recipe
      </button>
    </div>
  );
}
