"use client";

import { useState, type FormEvent } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginPanel() {
  const googleEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true";
  const githubEnabled = process.env.NEXT_PUBLIC_ENABLE_GITHUB_AUTH === "true";
  const hasOAuthProvider = googleEnabled || githubEnabled;
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
    setMessage(
      error
        ? error.message
        : "Check your inbox for a FlamingFoodies sign-in link. Email branding is still being polished."
    );
  }

  async function signInWithOAuth(provider: "google" | "github") {
    if (
      (provider === "google" && !googleEnabled)
      || (provider === "github" && !githubEnabled)
    ) {
      setMessage(
        `${provider === "google" ? "Google" : "GitHub"} login is not enabled for FlamingFoodies yet. Use the magic link below for now.`
      );
      return;
    }

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setMessage("Supabase credentials are not configured yet. Add env vars to enable auth.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    setLoading(false);

    if (error) {
      setMessage(
        error.message.includes("Unsupported provider")
          ? `${provider === "google" ? "Google" : "GitHub"} login is not enabled in Supabase yet. Turn it on in Authentication -> Providers before exposing the button.`
          : error.message
      );
    }
  }

  return (
    <div className="panel-light max-w-xl p-8">
      <p className="eyebrow">Members</p>
      <h1 className="mt-3 font-display text-5xl text-charcoal">Log in to turn up the heat</h1>
      <p className="mt-4 text-sm leading-7 text-charcoal/70">
        Use a sign-in link for now. Social login buttons only appear after they are fully enabled
        in Supabase, so we do not send you into a broken auth flow.
      </p>
      {hasOAuthProvider ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {googleEnabled ? (
            <button
              onClick={() => signInWithOAuth("google")}
              disabled={loading}
              className="rounded-full border border-charcoal/10 px-4 py-3 text-sm font-semibold text-charcoal disabled:opacity-60"
            >
              Continue with Google
            </button>
          ) : null}
          {githubEnabled ? (
            <button
              onClick={() => signInWithOAuth("github")}
              disabled={loading}
              className="rounded-full border border-charcoal/10 px-4 py-3 text-sm font-semibold text-charcoal disabled:opacity-60"
            >
              Continue with GitHub
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-8 rounded-[1.5rem] border border-charcoal/10 bg-charcoal/[0.03] p-4 text-sm leading-7 text-charcoal/70">
          Social login is hidden until the provider is fully configured in Supabase. Magic link
          sign-in is the active production path right now.
        </div>
      )}
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
