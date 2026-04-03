import { ContentCard } from "@/components/cards/content-card";
import type { Competition } from "@/lib/types";

export function CompetitionCard({ competition }: { competition: Competition }) {
  return (
    <ContentCard
      href={`/competitions/${competition.slug}`}
      image={competition.imageUrl}
      imageAlt={competition.title}
      eyebrow={`${competition.status} · ${competition.entries.length} entries`}
      title={competition.title}
      description={competition.description}
      meta={competition.startDate}
    />
  );
}
