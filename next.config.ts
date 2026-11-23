import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The live-mode API route reads demo prompts, samples and context files at
  // runtime, so make sure they are bundled with the serverless function.
  outputFileTracingIncludes: {
    "/api/live/[slug]": ["./content/demos/**/*"],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
