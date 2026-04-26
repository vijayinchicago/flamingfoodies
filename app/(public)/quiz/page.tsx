import { QuizForm } from "@/components/forms/quiz-form";
import { SectionHeading } from "@/components/layout/section-heading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Spice Personality Quiz | FlamingFoodies",
  description:
    "Take the heat quiz to find your spice profile and get better recipe, hot sauce, and product recommendations.",
  path: "/quiz"
});

export default function QuizPage() {
  return (
    <section className="container-shell py-16">
      <SectionHeading
        eyebrow="Heat quiz"
        title="Find the heat lane that actually fits how you cook and shop."
        copy="Answer a few quick questions to get a calmer starting point for recipes, bottles, and gift-friendly next steps."
      />
      <div className="mt-10">
        <QuizForm />
      </div>
    </section>
  );
}
