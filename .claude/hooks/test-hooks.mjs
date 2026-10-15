#!/usr/bin/env node
/**
 * Controls for the repo's Claude hooks: guard.mjs (command + path + role rules),
 * factory-stop.mjs (SubagentStop evidence gate), factory-context.mjs
 * (SessionStart re-injection). Run from the repo root after changing any of them:
 *
 *   node .claude/hooks/test-hooks.mjs
 *
 * Cases live here, not in a shell loop: the guard reads quoted strings and
 * executed heredocs on purpose, so a loop of banned commands trips it.
 */
import { execFileSync } from "node:child_process";
const root = process.cwd();
const run = (hook, input) => {
  const out = execFileSync("node", [hook], { input: JSON.stringify(input), env: { ...process.env, CLAUDE_PROJECT_DIR: root } }).toString();
  return out ? JSON.parse(out) : null;
};
let bad = 0, n = 0;

// ── guard: commands (main session) ──
const cases = [
  ["deny", "git push --force origin main"], ["deny", "git push -f"], ["allow", "git push --force-with-lease origin x"],
  ["allow", "git push origin main"], ["deny", "git push origin +main"], ["deny", "git push origin --delete main"],
  ["deny", "git push origin :main"], ["deny", "git push --mirror"], ["deny", "git stash"], ["deny", "git -C . stash list"],
  ["deny", "git -C. stash"], ["deny", "git -c x=y stash"], ["deny", "git --git-dir .git stash"], ["deny", "git --work-tree=. push -f"],
  ["deny", 'bash -c "git stash"'], ["deny", "cd x && git stash pop"], ["deny", "bash <<'EOF'\ngit stash\nEOF"],
  ["deny", "cat <<EOF | sh\ngit stash\nEOF"], ["allow", "git commit -q -F - <<'EOF'\nmentions git stash and git push --force\nEOF\ngit log -1"],
  ["deny", "git commit -q -F - <<'EOF'\nx\nEOF\ngit stash"], ["allow", "gh pr create --body-file - <<'EOF'\nnever git push --force\nEOF"],
  ["allow", 'git commit -m "no git stash here"'], ["deny", "pnpm db:push"], ["deny", "git add .env.local"], ["deny", 'git add ".env.local"'],
  ["allow", "git add .env.example"], ["allow", "git add README.md .env.example .env.local.example docker-compose.yml"],
  ["deny", "git add .env.local.example .env.local"], ["deny", "git add packages/dashboard/.env"], ["deny", "git add .env.production.local"], ["deny", "git add auth.json"], ["ask", "git push --no-verify origin main"], ["ask", "git add -A"],
  ["ask", "git add ."], ["allow", "git add packages/x.ts"], ["ask", "UPDATE_PARITY=true npx playwright test"], ["allow", "echo ok"], ["allow", "git status"],
];
for (const [want, command] of cases) {
  n++;
  const out = execFileSync("node", [".claude/hooks/guard.mjs"], { input: JSON.stringify({ tool_name: "Bash", tool_input: { command } }) }).toString();
  const got = out ? JSON.parse(out).hookSpecificOutput.permissionDecision : "allow";
  if (got !== want) { bad++; console.log("WRONG want", want, "got", got, JSON.stringify(command)); }
}

const expect = (label, got, want) => { n++; if (got !== want) { bad++; console.log("WRONG", label, "want", want, "got", got); } };
const guard = (agent_type, tool_name, tool_input) =>
  run(".claude/hooks/guard.mjs", { agent_type, tool_name, tool_input, cwd: root })?.hookSpecificOutput?.permissionDecision ?? "allow";

// read-only roles
for (const r of ["factory-qa", "factory-code-reviewer", "factory-security", "design-guard-reviewer"]) {
  expect(`${r} Edit`, guard(r, "Edit", { file_path: `${root}/packages/editor/src/x.ts` }), "deny");
  expect(`${r} Write outside repo`, guard(r, "Write", { file_path: "/tmp/x.txt" }), "deny");
  expect(`${r} commit`, guard(r, "Bash", { command: "git commit -m x" }), "deny");
  expect(`${r} vitest`, guard(r, "Bash", { command: "npx vitest run a.test.ts" }), "allow");
  expect(`${r} gh pr diff`, guard(r, "Bash", { command: "gh pr diff 12" }), "allow");
}
// analyst / designer scope
expect("analyst spec", guard("factory-analyst", "Write", { file_path: `${root}/docs/factory/tasks/T-001/spec.md` }), "allow");
expect("analyst task.md", guard("factory-analyst", "Edit", { file_path: `${root}/docs/factory/tasks/T-001/task.md` }), "deny");
expect("analyst code", guard("factory-analyst", "Edit", { file_path: `${root}/server/services/x.ts` }), "deny");
expect("designer design/", guard("factory-designer", "Write", { file_path: `${root}/docs/factory/tasks/T-001/design/ddr.md` }), "allow");
expect("designer spec", guard("factory-designer", "Write", { file_path: `${root}/docs/factory/tasks/T-001/spec.md` }), "deny");
expect("designer app code", guard("factory-designer", "Edit", { file_path: `${root}/packages/editor/src/a.tsx` }), "deny");
// developer
const wt = `${root}/.claude/worktrees/agent-abc`;
expect("dev code in worktree", guard("factory-developer", "Edit", { file_path: `${wt}/packages/editor/src/a.tsx` }), "allow");
expect("dev task.md", guard("factory-developer", "Edit", { file_path: `${wt}/docs/factory/tasks/T-001/task.md` }), "deny");
expect("dev agents", guard("factory-developer", "Edit", { file_path: `${root}/.claude/agents/factory-qa.md` }), "deny");
expect("dev push branch", guard("factory-developer", "Bash", { command: "git push -u origin factory/T-001" }), "allow");
expect("dev push main", guard("factory-developer", "Bash", { command: "git push origin main" }), "deny");
expect("dev push HEAD", guard("factory-developer", "Bash", { command: "git push" }), "deny");
expect("dev merge", guard("factory-developer", "Bash", { command: "gh pr merge 12 --squash" }), "deny");
expect("dev pr create", guard("factory-developer", "Bash", { command: "gh pr create --base main --head factory/T-001 --title x --body-file -" }), "allow");
// bypass forms (security review of 6665b109f)
expect("dev push branch:main", guard("factory-developer", "Bash", { command: "git push origin factory/T-001:main" }), "deny");
expect("dev push refs/heads/main", guard("factory-developer", "Bash", { command: "git push origin factory/T-001:refs/heads/main" }), "deny");
expect("dev push branch to its own name", guard("factory-developer", "Bash", { command: "git push origin factory/T-001:factory/T-001" }), "allow");
for (const [label, command] of [
  ["quoted main", "git push origin factory/T-001:'main'"], ["plus ref", "git push origin +factory/T-001:main"],
  ["other branch name", "git push origin factory/T-001:factory/T-002"], ["two refs", "git push origin factory/T-001 main"],
  ["git -C", "git -C . push origin factory/T-001:main"], ["push config", "git config remote.origin.push refs/heads/x:refs/heads/main"],
  ["set upstream", "git branch --set-upstream-to=origin/main"], ["remote set-url", "git remote set-url origin x"],
  ["chained", "git push -u origin factory/T-001 && git push origin HEAD:main"], ["tags", "git push --tags"],
]) expect(`dev push bypass: ${label}`, guard("factory-developer", "Bash", { command }), "deny");
expect("dev push -u ok", guard("factory-developer", "Bash", { command: "git push -u origin factory/T-001 2>&1 | tail -3" }), "allow");
for (const [label, command] of [
  ["redirect", "echo hacked > packages/editor/src/a.ts"], ["append", "printf x >> server/a.ts"], ["sed -i", "sed -i '' s/a/b/ lib/x.ts"],
  ["tee", "echo x | tee lib/x.ts"], ["cp", "cp /tmp/x lib/x.ts"], ["node writeFile", "node -e 'require(\"fs\").writeFileSync(\"a\",\"b\")'"],
  ["perl -pi", "perl -pi -e s/a/b/ x.ts"], ["git apply", "git apply /tmp/p.diff"],
]) expect(`qa shell write: ${label}`, guard("factory-qa", "Bash", { command }), "deny");
expect("analyst shell write", guard("factory-analyst", "Bash", { command: "echo x > server/a.ts" }), "deny");
for (const [label, command] of [
  ["2>&1", "npx vitest run a.test.ts 2>&1 | tail -5"], ["/dev/null", "pnpm lint > /dev/null"], ["tmp log", "pnpm lint > /tmp/lint.log 2>&1"],
  ["worktree add", "git worktree add ../qa-T-001 factory/T-001"], ["arrow in text", "grep -n 'a -> b' x"], ["gh pr view", "gh pr view 3 --json files"],
]) expect(`qa allowed: ${label}`, guard("factory-qa", "Bash", { command }), "allow");
expect("dev shell write allowed", guard("factory-developer", "Bash", { command: "echo x > packages/editor/src/a.ts" }), "allow");

// main session (PM) unaffected by role rules
expect("PM task.md", guard(undefined, "Edit", { file_path: `${root}/docs/factory/tasks/T-001/task.md` }), "allow");
expect("PM merge", guard(undefined, "Bash", { command: "gh pr merge 12 --squash" }), "allow");
expect("Explore agent read", guard("Explore", "Bash", { command: "git log -1" }), "allow");

// SubagentStop
const stop = (agent_type, msg, active = false) =>
  run(".claude/hooks/factory-stop.mjs", { agent_type, last_assistant_message: msg, stop_hook_active: active, cwd: root })?.decision ?? "allow";
expect("qa no block", stop("factory-qa", "All good, it works!"), "block");
expect("qa second stop", stop("factory-qa", "All good, it works!", true), "allow");
expect("qa full", stop("factory-qa", "TASK: T-001\nROLE: factory-qa\nBRANCH: factory/T-001 @ abc\nCHECKS:\n- x → PASS — y\nEVIDENCE: inline\nVERDICT: PASS"), "allow");
expect("qa bad verdict", stop("factory-qa", "TASK: T-001\nBRANCH: b\nCHECKS:\n- x → PASS\nVERDICT: LGTM"), "block");
expect("dev ready no PR", stop("factory-developer", "TASK: T-001\nBRANCH: factory/T-001\nTESTS: x\nDONE_CONDITION: y\nVERDICT: READY_FOR_QA"), "block");
expect("dev ready PR", stop("factory-developer", "TASK: T-001\nBRANCH: factory/T-001\nPR: https://github.com/a/b/pull/3\nTESTS: x\nDONE_CONDITION: y\nVERDICT: READY_FOR_QA"), "allow");
expect("dev blocked", stop("factory-developer", "TASK: T-001\nBRANCH: none\nTESTS: NOT RUN\nDONE_CONDITION: NOT RUN\nVERDICT: BLOCKED"), "allow");
expect("analyst spec missing on disk", stop("factory-analyst", "TASK: T-999\nSPEC: docs/factory/tasks/T-999/spec.md\nUI_CHANGE: no\nGUARDED: none\nVERDICT: READY"), "block");
expect("analyst spec exists", stop("factory-analyst", "TASK: T-000\nSPEC: docs/factory/tasks/_TEMPLATE/task.md\nUI_CHANGE: no\nGUARDED: none\nVERDICT: READY"), "allow");
expect("Explore untouched", stop("Explore", "whatever"), "allow");
expect("design-guard outside factory", stop("design-guard-reviewer", "Readiness: PROPOSAL"), "allow");
expect("design-guard in factory, no block", stop("design-guard-reviewer", "Reviewed T-001. Looks fine."), "block");

// SessionStart
const ctx = (source) => run(".claude/hooks/factory-context.mjs", { source, cwd: root })?.hookSpecificOutput?.additionalContext ?? "";
expect("compact has rules", ctx("compact").includes("The task lives on disk"), true);
expect("startup no rules", ctx("startup").includes("The task lives on disk"), false);
expect("startup lists tasks", /factory tasks/.test(ctx("startup")), true);

console.log(`${n - bad}/${n} ok`);
process.exit(bad ? 1 : 0);
