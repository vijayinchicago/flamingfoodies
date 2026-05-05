import { PrintButton } from "@/components/rewards/print-button";
import { buildMetadata } from "@/lib/seo";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { flags } from "@/lib/env";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "The Starter Shelf — Flame Club VIP Reward",
  description:
    "The hot sauces that earn their space. Each one tested, with what it's good on, what to skip it for, and where to buy it cheapest. Flame Club Tier 2 reward.",
  path: "/rewards/ten-bottle-shelf-x9k3lm5pq2",
  noIndex: true
});

type ShelfBottle = {
  slug: string;
  productName: string;
  brand: string;
  rating: number | null;
  priceUsd: number | null;
  heatLevel: string | null;
  category: string | null;
  description: string | null;
  affiliateUrl: string | null;
  // Hand-curated additions per bottle
  bestFor: string;
  skipFor: string;
};

// Editorial commentary per bottle. Updated when curation changes; not
// stored in the DB because this is reward-page-specific opinion content.
const SHELF_NOTES: Record<
  string,
  Pick<ShelfBottle, "bestFor" | "skipFor">
> = {
  "heatonist-los-calientes-rojo-review": {
    bestFor:
      "Eggs, tacos al pastor, anything where you want smoke without commitment. The first bottle I'd put in a cold pantry.",
    skipFor:
      "If you want a vinegar-forward Louisiana-style burn — this is built around fruit and char, not acid."
  },
  "queen-majesty-scotch-bonnet-ginger-review": {
    bestFor:
      "Caribbean dishes, jerk chicken, anything with mango or pineapple. The ginger does serious work alongside seafood.",
    skipFor:
      "Pizza or a steak rub — the floral fruit profile gets lost in heavy savory."
  },
  "torchbearer-garlic-reaper-review": {
    bestFor:
      "When you want extreme heat with actual flavor — a single dab in a pot of chili, on top of pizza for one, or wing sauce for guests who think they can hang.",
    skipFor:
      "Daily use. This is a special-occasion bottle. Use a quarter teaspoon and walk away."
  },
  "yellowbird-habanero-hot-sauce-review": {
    bestFor:
      "Burritos, fried chicken, anything that needs bright orange heat without smoke. Best price-to-flavor ratio on the shelf.",
    skipFor:
      "Asian dishes — the carrot sweetness fights with soy and fish sauce."
  },
  "mikes-hot-honey-review": {
    bestFor:
      "Pizza (especially pepperoni), fried chicken, sharp cheese, biscuits, fruit. The gateway pantry move that converts skeptics.",
    skipFor:
      "Anywhere you don't want sweetness. It's honey first, heat second — by design."
  },
  "fly-by-jing-sichuan-gold-review": {
    bestFor:
      "Dumplings (obviously), but also rice bowls, scrambled eggs, and a drizzle on roasted broccoli. The peppercorn tingle is unique.",
    skipFor:
      "Cuisines outside the Sichuan/East-Asian lane — the numbing quality is polarizing in a Mexican context."
  }
};

async function loadShelf(): Promise<ShelfBottle[]> {
  if (!flags.hasSupabaseAdmin) return [];
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("reviews")
    .select(
      "slug, product_name, brand, rating, price_usd, heat_level, category, description, affiliate_url"
    )
    .eq("status", "published")
    .eq("recommended", true)
    .in("category", ["hot-sauce", "pantry-condiment"])
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(20);

  return (data ?? [])
    .filter((row) => SHELF_NOTES[row.slug as string])
    .map((row) => ({
      slug: row.slug as string,
      productName: row.product_name as string,
      brand: row.brand as string,
      rating: (row.rating as number | null) ?? null,
      priceUsd: (row.price_usd as number | null) ?? null,
      heatLevel: (row.heat_level as string | null) ?? null,
      category: (row.category as string | null) ?? null,
      description: (row.description as string | null) ?? null,
      affiliateUrl: (row.affiliate_url as string | null) ?? null,
      ...SHELF_NOTES[row.slug as string]
    }));
}

function ShelfBottleCard({ bottle, index }: { bottle: ShelfBottle; index: number }) {
  return (
    <article className="break-inside-avoid border-t border-charcoal/15 pt-6 print:pt-4">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-flame">
            Pick {String(index + 1).padStart(2, "0")} · {bottle.brand}
          </p>
          <h3 className="mt-1 font-display text-3xl text-charcoal print:text-2xl">
            {bottle.productName}
          </h3>
        </div>
        <div className="text-right">
          {bottle.priceUsd != null ? (
            <p className="text-sm font-semibold text-charcoal">
              ${bottle.priceUsd.toFixed(2)}
            </p>
          ) : null}
          {bottle.heatLevel ? (
            <p className="mt-1 text-[0.65rem] uppercase tracking-[0.22em] text-charcoal/55">
              {bottle.heatLevel}
            </p>
          ) : null}
        </div>
      </header>

      {bottle.description ? (
        <p className="mt-3 text-sm font-medium italic leading-6 text-charcoal/85">
          {bottle.description}
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2 print:grid-cols-2">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-flame">
            Best for
          </p>
          <p className="mt-2 text-sm leading-6 text-charcoal/85">{bottle.bestFor}</p>
        </div>
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-flame">
            Skip if
          </p>
          <p className="mt-2 text-sm leading-6 text-charcoal/85">{bottle.skipFor}</p>
        </div>
      </div>

      {bottle.affiliateUrl ? (
        <p className="mt-4 text-xs leading-6 text-charcoal/70">
          <span className="font-semibold text-charcoal">Where to buy:</span>{" "}
          <a
            href={bottle.affiliateUrl}
            target="_blank"
            rel="noreferrer"
            className="text-flame underline decoration-flame/40 underline-offset-2"
          >
            {bottle.affiliateUrl.includes("amazon.com")
              ? "Amazon"
              : new URL(bottle.affiliateUrl).hostname.replace(/^www\./, "")}
          </a>{" "}
          · Read the full review at flamingfoodies.com/reviews/{bottle.slug}
        </p>
      ) : null}
    </article>
  );
}

export default async function StarterShelfPage() {
  const bottles = await loadShelf();

  return (
    <article className="bg-cream text-charcoal print:bg-white">
      <style>{`
        @media print {
          @page { margin: 0.6in; }
          a { color: inherit; text-decoration: none; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="container-shell py-12 print:py-0">
        <div className="mx-auto max-w-3xl">
          {/* Cover */}
          <header className="border-b-4 border-flame pb-10 print:pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-flame">
              Flame Club · VIP Reward
            </p>
            <h1 className="mt-4 font-display text-5xl leading-tight text-charcoal print:text-4xl">
              The Starter Shelf
            </h1>
            <p className="mt-4 text-base leading-7 text-charcoal/80 print:text-sm">
              The hot sauces I&apos;d build a kitchen around if I were starting from
              scratch tomorrow. Each one earns its space. For each, I&apos;ll tell
              you what it&apos;s actually good on, what to skip it for, and where
              the cheapest place to buy is.
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.22em] text-charcoal/55">
              You earned this with five Flame Club referrals · Edition 1
            </p>
          </header>

          {/* How to use */}
          <section className="mt-10 break-inside-avoid">
            <h2 className="font-display text-2xl text-charcoal">How I picked these</h2>
            <p className="mt-3 text-sm leading-7 text-charcoal/85">
              Most &ldquo;best hot sauce&rdquo; lists are built to drive Amazon clicks.
              This isn&apos;t one of those. Each bottle here covers a real
              kitchen lane — smoky, fruity, garlicky, sweet-heat, numbing,
              extreme — so the shelf works as a system, not a duplicate
              stack of tabasco-likes.
            </p>
            <p className="mt-3 text-sm leading-7 text-charcoal/85">
              Buy them over time, not all at once. Three at a time gives you
              enough variety to taste the differences side-by-side. If you
              build the whole shelf, send me a photo (reply to any Friday
              email) — I post the best ones with permission.
            </p>
          </section>

          {/* Bottles */}
          <section className="mt-12 print:mt-8">
            <header className="break-inside-avoid border-b border-charcoal/30 pb-3">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-flame">
                The shelf
              </p>
              <h2 className="mt-2 font-display text-3xl text-charcoal print:text-2xl">
                Hand-picked bottles
              </h2>
              <p className="mt-2 text-sm italic leading-6 text-charcoal/75">
                Ranked by my honest take, not by price or affiliate margin.
              </p>
            </header>
            <div className="mt-6 space-y-8 print:space-y-6">
              {bottles.length === 0 ? (
                <p className="text-sm leading-7 text-charcoal/70">
                  Bottle list is being refreshed. Check back in a few minutes,
                  or reply to any Flame Club email and I&apos;ll send the latest cut.
                </p>
              ) : (
                bottles.map((bottle, idx) => (
                  <ShelfBottleCard key={bottle.slug} bottle={bottle} index={idx} />
                ))
              )}
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-16 border-t-4 border-flame pt-6 print:mt-12">
            <p className="font-display text-2xl text-charcoal">— Vijay</p>
            <p className="mt-2 text-sm text-charcoal/75">
              Editor, FlamingFoodies · This list grows as we test more bottles
              worth space. Hit reply with what you&apos;d add to the shelf.
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.22em] text-charcoal/55">
              flamingfoodies.com · Please don&apos;t share this URL publicly — it&apos;s
              a VIP reward, not a public page.
            </p>
          </footer>

          <div className="no-print mt-10 flex justify-center">
            <PrintButton />
          </div>
        </div>
      </div>
    </article>
  );
}
