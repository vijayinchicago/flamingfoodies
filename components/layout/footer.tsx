import Link from "next/link";

import { SiteBrand } from "@/components/layout/site-brand";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-charcoal/95">
      <div className="container-shell grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <SiteBrand
            href="/"
            imageSize={64}
            titleClassName="text-3xl"
            subtitle="Flavor-first spicy food"
            subtitleClassName="tracking-[0.24em]"
          />
          <p className="mt-4 max-w-xl text-sm leading-7 text-cream/70">
            Recipes, reviews, community spotlights, and the internet&apos;s favorite place
            to chase deeper flavor and higher heat.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-ember">
            Explore
          </h2>
          <div className="mt-4 flex flex-col gap-3 text-sm text-cream/75">
            <Link href="/recipes">Recipes</Link>
            <Link href="/hot-sauces">Hot Sauces</Link>
            <Link href="/peppers">Pepper Encyclopedia</Link>
            <Link href="/brands">Brand Directory</Link>
            <Link href="/festivals">Festivals</Link>
            <Link href="/how-to">How-To Guides</Link>
            <Link href="/new-releases">New Releases</Link>
            <Link href="/community">Community Feed</Link>
            <Link href="/guides">Guides</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-ember">
            Heat Club
          </h2>
          <div className="mt-4 flex flex-col gap-3 text-sm text-cream/75">
            <Link href="/quiz">Heat Quiz</Link>
            <Link href="/subscriptions">Subscription Boxes</Link>
            <Link href="/shop">Shop</Link>
            <Link href="/leaderboard">Leaderboard</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-ember">
            Trust
          </h2>
          <div className="mt-4 flex flex-col gap-3 text-sm text-cream/75">
            <Link href="/about">About</Link>
            <Link href="/authors">Contributors</Link>
            <Link href="/editorial-policy">Editorial policy</Link>
            <Link href="/review-methodology">Review methodology</Link>
            <Link href="/corrections">Corrections</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>
      <div className="container-shell border-t border-white/10 py-5 text-xs text-cream/55">
        <Link href="/affiliate-disclosure" className="underline underline-offset-4">
          Affiliate disclosure
        </Link>
      </div>
    </footer>
  );
}
