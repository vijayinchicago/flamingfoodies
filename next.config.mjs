/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" }
    ]
  },
  async redirects() {
    return [
      // 301 the deprecated /hot-sauces/under-15 page into the consolidated
      // affordable picks page, which contains both an under-$15 section and
      // an under-$50 section. Preserves link equity and search rankings.
      {
        source: "/hot-sauces/under-15",
        destination: "/hot-sauces/affordable",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
