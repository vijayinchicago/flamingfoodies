"use client";

import { useState } from "react";

import { trackEvent } from "@/lib/analytics";
import { ANALYTICS_EVENTS } from "@/lib/telemetry-events";

const SHARE_COPY =
  "I just joined Flame Club — one tested spicy recipe + one honest hot sauce pick every Friday. Free, and weirdly good. Worth a spot in your inbox:";

export function ReferralShare({ shareUrl }: { shareUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      trackEvent(ANALYTICS_EVENTS.referralLinkCopied, { source: "thanks-page" });
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  }

  function track(channel: string) {
    trackEvent(ANALYTICS_EVENTS.referralShareClicked, { channel });
  }

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`${SHARE_COPY} ${shareUrl}`);
  const encodedTextOnly = encodeURIComponent(SHARE_COPY);

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          readOnly
          value={shareUrl}
          onFocus={(event) => event.currentTarget.select()}
          className="flex-1 rounded-2xl border border-white/15 bg-charcoal/60 px-4 py-3 text-sm text-cream/90 outline-none"
          aria-label="Your personal Flame Club share link"
        />
        <button
          type="button"
          onClick={copyLink}
          className="rounded-full bg-gradient-to-r from-flame to-ember px-6 py-3 font-semibold text-white"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <a
          href={`sms:?&body=${encodedText}`}
          onClick={() => track("sms")}
          className="rounded-2xl border border-white/15 bg-white/[0.04] px-3 py-3 text-center text-sm text-cream/85 transition hover:bg-white/[0.08]"
        >
          Text it
        </a>
        <a
          href={`mailto:?subject=${encodeURIComponent("Try Flame Club")}&body=${encodedText}`}
          onClick={() => track("email")}
          className="rounded-2xl border border-white/15 bg-white/[0.04] px-3 py-3 text-center text-sm text-cream/85 transition hover:bg-white/[0.08]"
        >
          Email
        </a>
        <a
          href={`https://wa.me/?text=${encodedText}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("whatsapp")}
          className="rounded-2xl border border-white/15 bg-white/[0.04] px-3 py-3 text-center text-sm text-cream/85 transition hover:bg-white/[0.08]"
        >
          WhatsApp
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedTextOnly}&url=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("twitter")}
          className="rounded-2xl border border-white/15 bg-white/[0.04] px-3 py-3 text-center text-sm text-cream/85 transition hover:bg-white/[0.08]"
        >
          Twitter / X
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("facebook")}
          className="rounded-2xl border border-white/15 bg-white/[0.04] px-3 py-3 text-center text-sm text-cream/85 transition hover:bg-white/[0.08]"
        >
          Facebook
        </a>
      </div>
    </div>
  );
}
