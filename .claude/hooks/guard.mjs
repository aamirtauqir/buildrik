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
  [git(String.raw`add\b[^\n]*(\.env(?!\.example)(\.[\w.-]+)?(['"\s]|$)|auth\.json|\.pem\b|\.p12\b)`), "staging a secrets file in a public repo"],
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
  [/(^|\/)\.env(?!\.example)(\.|$)|(^|\/)auth\.json$/, "secrets file"],
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
  for (const [re, why] of ASK_PATHS) if (re.test(rel)) decide("ask", `${rel} is ${why} — confirm before editing`);
}
process.exit(0);
