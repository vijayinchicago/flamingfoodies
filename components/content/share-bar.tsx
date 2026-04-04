"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { trackEvent } from "@/lib/analytics";
import { buildShareUrls, type SharePlatform } from "@/lib/share";
import { ANALYTICS_EVENTS } from "@/lib/telemetry-events";
import { PinterestSaveButton } from "@/components/content/pinterest-save-button";

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
      <div className={imageUrl ? "grid gap-5 lg:grid-cols-[1.15fr_0.85fr]" : undefined}>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-ember">Share this</p>
              <h2 className="mt-2 font-display text-3xl text-cream">Pass it around</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-cream/62">
                Use the quick-share options for chat and social, or save the hero image when the
                page deserves a stronger Pinterest moment.
              </p>
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
        </div>

        {imageUrl ? (
          <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.05]">
            <div className="relative h-44 overflow-hidden">
              <Image
                src={imageUrl}
                alt={title}
                fill
                sizes="(min-width: 1024px) 320px, 100vw"
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-ember">Best share asset</p>
              <h3 className="mt-2 font-display text-2xl text-cream">Save the visual, not just the link</h3>
              <p className="mt-2 text-sm leading-6 text-cream/62">
                Pinterest tends to work best when the image travels with the recipe, review, or
                article instead of just the URL.
              </p>
              <PinterestSaveButton
                title={title}
                description={description}
                url={url}
                imageUrl={imageUrl}
                contentType={contentType}
                contentId={contentId}
                contentSlug={contentSlug}
                className="mt-4 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream transition hover:border-white/25 hover:bg-white/[0.08]"
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
