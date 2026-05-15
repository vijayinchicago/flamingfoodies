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

type EmailCaptureVariant = "full" | "email-only";

export function EmailCapture({
  source = "homepage",
  tag = "homepage-hero",
  heading = "Join Flame Club",
  buttonLabel = "Join Flame Club",
  successMessage = "You’re in. Expect weekly heat, not inbox sludge.",
  description,
  defaultSegments = ["weekly-roundup"],
  segmentOptions = [],
  variant = "full"
}: {
  source?: string;
  tag?: string;
  heading?: string;
  buttonLabel?: string;
  successMessage?: string;
  description?: string;
  defaultSegments?: NewsletterSegmentTag[];
  segmentOptions?: SegmentOption[];
  variant?: EmailCaptureVariant;
}) {
  const [state, setState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [selectedSegments, setSelectedSegments] = useState<NewsletterSegmentTag[]>(
    normalizeNewsletterSegmentTags(defaultSegments)
  );
  const showsExpandedFields = variant === "full";

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
      segments: selectedSegments.join(","),
      captureVariant: variant
    });
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="panel p-5">
      <div className="grid gap-4">
        <div>
          <h3 className="font-display text-4xl text-charcoal">{heading}</h3>
          {description ? (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-charcoal/70">{description}</p>
          ) : null}
        </div>
        {showsExpandedFields && availableOptions.length ? (
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
                      ? "border-ember bg-ember/[0.08] text-charcoal shadow-sm"
                      : "border-charcoal/10 bg-charcoal/[0.04] text-charcoal/75 hover:border-charcoal/20 hover:bg-charcoal/[0.06]"
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
        <div
          className={`grid gap-4 ${
            showsExpandedFields
              ? "md:grid-cols-[0.8fr_1.2fr_auto] md:items-end"
              : "sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
          }`}
        >
          {showsExpandedFields ? (
            <div>
              <label htmlFor={`${source}-firstName`} className="mb-2 block text-sm text-charcoal/70">
                First name
              </label>
              <input
                id={`${source}-firstName`}
                name="firstName"
                className="w-full rounded-2xl border border-charcoal/15 bg-white px-4 py-3 text-charcoal caret-charcoal outline-none placeholder:text-charcoal/45 focus:border-ember"
                placeholder="Mara"
              />
            </div>
          ) : null}
          <div>
            <label htmlFor={`${source}-email`} className="mb-2 block text-sm text-charcoal/70">
              Email
            </label>
            <input
              id={`${source}-email`}
              name="email"
              required
              type="email"
              className="w-full rounded-2xl border border-charcoal/15 bg-white px-4 py-3 text-charcoal caret-charcoal outline-none placeholder:text-charcoal/45 focus:border-ember"
              placeholder="you@flameclub.com"
            />
          </div>
          <button
            type="submit"
            disabled={state === "saving"}
            className="w-full rounded-full bg-gradient-to-r from-flame to-ember px-6 py-3 font-semibold text-white disabled:opacity-60 sm:w-auto"
          >
            {state === "saving" ? "Joining..." : buttonLabel}
          </button>
        </div>
        {message ? <p className="text-sm text-charcoal/70">{message}</p> : null}
      </div>
    </form>
  );
}
