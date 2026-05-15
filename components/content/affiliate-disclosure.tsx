import Link from "next/link";

import {
  AFFILIATE_DISCLOSURE_DETAIL,
  AFFILIATE_DISCLOSURE_SUMMARY
} from "@/lib/affiliates";

interface AffiliateDisclosureProps {
  className?: string;
  compact?: boolean;
}

export function AffiliateDisclosure({
  className = "",
  compact = false
}: AffiliateDisclosureProps) {
  if (compact) {
    return (
      <aside className={`text-xs leading-6 text-charcoal/55 ${className}`.trim()}>
        <p>
          <span className="font-semibold uppercase tracking-[0.18em] text-charcoal/70">Disclosure</span>{" "}
          {AFFILIATE_DISCLOSURE_SUMMARY}{" "}
          <Link href="/affiliate-disclosure" className="font-semibold text-charcoal/75 underline underline-offset-4">
            Details
          </Link>
          .
        </p>
      </aside>
    );
  }

  return (
    <aside className={`rounded-[1.5rem] border border-charcoal/10 bg-charcoal/[0.04] px-5 py-4 ${className}`.trim()}>
      <p className="text-xs uppercase tracking-[0.22em] text-ember">Disclosure</p>
      <p className="mt-2 text-sm leading-7 text-charcoal/75">
        {AFFILIATE_DISCLOSURE_DETAIL}{" "}
        <Link href="/affiliate-disclosure" className="font-semibold text-charcoal underline underline-offset-4">
          Learn more
        </Link>
        .
      </p>
    </aside>
  );
}
