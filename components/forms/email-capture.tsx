"use client";

import { useState, type FormEvent } from "react";

export function EmailCapture({
  source = "homepage",
  tag = "homepage-hero"
}: {
  source?: string;
  tag?: string;
}) {
  const [state, setState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

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
        tag
      })
    });

    if (!response.ok) {
      setState("error");
      setMessage("Subscription failed. Please try again.");
      return;
    }

    setState("success");
    setMessage("You’re in. Expect weekly heat, not inbox sludge.");
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="panel flex flex-col gap-4 p-5 md:flex-row md:items-end">
      <div className="flex-1">
        <label htmlFor="firstName" className="mb-2 block text-sm text-cream/70">
          First name
        </label>
        <input
          id="firstName"
          name="firstName"
          className="w-full rounded-2xl border border-white/15 bg-charcoal/50 px-4 py-3 text-cream outline-none placeholder:text-cream/40 focus:border-ember"
          placeholder="Mara"
        />
      </div>
      <div className="flex-[1.2]">
        <label htmlFor="email" className="mb-2 block text-sm text-cream/70">
          Email
        </label>
        <input
          id="email"
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
        {state === "saving" ? "Joining..." : "Join Flame Club"}
      </button>
      {message ? <p className="text-sm text-cream/70 md:w-72">{message}</p> : null}
    </form>
  );
}
