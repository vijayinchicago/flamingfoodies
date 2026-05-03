import Link from "next/link";

import { ReferralShare } from "@/components/forms/referral-share";
import { env } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import { getReferralStats } from "@/lib/services/newsletter";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "You're in — welcome to Flame Club",
  description:
    "Welcome to Flame Club. Check your inbox for your first email, then share Flame Club with one friend who'd love it.",
  path: "/flame-club/thanks",
  noIndex: true
});

const REWARDS = [
  {
    threshold: 3,
    name: "The Pepper Dossier",
    body: "Our 40-page printable cheat sheet — every common pepper, Scoville range, what it tastes like, and what to cook with it."
  },
  {
    threshold: 5,
    name: "The Ten-Bottle Starter Shelf",
    body: "Our hand-picked list of the 10 hot sauces every kitchen should own, with where to buy each at the best price."
  },
  {
    threshold: 10,
    name: "VIP Festival Planner + Lifetime VIP Tag",
    body: "Our complete US hot sauce festival travel planner plus a lifetime VIP tag in Flame Club — first dibs on every drop, gift, and giveaway."
  }
];

export default async function FlameClubThanksPage({
  searchParams
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams?.token;
  const stats = token ? await getReferralStats(token) : null;
  const shareUrl = token
    ? `${env.NEXT_PUBLIC_SITE_URL}/flame-club?ref=${token}`
    : `${env.NEXT_PUBLIC_SITE_URL}/flame-club`;
  const referralCount = stats?.referralCount ?? 0;
  const nextReward = REWARDS.find((r) => referralCount < r.threshold) ?? REWARDS[REWARDS.length - 1];
  const progressPct = Math.min(100, Math.round((referralCount / nextReward.threshold) * 100));
  const remaining = Math.max(0, nextReward.threshold - referralCount);

  return (
    <>
      <section className="container-shell py-14 sm:py-20">
        <div className="panel relative overflow-hidden px-5 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,99,30,0.28),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(230,57,70,0.24),transparent_32%)]" />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="eyebrow">You&apos;re in.</p>
            <h1 className="mt-4 font-display text-4xl leading-tight text-cream sm:text-6xl">
              Welcome to Flame Club{stats?.firstName ? `, ${stats.firstName}` : ""}.
            </h1>
            <p className="mt-6 text-base leading-7 text-cream/80 sm:text-lg sm:leading-8">
              Check your inbox in the next minute or two — we&apos;re sending your first
              recipe and a hot sauce pick you can use tonight. (If it&apos;s not there,
              peek in Promotions or spam, and drag us into your main inbox so future
              ones land cleanly.)
            </p>
          </div>
        </div>
      </section>

      {token ? (
        <section className="container-shell pb-12 sm:pb-20">
          <div className="panel mx-auto max-w-3xl p-6 sm:p-10">
            <p className="eyebrow text-center">Now the fun part</p>
            <h2 className="mt-3 text-center font-display text-3xl text-cream sm:text-5xl">
              Share Flame Club. Unlock real stuff.
            </h2>
            <p className="mt-4 text-center text-sm leading-7 text-cream/75 sm:text-base">
              Send your personal link to one friend who&apos;d love spicier weeknight
              dinners. Hit a milestone, unlock a free reward — instantly, no codes,
              no hoops.
            </p>

            <div className="mt-8">
              <ReferralShare shareUrl={shareUrl} />
            </div>

            <div className="mt-10">
              <div className="flex items-center justify-between text-sm text-cream/70">
                <span>
                  <strong className="font-semibold text-cream">{referralCount}</strong> of{" "}
                  <strong className="font-semibold text-cream">{nextReward.threshold}</strong> friends
                </span>
                <span className="text-xs uppercase tracking-[0.18em] text-ember">
                  {remaining === 0 ? "Reward unlocked!" : `${remaining} to go`}
                </span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-flame to-ember transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-cream/60">
                Next up: <strong className="text-cream/85">{nextReward.name}</strong>
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {REWARDS.map((reward) => {
                const unlocked = referralCount >= reward.threshold;
                return (
                  <div
                    key={reward.threshold}
                    className={`rounded-[1.4rem] border p-5 transition ${
                      unlocked
                        ? "border-ember/60 bg-white/[0.06]"
                        : "border-white/10 bg-white/[0.02]"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-ember">
                      {reward.threshold} referrals
                    </p>
                    <h3 className="mt-2 font-display text-lg text-cream">{reward.name}</h3>
                    <p className="mt-2 text-xs leading-6 text-cream/70">{reward.body}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em]">
                      {unlocked ? (
                        <span className="text-ember">Unlocked</span>
                      ) : (
                        <span className="text-cream/45">Locked</span>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className="container-shell pb-16 sm:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">While you wait for Friday</p>
          <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
            Three things worth a click right now.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Link
              href="/quiz"
              className="panel block p-5 text-left transition hover:border-white/20"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-ember">2 minutes</p>
              <h3 className="mt-2 font-display text-xl text-cream">Heat & flavor quiz</h3>
              <p className="mt-2 text-xs leading-6 text-cream/70">
                Find your tolerance and the recipes/sauces built for it.
              </p>
            </Link>
            <Link
              href="/recipes?maxTime=45&sort=quickest"
              className="panel block p-5 text-left transition hover:border-white/20"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-ember">For tonight</p>
              <h3 className="mt-2 font-display text-xl text-cream">Quick spicy dinners</h3>
              <p className="mt-2 text-xs leading-6 text-cream/70">
                Under 45 minutes, scaled for mixed-heat tables.
              </p>
            </Link>
            <Link
              href="/hot-sauces"
              className="panel block p-5 text-left transition hover:border-white/20"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-ember">Curated</p>
              <h3 className="mt-2 font-display text-xl text-cream">Hot sauce collections</h3>
              <p className="mt-2 text-xs leading-6 text-cream/70">
                Best for tacos, eggs, wings, gifts under $50, and more.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
