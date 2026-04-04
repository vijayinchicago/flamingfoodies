import Script from "next/script";

export function AdScript({ clientId }: { clientId: string }) {
  return (
    <Script
      id="adsense-manual-slots"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
    />
  );
}
