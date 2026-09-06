"use client";

import { useState, type FormEvent } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginPanel({ initialMessage = "" }: { initialMessage?: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [loading, setLoading] = useState(false);

  async function signInWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setMessage("Sign-in is temporarily unavailable right now. Please try again in a bit.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
        shouldCreateUser: false
      }
    });

    setLoading(false);
    setMessage(
      error
        ? error.message
        : "Check your inbox for the admin sign-in link."
    );
  }

  return (
    <div className="panel-light max-w-xl p-8">
      <p className="eyebrow">Restricted</p>
      <h1 className="mt-3 font-display text-5xl text-charcoal">Admin sign in</h1>
      <p className="mt-4 text-sm leading-7 text-charcoal/70">
        Member login is paused. This sign-in form is only for an existing FlamingFoodies
        administrator account.
      </p>
      <form onSubmit={signInWithEmail} className="mt-8 space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@example.com"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send admin sign-in link"}
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-charcoal/70">{message}</p> : null}
    </div>
  );
}
