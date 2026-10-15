/**
 * Minimal POSIX-ish shell parser for guard.mjs — enough to know what a Bash
 * command will RUN, not just what text it contains.
 *
 * Why: matching words in the raw string could not tell `grep 'touch' f` from
 * `touch f`, or a commit message saying "push" from a push; QA was denied
 * `pnpm install` because the string contained "install". Rules now look at
 * each simple command's program and arguments.
 *
 * parseScript(src) → { commands: SimpleCommand[] } | null (null = could not
 * parse: unbalanced quotes / parens; callers fail closed for agents).
 * SimpleCommand = { words: string[], assigns: string[], redirects: {op, target}[] }
 * Nested code is flattened into `commands`: $(…) and `…` substitutions,
 * `sh|bash|zsh -c <str>`, `eval …`, a heredoc fed to a shell, and wrappers
 * (env, nice, nohup, timeout, time, command, exec, sudo, xargs) are unwrapped.
 */

const SHELLS = new Set(["sh", "bash", "zsh", "dash", "ksh"]);
const WRAPPERS = new Set(["env", "nice", "nohup", "timeout", "time", "command", "exec", "sudo", "xargs", "stdbuf", "caffeinate"]);
const ASSIGN = /^[A-Za-z_][A-Za-z0-9_]*=/;

/** Split into tokens: words (quotes resolved), operators, redirections, heredocs. */
function tokenize(src) {
  const toks = [];
  const nested = [];          // inner scripts from $(…) / `…`
  const heredocs = [];        // pending { delim, strip } awaiting the next newline
  let i = 0, word = null;
  const flush = () => { if (word !== null) { toks.push({ t: "w", v: word }); word = null; } };
  const add = (s) => { word = (word ?? "") + s; };

  const readSubst = (open, close) => { // i points just past the opener
    let depth = 1, start = i, q = null;
    for (; i < src.length; i++) {
      const c = src[i];
      if (q) { if (c === q) q = null; else if (c === "\\" && q === '"') i++; continue; }
      if (c === "'" || c === '"') { q = c; continue; }
      if (c === "\\") { i++; continue; }
      if (open !== close && c === open) depth++;
      if (c === close && --depth === 0) { nested.push(src.slice(start, i)); i++; return true; }
    }
    return false;
  };

  while (i < src.length) {
    const c = src[i];
    if (c === "\n") {
      flush(); toks.push({ t: "op", v: ";" }); i++;
      // heredoc bodies start on the line after their operator
      for (const h of heredocs.splice(0)) {
        const lines = [];
        while (i <= src.length) {
          let end = src.indexOf("\n", i); if (end === -1) end = src.length;
          const line = src.slice(i, end); i = end + 1;
          if ((h.strip ? line.replace(/^\t+/, "") : line).trim() === h.delim) break;
          lines.push(line);
          if (end >= src.length) { i = src.length; break; }
        }
        h.tok.body = lines.join("\n");
      }
      continue;
    }
    if (c === " " || c === "\t") { flush(); i++; continue; }
    if (c === "#" && word === null) { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (c === "\\") { if (src[i + 1] === "\n") { i += 2; continue; } add(src[i + 1] ?? ""); i += 2; continue; }
    if (c === "'") { const e = src.indexOf("'", i + 1); if (e === -1) return null; add(src.slice(i + 1, e)); i = e + 1; continue; }
    if (c === '"') {
      i++; let s = "";
      for (;;) {
        if (i >= src.length) return null;
        const d = src[i];
        if (d === '"') { i++; break; }
        if (d === "\\" && i + 1 < src.length) { s += src[i + 1]; i += 2; continue; }
        if (d === "$" && src[i + 1] === "(") { i += 2; if (!readSubst("(", ")")) return null; s += "$SUBST"; continue; }
        if (d === "`") { i++; if (!readSubst("`", "`")) return null; s += "$SUBST"; continue; }
        s += d; i++;
      }
      add(s); continue;
    }
    if (c === "$" && (src[i + 1] === "'" || src[i + 1] === '"')) return null; // ANSI-C / locale quoting: not resolved
    if (c === "$" && src[i + 1] === "(") { i += 2; if (!readSubst("(", ")")) return null; add("$SUBST"); continue; }
    if (c === "`") { i++; if (!readSubst("`", "`")) return null; add("$SUBST"); continue; }
    if (c === "<" && src[i + 1] === "<" && src[i + 2] !== "<") { // heredoc
      flush(); i += 2;
      const strip = src[i] === "-"; if (strip) i++;
      while (src[i] === " ") i++;
      const m = src.slice(i).match(/^(['"]?)([A-Za-z0-9_.-]+)\1/);
      if (!m) return null;
      i += m[0].length;
      const tok = { t: "heredoc", body: "" };
      toks.push(tok); heredocs.push({ delim: m[2], strip, tok });
      continue;
    }
    // redirections: [n]>, [n]>>, &>, >&n, <, <<<
    const r = src.slice(i).match(/^(\d*|&)(>>?|<<<|<)(&\d+|&-)?/);
    if (r && (word === null || /^\d+$/.test(word ?? "")) && r[0].length) {
      if (/^\d+$/.test(word ?? "")) word = null;
      i += r[0].length; flush();
      if (r[3]) { toks.push({ t: "redir", op: r[2], target: r[3] }); continue; }
      while (src[i] === " ") i++;
      toks.push({ t: "redir", op: r[2], target: null }); // target = next word
      continue;
    }
    if (c === ";" || c === "|" || c === "&" || c === "(" || c === ")" || c === "{" && word === null || c === "}" && word === null) {
      flush();
      const two = src.slice(i, i + 2);
      if (two === "&&" || two === "||" || two === ";;") { toks.push({ t: "op", v: two }); i += 2; continue; }
      toks.push({ t: "op", v: c }); i++; continue;
    }
    add(c); i++;
  }
  flush();
  if (heredocs.length) for (const h of heredocs) h.tok.body = h.tok.body || "";
  return { toks, nested };
}

/** Strip assignment prefixes and wrapper programs; returns the effective argv. */
function unwrap(words, assigns) {
  let w = words.slice();
  for (let guard = 0; guard < 8 && w.length; guard++) {
    while (w.length && ASSIGN.test(w[0])) assigns.push(w.shift());
    const p = (w[0] ?? "").split("/").pop();
    if (!WRAPPERS.has(p)) break;
    w.shift();
    // wrapper options / operands before the real program
    while (w.length && (w[0].startsWith("-") || (p === "timeout" && /^\d/.test(w[0])) || (p === "env" && ASSIGN.test(w[0])))) {
      const o = w.shift();
      if (p === "env" && ASSIGN.test(o)) assigns.push(o);
      if ((p === "timeout" || p === "xargs" || p === "sudo") && /^-[a-zA-Z]$/.test(o) && w.length && !w[0].startsWith("-")) {
        if (!(p === "timeout")) w.shift(); // option argument
      }
    }
  }
  return w;
}

export function parseScript(src, depth = 0) {
  if (depth > 6) return null;
  const tz = tokenize(String(src));
  if (!tz) return null;
  const commands = [];
  let cur = { words: [], assigns: [], redirects: [], heredocBodies: [], prevOp: null };
  const pending = [];
  let lastOp = null;
  const end = () => {
    if (cur.words.length || cur.assigns.length || cur.redirects.length || cur.heredocBodies.length) pending.push(cur);
    cur = { words: [], assigns: [], redirects: [], heredocBodies: [], prevOp: lastOp };
  };
  for (let k = 0; k < tz.toks.length; k++) {
    const t = tz.toks[k];
    if (t.t === "op") { lastOp = t.v; end(); continue; }
    if (t.t === "heredoc") { cur.heredocBodies.push(t); continue; }
    if (t.t === "redir") {
      if (t.target) cur.redirects.push({ op: t.op, target: t.target });
      else { const nx = tz.toks[k + 1]; if (!nx || nx.t !== "w") return null; cur.redirects.push({ op: t.op, target: nx.v }); k++; }
      continue;
    }
    cur.words.push(t.v);
  }
  end();
  for (const inner of tz.nested) {
    const sub = parseScript(inner, depth + 1);
    if (!sub) return null;
    commands.push(...sub.commands);
  }
  for (const c of pending) {
    const assigns = c.assigns.slice();
    const words = unwrap(c.words, assigns);
    const prog = (words[0] ?? "").split("/").pop();
    // xargs appends stdin words to its argv: the real arguments are unknowable.
    const sc = { words, assigns, redirects: c.redirects, openArgs: c.words.some((w) => w.split("/").pop() === "xargs") };
    commands.push(sc);
    // find -exec / -execdir / -ok / -okdir run their own command
    if (prog === "find") {
      for (let k = 1; k < words.length; k++) {
        if (/^-(exec|execdir|ok|okdir)$/.test(words[k])) {
          let e = k + 1; while (e < words.length && words[e] !== ";" && words[e] !== "+") e++;
          commands.push({ words: words.slice(k + 1, e).map((w) => w.replace("{}", "FILE")), assigns: [], redirects: [], openArgs: words[e] === "+" });
          k = e;
        }
      }
    }
    // code that a shell will execute
    if (SHELLS.has(prog)) {
      // -c may sit in a cluster (`-ec`, `-xc`); the code is the next word.
      // Walk the shell's own options: short clusters (-ec, +x), the ones that
      // take an argument (-o/-O/+o/+O, --rcfile, --init-file), `--`. Any other
      // long option is unknown grammar → unparseable. The first operand is the
      // -c code if a cluster contained `c`, otherwise a script path.
      let hasC = false, k = 1;
      for (; k < words.length; k++) {
        const w = words[k];
        if (w === "--") { k++; break; }
        if (/^[-+][oO]$/.test(w)) { k++; continue; }
        if (w === "--rcfile" || w === "--init-file") { k++; continue; }
        if (/^--/.test(w)) { if (/^--(norc|noprofile|posix|login|noediting|restricted|verbose)$/.test(w)) continue; return null; }
        if (/^[-+][a-zA-Z]+$/.test(w)) { if (w[0] === "-" && w.includes("c")) hasC = true; if (w[0] === "-" && w.includes("s")) return null; continue; }
        break;
      }
      const operand = words[k];
      const code = hasC ? operand : null;
      if (hasC && code == null) return null;
      const hereStrings = c.redirects.filter((r) => r.op === "<<<").map((r) => r.target);
      // stdin and fd paths are opaque code
      if (!hasC && operand && /^(-|\/dev\/(stdin|fd\/\d+)|\/proc\/self\/fd\/\d+)$/.test(operand)) return null;
      const prevHeredoc = pending[pending.indexOf(c) - 1]?.heredocBodies?.length; // parsed below
      // No -c, no script path, no own heredoc / here-string: code comes from
      // stdin we cannot see (a pipe, a `<` redirect, an inherited stdin) — fail
      // closed, unless the previous command is a heredoc we parse below.
      if (!hasC && !operand && !c.heredocBodies.length && !hereStrings.length && !(c.prevOp === "|" && prevHeredoc)) return null;
      for (const s of [code, ...hereStrings, ...c.heredocBodies.map((h) => h.body)].filter((x) => x != null)) {
        const sub = parseScript(s, depth + 1); if (!sub) return null; commands.push(...sub.commands);
      }
    } else if (prog === "eval") {
      const sub = parseScript(words.slice(1).join(" "), depth + 1); if (!sub) return null; commands.push(...sub.commands);
    }
    sc.heredocBodies = c.heredocBodies.map((h) => h.body);
  }
  // `cat <<EOF | sh` — a heredoc piped into a shell: the next command is the shell
  for (let k = 0; k + 1 < pending.length; k++) {
    const nextProg = (unwrap(pending[k + 1].words, []).at(0) ?? "").split("/").pop();
    if (SHELLS.has(nextProg) && pending[k].heredocBodies.length) {
      for (const h of pending[k].heredocBodies) { const sub = parseScript(h.body, depth + 1); if (!sub) return null; commands.push(...sub.commands); }
    }
  }
  return { commands };
}

export const programOf = (sc) => (sc.words[0] ?? "").split("/").pop();
