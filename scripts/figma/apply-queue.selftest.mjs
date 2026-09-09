/**
 * Parse every sandbox body apply-queue.mjs can generate, offline.
 *
 * The bodies are assembled as strings and only ever parsed inside Figma, so a
 * syntax error in one of them is invisible until a call is spent discovering
 * it — and at 200 calls a day that is the most expensive kind of typo. This
 * builds each op's body with a fixture row, in both --apply and dry-run form,
 * and runs `node --check` over it. It also fails a body containing a backtick,
 * which would end the enclosing template early.
 *
 * Costs zero Figma calls. Run it after touching any BUILD entry.
 *
 * Usage: node scripts/figma/apply-queue.selftest.mjs
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SRC = new URL("./apply-queue.mjs", import.meta.url).pathname;
const src = fs.readFileSync(SRC, "utf8");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "aq-selftest-"));

/* One fixture per op, carrying every field its builder reads. A field the
   builder reads and the fixture omits shows up as `undefined` in the emitted
   JSON, which still parses — so this proves syntax, not semantics. */
const FIX = {
  text:          { id: "1:2", text: "hello", expect: "h", width: 200 },
  rename:        { id: "1:2", name: "[not-implemented] x", expect: "y" },
  resize:        { id: "1:2", w: 100, h: 60 },
  fill:          { id: "1:2", hex: "#1A56DB" },
  hotspot:       { over: "1:2", to: "1:3", name: "hotspot/x", pad: 8 },
  move:          { id: "1:2", x: 30, y: null },
  delete:        { id: "1:2", note: "Save changes" },
  "add-text":    { parent: "1:2", name: "n", text: "t", x: 1, y: 2, w: 100, size: 12, leading: 16, style: "Regular", color: "#111827", align: "LEFT" },
  "add-rect":    { parent: "1:2", name: "n", x: 1, y: 2, w: 10, h: 10, color: "#F3F4F6", stroke: "#E5E7EB", radius: 4 },
  "add-caption": { board: "1:2", name: "caption/x", text: "t", from: "1:9", w: 0, x: null, y: null },
  "append-text": { id: "1:2", add: "more", maxHeight: 174 },
  rewire:        { id: "1:2", from: "1:3", to: "1:4" },
  "clone-node":  { src: "1:2", parent: "1:3", name: "Aa Fonts", text: "Aa Fonts", textIndex: null, x: 213, y: 14, width: 50 },
};

let fails = 0, checked = 0;

for (const APPLY of [true, false]) {
  /* Pin APPLY, stub the transport, and cut the file at the point it stops
     defining and starts doing — importing the real module would open a
     connection and spend the very calls this exists to protect. */
  const mod = src
    .replace('const APPLY = process.argv.includes("--apply");', `const APPLY = ${APPLY};`)
    .replace(/^import \{ connect, rpc \}.*$/m, "const connect = null, rpc = null;")
    .replace(/^const all = loadRows\(\);[\s\S]*$/m, "export { BUILD };\n");
  const tmp = path.join(TMP, `aq-${APPLY}.mjs`);
  fs.writeFileSync(tmp, mod);
  const { BUILD } = await import(`${tmp}?v=${Date.now()}`);

  for (const [op, row] of Object.entries(FIX)) {
    checked++;
    if (!BUILD[op]) { console.log(`FAIL  no builder for op "${op}"`); fails++; continue; }
    const body = BUILD[op]([{ key: "k#0", row }]);
    const f = path.join(TMP, `body-${op.replace(/\W/g, "_")}-${APPLY}.mjs`);
    fs.writeFileSync(f, `export default async function(){ const figma={}; const out=[];\n${body}\nreturn out; }`);
    try {
      execFileSync("node", ["--check", f]);
      if (body.includes("`")) { console.log(`FAIL  apply=${String(APPLY).padEnd(5)} ${op} — backtick inside the emitted body ends the template early`); fails++; }
      else console.log(`ok    apply=${String(APPLY).padEnd(5)} ${op}`);
    } catch (e) {
      console.log(`FAIL  apply=${String(APPLY).padEnd(5)} ${op}\n${String(e.stderr || e).slice(0, 400)}`);
      fails++;
    }
  }
}

fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\n${checked - fails}/${checked} bodies parse clean`);
if (fails) process.exit(1);
