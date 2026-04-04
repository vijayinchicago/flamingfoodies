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
  return (
    <aside
      className={`rounded-[1.5rem] border border-white/10 bg-white/[0.05] ${compact ? "px-4 py-3" : "px-5 py-4"} ${className}`.trim()}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-ember">Affiliate note</p>
      <p className={`mt-2 ${compact ? "text-xs leading-6" : "text-sm leading-7"} text-cream/72`}>
        {compact ? AFFILIATE_DISCLOSURE_SUMMARY : AFFILIATE_DISCLOSURE_DETAIL}{" "}
        <Link href="/affiliate-disclosure" className="font-semibold text-cream underline underline-offset-4">
          Learn more
        </Link>
        .
      </p>
    </aside>
  );
}
