/**
 * Parse the code a script would actually SEND to Figma, before sending it.
 *
 * `node --check` on the script proves the HOST file parses. It says nothing
 * about the string inside the template literal, which is the part Figma runs —
 * and that string is where the bugs are. Two found on 2026-09-07, both of which
 * cost a call to discover and one of which had been reported as "syntax-checked":
 *
 *   1. `\"` inside a template literal. The escape is consumed by the HOST
 *      parser, so the emitted sandbox code carries a BARE double quote and dies
 *      on `T("… and "Try again" hits …")`. Escaping for the file you are
 *      writing is not escaping for the file you are generating.
 *   2. A backtick in a comment inside the literal, which ends the template
 *      early. `lint-sandbox-scripts.mjs` catches this one; it does not catch
 *      the first, because a bare quote is legal text.
 *
 * This stubs the transport, evaluates the module far enough to build its `code`,
 * and runs `node --check` over the result. It opens no connection and spends no
 * quota.
 *
 * Usage:
 *   node scripts/figma/preflight-sandbox.mjs                 # every *.mjs that builds a `code` literal
 *   node scripts/figma/preflight-sandbox.mjs apply-publish-v2.mjs …
 *
 * @license BSD-3-Clause
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const DIR = new URL(".", import.meta.url).pathname;
const args = process.argv.slice(2);
const files = (args.length ? args : fs.readdirSync(DIR).filter((f) => f.endsWith(".mjs")))
  .filter((f) => !f.includes("preflight-sandbox") && !f.includes("selftest"));

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "preflight-"));
let checked = 0, failed = 0, skipped = 0;
const unchecked = [];

for (const f of files) {
  const p = path.join(DIR, f);
  let src;
  try { src = fs.readFileSync(p, "utf8"); } catch { continue; }

  const NEEDLE = "const code = " + String.fromCharCode(96);
  const at = src.indexOf(NEEDLE);
  if (at < 0) {
    /* Report it. A file that builds its payload some other way is not checked
       by this tool, and a silent skip makes "all payloads parse" mean less than
       it appears to — which is the same shape as every other null result this
       arc has had to learn to distrust. */
    if (/use_figma/.test(src)) unchecked.push(f);
    skipped++;
    continue;
  }
  const end = src.indexOf(String.fromCharCode(96) + ";", at);
  if (end < 0) { console.log("?     " + f + " — a code literal that does not close with a backtick-semicolon; not checked"); skipped++; continue; }

  /* Cut the module at the end of the literal and stub the transport, so nothing
     below it runs and nothing opens a connection. */
  const head = src.slice(0, end + 2)
    .replace(/^import \{ connect, rpc \}.*$/m, "const connect = async () => {}, rpc = async () => ({});")
    .replace(/^const APPLY = .*$/m, "const APPLY = true;");
  const dump = path.join(TMP, `dump-${f}`);
  const out = path.join(TMP, `emit-${f.replace(/\.mjs$/, "")}.js`);
  fs.writeFileSync(dump, `${head}\nimport fs from "node:fs"; fs.writeFileSync(${JSON.stringify(out)}, "(async()=>{" + code + "})()");\n`);

  try {
    execFileSync("node", [dump], { stdio: "pipe" });
  } catch (e) {
    /* The module needs an argv, a plan file, or something else to reach its
       literal. That is not a syntax verdict — say so rather than scoring it. */
    console.log("?     " + f + " — could not build its payload without arguments (" + String(e.stderr || e).split("\n")[0].slice(0, 70) + ")");
    skipped++;
    continue;
  }
  checked++;
  try {
    execFileSync("node", ["--check", out], { stdio: "pipe" });
    console.log("ok    " + f);
  } catch (e) {
    failed++;
    const msg = String(e.stderr || e).split("\n").slice(0, 4).join("\n");
    console.log("FAIL  " + f + "\n" + msg);
  }
}

fs.rmSync(TMP, { recursive: true, force: true });
console.log("\n" + (checked - failed) + "/" + checked + " payloads parse · " + skipped + " skipped");
if (unchecked.length) {
  console.log("\n" + unchecked.length + " script(s) CALL use_figma but build the payload some other way, so this tool did not check them:");
  for (const f of unchecked) console.log("  " + f);
  console.log("Their sandbox code is unverified. That is not the same as clean.");
}
if (failed) process.exit(1);
