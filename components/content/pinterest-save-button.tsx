"use client";

import { trackEvent } from "@/lib/analytics";
import { buildShareUrls } from "@/lib/share";
import { ANALYTICS_EVENTS } from "@/lib/telemetry-events";

interface PinterestSaveButtonProps {
  title: string;
  description?: string;
  url: string;
  imageUrl: string;
  contentType: string;
  contentId: number;
  contentSlug: string;
  className?: string;
  label?: string;
  action?: string;
}

export function PinterestSaveButton({
  title,
  description,
  url,
  imageUrl,
  contentType,
  contentId,
  contentSlug,
  className,
  label = "Save image to Pinterest",
  action = "saved_image"
}: PinterestSaveButtonProps) {
  const shareUrls = buildShareUrls({
    url,
    title,
    description,
    imageUrl
  });
  const path = new URL(url).pathname;

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        window.open(
          shareUrls.network.pinterest,
          "_blank",
          "noopener,noreferrer,width=720,height=720"
        );
        trackEvent(ANALYTICS_EVENTS.recipeShare, {
          contentType,
          contentId,
          contentSlug,
          path,
          platform: "pinterest",
          shareAction: action
        });
      }}
    >
      {label}
    </button>
  );
}
