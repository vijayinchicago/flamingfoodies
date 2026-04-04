import { SectionHeading } from "@/components/layout/section-heading";
import { FaqSchema } from "@/components/schema/faq-schema";
import type { RecipeFaq } from "@/lib/types";

export function HotSauceFaqSection({
  eyebrow,
  title,
  copy,
  faqs
}: {
  eyebrow: string;
  title: string;
  copy: string;
  faqs: RecipeFaq[];
}) {
  if (!faqs.length) {
    return null;
  }

  return (
    <div className="mt-12">
      <FaqSchema faqs={faqs} />
      <SectionHeading eyebrow={eyebrow} title={title} copy={copy} />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {faqs.map((faq) => (
          <article key={faq.question} className="panel p-6">
            <h3 className="font-display text-3xl text-cream">{faq.question}</h3>
            <p className="mt-4 text-sm leading-7 text-cream/72">{faq.answer}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
