#!/usr/bin/env node
/**
 * SessionStart (startup | resume | compact) — put the factory rules and the
 * open tasks back in front of the PM.
 *
 * Long sessions lose instructions at compaction; this is what restores them.
 * The task list comes from disk (docs/factory/tasks/<ID>/task.md), so the job
 * survives even when the chat that started it does not.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

let input = {};
try { input = JSON.parse(readFileSync(0, "utf8")); } catch { /* still useful without input */ }
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const dir = join(root, "docs/factory/tasks");

const open = [];
if (existsSync(dir)) {
  for (const id of readdirSync(dir).filter((d) => /^T-\d+$/.test(d)).sort()) {
    const file = join(dir, id, "task.md");
    if (!existsSync(file)) continue;
    const text = readFileSync(file, "utf8");
    const status = text.match(/^- \*\*Status:\*\*\s*([a-z-]+)/m)?.[1] ?? "unknown";
    if (status === "merged") continue;
    const title = text.match(/^#\s+(.+)$/m)?.[1] ?? id;
    const owner = text.match(/^- \*\*Stage owner:\*\*\s*(.+)$/m)?.[1] ?? "?";
    open.push(`- ${title} — status: ${status}, owner: ${owner} (docs/factory/tasks/${id}/task.md)`);
  }
}

const rulesFile = join(root, "docs/factory/RULES.md");
const rules = existsSync(rulesFile) ? readFileSync(rulesFile, "utf8").trim() : "";
const source = input.source ?? "startup";

const parts = [];
if (source === "compact" || source === "resume") parts.push(rules);
parts.push(open.length
  ? `Open factory tasks (from disk):\n${open.join("\n")}\nIf you were working on one, re-read its task.md before the next step; do not start new work until the founder asks.`
  : "No open factory tasks in docs/factory/tasks/.");

process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: parts.join("\n\n") },
}));
