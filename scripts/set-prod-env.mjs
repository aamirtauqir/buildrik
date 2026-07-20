#!/usr/bin/env node
/**
 * Merge env vars into the LIVE cPanel Node app config.
 *
 * `cloudlinux-selector set --env-vars` REPLACES the entire map — there is no
 * per-variable setter (checked against the tool's own usage on the box). Anyone
 * running it with just the vars they care about deletes DATABASE_URL and takes
 * the site down. This script exists so that mistake is not reachable: it reads
 * the current map, merges on top of it, and refuses to write if the merge would
 * drop a key.
 *
 *   node scripts/set-prod-env.mjs --file stripe-live.env            # dry run
 *   node scripts/set-prod-env.mjs --file stripe-live.env --apply
 *   node scripts/set-prod-env.mjs --file stripe-live.env --apply --restart
 *
 * The input file is KEY=VALUE lines (blank lines and #-comments ignored) — the
 * shape `scripts/stripe-setup.ts` prints. Values are never echoed; the plan
 * shows key names and whether each is new or changed.
 */

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const HOST = process.env.DEPLOY_SSH_HOST ?? "vortyoyz";
const APP_ROOT = "apps/dashboard";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

function ssh(command) {
  return execFileSync("ssh", ["-o", "ServerAliveInterval=15", HOST, command], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
}

function parseEnvFile(path) {
  const out = {};
  for (const raw of readFileSync(path, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (!key || !value || value.startsWith("<")) continue; // skip placeholders
    out[key] = value;
  }
  return out;
}

function readRemoteEnv() {
  const raw = ssh(
    `python3 -c "import json,os;print(json.dumps(json.load(open(os.path.expanduser('~/.cl.selector/node-selector.json')))['${APP_ROOT}']['env_vars']))"`,
  );
  return JSON.parse(raw);
}

function main() {
  const file = arg("file");
  if (!file) throw new Error("Pass --file <KEY=VALUE file>");
  const apply = process.argv.includes("--apply");

  const incoming = parseEnvFile(file);
  const keys = Object.keys(incoming);
  if (keys.length === 0) throw new Error(`No usable KEY=VALUE lines in ${file}`);

  console.log(`\nReading current env from ${HOST}:${APP_ROOT} …`);
  const current = readRemoteEnv();
  console.log(`Current map holds ${Object.keys(current).length} vars.\n`);

  const merged = { ...current, ...incoming };

  // The whole point of the script. If this ever trips, do not write.
  for (const key of Object.keys(current)) {
    if (!(key in merged)) throw new Error(`MERGE_WOULD_DROP:${key} — refusing to write`);
  }

  console.log("Plan:");
  for (const key of keys) {
    if (!(key in current)) console.log(`  + ${key}  (new)`);
    else if (current[key] !== incoming[key]) console.log(`  ~ ${key}  (changed)`);
    else console.log(`  = ${key}  (already correct)`);
  }
  console.log(`\n${Object.keys(current).length} → ${Object.keys(merged).length} vars.`);

  if (!apply) {
    console.log("\nDry run. Re-run with --apply to write.\n");
    return;
  }

  console.log("\nWriting …");
  const payload = JSON.stringify(merged).replace(/'/g, `'\\''`);
  ssh(
    `cloudlinux-selector set --json --interpreter nodejs --app-root ${APP_ROOT} --env-vars '${payload}'`,
  );

  const after = readRemoteEnv();
  const missing = keys.filter((k) => after[k] !== incoming[k]);
  const dropped = Object.keys(current).filter((k) => !(k in after));
  if (missing.length) throw new Error(`VERIFY_FAILED — not stored: ${missing.join(", ")}`);
  if (dropped.length) throw new Error(`VERIFY_FAILED — dropped: ${dropped.join(", ")}`);
  console.log(`Verified: ${Object.keys(after).length} vars, all ${keys.length} incoming stored.`);

  if (process.argv.includes("--restart")) {
    // cloudlinux-selector does not kill the running workers itself — an orphan
    // node process keeps the port and the app crashloops under LVE. Kill this
    // app's workers by cwd first (the same user also runs an unrelated app).
    console.log("\nRestarting …");
    ssh(
      `for pid in $(pgrep -u $USER node); do ls -l /proc/$pid/cwd 2>/dev/null | grep -q buildrik && kill $pid; done; true`,
    );
    ssh(`cloudlinux-selector restart --json --interpreter nodejs --app-root ${APP_ROOT}`);
    console.log("Restarted. Run: npm run env:check:prod");
  } else {
    console.log("\nNot restarted — the app reads env at boot, so the new vars are");
    console.log("not live yet. Re-run with --restart, or restart from cPanel.");
  }
  console.log();
}

try {
  main();
} catch (e) {
  console.error(`\nFAILED: ${e instanceof Error ? e.message : e}\n`);
  process.exit(1);
}
