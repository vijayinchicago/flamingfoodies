import type { ReactNode } from "react";

export function TrustPageShell({
  eyebrow,
  title,
  description,
  lastUpdated,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <section className="container-shell py-16">
      <div className="max-w-5xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-4 font-display text-5xl leading-tight text-cream sm:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-cream/75">{description}</p>
        <p className="mt-5 text-sm uppercase tracking-[0.18em] text-cream/45">
          Last updated {lastUpdated}
        </p>
      </div>
      <div className="mt-10 space-y-6">{children}</div>
    </section>
  );
}
