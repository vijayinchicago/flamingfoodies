import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type SiteBrandProps = {
  href?: string;
  className?: string;
  imageSize?: number;
  onClick?: () => void;
  priority?: boolean;
  subtitle?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

export function SiteBrand({
  href,
  className,
  imageSize = 44,
  onClick,
  priority = false,
  subtitle,
  titleClassName,
  subtitleClassName
}: SiteBrandProps) {
  const content = (
    <>
      <span
        className="relative shrink-0 overflow-hidden rounded-[1.1rem] border border-white/10 bg-[#120b08] shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
        style={{ width: imageSize, height: imageSize }}
      >
        <Image
          src="/brand/flamingfoodies-mark.png"
          alt="FlamingFoodies logo"
          fill
          priority={priority}
          sizes={`${imageSize}px`}
          className="object-cover"
        />
      </span>
      <span className="min-w-0">
        <span className={cn("block font-display text-xl text-cream sm:text-2xl", titleClassName)}>
          FlamingFoodies
        </span>
        {subtitle ? (
          <span
            className={cn(
              "hidden text-xs uppercase tracking-[0.28em] text-cream/55 sm:block",
              subtitleClassName
            )}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={cn("flex min-w-0 items-center gap-3", className)}>
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={cn("flex min-w-0 items-center gap-3", className)}>
      {content}
    </div>
  );
}
