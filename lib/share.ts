export const SHARE_PLATFORMS = [
  "native",
  "copy",
  "pinterest",
  "facebook",
  "x",
  "whatsapp",
  "reddit"
] as const;

export type SharePlatform = (typeof SHARE_PLATFORMS)[number];

type BuildShareUrlsInput = {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
};

function withShareTracking(url: string, source: string) {
  const trackedUrl = new URL(url);
  trackedUrl.searchParams.set("utm_source", source);
  trackedUrl.searchParams.set("utm_medium", "social");
  trackedUrl.searchParams.set("utm_campaign", "organic_share");
  return trackedUrl.toString();
}

export function buildShareUrls({ url, title, description, imageUrl }: BuildShareUrlsInput) {
  const tracked = {
    native: withShareTracking(url, "share"),
    copy: withShareTracking(url, "share"),
    pinterest: withShareTracking(url, "pinterest"),
    facebook: withShareTracking(url, "facebook"),
    x: withShareTracking(url, "x"),
    whatsapp: withShareTracking(url, "whatsapp"),
    reddit: withShareTracking(url, "reddit")
  };

  const summary = description?.trim() || title;
  const urls = {
    pinterest: new URL("https://www.pinterest.com/pin/create/button/"),
    facebook: new URL("https://www.facebook.com/sharer/sharer.php"),
    x: new URL("https://twitter.com/intent/tweet"),
    whatsapp: new URL("https://wa.me/"),
    reddit: new URL("https://reddit.com/submit")
  };

  urls.pinterest.searchParams.set("url", tracked.pinterest);
  urls.pinterest.searchParams.set("description", `${title} | ${summary}`);
  if (imageUrl) {
    urls.pinterest.searchParams.set("media", imageUrl);
  }

  urls.facebook.searchParams.set("u", tracked.facebook);
  urls.x.searchParams.set("url", tracked.x);
  urls.x.searchParams.set("text", `${title} | FlamingFoodies`);
  urls.whatsapp.searchParams.set("text", `${title} ${tracked.whatsapp}`);
  urls.reddit.searchParams.set("url", tracked.reddit);
  urls.reddit.searchParams.set("title", title);

  return {
    tracked,
    network: {
      pinterest: urls.pinterest.toString(),
      facebook: urls.facebook.toString(),
      x: urls.x.toString(),
      whatsapp: urls.whatsapp.toString(),
      reddit: urls.reddit.toString()
    }
  };
}
