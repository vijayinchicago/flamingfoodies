import type { Metadata } from "next";
import Script from "next/script";

import "@/app/globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { env } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "FlamingFoodies | Turn Up the Heat",
  description:
    "Recipes, reviews, competitions, and spicy food culture for people who like their meals with a serious kick.",
  path: "/"
});

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-flame-gradient">
          <Header />
          <main>{children}</main>
          <Footer />
        </div>
        {env.NEXT_PUBLIC_GA4_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${env.NEXT_PUBLIC_GA4_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${env.NEXT_PUBLIC_GA4_ID}');`}
            </Script>
          </>
        ) : null}
        {env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? (
          <Script
            defer
            data-domain={env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.outbound-links.js"
            strategy="afterInteractive"
          />
        ) : null}
        {env.NEXT_PUBLIC_CLARITY_ID ? (
          <Script id="clarity-init" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${env.NEXT_PUBLIC_CLARITY_ID}");`}
          </Script>
        ) : null}
      </body>
    </html>
  );
}
