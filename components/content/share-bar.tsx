"use client";

import { useMemo, useState } from "react";

import { trackEvent } from "@/lib/analytics";
import { buildShareUrls, type SharePlatform } from "@/lib/share";
import { ANALYTICS_EVENTS } from "@/lib/telemetry-events";

type ShareBarProps = {
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
  contentType: string;
  contentId: number;
  contentSlug: string;
  className?: string;
};

const buttonClasses =
  "rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-cream transition hover:border-white/25 hover:bg-white/[0.1]";

const shareOptions: Array<{ platform: SharePlatform; label: string }> = [
  { platform: "copy", label: "Copy link" },
  { platform: "pinterest", label: "Pinterest" },
  { platform: "facebook", label: "Facebook" },
  { platform: "x", label: "X" },
  { platform: "whatsapp", label: "WhatsApp" }
];

function isNetworkPlatform(
  platform: SharePlatform
): platform is Extract<SharePlatform, "pinterest" | "facebook" | "x" | "whatsapp"> {
  return platform === "pinterest" || platform === "facebook" || platform === "x" || platform === "whatsapp";
}

function formatFeedback(platform: SharePlatform) {
  if (platform === "copy") return "Share link copied.";
  if (platform === "native") return "Share sheet opened.";
  return `Opening ${platform}.`;
}

export function ShareBar({
  title,
  description,
  url,
  imageUrl,
  contentType,
  contentId,
  contentSlug,
  className
}: ShareBarProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const shareUrls = useMemo(
    () => buildShareUrls({ url, title, description, imageUrl }),
    [description, imageUrl, title, url]
  );
  const path = useMemo(() => new URL(url).pathname, [url]);
  const nativeShareAvailable =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  function logShare(platform: SharePlatform, action: string) {
    trackEvent(ANALYTICS_EVENTS.recipeShare, {
      contentType,
      contentId,
      contentSlug,
      path,
      platform,
      shareAction: action
    });
  }

  async function handleNativeShare() {
    if (!nativeShareAvailable) return;

    try {
      await navigator.share({
        title,
        text: description,
        url: shareUrls.tracked.native
      });
      logShare("native", "shared");
      setFeedback(formatFeedback("native"));
    } catch {
      logShare("native", "dismissed");
    }
  }

  async function handleCopyShare() {
    await navigator.clipboard.writeText(shareUrls.tracked.copy);
    logShare("copy", "copied");
    setFeedback(formatFeedback("copy"));
  }

  function handleNetworkShare(platform: Extract<SharePlatform, "pinterest" | "facebook" | "x" | "whatsapp">) {
    const href = shareUrls.network[platform];
    window.open(href, "_blank", "noopener,noreferrer,width=720,height=720");
    logShare(platform, "opened");
    setFeedback(formatFeedback(platform));
  }

  return (
    <section
      className={className || "rounded-[2rem] border border-white/10 bg-white/[0.04] p-5"}
      aria-label="Share this page"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-ember">Share this</p>
          <h2 className="mt-2 font-display text-3xl text-cream">Pass it around</h2>
        </div>
        {feedback ? <p className="text-sm text-cream/62">{feedback}</p> : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {nativeShareAvailable ? (
          <button type="button" className={buttonClasses} onClick={handleNativeShare}>
            Share
          </button>
        ) : null}
        {shareOptions.map((option) => (
          <button
            key={option.platform}
            type="button"
            className={buttonClasses}
            onClick={
              option.platform === "copy"
                ? handleCopyShare
                : () => {
                    if (isNetworkPlatform(option.platform)) {
                      handleNetworkShare(option.platform);
                    }
                  }
            }
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
