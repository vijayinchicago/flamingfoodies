import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ComparePicker } from "@/components/peppers/compare-picker";
import { buildMetadata } from "@/lib/seo";
import { getPeppersSortedByHeat } from "@/lib/peppers";

export const metadata = buildMetadata({
  title: "Compare Peppers: Scoville, Flavor & Heat Side-by-Side | FlamingFoodies",
  description:
    "Pick two peppers and compare their scoville, flavor, and culinary uses side by side. Includes a heat-multiplier and which-to-use guidance.",
  path: "/peppers/compare"
});

export default async function PepperComparePickerPage() {
  const peppers = getPeppersSortedByHeat();

  return (
    <article className="container-shell py-12">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Pepper Encyclopedia", href: "/peppers" },
          { label: "Compare" }
        ]}
      />
      <header className="mt-6 max-w-3xl">
        <p className="eyebrow">Pepper comparison</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-charcoal sm:text-5xl">
          Compare two peppers side by side.
        </h1>
        <p className="mt-4 text-lg leading-8 text-charcoal/75">
          Pick any two chiles and see how their scoville, flavor, and culinary use stack up — with
          a heat multiplier and a quick which-to-use verdict.
        </p>
      </header>

      <section className="mt-10">
        <ComparePicker peppers={peppers.map((p) => ({ slug: p.slug, name: p.name }))} />
      </section>
    </article>
  );
}
