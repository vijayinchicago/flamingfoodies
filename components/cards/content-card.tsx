import Image from "next/image";
import Link from "next/link";

import { formatDate } from "@/lib/utils";

export function ContentCard({
  href,
  image,
  imageAlt,
  eyebrow,
  title,
  description,
  meta
}: {
  href: string;
  image?: string;
  imageAlt?: string;
  eyebrow: string;
  title: string;
  description: string;
  meta?: string;
}) {
  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
    >
      {image ? (
        <div className="relative h-48 overflow-hidden sm:h-56">
          <Image
            src={image}
            alt={imageAlt || title}
            fill
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="h-56 bg-gradient-to-br from-flame/30 via-ember/20 to-transparent" />
      )}
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="eyebrow">{eyebrow}</p>
          {meta ? <span className="text-xs text-cream/55">{formatDate(meta)}</span> : null}
        </div>
        <h3 className="mt-4 font-display text-2xl leading-tight text-cream sm:text-3xl">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-cream/72">{description}</p>
      </div>
    </Link>
  );
}
