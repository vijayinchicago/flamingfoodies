import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-charcoal/95">
      <div className="container-shell grid gap-10 py-14 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <div className="font-display text-3xl text-cream">FlamingFoodies</div>
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
            <Link href="/reviews">Hot Sauce Reviews</Link>
            <Link href="/community">Community Feed</Link>
            <Link href="/competitions">Competitions</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-ember">
            Heat Club
          </h2>
          <div className="mt-4 flex flex-col gap-3 text-sm text-cream/75">
            <Link href="/quiz">Heat Quiz</Link>
            <Link href="/subscriptions">Subscription Boxes</Link>
            <Link href="/shop">Merch</Link>
            <Link href="/leaderboard">Leaderboard</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
