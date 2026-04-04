import { CompetitionCard } from "@/components/cards/competition-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { buildMetadata } from "@/lib/seo";
import { getCompetitions } from "@/lib/services/content";

export const metadata = buildMetadata({
  title: "Spicy Food Competitions | FlamingFoodies",
  description:
    "Monthly spicy cooking and heat challenges designed to drive community participation and repeat visits.",
  path: "/competitions"
});

export default async function CompetitionsPage() {
  const competitions = await getCompetitions();

  return (
    <section className="container-shell py-16">
      <SectionHeading
        eyebrow="Competitions"
        title="Monthly challenge loops that turn heat into retention."
        copy="Competitions create recurring UGC, social moments, and newsletter hooks with relatively low editorial cost."
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {competitions.map((competition) => (
          <CompetitionCard key={competition.id} competition={competition} />
        ))}
      </div>
    </section>
  );
}
