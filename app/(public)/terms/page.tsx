import { TrustPageShell } from "@/components/layout/trust-page-shell";
import { buildMetadata } from "@/lib/seo";

const LAST_UPDATED = "April 10, 2026";

export const metadata = buildMetadata({
  title: "Terms of Use | FlamingFoodies",
  description:
    "Basic terms covering use of FlamingFoodies content, recommendations, affiliate links, and site access.",
  path: "/terms"
});

export default function TermsPage() {
  return (
    <TrustPageShell
      eyebrow="Terms"
      title="Use the site like a helpful kitchen companion, not a loophole."
      description="These terms cover basic use of FlamingFoodies content, recommendations, and public site features."
      lastUpdated={LAST_UPDATED}
    >
      <article className="panel p-8">
        <p className="eyebrow">Editorial content</p>
        <div className="mt-4 space-y-4 text-sm leading-7 text-cream/75">
          <p>
            Recipes, reviews, guides, and other editorial content on FlamingFoodies are provided
            for general information and inspiration. They are not a substitute for your own
            judgment about ingredients, allergies, equipment safety, or product suitability.
          </p>
          <p>
            We try to keep information accurate and useful, but we cannot guarantee that every
            detail will always be current, complete, or right for every kitchen.
          </p>
        </div>
      </article>

      <article className="panel p-8">
        <p className="eyebrow">Recommendations and affiliate links</p>
        <div className="mt-4 space-y-4 text-sm leading-7 text-cream/75">
          <p>
            Some outbound links on FlamingFoodies are affiliate links. If you choose to buy through
            one, FlamingFoodies may earn a commission at no additional cost to you.
          </p>
          <p>
            Product availability, pricing, and third-party policies are controlled by the linked
            retailer or partner, not by FlamingFoodies.
          </p>
        </div>
      </article>

      <article className="panel p-8">
        <p className="eyebrow">Site use</p>
        <div className="mt-4 space-y-4 text-sm leading-7 text-cream/75">
          <p>
            You agree not to abuse the site, interfere with its operation, scrape it in a way that
            harms normal use, or submit unlawful, fraudulent, or abusive content through any public
            or account-based features.
          </p>
          <p>
            FlamingFoodies may remove content, limit access, or update site features at any time in
            order to protect the service and the people using it.
          </p>
        </div>
      </article>

      <article className="panel p-8">
        <p className="eyebrow">Ownership</p>
        <div className="mt-4 space-y-4 text-sm leading-7 text-cream/75">
          <p>
            Unless otherwise stated, site copy, structure, branding, and original editorial content
            belong to FlamingFoodies. Please do not republish full content without permission.
          </p>
          <p>
            Questions about reuse, quoting, or partnerships should go through the contact page.
          </p>
        </div>
      </article>
    </TrustPageShell>
  );
}
