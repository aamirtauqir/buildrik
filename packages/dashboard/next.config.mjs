import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  transpilePackages: ["@buildrik/editor"],
  compiler: { emotion: true },
  // Legacy ?siteId= bookmark forwarding on dashboard origin only.
  // Cross-origin editor.buildrik.com stale bookmarks need a Vercel-project
  // redirect rule (Phase 4 cleanup checklist).
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "query", key: "siteId", value: "(?<id>.+)" }],
        destination: "/edit/:id",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.bunny.net; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.bunny.net; img-src 'self' data: https:; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://fonts.bunny.net; connect-src 'self' https://fonts.bunny.net" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.EDITOR_ORIGIN || "http://localhost:5050" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

// withSentryConfig is safe to call even without DSN — it only activates
// source-map upload + release tagging when SENTRY_AUTH_TOKEN + SENTRY_ORG
// + SENTRY_PROJECT are set in Vercel env. Dev builds stay untouched.
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  disableLogger: true,
});
