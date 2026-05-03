"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { trackEvent } from "@/lib/analytics";
import { ANALYTICS_EVENTS } from "@/lib/telemetry-events";

export function FlameClubSignup({
  source = "flame-club-landing",
  buttonLabel = "Join Flame Club — it's free",
  size = "lg"
}: {
  source?: string;
  buttonLabel?: string;
  size?: "lg" | "md";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [referrerToken, setReferrerToken] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferrerToken(ref);
      try {
        window.localStorage.setItem("flameclub_ref", ref);
      } catch {}
    } else {
      try {
        const stored = window.localStorage.getItem("flameclub_ref");
        if (stored) setReferrerToken(stored);
      } catch {}
    }
  }, [searchParams]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    if (!email) return;

    setState("saving");
    setErrorMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source,
          tag: source,
          tags: ["weekly-roundup"],
          referrerToken: referrerToken ?? undefined
        })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result?.error || "Subscription failed.");
      }

      trackEvent(ANALYTICS_EVENTS.emailSignup, {
        path: window.location.pathname,
        source,
        tag: source,
        segments: "weekly-roundup",
        referred: referrerToken ? "1" : "0"
      });

      try {
        window.localStorage.removeItem("flameclub_ref");
      } catch {}

      const token = result.referralToken as string | undefined;
      router.push(token ? `/flame-club/thanks?token=${token}` : "/flame-club/thanks");
    } catch (error) {
      setState("error");
      setErrorMessage(error instanceof Error ? error.message : "Subscription failed.");
    }
  }

  const inputCls =
    size === "lg"
      ? "w-full rounded-2xl border border-white/15 bg-charcoal/60 px-5 py-4 text-base text-cream outline-none placeholder:text-cream/40 focus:border-ember sm:py-5 sm:text-lg"
      : "w-full rounded-2xl border border-white/15 bg-charcoal/60 px-4 py-3 text-cream outline-none placeholder:text-cream/40 focus:border-ember";

  const buttonCls =
    size === "lg"
      ? "rounded-full bg-gradient-to-r from-flame to-ember px-7 py-4 text-base font-semibold text-white shadow-lg shadow-flame/20 disabled:opacity-60 sm:py-5 sm:text-lg"
      : "rounded-full bg-gradient-to-r from-flame to-ember px-6 py-3 font-semibold text-white disabled:opacity-60";

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-stretch"
      aria-label="Flame Club signup"
    >
      <label htmlFor="flame-club-email" className="sr-only">
        Email address
      </label>
      <input
        id="flame-club-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="you@flameclub.com"
        className={inputCls}
      />
      <button type="submit" disabled={state === "saving"} className={buttonCls}>
        {state === "saving" ? "Joining…" : buttonLabel}
      </button>
      {state === "error" ? (
        <p className="text-sm text-flame sm:col-span-2">{errorMessage}</p>
      ) : (
        <p className="text-xs text-cream/55 sm:col-span-2">
          One email a week. Unsubscribe anytime. We never sell your address.
        </p>
      )}
    </form>
  );
}
