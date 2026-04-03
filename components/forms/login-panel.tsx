"use client";

import { useState, type FormEvent } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginPanel() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setMessage("Supabase credentials are not configured yet. Add env vars to enable auth.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    setLoading(false);
    setMessage(error ? error.message : "Magic link sent. Check your inbox.");
  }

  async function signInWithOAuth(provider: "google" | "github") {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setMessage("Supabase credentials are not configured yet. Add env vars to enable auth.");
      return;
    }

    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  }

  return (
    <div className="panel-light max-w-xl p-8">
      <p className="eyebrow">Members</p>
      <h1 className="mt-3 font-display text-5xl text-charcoal">Log in to turn up the heat</h1>
      <p className="mt-4 text-sm leading-7 text-charcoal/70">
        Use Google, GitHub, or a magic link. New members land in onboarding to claim a
        username before posting.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => signInWithOAuth("google")}
          className="rounded-full border border-charcoal/10 px-4 py-3 text-sm font-semibold text-charcoal"
        >
          Continue with Google
        </button>
        <button
          onClick={() => signInWithOAuth("github")}
          className="rounded-full border border-charcoal/10 px-4 py-3 text-sm font-semibold text-charcoal"
        >
          Continue with GitHub
        </button>
      </div>
      <form onSubmit={signInWithEmail} className="mt-6 space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@flameclub.com"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send magic link"}
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-charcoal/70">{message}</p> : null}
    </div>
  );
}
