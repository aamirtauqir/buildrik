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
  ["GIT_CONFIG env", "GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=remote.origin.push GIT_CONFIG_VALUE_0=refs/heads/factory/T-001:refs/heads/main git push origin factory/T-001"],
  ["export GIT_", "export GIT_CONFIG_PARAMETERS=x; git push origin factory/T-001"], ["env GIT_ prefix", "env GIT_DIR=x git push origin factory/T-001"],
  ["git -c", "git -c remote.origin.push=x push origin factory/T-001"], ["wrapper to main", "nice git push origin main"],
  ["sh -c to main", "sh -c 'git push origin main'"], ["xargs appends args", "echo main | xargs git push origin factory/T-001"],
  ["find -exec push", "find . -maxdepth 0 -exec git push origin main \;"], ["subst push", "echo $(git push origin main)"], ["eval push", "eval git push origin HEAD:main"],
  ["var subcommand", "S=push; git $S origin main"], ["alias config", "git config alias.p push"], ["alias use", "git p origin main"],
  ["push var ref", "B=main; git push origin factory/T-001:$B"], ["node child_process", "node -e 'require(\"child_process\").execSync(\"git push origin main\")'"],
  ["python subprocess", "python3 -c 'import subprocess; subprocess.run([\"git\",\"push\",\"origin\",\"main\"])'"], ["source", "source ./x.sh"],
  ["GIT_ via raw", "X=GIT_DIR; git status"], ["xargs gh", "echo 31 | xargs gh pr merge"],
  ["bash -ec", "bash -ec 'git push origin main'"], ["here-string", "bash <<< 'git push origin main'"], ["pipe to bash", "echo 'git push origin main' | bash"],
  ["bash -c -x", "bash -c -x 'git push origin main'"], ["bash -o opt -c", "bash -o errexit -c 'git push origin main'"], ["bash -c -- code", "bash -c -- 'git push origin main'"],
  ["bash -oc", "bash -oc errexit 'git push origin main'"], ["bash -eo pipefail -c", "bash -eo pipefail -c 'git push origin main'"],
  ["sed-rewritten heredoc to bash", "sed s/X/main/ <<'EOF' | bash\ngit push origin X\nEOF"], ["cat with file + heredoc", "cat x.sh <<'EOF' | bash\necho hi\nEOF"],
  ["cat heredoc to bash, push main", "cat <<'EOF' | bash\ngit push origin main\nEOF"],
  ["bash /dev/stdin", "echo x | bash /dev/stdin"], ["bash -", "echo x | bash -"], ["bare bash", "bash"], ["bash unknown --opt", "bash --weird -c 'git push origin main'"],
  ["ansi-c quote", "git push origin $'main'"], ["bash < file", "bash < /tmp/x.sh"], ["sh -s", "printf x | sh -s"],
  ["heredoc to bash", "bash <<'EOF'\ngit push origin main\nEOF"], ["unbalanced quote", "git push origin 'factory/T-001"],
  ["declare", "declare -x GIT_CONFIG_COUNT=1; git push origin factory/T-001"], ["printf -v", "printf -v GIT_DIR x; git push origin factory/T-001"],
  ["quoted name", "export 'GIT''_CONFIG_PARAMETERS'=x; git push origin factory/T-001"], ["backslash", "G\\IT_DIR=x git push origin factory/T-001"],

]) expect(`dev push bypass: ${label}`, guard("factory-developer", "Bash", { command }), "deny");
// resolved by the parser: these push only the factory branch, so they are fine
for (const command of ["bash -ec 'git push origin factory/T-001'", "bash <<< 'git push origin factory/T-001'", "env FOO=1 git push origin factory/T-001", "nice git push origin factory/T-001", "sh -c 'git push origin factory/T-001'", "cd /tmp && git push origin factory/T-001"]) {
  expect(`dev push via wrapper, factory branch: ${command}`, guard("factory-developer", "Bash", { command }), "allow");
}
// false positives the raw-text matcher had (investigation 2026-10-15)
for (const [role, command] of [
  ["factory-qa", "pnpm install --frozen-lockfile"], ["factory-qa", "npx playwright install chromium"], ["factory-qa", 'grep -rn "rm -rf" scripts/'],
  ["factory-qa", "grep -n 'touch' x.ts"], ["factory-qa", "awk -F, '$3 > 5' data.csv"], ["factory-qa", "node -e 'console.log(1 > 0)'"],
  ["factory-qa", "git log --format='%h > %s' -5"], ["factory-qa", "gh pr diff 31 | grep -n 'cp '"], ["factory-code-reviewer", 'git log -p -S"git push" -- scripts/'],
  ["factory-security", "grep -rn 'GIT_DIR' scripts/"], ["factory-developer", 'git commit -m "feat(notifications): push toasts to the panel"'],
  ["factory-developer", 'git commit -m "docs: explain the git push hook"'], ["factory-analyst", "grep -rn 'install' package.json"], ["factory-qa", "find . -name '*.test.ts' -newer x"], ["factory-qa", "git worktree list"], ["factory-qa", "git rev-parse --short HEAD"], ["factory-qa", "git -C ../qa-T-001 log -1"],
]) expect(`no false positive: ${role} ${command}`, guard(role, "Bash", { command }), "allow");
expect("qa find -delete", guard("factory-qa", "Bash", { command: "find . -name x -delete" }), "deny");
expect("qa find -exec rm", guard("factory-qa", "Bash", { command: "find . -name x -exec rm {} +" }), "deny");
expect("qa node fs write", guard("factory-qa", "Bash", { command: "node -e 'require(\"fs\").writeFileSync(\"a\",\"b\")'" }), "deny");
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
