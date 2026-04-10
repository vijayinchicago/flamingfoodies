import Image from "next/image";
import Link from "next/link";

import {
  getHotSauceBestForCopy,
  getHotSauceIntentLabel,
  getHotSauceSkipIfCopy
} from "@/lib/hot-sauces";
import { getReviewHeroFields } from "@/lib/review-hero";
import type { Review } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function formatHeatLabel(heatLevel?: Review["heatLevel"]) {
  if (!heatLevel) return "all heat levels";
  return heatLevel.replace("_", " ");
}

export function ReviewCard({ review }: { review: Review }) {
  const hero = getReviewHeroFields(review);
  const intentLabel = getHotSauceIntentLabel(review);
  const bestFor = getHotSauceBestForCopy(review);
  const skipIf = getHotSauceSkipIfCopy(review);

  return (
    <Link
      href={`/reviews/${review.slug}`}
      className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
    >
      {hero.imageUrl ? (
        <div className="relative h-56 overflow-hidden">
          <Image
            src={hero.imageUrl}
            alt={hero.imageAlt}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="h-56 bg-gradient-to-br from-flame/30 via-ember/20 to-transparent" />
      )}
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-ember">
          <span>{review.brand}</span>
          <span className="text-cream/35">•</span>
          <span>{formatHeatLabel(review.heatLevel)}</span>
        </div>
        <h3 className="mt-4 font-display text-3xl leading-tight text-cream">{review.title}</h3>
        <p className="mt-3 text-sm leading-7 text-cream/72">{review.description}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.22em] text-ember">{intentLabel}</p>
        <div className="mt-4 space-y-2 text-sm leading-6 text-cream/72">
          <p>
            <span className="font-semibold text-cream">Best for:</span> {bestFor}
          </p>
          <p>
            <span className="font-semibold text-cream">Skip if:</span> {skipIf}
          </p>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-sm font-semibold text-amber-100">
            {review.rating.toFixed(1)}/5
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-cream/70">
            {review.category}
          </span>
          <span className="text-xs text-cream/48">{formatDate(review.publishedAt)}</span>
        </div>
        <p className="mt-5 text-sm font-semibold text-cream group-hover:text-white">
          Read review
        </p>
      </div>
    </Link>
  );
}
