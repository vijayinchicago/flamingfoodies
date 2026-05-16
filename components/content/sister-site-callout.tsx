import { SISTER_SITE, type SisterSiteLink } from "@/lib/sister-site-links";

export function SisterSiteCallout({
  links,
  eyebrow
}: {
  links: SisterSiteLink[];
  eyebrow?: string;
}) {
  if (!links || links.length === 0) return null;

  // Render the first curated link only. Surfacing more than one risks looking
  // programmatic; a single editorial recommendation reads as a deliberate
  // cross-reference.
  const link = links[0];
  const cardEyebrow = eyebrow ?? link.eyebrow ?? `From ${SISTER_SITE.name}`;
  const anchor = link.anchor ?? link.title;

  return (
    <aside className="mt-8 rounded-[1.5rem] border border-charcoal/10 bg-white p-5 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">
        {cardEyebrow}
      </p>
      <h3 className="mt-2 font-display text-2xl leading-tight text-charcoal">
        <a
          href={link.url}
          rel="noopener"
          className="hover:text-ember underline-offset-4 hover:underline"
        >
          {anchor}
        </a>
      </h3>
      <p className="mt-2 text-sm leading-7 text-charcoal/70">{link.reason}</p>
      <p className="mt-3 text-xs text-charcoal/45">
        Published on {SISTER_SITE.name}, our BBQ sister site.
      </p>
    </aside>
  );
}
