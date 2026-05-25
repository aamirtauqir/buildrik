#!/usr/bin/env node
/**
 * Pre-deploy env validator (Sprint 4 prep — V1 shipping sprints).
 *
 * Run BEFORE pushing prod env config or after `vercel env pull`. Catches
 * the most common deploy-killing typos: wrong URLs in the CSRF allowlist,
 * missing OAuth callback alignment, secrets at dev placeholders,
 * Resend domain unset, etc.
 *
 * Usage:
 *   node scripts/check-prod-env.mjs                # validates process.env
 *   node scripts/check-prod-env.mjs --file .env.production
 *   vercel env pull && node scripts/check-prod-env.mjs --file .env
 *
 * Exits 0 if all checks pass, 1 if any fail.
 *
 * Source of truth: docs/prod-deploy.md env table. Update both together.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { argv, exit } from "node:process";

/** ─── Parse args ─────────────────────────────────────────────────────── */

const args = argv.slice(2);
const fileIdx = args.indexOf("--file");
const envFile = fileIdx >= 0 ? args[fileIdx + 1] : null;
const isDev = args.includes("--dev"); // relaxed checks for local

/** ─── Load env ───────────────────────────────────────────────────────── */

let env = { ...process.env };
if (envFile) {
  const fullPath = resolve(envFile);
  if (!existsSync(fullPath)) {
    console.error(`✗ env file not found: ${fullPath}`);
    exit(1);
  }
  const raw = readFileSync(fullPath, "utf-8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
}

/** ─── Checks ─────────────────────────────────────────────────────────── */

const results = [];

function pass(name) {
  results.push({ name, ok: true });
}
function fail(name, reason) {
  results.push({ name, ok: false, reason });
}
function warn(name, reason) {
  results.push({ name, ok: true, warning: reason });
}

function isHttpsUrl(v) {
  return typeof v === "string" && /^https:\/\//.test(v);
}

function requirePresent(name) {
  const v = env[name];
  if (!v || v.length === 0) {
    fail(name, "missing");
    return false;
  }
  pass(name);
  return true;
}

function requireHttps(name) {
  const v = env[name];
  if (!v) {
    fail(name, "missing");
    return false;
  }
  if (isDev && /^http:\/\/localhost/.test(v)) {
    warn(name, "localhost URL (dev mode)");
    return true;
  }
  if (!isHttpsUrl(v)) {
    fail(name, `must be https:// (got ${v.slice(0, 50)}…)`);
    return false;
  }
  pass(name);
  return true;
}

function requireRandomSecret(name, minLen = 32) {
  const v = env[name];
  if (!v) {
    fail(name, "missing");
    return false;
  }
  if (
    v === "dev-secret-change-in-prod" ||
    /change-in-prod|todo|xxx|secret123|placeholder/i.test(v)
  ) {
    fail(name, "placeholder value — regenerate with `openssl rand -hex 32`");
    return false;
  }
  if (v.length < minLen) {
    fail(name, `too short (${v.length} < ${minLen})`);
    return false;
  }
  pass(name);
  return true;
}

/** ─── Required vars ──────────────────────────────────────────────────── */

const dashboardUrl = env.NEXT_PUBLIC_APP_URL;
const editorOrigin = env.EDITOR_ORIGIN;
const authUrl = env.AUTH_URL;
const nextauthUrl = env.NEXTAUTH_URL;
const viteDashboardUrl = env.VITE_DASHBOARD_URL;
const vercelOauthRedirect = env.VERCEL_OAUTH_REDIRECT_URI;

// Core presence
requirePresent("DATABASE_URL");
requireRandomSecret("NEXTAUTH_SECRET");
requireRandomSecret("AUTH_SECRET");
requireRandomSecret("SESSION_GRANT_SECRET");
requireRandomSecret("ENCRYPTION_KEY", 64); // 32-byte hex
requireRandomSecret("CRON_SECRET");

// URL shape
requireHttps("NEXT_PUBLIC_APP_URL");
requireHttps("EDITOR_ORIGIN");
requireHttps("AUTH_URL");
requireHttps("NEXTAUTH_URL");
requireHttps("VITE_DASHBOARD_URL");
requireHttps("VERCEL_OAUTH_REDIRECT_URI");

// Email
requirePresent("RESEND_API_KEY");
const emailFrom = env.EMAIL_FROM;
if (!emailFrom) {
  fail("EMAIL_FROM", "missing");
} else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailFrom)) {
  fail("EMAIL_FROM", `invalid format: ${emailFrom}`);
} else {
  pass("EMAIL_FROM");
}

// OAuth
requirePresent("GOOGLE_CLIENT_ID");
requirePresent("GOOGLE_CLIENT_SECRET");
requirePresent("GITHUB_CLIENT_ID");
requirePresent("GITHUB_CLIENT_SECRET");
requirePresent("VERCEL_INTEGRATION_ID");
requirePresent("VERCEL_CLIENT_ID");
requirePresent("VERCEL_CLIENT_SECRET");

/** ─── Cross-var consistency ──────────────────────────────────────────── */

// CSRF Origin pin matches NextAuth's notion of "self"
if (dashboardUrl && authUrl && dashboardUrl !== authUrl) {
  fail(
    "CSRF/Origin alignment",
    `NEXT_PUBLIC_APP_URL (${dashboardUrl}) ≠ AUTH_URL (${authUrl}) — POSTs from dashboard will 403`,
  );
} else if (dashboardUrl && authUrl) {
  pass("CSRF/Origin alignment");
}

// NEXTAUTH_URL and AUTH_URL should agree
if (authUrl && nextauthUrl && authUrl !== nextauthUrl) {
  fail(
    "AUTH_URL ↔ NEXTAUTH_URL",
    `mismatch (AUTH_URL=${authUrl}, NEXTAUTH_URL=${nextauthUrl}) — v5/v4 paths disagree on callbacks`,
  );
} else if (authUrl && nextauthUrl) {
  pass("AUTH_URL ↔ NEXTAUTH_URL");
}

// Editor → dashboard URL should be dashboard's own canonical
if (viteDashboardUrl && dashboardUrl && viteDashboardUrl !== dashboardUrl) {
  fail(
    "VITE_DASHBOARD_URL ↔ NEXT_PUBLIC_APP_URL",
    `editor calls dashboard at ${viteDashboardUrl}, dashboard advertises ${dashboardUrl} — editor publish + auth will hit wrong host`,
  );
} else if (viteDashboardUrl && dashboardUrl) {
  pass("VITE_DASHBOARD_URL ↔ NEXT_PUBLIC_APP_URL");
}

// Vercel OAuth callback must be under the dashboard origin
if (vercelOauthRedirect && dashboardUrl) {
  const expectedPrefix = `${dashboardUrl}/api/integrations/vercel/callback`;
  if (vercelOauthRedirect !== expectedPrefix) {
    fail(
      "VERCEL_OAUTH_REDIRECT_URI shape",
      `expected ${expectedPrefix}, got ${vercelOauthRedirect}`,
    );
  } else {
    pass("VERCEL_OAUTH_REDIRECT_URI shape");
  }
}

// AUTH_TRUST_HOST required when behind Vercel proxy
if (env.AUTH_TRUST_HOST !== "true" && !isDev) {
  fail(
    "AUTH_TRUST_HOST",
    "must be 'true' on Vercel — NextAuth refuses cookies behind reverse proxy otherwise",
  );
} else {
  pass("AUTH_TRUST_HOST");
}

/** ─── Print ──────────────────────────────────────────────────────────── */

let failed = 0;
let warned = 0;
console.log("");
console.log("┌────────────────────────────────────────────────────────────");
console.log("│ check-prod-env.mjs — Sprint 4 preflight");
console.log(
  envFile
    ? `│ source: ${envFile}${isDev ? " (dev mode)" : ""}`
    : `│ source: process.env${isDev ? " (dev mode)" : ""}`,
);
console.log("├────────────────────────────────────────────────────────────");
for (const r of results) {
  if (!r.ok) {
    failed++;
    console.log(`│ ✗  ${r.name}`);
    console.log(`│      ${r.reason}`);
  } else if (r.warning) {
    warned++;
    console.log(`│ ⚠  ${r.name}  (${r.warning})`);
  } else {
    console.log(`│ ✓  ${r.name}`);
  }
}
console.log("├────────────────────────────────────────────────────────────");
console.log(
  `│ ${results.length} checks: ${results.length - failed - warned} pass, ${warned} warn, ${failed} fail`,
);
console.log("└────────────────────────────────────────────────────────────");
console.log("");

if (failed > 0) {
  console.error(
    `Fix ${failed} failing check(s) before deploy. See docs/prod-deploy.md for the env table.`,
  );
  exit(1);
}
exit(0);
