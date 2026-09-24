/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_RC1_PREVIEW: process.env.VERCEL_ENV === "preview" ? "true" : process.env.NEXT_PUBLIC_RC1_PREVIEW || "false"
  },
  async redirects() {
    return [
      {
        source: "/privacy",
        destination: "/privacy-policy",
        permanent: true
      },
      {
        source: "/terms",
        destination: "/terms-of-use",
        permanent: true
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.VERCEL_ENV === "preview" || process.env.NEXT_PUBLIC_RC1_PREVIEW === "true" ? "ecluxmyxqofkbzcyurlf.supabase.co" : "*.supabase.co",
        pathname: "/storage/v1/object/public/**"
      }
    ]
  }
};

export default nextConfig;
