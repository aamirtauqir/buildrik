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

// Core presence
requirePresent("DATABASE_URL");
requireRandomSecret("NEXTAUTH_SECRET");
requireRandomSecret("AUTH_SECRET");
requireRandomSecret("ENCRYPTION_KEY", 64); // 32-byte hex
requireRandomSecret("CRON_SECRET");

// NextAuth v5 reads this itself — it never appears in a `grep process.env` of
// the app, which is how it stayed undocumented. Behind cPanel's proxy, without
// it NextAuth rejects the forwarded host and every sign-in fails.
requirePresent("AUTH_TRUST_HOST");

// URL shape
requireHttps("NEXT_PUBLIC_APP_URL");
requireHttps("EDITOR_ORIGIN");
requireHttps("AUTH_URL");
requireHttps("NEXTAUTH_URL");
// VITE_DASHBOARD_URL is deliberately NOT required here. It is an editor
// build-time var; the server's runtime env has no use for it, and when the
// editor is bundled into Next, runtimeEnv falls back to NEXT_PUBLIC_APP_URL.
// Requiring it made this script fail a perfectly good production.
if (env.VITE_DASHBOARD_URL) requireHttps("VITE_DASHBOARD_URL");

// Email. Transactional mail goes over SMTP (nodemailer) — this used to require
// RESEND_API_KEY, which nothing in the codebase reads, so the check both failed
// a correctly-configured production and passed one with no mail config at all.
requirePresent("SMTP_HOST");
requirePresent("SMTP_PORT");
requirePresent("SMTP_USER");
if (!env.SMTP_PASS_B64 && !env.SMTP_PASS) {
  fail("SMTP_PASS_B64", "missing (and no SMTP_PASS fallback)");
} else if (!env.SMTP_PASS_B64) {
  // cPanel/Passenger pipes env through a shell, so a `$` in the password is read
  // as a variable and silently eaten. Base64 has no shell metacharacters.
  fail("SMTP_PASS_B64", "only SMTP_PASS is set — cPanel will corrupt a password containing `$`");
} else {
  pass("SMTP_PASS_B64");
}
const emailFrom = env.EMAIL_FROM;
// Both RFC 5322 forms are valid and nodemailer takes either: a bare address, or
// a display name with the address in angle brackets. The old check only allowed
// the bare form, so it failed the documented value (`Buildrick <info@…>`).
const ADDR = String.raw`[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+`;
if (!emailFrom) {
  fail("EMAIL_FROM", "missing");
} else if (!new RegExp(`^(?:${ADDR}|[^<>]+<${ADDR}>)$`).test(emailFrom.trim())) {
  fail("EMAIL_FROM", `invalid format: ${emailFrom}`);
} else {
  pass("EMAIL_FROM");
}

// OAuth. Without these NextAuth still redirects to the provider — with
// `client_id=undefined` — so the buttons look alive and are not. Both were
// missing in production for months (2026-07-14).
requirePresent("GOOGLE_CLIENT_ID");
requirePresent("GOOGLE_CLIENT_SECRET");
requirePresent("GITHUB_CLIENT_ID");
requirePresent("GITHUB_CLIENT_SECRET");

// Publishing. Sites deploy into the workspace's own Vercel account; without
// VERCEL_INTEGRATION_ID nobody can even connect one, so nobody can publish.
requirePresent("VERCEL_INTEGRATION_ID");
requirePresent("VERCEL_CLIENT_ID");
requirePresent("VERCEL_CLIENT_SECRET");

// AI. Absent → every ai-generate-worker job fails on "Missing credentials", the
// AI onboarding path is dead, and in-editor AI + alt-text throw.
requirePresent("OPENAI_API_KEY");

// OLLAMA_BASE_URL must NOT be set in production. resolveModelForUser
// short-circuits to the local model whenever it is present — in production that
// points at a model server that does not exist, and it would silently route
// every AI request there. It is a dev-only escape hatch.
if (env.OLLAMA_BASE_URL) {
  fail(
    "OLLAMA_BASE_URL",
    "set in production — resolveModelForUser would route ALL AI to a local model server that isn't there",
  );
} else {
  pass("OLLAMA_BASE_URL (correctly unset)");
}

// Editing. Unset/false sends "Edit site" to the retired standalone demo.
if (env.NEXT_PUBLIC_UNIFIED_EDITOR === "true") {
  pass("NEXT_PUBLIC_UNIFIED_EDITOR");
} else {
  fail("NEXT_PUBLIC_UNIFIED_EDITOR", `expected "true", got ${env.NEXT_PUBLIC_UNIFIED_EDITOR ?? "unset"} — "Edit site" would open the dead demo`);
}

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

// There is deliberately no VERCEL_OAUTH_REDIRECT_URI check. The var does not
// exist: the callback URL is registered with Vercel at integration-registration
// time, and the callback route derives its own redirect_uri from the request
// (`${url.protocol}//${url.host}/api/integrations/vercel/callback`). This script
// used to require it, and CLAUDE.md used to document it.

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
