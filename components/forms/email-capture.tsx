"use client";

import { useMemo, useState, type FormEvent } from "react";

import { trackEvent } from "@/lib/analytics";
import {
  NEWSLETTER_SEGMENTS,
  type NewsletterSegmentTag,
  normalizeNewsletterSegmentTags
} from "@/lib/newsletter-segments";
import { ANALYTICS_EVENTS } from "@/lib/telemetry-events";

type SegmentOption = {
  tag: NewsletterSegmentTag;
  label: string;
  description: string;
};

export function EmailCapture({
  source = "homepage",
  tag = "homepage-hero",
  heading = "Join Flame Club",
  buttonLabel = "Join Flame Club",
  successMessage = "You’re in. Expect weekly heat, not inbox sludge.",
  description,
  defaultSegments = ["weekly-roundup"],
  segmentOptions = []
}: {
  source?: string;
  tag?: string;
  heading?: string;
  buttonLabel?: string;
  successMessage?: string;
  description?: string;
  defaultSegments?: NewsletterSegmentTag[];
  segmentOptions?: SegmentOption[];
}) {
  const [state, setState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [selectedSegments, setSelectedSegments] = useState<NewsletterSegmentTag[]>(
    normalizeNewsletterSegmentTags(defaultSegments)
  );

  const availableOptions = useMemo(() => {
    if (segmentOptions.length) {
      return segmentOptions;
    }

    return NEWSLETTER_SEGMENTS;
  }, [segmentOptions]);

  function toggleSegment(segmentTag: NewsletterSegmentTag) {
    setSelectedSegments((current) => {
      const next = current.includes(segmentTag)
        ? current.filter((tag) => tag !== segmentTag)
        : [...current, segmentTag];
      return normalizeNewsletterSegmentTags(next);
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const tags = Array.from(new Set([tag, ...selectedSegments].filter(Boolean)));

    setState("saving");

    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: formData.get("email"),
        firstName: formData.get("firstName"),
        source,
        tag,
        tags
      })
    });

    if (!response.ok) {
      setState("error");
      setMessage("Subscription failed. Please try again.");
      return;
    }

    setState("success");
    setMessage(successMessage);
    trackEvent(ANALYTICS_EVENTS.emailSignup, {
      path: window.location.pathname,
      source,
      tag,
      segments: selectedSegments.join(",")
    });
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="panel p-5">
      <div className="grid gap-4">
        <div>
          <h3 className="font-display text-4xl text-cream">{heading}</h3>
          {description ? (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-cream/70">{description}</p>
          ) : null}
        </div>
        {availableOptions.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {availableOptions.map((option) => {
              const active = selectedSegments.includes(option.tag);

              return (
                <button
                  key={option.tag}
                  type="button"
                  onClick={() => toggleSegment(option.tag)}
                  className={`rounded-[1.4rem] border p-4 text-left transition ${
                    active
                      ? "border-ember bg-white text-charcoal shadow-sm"
                      : "border-white/12 bg-white/[0.04] text-cream/82 hover:border-white/25 hover:bg-white/[0.07]"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-ember">{option.label}</p>
                  <p className={`mt-2 text-sm leading-6 ${active ? "text-charcoal/75" : "text-inherit"}`}>
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr_auto] md:items-end">
          <div>
            <label htmlFor={`${source}-firstName`} className="mb-2 block text-sm text-cream/70">
              First name
            </label>
            <input
              id={`${source}-firstName`}
              name="firstName"
              className="w-full rounded-2xl border border-white/15 bg-charcoal/50 px-4 py-3 text-cream outline-none placeholder:text-cream/40 focus:border-ember"
              placeholder="Mara"
            />
          </div>
          <div>
            <label htmlFor={`${source}-email`} className="mb-2 block text-sm text-cream/70">
              Email
            </label>
            <input
              id={`${source}-email`}
              name="email"
              required
              type="email"
              className="w-full rounded-2xl border border-white/15 bg-charcoal/50 px-4 py-3 text-cream outline-none placeholder:text-cream/40 focus:border-ember"
              placeholder="you@flameclub.com"
            />
          </div>
          <button
            type="submit"
            disabled={state === "saving"}
            className="rounded-full bg-gradient-to-r from-flame to-ember px-6 py-3 font-semibold text-white disabled:opacity-60"
          >
            {state === "saving" ? "Joining..." : buttonLabel}
          </button>
        </div>
        {message ? <p className="text-sm text-cream/70">{message}</p> : null}
      </div>
    </form>
  );
}
