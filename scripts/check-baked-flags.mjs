#!/usr/bin/env node
/**
 * Verify the flags that gate user-visible features are actually BAKED into the
 * production bundle.
 *
 * `NEXT_PUBLIC_*` are inlined at `next build` time, not read from the server's
 * environment — so `check-prod-env.mjs`, which pulls the live cPanel env, can
 * neither see them nor catch them being wrong. That is a real gap and it has a
 * documented shape: a flag that is silently false in production looks exactly
 * like a feature that was never built. `GOOGLE_CLIENT_ID` cost months that way.
 *
 * Found 2026-08-24 while walking F-A3: `NEXT_PUBLIC_FEATURE_PUBLISH` was baked
 * "true" in the shipped bundle — but the value came from `.env.local`, a
 * gitignored DEV file that Next also loads during a production build. It was
 * absent from `.env.production.local`. A build on any other machine, or after
 * that dev file changed, would have shipped Publish OFF and nothing would have
 * said so.
 *
 * Usage: node scripts/check-baked-flags.mjs [buildDir]
 *   default buildDir: packages/dashboard/.next
 *
 * @license BSD-3-Clause
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * flag → the value the CLIENT bundle must carry.
 *
 * Only flags read in the browser belong here. `NEXT_PUBLIC_UNIFIED_EDITOR` is
 * deliberately absent: it is read once, in `unified-flag.server.ts`, on the
 * server — so it correctly never reaches the client bundle, and requiring it
 * here made this check fail on its first run against a perfectly good build.
 * `check-prod-env.mjs` already verifies that one against the live server env,
 * which is where it is actually needed.
 *
 * `FEATURE_DS_AI` and `FEATURE_COLLAB` are not here either, and must not be:
 * both are meant to be OFF in production (collab is demo-only with six known
 * non-convergence bugs). This file asserts what must be ON.
 */
const REQUIRED = {
  NEXT_PUBLIC_FEATURE_PUBLISH: "true",
};

const buildDir = process.argv[2] ?? "packages/dashboard/.next";
const staticDir = join(buildDir, "static");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith(".js")) out.push(p);
  }
  return out;
}

let files;
try {
  files = walk(staticDir);
} catch {
  console.error(`[baked-flags] cannot read ${staticDir} — run \`next build\` first.`);
  process.exit(1);
}

const haystack = files.map((f) => readFileSync(f, "utf8")).join("\n");
let failed = 0;

for (const [flag, want] of Object.entries(REQUIRED)) {
  /* Next replaces the VALUE and keeps the object key, so the bundle reads
     `FLAG:"true"`. A key with a runtime lookup beside it (`FLAG:x.env.FLAG`)
     means the replacement never happened and the flag is undefined at runtime. */
  const baked = new RegExp(`${flag}\\s*:\\s*"${want}"`).test(haystack);
  const present = haystack.includes(flag);
  if (baked) {
    console.log(`  ✓ ${flag} baked "${want}"`);
  } else if (present) {
    console.error(`  ✗ ${flag} appears in the bundle but NOT as "${want}" — it was not inlined, so it is undefined in the browser`);
    failed++;
  } else {
    console.error(`  ✗ ${flag} is not in the bundle at all`);
    failed++;
  }
}

console.log(`[baked-flags] ${files.length} bundle file(s) scanned`);
if (failed) {
  console.error(`\n[baked-flags] BLOCK: ${failed} flag(s) not baked. Set them in .env.production.local and rebuild —`);
  console.error(`a NEXT_PUBLIC_* set only in the server environment does nothing; they are inlined at build time.`);
  process.exit(1);
}
console.log("[baked-flags] PASS");
