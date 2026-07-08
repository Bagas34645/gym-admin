import type { NextConfig } from "next";

function imageRemotePatterns() {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    { protocol: "http", hostname: "localhost" },
    { protocol: "http", hostname: "127.0.0.1" },
  ];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL;
  if (apiUrl) {
    try {
      const parsed = new URL(apiUrl);
      const protocol = parsed.protocol.replace(":", "") as "http" | "https";
      if (!patterns.some((p) => p.hostname === parsed.hostname)) {
        patterns.push({ protocol, hostname: parsed.hostname });
      }
    } catch {
      // ignore invalid URL
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: imageRemotePatterns(),
  },
};

export default nextConfig;
