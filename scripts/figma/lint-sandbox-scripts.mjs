/**
 * One rule: no backtick inside the sandbox template literal.
 *
 * Every one of these scripts ships its Figma code as a JS template literal.
 * A backtick anywhere inside it — including inside a COMMENT — closes the
 * literal early and produces a SyntaxError pointing at whatever word follows.
 * That has now cost six separate debugging round-trips in one session, always
 * from writing `someIdentifier` in prose out of habit.
 *
 * node --check catches it, but only after the edit is written and only if
 * someone runs it. This makes the rule explicit and greppable, and names the
 * line so the fix is obvious rather than archaeological.
 *
 * Usage: node scripts/figma/lint-sandbox-scripts.mjs
 */
import { readFileSync, readdirSync } from "node:fs";

const dir = "scripts/figma";
const SELF = "lint-sandbox-scripts.mjs";

/* A backtick inside the literal is only fatal in PLAIN text — in a comment or a
   string. Inside a ${...} interpolation a nested template is perfectly legal,
   and the first version of this lint flagged nineteen of those as errors,
   including its own source. A check that cannot tell a violation from a valid
   use is not a check; it is noise that trains you to ignore it. So: strip the
   interpolations first, then look at what is left. */
const stripInterpolations = (s) => {
  let out = "", depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "$" && s[i + 1] === "{") { depth++; i++; continue; }
    if (depth > 0) { if (s[i] === "{") depth++; else if (s[i] === "}") depth--; continue; }
    out += s[i];
  }
  return out;
};

let bad = 0;
for (const f of readdirSync(dir).filter((n) => n.endsWith(".mjs") && n !== SELF)) {
  const src = readFileSync(dir + "/" + f, "utf8");
  const marker = "const code = " + String.fromCharCode(96);
  const open = src.indexOf(marker);
  if (open < 0) continue;
  const before = src.slice(0, open).split("\n").length;
  const body = src.slice(open + marker.length);
  const close = body.indexOf("\n" + String.fromCharCode(96) + ";");
  const inner = close < 0 ? body : body.slice(0, close);
  stripInterpolations(inner).split("\n").forEach((line, i) => {
    if (line.includes(String.fromCharCode(96))) {
      bad++;
      console.log(f + ":" + (before + i) + "\tbacktick in plain text inside the sandbox literal");
      console.log("   " + line.trim().slice(0, 100));
    }
  });
}
console.log(bad
  ? bad + " backtick(s) in plain text inside a sandbox literal — each ends the template early"
  : "clean: no backticks in plain text inside any sandbox literal");
process.exit(bad ? 1 : 0);
