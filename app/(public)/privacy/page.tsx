import { TrustPageShell } from "@/components/layout/trust-page-shell";
import { buildMetadata } from "@/lib/seo";

const LAST_UPDATED = "April 10, 2026";

export const metadata = buildMetadata({
  title: "Privacy Policy | FlamingFoodies",
  description:
    "How FlamingFoodies collects, uses, and stores newsletter, analytics, and affiliate-related data.",
  path: "/privacy"
});

export default function PrivacyPage() {
  return (
    <TrustPageShell
      eyebrow="Privacy"
      title="FlamingFoodies keeps the data footprint practical and tied to site operations."
      description="This page explains what information the site collects, how it is used, and what third-party services support analytics, newsletter delivery, and affiliate links."
      lastUpdated={LAST_UPDATED}
    >
      <article className="panel p-8">
        <p className="eyebrow">What we collect</p>
        <div className="mt-4 space-y-4 text-sm leading-7 text-cream/75">
          <p>
            FlamingFoodies may collect newsletter signup details such as email address and optional
            first name, basic analytics such as pages viewed and actions taken on the site, and
            community or account information if you create or use a logged-in profile.
          </p>
          <p>
            The site may also store browser-based identifiers, cookies, or session information to
            keep analytics and newsletter attribution coherent across visits.
          </p>
        </div>
      </article>

      <article className="panel p-8">
        <p className="eyebrow">How the data is used</p>
        <div className="mt-4 space-y-4 text-sm leading-7 text-cream/75">
          <p>
            We use data to run the site, deliver newsletters, understand which content is useful,
            improve discovery and navigation, and measure which recipes, reviews, guides, and shop
            picks are actually helping readers.
          </p>
          <p>
            Analytics and event data may also be used to prioritize future content, improve site
            performance, and understand which pages or email lanes create the strongest follow-on
            activity.
          </p>
        </div>
      </article>

      <article className="panel p-8">
        <p className="eyebrow">Third-party services</p>
        <div className="mt-4 space-y-4 text-sm leading-7 text-cream/75">
          <p>
            FlamingFoodies uses third-party infrastructure and services to operate, which may
            include hosting, database/authentication, analytics, session insight tools, newsletter
            delivery, advertising, and affiliate partners. These may include providers such as
            Vercel, Supabase, Google Analytics, Microsoft Clarity, newsletter tooling, Google
            AdSense, and Amazon Associates or similar affiliate platforms.
          </p>
          <p>
            Outbound affiliate links may contain tracking parameters so we can understand whether a
            recommendation led to a click or purchase-related action.
          </p>
        </div>
      </article>

      <article className="panel p-8">
        <p className="eyebrow">Your choices</p>
        <div className="mt-4 space-y-4 text-sm leading-7 text-cream/75">
          <p>
            You can choose not to sign up for the newsletter, clear browser storage or cookies, or
            stop using the site if you do not want analytics-style data captured.
          </p>
          <p>
            Newsletter subscribers can use the unsubscribe link in any email. For privacy-related
            questions or requests, use the contact page.
          </p>
        </div>
      </article>
    </TrustPageShell>
  );
}
