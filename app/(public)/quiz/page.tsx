import { QuizForm } from "@/components/forms/quiz-form";
import { SectionHeading } from "@/components/layout/section-heading";

export default function QuizPage() {
  return (
    <section className="container-shell py-16">
      <SectionHeading
        eyebrow="Heat quiz"
        title="Figure out what kind of spice person you actually are."
        copy="This funnel can drive segmented email capture, personalized product recs, and useful self-selection for future campaigns."
      />
      <div className="mt-10">
        <QuizForm />
      </div>
    </section>
  );
}
