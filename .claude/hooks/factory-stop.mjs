#!/usr/bin/env node
/**
 * SubagentStop — a factory agent may not finish without its evidence block.
 *
 * Each role ends its final message with a fixed block (see .claude/agents/*.md).
 * Missing fields → the agent is sent back once with the list of what is
 * missing. On the second stop (`stop_hook_active`) it is let through so it
 * cannot loop forever; the PM treats an incomplete block as FAIL.
 *
 * Non-factory agents (Explore, general-purpose, …) are never touched.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const VERDICT = (...allowed) => ["VERDICT (" + allowed.join(" | ") + ")", new RegExp(`^VERDICT:\\s*(${allowed.join("|")})\\b`, "m")];
const FIELD = (name) => [name, new RegExp(`^${name}:\\s*\\S`, "m")];
const CHECKS = ["CHECKS (one '- <line> → PASS|FAIL|NOT RUN' per done-condition)", /^CHECKS:\s*\n\s*- /m];

const REQUIRED = {
  "factory-analyst": [FIELD("TASK"), FIELD("SPEC"), FIELD("UI_CHANGE"), FIELD("GUARDED"), VERDICT("READY", "BLOCKED")],
  "factory-designer": [FIELD("TASK"), FIELD("DESIGN"), FIELD("CAPABILITIES_MAPPED"), VERDICT("READY", "BLOCKED")],
  "factory-developer": [FIELD("TASK"), FIELD("BRANCH"), FIELD("TESTS"), FIELD("DONE_CONDITION"), VERDICT("READY_FOR_QA", "BLOCKED")],
  "factory-qa": [FIELD("TASK"), FIELD("BRANCH"), CHECKS, VERDICT("PASS", "FAIL", "BLOCKED")],
  "factory-code-reviewer": [FIELD("TASK"), FIELD("PR"), FIELD("FINDINGS"), VERDICT("APPROVE", "CHANGES_REQUESTED")],
  "factory-security": [FIELD("TASK"), FIELD("SCOPE"), FIELD("FINDINGS"), VERDICT("PASS", "FAIL")],
  "design-guard-reviewer": [FIELD("TASK"), FIELD("READINESS"), VERDICT("PASS", "FAIL")],
};

let input;
try { input = JSON.parse(readFileSync(0, "utf8")); } catch { process.exit(0); }
const role = input.agent_type;
const rules = REQUIRED[role];
if (!rules) process.exit(0);

// design-guard-reviewer also runs outside the factory; only gate it when it was given a task.
const msg = String(input.last_assistant_message ?? "");
if (role === "design-guard-reviewer" && !/^TASK:/m.test(msg) && !/\bT-\d{3,}\b/.test(msg)) process.exit(0);

const missing = rules.filter(([, re]) => !re.test(msg)).map(([name]) => name);

// Files the block points at must exist — a SPEC/DESIGN path that is not on disk is a claim, not output.
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
for (const key of ["SPEC", "DESIGN"]) {
  const m = msg.match(new RegExp(`^${key}:\\s*(\\S+)`, "m"));
  if (m && !existsSync(join(input.cwd || root, m[1])) && !existsSync(join(root, m[1]))) missing.push(`${key} (path not found: ${m[1]})`);
}
if (role === "factory-developer" && /VERDICT:\s*READY_FOR_QA/.test(msg) && !/^PR:\s*https:\/\/github\.com\/\S+\/pull\/\d+/m.test(msg)) {
  missing.push("PR (READY_FOR_QA needs the pull request URL)");
}

if (missing.length === 0 || input.stop_hook_active) process.exit(0);

process.stdout.write(JSON.stringify({
  decision: "block",
  reason: `[factory] ${role} cannot finish yet — the final message is missing: ${missing.join(", ")}. ` +
    `End with the exact evidence block from .claude/agents/${role}.md. If the work could not be done, say so with VERDICT: BLOCKED (or FAIL) and why.`,
}));
process.exit(0);
