#!/usr/bin/env node
/**
 * Post-deploy smoke test (Sprint 5 prep).
 *
 * Runs against deployed dashboard + editor URLs after `git push origin main`
 * triggers Vercel auto-deploy. Public-surface checks only — no auth needed,
 * safe to run from anywhere.
 *
 * Validates:
 *   - Dashboard /auth + /robots.txt + /favicon.ico
 *   - Editor / (Vite SPA shell)
 *   - At least one already-published site URL (you pass it via --site)
 *   - HSTS header on dashboard (security baseline)
 *   - Response time per endpoint (warns if > 3s, fails if > 15s)
 *
 * Usage:
 *   pnpm smoke:prod                          # uses defaults (buildrik.com)
 *   pnpm smoke:prod -- --dashboard https://app.buildrik.com \
 *                      --editor https://editor.buildrik.com \
 *                      --site https://buildrik-site-mysite.vercel.app
 *
 * Exits 0 if all green, 1 if any fail. Print is a compact pass/warn/fail
 * table per check.
 */

import { argv, exit } from "node:process";

const args = argv.slice(2);
function arg(name, defaultVal) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : defaultVal;
}

const DASHBOARD = arg("dashboard", "https://app.buildrik.com");
const EDITOR = arg("editor", "https://editor.buildrik.com");
const SITE = arg("site", null); // optional — user provides their test site
const SLOW_MS = 3000;
const TIMEOUT_MS = 15000;

const results = [];

function record(name, ok, detail, ms) {
  results.push({ name, ok, detail, ms });
}

/** Fetch with timeout. Returns { ok, status, headers, ms, error }. */
async function head(url) {
  const start = Date.now();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "buildrik-smoke/1.0" },
    });
    return {
      ok: true,
      status: res.status,
      headers: res.headers,
      ms: Date.now() - start,
    };
  } catch (e) {
    return { ok: false, error: String(e?.message ?? e), ms: Date.now() - start };
  } finally {
    clearTimeout(t);
  }
}

async function getBody(url) {
  const start = Date.now();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "buildrik-smoke/1.0" },
    });
    const body = await res.text();
    return {
      ok: true,
      status: res.status,
      headers: res.headers,
      body,
      ms: Date.now() - start,
    };
  } catch (e) {
    return { ok: false, error: String(e?.message ?? e), ms: Date.now() - start };
  } finally {
    clearTimeout(t);
  }
}

/** Dashboard checks ───────────────────────────────────────────────────── */

async function checkDashboard() {
  // /auth — should redirect 200 or 307 to auth page
  let r = await head(`${DASHBOARD}/auth`);
  if (!r.ok) {
    record("dashboard /auth", false, r.error ?? "fetch failed", r.ms);
  } else if (r.status !== 200 && r.status !== 307) {
    record("dashboard /auth", false, `HTTP ${r.status}`, r.ms);
  } else {
    record("dashboard /auth", true, `HTTP ${r.status}`, r.ms);
  }

  // HSTS header (security baseline — Vercel auto-adds for HTTPS)
  const hsts = r.headers?.get("strict-transport-security");
  if (DASHBOARD.startsWith("https://")) {
    record(
      "dashboard HSTS header",
      !!hsts,
      hsts ?? "missing — check Vercel project config",
      0,
    );
  }

  // /robots.txt — should be 200 (Vercel auto if missing)
  r = await head(`${DASHBOARD}/robots.txt`);
  if (!r.ok) {
    record("dashboard /robots.txt", false, r.error ?? "fetch failed", r.ms);
  } else {
    record("dashboard /robots.txt", r.status === 200 || r.status === 404, `HTTP ${r.status}`, r.ms);
  }

  // /favicon.ico
  r = await head(`${DASHBOARD}/favicon.ico`);
  if (!r.ok) {
    record("dashboard /favicon.ico", false, r.error ?? "fetch failed", r.ms);
  } else {
    record("dashboard /favicon.ico", r.status === 200, `HTTP ${r.status}`, r.ms);
  }

  // tRPC health probe (read-only, no auth needed)
  r = await getBody(`${DASHBOARD}/api/auth/session`);
  if (!r.ok) {
    record("dashboard auth/session", false, r.error ?? "fetch failed", r.ms);
  } else {
    record(
      "dashboard auth/session",
      r.status === 200,
      `HTTP ${r.status} ${r.body.slice(0, 30)}`,
      r.ms,
    );
  }
}

/** Editor checks ──────────────────────────────────────────────────────── */

async function checkEditor() {
  const r = await getBody(`${EDITOR}/`);
  if (!r.ok) {
    record("editor /", false, r.error ?? "fetch failed", r.ms);
    return;
  }
  if (r.status !== 200) {
    record("editor /", false, `HTTP ${r.status}`, r.ms);
    return;
  }
  // Vite SPA — body should include a script tag for the bundle
  const hasBundle = /<script[^>]+src=/.test(r.body);
  record("editor / has bundle <script>", hasBundle, hasBundle ? "ok" : "no <script src=> in body", r.ms);

  // Sentry / VITE_DASHBOARD_URL should be inlined into bundle. Spot-check:
  const refsDashboard = r.body.includes("app.buildrik.com") || r.body.includes(DASHBOARD.replace(/^https?:\/\//, ""));
  record(
    "editor references dashboard host",
    refsDashboard,
    refsDashboard ? "ok" : "dashboard host not found in editor HTML — VITE_DASHBOARD_URL maybe unset at build",
    0,
  );
}

/** Site checks ────────────────────────────────────────────────────────── */

async function checkSite() {
  if (!SITE) {
    record("site URL", true, "(skipped — pass --site to enable)", 0);
    return;
  }
  const r = await getBody(SITE);
  if (!r.ok) {
    record(`site ${SITE}`, false, r.error ?? "fetch failed", r.ms);
    return;
  }
  if (r.status !== 200) {
    record(`site ${SITE}`, false, `HTTP ${r.status}${r.status === 401 ? " — SSO wall (use canonical URL, not deploy-hash URL)" : ""}`, r.ms);
    return;
  }
  // Body should have a non-empty <body> tag
  const bodyMatch = r.body.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const inner = bodyMatch ? bodyMatch[1].trim() : "";
  const hasContent = inner.length > 20 && inner !== "<div></div>";
  record(
    `site ${SITE} body has content`,
    hasContent,
    hasContent ? `${inner.length} chars` : "EMPTY <body> — Iter 19 ExportEngine regression?",
    r.ms,
  );
}

/** Run + print ────────────────────────────────────────────────────────── */

console.log("");
console.log("┌──────────────────────────────────────────────────────────");
console.log("│ smoke-deployed.mjs — Sprint 5 post-deploy check");
console.log(`│  dashboard: ${DASHBOARD}`);
console.log(`│  editor:    ${EDITOR}`);
console.log(`│  site:      ${SITE ?? "(skipped — pass --site)"}`);
console.log("├──────────────────────────────────────────────────────────");

await checkDashboard();
await checkEditor();
await checkSite();

let failed = 0;
let warned = 0;
for (const r of results) {
  const slow = r.ms > SLOW_MS;
  if (!r.ok) {
    failed++;
    console.log(`│ ✗  ${r.name}  (${r.ms}ms)`);
    console.log(`│      ${r.detail}`);
  } else if (slow) {
    warned++;
    console.log(`│ ⚠  ${r.name}  (${r.ms}ms slow — > ${SLOW_MS}ms)`);
    console.log(`│      ${r.detail}`);
  } else {
    console.log(`│ ✓  ${r.name}  (${r.ms}ms)  ${r.detail}`);
  }
}

console.log("├──────────────────────────────────────────────────────────");
console.log(
  `│ ${results.length} checks: ${results.length - failed - warned} pass, ${warned} slow, ${failed} fail`,
);
console.log("└──────────────────────────────────────────────────────────");
console.log("");

if (failed > 0) {
  console.error(`${failed} check(s) failed. Review Vercel deploy logs + docs/prod-deploy.md.`);
  exit(1);
}
exit(0);
