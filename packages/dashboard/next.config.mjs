import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for cPanel / LiteSpeed Node-app deploys.
  // Produces .next/standalone/ — a self-contained portable Node server
  // with only the deps actually used at runtime (~80MB vs 571MB full build).
  // Run via: cd .next/standalone/packages/dashboard && node server.js
  //
  // outputFileTracingRoot pinned to monorepo root so the standalone bundle
  // does NOT embed the developer's absolute path (default behavior would
  // create .next/standalone/Users/<you>/.../buildrik/... which breaks
  // deploy portability).
  output: "standalone",
  outputFileTracingRoot: process.cwd().includes("packages/dashboard")
    ? process.cwd().replace(/\/packages\/dashboard$/, "")
    : process.cwd(),
  // "openai" is externalized (not bundled) so the standalone tracer copies it
  // into .next/standalone/node_modules. Both openai.client.ts and
  // ollama.client.ts import it (Ollama speaks the OpenAI-compatible API); nft
  // did NOT trace it through the bundled path, so the standalone shipped
  // without it and every AI call died on "Cannot find module 'openai'".
  serverExternalPackages: ["@prisma/client", "bcryptjs", "isomorphic-dompurify", "openai"],
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
      // IA v2 route merge (spec 2026-07-16-dashboard-ia-v2-design). 308 permanent:
      // sent emails link /dashboard/reviews. Next merges incoming query params.
      // /dashboard/sites is EXACT only — site-detail /dashboard/sites/[id] survives.
      { source: "/dashboard/sites", destination: "/dashboard/projects", permanent: true },
      { source: "/dashboard/apps", destination: "/dashboard/marketplace", permanent: true },
      { source: "/dashboard/reviews", destination: "/dashboard/agency/reviews", permanent: true },
      { source: "/dashboard/comments", destination: "/dashboard/agency/reviews", permanent: true },
      { source: "/dashboard/partner", destination: "/dashboard/agency/partner", permanent: true },
      { source: "/dashboard/theme", destination: "/dashboard/agency/theme", permanent: true },
      { source: "/dashboard/clients", destination: "/dashboard/agency", permanent: true },
      { source: "/dashboard/clients/:id", destination: "/dashboard/agency/:id", permanent: true },
      { source: "/dashboard/team", destination: "/dashboard/settings/team", permanent: true },
      { source: "/dashboard/plans", destination: "/dashboard/settings/plans", permanent: true },
      { source: "/dashboard/usage", destination: "/dashboard/settings/usage", permanent: true },
      { source: "/dashboard/billing", destination: "/dashboard/settings/billing", permanent: true },
      { source: "/dashboard/domains", destination: "/dashboard/settings/domains", permanent: true },
      { source: "/dashboard/integrations", destination: "/dashboard/settings/integrations", permanent: true },
      { source: "/dashboard/libraries", destination: "/dashboard/templates", permanent: true },
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
