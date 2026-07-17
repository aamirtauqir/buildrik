// IA v2 route-merge redirects (spec 2026-07-16-dashboard-ia-v2-design), SSOT.
// 308 permanent because sent emails link /dashboard/reviews; Next merges
// incoming query params onto the destination. `/dashboard/sites` is EXACT only
// (no `/:path*`) so site-detail `/dashboard/sites/[id]` survives untouched.
// Imported by next.config.mjs and asserted by the redirect-table contract test.
export const IA_V2_REDIRECTS = [
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
