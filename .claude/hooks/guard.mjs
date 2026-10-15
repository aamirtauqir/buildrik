#!/usr/bin/env node
/**
 * PreToolUse guard — the write-scope and dangerous-action gate.
 *
 * Two kinds of verdict:
 *   deny — never right from an agent session (force-push, secret staging,
 *          prod env rewrite, schema push that bypasses migrations, git stash).
 *   ask  — sometimes right, always worth a human look (migrations, auth,
 *          billing, publish, tokens, test baselines, CI, --no-verify).
 *
 * A backstop, not a sandbox: command text can always be assembled at runtime.
 * The binding checks live server-side (branch protection blocks force-push)
 * and in the pre-commit hook (staged file NAMES, however they were staged).
 *
 * Fails open on unparseable input: a guard that crashes would block every
 * tool call, and the deny list is a backstop, not the only line.
 */
import { readFileSync } from "node:fs";
import { relative, isAbsolute } from "node:path";
import { parseScript, programOf } from "./shell-parse.mjs";

// `git` plus any global options (`git -C dir`, `git -c k=v`, `git --no-pager`)
// before the subcommand — otherwise `git -C . stash` walks past every rule.
const GIT = String.raw`\bgit(?:\s+-[Cc]\s*\S+|\s+--(?:git-dir|work-tree|namespace|exec-path|config-env)(?:=|\s+)\S+|\s+--[\w-]+(?:=\S+)?)*\s+`;
const git = (rest) => new RegExp(GIT + rest);

const DENY_COMMANDS = [
  // --force, -f, a `+ref` refspec, --mirror, and deleting a remote ref
  // (`--delete`, `:ref`) all rewrite or remove shared history.
  [git(String.raw`push\b[^\n]*(\s--force(?!-with-lease)\b|\s-f\b|\s\+\S|\s--mirror\b|\s--delete\b|\s-d\b|\s:\S)`), "force-push / remote ref deletion rewrites shared history"],
  [git(String.raw`stash\b`), "CLAUDE.md bans git stash mid-execution (5 recovery incidents) — use git worktree add"],
  [/\b(db:push|prisma\s+db\s+push)\b/, "prisma db push bypasses migrations and can drop columns — write a migration"],
  [/\bprisma\s+migrate\s+reset\b/, "migrate reset drops the database"],
  [/\benv:set:prod\b|set-prod-env\.mjs/, "rewrites the entire production env map over SSH — founder step"],
  [/\bcloudlinux-selector\s+set\b/, "replaces the entire production env map — founder step"],
  [git(String.raw`add\b[^\n]*(\.env(?![\w.-]*\.example(['"\s]|$))(\.[\w.-]+)?(['"\s]|$)|auth\.json|\.pem\b|\.p12\b)`), "staging a secrets file in a public repo"],
];

const ASK_COMMANDS = [
  [/\s--no-verify\b/, "bypasses the pre-push / pre-commit gates — say why"],
  [/\bstripe:setup\b|stripe-setup\.ts/, "creates Stripe products/prices against whatever key is set"],
  [/\bprisma\s+migrate\s+(deploy|dev)\b/, "applies migrations to the database DATABASE_URL points at"],
  [/\bsmoke:prod\b|smoke-deployed\.mjs/, "hits the live production deployment"],
  [/\bUPDATE_PARITY=true\b|--update-snapshots\b|\s-u\b.*vitest|vitest.*\s-u\b/, "rewrites test baselines — every change needs a named intended cause"],
  [git(String.raw`add\s+(-A|--all|\.)(\s|$)`), "bulk staging — the working tree holds untracked audit dumps and local files"],
];

const ASK_PATHS = [
  [/^prisma\/(schema\.prisma|migrations\/|seed)/, "database schema / migrations / seed"],
  [/^server\/(auth(\.config)?\.ts|services\/auth\.service\.ts|trpc\/routers\/auth\.ts)$/, "auth"],
  [/^(lib\/cron-auth\.ts|packages\/dashboard\/middleware\.ts|packages\/dashboard\/app\/api\/auth\/)/, "auth"],
  [/vercel-oauth|packages\/dashboard\/app\/api\/integrations\/vercel\//, "Vercel OAuth"],
  [/^server\/services\/(billing\.service|stripe-webhook\.service|stripe\.client|webhook\.service)\.ts$/, "billing"],
  [/^server\/trpc\/routers\/(billing|webhooks)\.ts$|app\/api\/webhooks\/stripe\/|app\/api\/cron\/billing-|packages\/shared\/schemas\/billing\.ts$|scripts\/stripe-setup\.ts$/, "billing"],
  [/^server\/services\/(publish\.service|publish-approval|scheduled-publish\.service)\.ts$|app\/api\/workers\/publish\/|app\/api\/cron\/(scheduled-publish|publish-job-cleanup)\/|^lib\/publish-|packages\/shared\/schemas\/publish\.ts$|^vercel\.json$|packages\/dashboard\/next\.config\.mjs$/, "publish / deploy"],
  [/^DESIGN\.md$|design-tokens\.css$|tokens\.generated\.|engine\/designSystem\/(defaultTokens|projectTokens)\.ts$|packages\/shared\/schemas\/(design-tokens|designToken)\.ts$/, "design tokens"],
  [/\.tsc-baselines\.json$|e2e\/baselines\/|-snapshots\/|ratchet.*baseline|baseline.*\.json$/, "gate / test baseline"],
  [/^scripts\/(check-prod-env|set-prod-env)|^\.github\/workflows\/|scripts\/hooks\/pre-(push|commit)$|^\.claude\/(settings\.json|hooks\/)/, "CI / deploy / gate config"],
  [/(^|\/)\.env(?![\w.-]*\.example$)(\.|$)|(^|\/)auth\.json$/, "secrets file"],
];

function decide(decision, reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: decision, permissionDecisionReason: `[guard] ${reason}` },
  }));
  process.exit(0);
}

let input;
try { input = JSON.parse(readFileSync(0, "utf8")); } catch { process.exit(0); }
const tool = input.tool_name ?? "";
const ti = input.tool_input ?? {};

// ── Factory roles (input.agent_type is set when a subagent makes the call) ──
// Who-may-write is enforced here, not only in each agent's tool list: a role
// that cannot edit has nothing to defend when its work is reviewed.
const ROLE = input.agent_type ?? "";
const READ_ONLY_ROLES = new Set(["factory-qa", "factory-code-reviewer", "factory-security", "design-guard-reviewer"]);
const WRITE_SCOPE = {
  "factory-analyst": [/^docs\/factory\/tasks\/T-\d+\/(?!task\.md$)[^/]+$/, "its task folder (spec.md), never task.md"],
  "factory-designer": [/^docs\/factory\/tasks\/T-\d+\/design\//, "docs/factory/tasks/<ID>/design/"],
};
const isFactory = ROLE.startsWith("factory-") || READ_ONLY_ROLES.has(ROLE);
const WRITE_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);

if (isFactory && WRITE_TOOLS.has(tool) && READ_ONLY_ROLES.has(ROLE)) {
  decide("deny", `${ROLE} is read-only — it reports, it does not change files`);
}
if (isFactory && tool === "Bash") {
  // Rules read the PARSED command (shell-parse.mjs): program + argv per simple
  // command, with $(…), sh -c, eval, shell-fed heredocs and wrappers unwrapped.
  // Matching raw text denied `grep 'touch' f`, `pnpm install` and commit
  // messages that said "push"; parsing also closes the quoting / prefix bypasses
  // the raw rules kept chasing. An agent's command that cannot be parsed is denied.
  const parsed = parseScript(String(ti.command ?? ""));
  if (!parsed) decide("deny", `${ROLE}: command could not be parsed (unbalanced quotes or parens) — split it into simple commands`);
  const readOnly = READ_ONLY_ROLES.has(ROLE);
  const noShellWrites = readOnly || Boolean(WRITE_SCOPE[ROLE]);
  const TMP = /^(\/dev\/null|\/dev\/std(out|err)|&\d+|&-|\/tmp\/|\/private\/tmp\/|\/var\/folders\/|\$TMPDIR|\$\{TMPDIR\})/;
  const WRITERS = new Set(["tee", "truncate", "touch", "rm", "rmdir", "mv", "cp", "ln", "install", "dd", "patch", "rsync", "unlink", "shred"]);
  const SCRIPTERS = new Set(["node", "python", "python3", "ruby", "perl", "deno", "bun", "php"]);
  const FS_WRITE = /\b(writeFile|appendFile|createWriteStream|copyFile|rename|unlink|rmSync|rm\s*\(|mkdirSync|truncate|symlink)\w*\s*\(|open\([^)]*['"][wa+]|\.write_text|\.write_bytes|shutil\./;

  for (const sc of parsed.commands) {
    const prog = programOf(sc);
    const args = sc.words.slice(1);

    // Git config via the environment, or variables named for it.
    const envNames = sc.assigns.map((a) => a.split("=")[0]);
    if (envNames.some((n) => /^GIT_/i.test(n))) decide("deny", `${ROLE} cannot set GIT_* variables`);
    if (["export", "declare", "typeset", "readonly", "local", "printf", "read", "set", "unset"].includes(prog) && args.some((a) => /(^|=|-v)GIT_|^GIT_/i.test(a))) {
      decide("deny", `${ROLE} cannot set GIT_* variables`);
    }

    if (prog === "gh" && args[0] === "pr" && args[1] === "merge") decide("deny", `${ROLE} cannot merge — the PM merges after every gate passes`);

    if (prog === "git") {
      // global options before the subcommand
      let k = 0;
      while (k < args.length && args[k].startsWith("-")) {
        const o = args[k];
        if (o === "-c" || o.startsWith("--config-env")) decide("deny", `${ROLE} cannot pass git -c / --config-env`);
        k += /^(-C|--git-dir|--work-tree|--namespace|--exec-path)$/.test(o) ? 2 : 1;
      }
      const sub = args[k];
      const rest = args.slice(k + 1);
      if (sub === "push") {
        // Allowlist: exactly [-u|--set-upstream] origin factory/T-NNN[:factory/T-NNN]
        const r = rest.filter((a) => a !== "-u" && a !== "--set-upstream");
        const ok = !sc.openArgs && rest.length - r.length <= 1 && r.length === 2 && r[0] === "origin" &&
          /^factory\/T-\d+$/.test(r[1].split(":")[0]) && (!r[1].includes(":") || r[1].split(":")[1] === r[1].split(":")[0]);
        if (!ok) decide("deny", `${ROLE} may only push: git push -u origin factory/<ID> (got: git ${args.join(" ")})`);
      }
      if (sub === "config" && rest.some((a) => /^(remote|push|branch|url)\./i.test(a))) decide("deny", `${ROLE} cannot change remotes, upstreams or push config`);
      if (sub === "remote" && ["add", "set-url", "rename"].includes(rest[0])) decide("deny", `${ROLE} cannot change remotes`);
      if (sub === "branch" && rest.some((a) => a === "-u" || a.startsWith("--set-upstream-to"))) decide("deny", `${ROLE} cannot change upstreams`);
      if (readOnly && ["commit", "push", "add", "reset", "restore", "apply", "am", "rebase", "merge", "cherry-pick", "revert", "rm", "mv", "clean"].includes(sub)) {
        decide("deny", `${ROLE} is read-only — no commits, staging or resets`);
      }
      if (readOnly && sub === "checkout" && rest.includes("--")) decide("deny", `${ROLE} is read-only — no checkout of files`);
    }

    if (noShellWrites) {
      const bad = (why) => decide("deny", `${ROLE} cannot write files from the shell (${why}) — use the Write tool (scoped) or report it`);
      for (const r of sc.redirects) if ((r.op === ">" || r.op === ">>") && !TMP.test(r.target)) bad(`${r.op} ${r.target}`);
      if (WRITERS.has(prog)) bad(prog);
      if (prog === "find" && args.includes("-delete")) bad("find -delete");
      if (prog === "sed" && args.some((a) => /^-[a-zA-Z]*i/.test(a) || a.startsWith("--in-place"))) bad("sed -i");
      if (SCRIPTERS.has(prog)) {
        if (prog === "perl" && args.some((a) => /^-[a-zA-Z]*i/.test(a))) bad("perl -i");
        const ci = args.findIndex((a) => /^-(e|c|p|-eval|-print)$/.test(a));
        const code = ci !== -1 ? args.slice(ci + 1).join(" ") : "";
        if (FS_WRITE.test(code)) bad(`${prog} script writes files`);
      }
    }
  }
}

if (tool === "Bash") {
  // Match what runs, not what is written: a commit message that MENTIONS
  // `git stash` is not a stash. Only message text is dropped — the quoted
  // value of -m/--message/--title/--body, and a heredoc whose opener line is a
  // git commit/tag or gh pr/issue/release that is not piped into a shell.
  // Everything else is matched raw, so `bash -c "git stash"` and
  // `bash <<EOF ... EOF` are still read.
  const cmd = String(ti.command ?? "")
    .replace(/^([^\n]*\b(?:git\s+(?:commit|tag)|gh\s+(?:pr|issue|release))\b(?![^\n]*\|\s*(?:ba|z)?sh\b)[^\n]*)<<-?\s*(['"]?)(\w+)\2[^\n]*\n[\s\S]*?\n\s*\3\s*(?=\n|$)/gm, "$1")
    .replace(/(\s(?:-m|--message|--title|--body)[\s=])\s*('[^']*'|"(?:[^"\\]|\\.)*")/g, "$1''");
  for (const [re, why] of DENY_COMMANDS) if (re.test(cmd)) decide("deny", why);
  for (const [re, why] of ASK_COMMANDS) if (re.test(cmd)) decide("ask", why);
  process.exit(0);
}

const file = ti.file_path ?? ti.notebook_path;
if (file) {
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  // CLAUDE_PROJECT_DIR stays on the main checkout inside a worktree, so a
  // worktree file arrives as `.worktrees/<name>/prisma/...`; strip that prefix.
  const rel = (isAbsolute(file) ? relative(root, file) : file).split("\\").join("/")
    .replace(/^(\.claude\/)?\.?worktrees\/[^/]+\//, "");
  if (rel.startsWith("..")) process.exit(0);
  if (isFactory && /^docs\/factory\/tasks\/[^/]+\/task\.md$/.test(rel)) decide("deny", "only the PM (main session) edits task.md — return your result instead");
  if (isFactory && /^docs\/factory\/(RULES|README)\.md$|^\.claude\//.test(rel)) decide("deny", `${ROLE} cannot change the factory's own rules, agents or hooks`);
  const scope = WRITE_SCOPE[ROLE];
  if (scope && !scope[0].test(rel)) decide("deny", `${ROLE} may write only in ${scope[1]} (tried ${rel})`);
  for (const [re, why] of ASK_PATHS) if (re.test(rel)) decide("ask", `${rel} is ${why} — confirm before editing`);
}
process.exit(0);
