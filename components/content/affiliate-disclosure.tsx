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
      <aside className={`text-xs leading-6 text-cream/52 ${className}`.trim()}>
        <p>
          <span className="font-semibold uppercase tracking-[0.18em] text-cream/62">Disclosure</span>{" "}
          {AFFILIATE_DISCLOSURE_SUMMARY}{" "}
          <Link href="/affiliate-disclosure" className="font-semibold text-cream/72 underline underline-offset-4">
            Details
          </Link>
          .
        </p>
      </aside>
    );
  }

  return (
    <aside className={`rounded-[1.5rem] border border-white/10 bg-white/[0.05] px-5 py-4 ${className}`.trim()}>
      <p className="text-xs uppercase tracking-[0.22em] text-ember">Disclosure</p>
      <p className="mt-2 text-sm leading-7 text-cream/72">
        {AFFILIATE_DISCLOSURE_DETAIL}{" "}
        <Link href="/affiliate-disclosure" className="font-semibold text-cream underline underline-offset-4">
          Learn more
        </Link>
        .
      </p>
    </aside>
  );
}
