---
name: factory-audit
description: Read-only readiness audit of this repository for a gated, multi-agent development pipeline — tests, static checks, CI, branch protection, run recipe, docs, existing Claude Code setup, secrets hygiene. Writes docs/factory-readiness-audit.md. Manual only; run /factory-audit.
disable-model-invocation: true
---

# Factory-readiness audit

You are auditing this repository to find out which foundations for a gated, multi-agent
development pipeline already exist. This is a READ-ONLY audit:

- Do not modify, create, install, delete, reset or reformat anything, except the single
  report file named under "Output".
- Do not fix anything you find. Do not start the dev server unless section 5 says so.
- Do not invent facts. Every status needs an evidence path or command output. If you
  cannot check something, mark it UNKNOWN and say exactly what would be needed to check it.
- Never print secret values. When a file looks like it holds secrets, report the path only.
- Keep your own context small: delegate wide scans (file counts, greps across the tree) to
  the Explore subagent and keep only the conclusions. If the repo is very large, sample and
  say so.
- Time-box: if a single command runs longer than 10 minutes, stop it and report NOT RUN.

Statuses: FOUND / PARTIAL / MISSING / UNKNOWN. Use NOT RUN for a command that exists but
could not be executed here, with the reason.

## 1. Repository overview

- Stack: languages, frameworks, package manager(s), monorepo or single app, top-level
  structure to depth 2 (skip generated/vendored directories but name them).
- Entry points, build command, how the app is started locally according to existing docs.
- Size: file count by extension, the five largest directories.
- Git: default branch, number of branches, last 10 commits (date + one-line summary),
  whether there are uncommitted changes (list files; do not touch them), `.gitignore`
  present and what it covers.

## 2. Tests

- Test frameworks and their config files; number of test files and where they live;
  which layers are covered (unit / integration / e2e / visual / snapshot).
- The exact command(s) to run them. RUN the primary suite once if it exists; report
  pass/fail/skipped counts and duration. If it cannot run (missing deps, env, database),
  report NOT RUN with the reason — do not install or configure anything.
- Coverage tooling present? Any recorded coverage figure?
- Fixtures: seed data, saved example projects, older-format documents used in tests.
- Signs of weakened tests: `.skip`, `.only`, `xit`, snapshot files updated in bulk in
  recent commits, tests with no assertions (grep; report counts and a few paths).

## 3. Static checks

- Lint, typecheck and formatter tools with their commands. Run each once and report
  error/warning counts. If a command does not exist, say MISSING.
- Pre-commit hooks (husky, lint-staged, pre-commit framework): present and active?

## 4. CI/CD and branch protection

- CI configuration (`.github/workflows`, `.gitlab-ci.yml`, etc.): list jobs, trigger
  events, and whether tests, lint, typecheck and build actually run in CI.
- Deploy pipeline: what deploys, from which branch, any manual step, any secrets it needs
  (names only).
- Branch protection: if `gh auth status` succeeds, run
  `gh api repos/{owner}/{repo}/branches/<default-branch>/protection` and summarise
  required reviews, required status checks, force-push and deletion rules. Otherwise
  UNKNOWN and give the exact command the owner should run.

## 5. Run / preview recipe

- Can the app be launched from a clean checkout using only documented steps? List the
  steps as documented and any gap you can see without running them.
- Required environment variables (names only), external services (database, queue,
  storage), Docker/compose files.
- Any existing `.claude/skills/run-*` or `verify` recipe? If one exists, do not run it;
  report what it records.
- Only if there is a documented, dependency-free dev command (e.g. `npm run dev` with no
  database), start it once in the background, confirm the port responds, then stop it.

## 6. Documentation that agents would rely on

- README: setup, commands, architecture section present?
- Architecture docs, ADRs, module-boundary or "where things live" docs.
- Feature/spec template; where specs, tickets or design docs live (paths or tool names).
- Any existing inventory: feature map, ownership map, panel/layout map, navigation map,
  component/token catalog — in any format.
- Figma links or design-system references found in the repo (paths; do not fetch).

## 7. Existing Claude Code setup

- All `CLAUDE.md` / `CLAUDE.local.md` / `AGENTS.md` files: path, line count, what kind of
  content (facts vs procedures). Flag procedures that should be skills and facts that look
  stale against the code.
- `.claude/` contents: `settings.json` and `settings.local.json` (permissions allow/ask/
  deny, hooks, env), `rules/`, `skills/`, `agents/`, `commands/`, `.mcp.json`, plugins
  enabled. For each skill/agent: name, one-line purpose, whether it looks maintained.
- Hooks: which events, what they enforce.

## 8. Safety and hygiene

- Secrets in git: `git ls-files` filtered for `.env`, `secret`, `credential`, `key`,
  `.pem`, `.p12`; grep tracked files for token-like patterns. Report paths and counts only.
- Dependencies: lockfile present and committed? Run `npm audit --omit=dev` (or the
  ecosystem equivalent) if available; report severity counts only.
- Areas a hook should guard: migrations, auth, billing/payments, publish/deploy scripts,
  schema files, shared design tokens. List the paths.
- Destructive scripts in `package.json`/Makefile/etc.: anything that drops a database,
  force-pushes, deploys, or deletes.

## 9. Integrations available in this session

- `gh auth status`; MCP servers connected (Figma, GitHub, others); whether `claude plugin
  list` shows anything relevant.

## 10. Readiness verdict

Produce:

1. A table — Area | Status | Evidence | Gap | Effort (S/M/L) — covering: tests, static
   checks, CI, branch protection, run recipe, architecture docs, spec template,
   CLAUDE.md quality, permissions/hooks, agents/skills, secrets hygiene, dependency
   health.
2. "Top 5 fixes, in order" — for each: what to add, which pipeline gate it unblocks,
   effort.
3. "Enforceable today vs needs foundation first" — which rules could be turned into hooks
   right now with what exists, and which have nothing to check against yet.
4. "Unknowns" — every UNKNOWN/NOT RUN with the exact command or access needed.

## Output

Write the complete report to `docs/factory-readiness-audit.md` (create `docs/` if it is
missing; this is the only write permitted). Put the date and the current commit hash at
the top. Then print sections 10.1 and 10.2 in the chat. English, concrete, no praise, no
filler, no recommendations beyond section 10.
