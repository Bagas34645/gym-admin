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

/** Extra hosts allowed to hit Next.js dev resources (HMR, client runtime) via LAN IP. */
function allowedDevOrigins(): string[] {
  const fromEnv = (process.env.ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return Array.from(
    new Set(["192.168.18.11", "127.0.0.1", ...fromEnv]),
  );
}

const nextConfig: NextConfig = {
  allowedDevOrigins: allowedDevOrigins(),
  images: {
    remotePatterns: imageRemotePatterns(),
  },
};

export default nextConfig;
