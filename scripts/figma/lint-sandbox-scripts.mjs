/**
 * Two rules for the sandbox template literal: no stray backtick, and no
 * odd-parity backslash before a slash.
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
  /* Generalising this to every template literal in the file was tried and
     REVERTED 2026-09-07. It does find a real blind spot — a literal returned
     from a helper, or held under any name but "code", is never scanned — but it
     cannot find the END of a literal that closes as backtick-paren rather than
     newline-backtick-semicolon, and build-ai-v2-boards.mjs builds its rows with
     exactly that shape. The generalised version swallowed the rest of that file
     and reported 19 violations, all false. Same trap the header above describes:
     a check that cannot tell a violation from a valid use is noise. If this is
     retried, parse the literal boundaries properly rather than by marker. */
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
    /* Second rule, added 2026-09-07 after it cost a silent failure.
       Inside a template literal JS resolves the identity escape BACKSLASH-SLASH
       to a bare slash before the sandbox ever sees the code. So a regex written
       to match a literal slash emits one slash too few: the source read
       /^dp\\//.test(name) and Figma received /^dp//.test(name) — a regex, then a
       LINE COMMENT, and the reply was "SyntaxError: unexpected token in
       expression: '.'" pointing at .test, nowhere near the cause.
       Same family as the BACKSLASH-QUOTE trap that killed two payloads earlier
       in this arc: any single backslash in here is read by JS, not passed on.
       Write a doubled backslash, or use the repo's non-regex idiom
       String(x).indexOf("dp/")===0 — which this very file already used two
       lines above the break. */
    /* Parity matters and the first version of this rule got it wrong, in the
       precise way this file's header warns about. A DOUBLED backslash is the
       CORRECT spelling — it emits one real backslash and the regex ships intact.
       Matching the two characters naively flags those too, and the rule lit up
       28 correct lines on its first run. Count the backslash run before the
       slash: odd means JS eats one and the sandbox is shorted, even means the
       author already did the right thing. */
    const BS = String.fromCharCode(92);
    let shorted = false;
    for (let k = 0; k < line.length; k++) {
      if (line[k] !== "/") continue;
      let run = 0;
      for (let j = k - 1; j >= 0 && line[j] === BS; j--) run++;
      if (run % 2 === 1) { shorted = true; break; }
    }
    if (shorted) {
      bad++;
      console.log(f + ":" + (before + i) + "\tescaped slash inside the sandbox literal — JS eats the backslash, the regex ships one slash short");
      console.log("   " + line.trim().slice(0, 100));
    }
  });
}
console.log(bad
  ? bad + " sandbox-literal violation(s) — a backtick ends the template early; an odd backslash run before a slash is eaten by JS and ships the regex one slash short"
  : "clean: no stray backticks and no shorted escapes in any sandbox literal");
process.exit(bad ? 1 : 0);
