#!/usr/bin/env node
/**
 * Every tRPC procedure must have a caller, or an entry here saying why not.
 *
 * The 2026-08-27 dashboard walk found 27 procedures nothing calls. Two of them
 * were real user-facing gaps hiding in plain sight — `media.moveAsset` (you
 * could create media folders and never file anything into one) and
 * `sites.unarchive` (archiving a site was one-way from the UI, with an
 * "Archived · N" filter to look at what you could never bring back). Both had a
 * working service, schema, permission check and error mapping. Only the door
 * was missing, and nothing in the repo said so.
 *
 * This is the thing that would have caught them. It does NOT delete anything:
 * an unbuilt feature's server half is worth keeping, and deciding to drop one
 * is a product call, not a lint. What it refuses is SILENCE — a new orphan must
 * be named and given a reason before it can be pushed.
 *
 * Two call styles count as a consumer, because the repo uses both and an early
 * version of this scan knew only the first:
 *   1. `trpc.foo.bar.useQuery(...)` / `client().foo.bar.mutate(...)`
 *   2. `fetch("/api/trpc/foo.bar", ...)` — how the editor reaches ai.summarize
 *      and ai.milestoneSuggest, which a client-only scan reports as dead.
 *
 * Usage: node scripts/check-trpc-orphans.mjs        (from packages/dashboard)
 *
 * @license BSD-3-Clause
 */
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const DASHBOARD = path.resolve(HERE, "..");
const ROOT = path.resolve(DASHBOARD, "../..");

/** Router file basename -> the key it is mounted under in server/trpc/router.ts. */
const ROUTER_KEYS = {
  auth: "auth", dashboard: "dashboard", sites: "sites", "site-detail": "siteDetail",
  templates: "templates", team: "team", billing: "billing", account: "account",
  help: "help", learn: "learn", notifications: "notifications", onboarding: "onboarding",
  pages: "pages", forms: "forms", upload: "upload", ai: "ai", media: "media",
  "api-tokens": "apiTokens", integrations: "integrations.vercel", actions: "actions",
  features: "features", clients: "clients", reviews: "reviews", handover: "handover",
  "client-review": "clientReview", comments: "comments", webhooks: "webhooks",
  cms: "cms", theme: "theme", "site-version": "siteVersions",
  "site-component": "siteComponents", "user-template": "userTemplates",
  marketplace: "marketplace",
};

/**
 * Known orphans, each with the reason it is allowed to have no caller.
 * Removing a procedure's entry after wiring it up is the point — this list
 * should shrink. Adding one requires saying why in the same commit.
 */
const ALLOWED = {
  // --- superseded: a shipped screen already does this job ---
  "billing.usage": "The Usage screen reads dashboard.usage; this is a second reader of the same numbers.",
  "team.auditLog": "Reads activityLog — the same table /dashboard/activity already shows via dashboard.activity.",
  "dashboard.quickActions": "Home's quick actions are a fixed list now (components/dashboard/quick-actions.tsx).",
  "dashboard.recentSites": "Home shows recent ACTIVITY, not recent sites; the sites list is its own screen.",
  "auth.logout": "Sign-out goes through NextAuth signOut + /api/auth/logout.",
  "ai.getQuotaStatus": "The AI settings screen reads account.aiCredits.",
  "sites.getProjectData": "The editor loads through sites.get; saves through sites.saveProject.",
  "sites.saveProjectData": "Superseded by sites.saveProject (editorSaveProjectSchema) — see packages/shared/schemas/sites.ts.",
  "upload.limits": "Upload limits are read from PLAN_LIMITS on the client.",
  "siteComponents.usage": "The editor's component library shows usage from its own local registry.",
  "help.categories": "The Help index renders its categories from help.articles.",
  "onboarding.completeStep": "The wizard persists its position through onboarding.saveProgress.",
  "theme.snapshots": "Theme history is not surfaced; the Brand panel reads the live theme.",

  // --- built server-side, UI never built. A product decision, not dead code ---
  "theme.presets.list": "Theme presets: server half complete, no UI. FOUNDER DECISION — build or drop.",
  "theme.presets.save": "Theme presets: server half complete, no UI. FOUNDER DECISION — build or drop.",
  "theme.presets.delete": "Theme presets: server half complete, no UI. FOUNDER DECISION — build or drop.",
  "theme.presets.applyPreset": "Theme presets: server half complete, no UI. FOUNDER DECISION — build or drop.",
  "pages.create": "Page CRUD lives in the editor's Pages panel, which mutates through the project save.",
  "pages.update": "Page CRUD lives in the editor's Pages panel, which mutates through the project save.",
  "pages.getTranslation": "Per-locale page content: server half complete, no i18n UI. FOUNDER DECISION.",
  "pages.setTranslation": "Per-locale page content: server half complete, no i18n UI. FOUNDER DECISION.",
  "pages.removeTranslation": "Per-locale page content: server half complete, no i18n UI. FOUNDER DECISION.",
  "cms.dynamicPages": "Collection-driven pages: server half complete, no UI. FOUNDER DECISION.",
  "cms.generateDynamicPages": "Collection-driven pages: server half complete, no UI. FOUNDER DECISION.",
  "templates.cloneFromSite": "\"Save this site as a template\" has no entry point. FOUNDER DECISION.",
  "media.moveFolder": "Re-parents a folder; the media UI is deliberately a flat folder list.",
  "userTemplates.delete": "Editor lane: templateSync saves and lists user templates but never deletes one.",
};

/** Every procedure the app router exposes, as its full dotted path. */
function collectProcedures() {
  const dir = path.join(ROOT, "server/trpc/routers");
  const out = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".ts")) continue;
    const base = file.slice(0, -3);
    const key = ROUTER_KEYS[base];
    if (!key) continue;
    const stack = [key];
    let nestedIndent = 2;
    for (const line of fs.readFileSync(path.join(dir, file), "utf8").split("\n")) {
      const nested = line.match(/^(\s+)([a-zA-Z][a-zA-Z0-9]*):\s*router\(\{/);
      if (nested) { stack.push(nested[2]); nestedIndent = nested[1].length; continue; }
      const proc = line.match(
        /^(\s+)([a-zA-Z][a-zA-Z0-9]*):\s*(publicProcedure|protectedProcedure|[a-zA-Z]*[Rr]ate[a-zA-Z]*|[a-zA-Z]*[Pp]rocedure|proc)\b/,
      );
      if (!proc) continue;
      const prefix = proc[1].length > nestedIndent && stack.length > 1 ? stack.join(".") : stack[0];
      out.push({ full: `${prefix}.${proc[2]}`, file });
    }
  }
  return out;
}

/** Everything that could call a procedure, concatenated once. */
function consumerSource() {
  const roots = [
    "packages/dashboard/app", "packages/dashboard/components", "packages/dashboard/lib",
    "packages/editor/src", "packages/shared", "lib", "scripts",
  ];
  let blob = "";
  const walk = (rel) => {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) return;
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const child = path.join(rel, entry.name);
      if (entry.isDirectory()) {
        if (/^(node_modules|\.next|dist|\.playwright-mcp)$/.test(entry.name)) continue;
        walk(child);
      } else if (/\.(ts|tsx|mjs|js)$/.test(entry.name)) {
        blob += "\n" + fs.readFileSync(path.join(ROOT, child), "utf8");
      }
    }
  };
  roots.forEach(walk);
  return blob;
}

const procedures = collectProcedures();
const blob = consumerSource();
const seen = new Set();
const orphans = [];

for (const proc of procedures) {
  if (seen.has(proc.full)) continue;
  seen.add(proc.full);
  // `.parent.leaf` matches trpc.a.b.c and client().a.b.c alike; the full dotted
  // path matches the raw-fetch style.
  const parentLeaf = proc.full.split(".").slice(-2).join(".");
  const called = blob.includes("." + parentLeaf) || blob.includes(`/api/trpc/${proc.full}`);
  if (!called) orphans.push(proc);
}

const undocumented = orphans.filter((o) => !(o.full in ALLOWED));
const staleAllowlist = Object.keys(ALLOWED).filter(
  (name) => seen.has(name) && !orphans.some((o) => o.full === name),
);

console.log(`tRPC orphan gate — ${seen.size} procedures, ${orphans.length} with no caller`);

if (staleAllowlist.length) {
  console.log("\nWired up since they were allow-listed — remove these entries:");
  for (const name of staleAllowlist) console.log(`  ${name}`);
}

if (undocumented.length) {
  console.log("\nFAIL — no caller and no reason recorded:");
  for (const o of undocumented) console.log(`  ${o.full.padEnd(34)} <- routers/${o.file}`);
  console.log(
    "\nEither wire it to a screen, or add it to ALLOWED in this file with the reason.\n" +
      "Two of these turned out to be features users could not reach at all.",
  );
}

const failed = undocumented.length > 0 || staleAllowlist.length > 0;
if (!failed) console.log("PASS — every orphan is accounted for.");
process.exit(failed ? 1 : 0);
