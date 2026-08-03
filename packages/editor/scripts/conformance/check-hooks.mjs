#!/usr/bin/env node
/**
 * Is the installed git hook the one this repo ships?
 *
 * ADVISORY. Always exits 0. This never blocks anything, and the reason is worth
 * stating plainly rather than discovering later.
 *
 * WHY IT CANNOT BE ENFORCEMENT
 * The plan originally called for "CI asserts the hook is installed". That does
 * not work, and believing it did would have been worse than not having it:
 *
 *   - `.git/hooks/` is not tracked by git and `actions/checkout` does not
 *     populate it, so CI's own checkout NEVER has the hook. A CI assertion
 *     would either always fail or be quietly skipped.
 *   - CI inspects its own working copy. It has no way to see whether a
 *     developer's laptop installed anything.
 *   - `git push --no-verify` bypasses the hook regardless.
 *
 * So hook installation is not something any automated check can guarantee. What
 * it CAN do is make drift visible on the machine where it matters, at the
 * moment it matters.
 *
 * WHY IT EXISTS ANYWAY
 * `install-git-hooks.sh` COPIES the script into `.git/hooks/`. It does not
 * link it. So the installed copy silently ages every time the tracked script
 * changes, and the new steps simply do not run. That is not hypothetical: it
 * happened on 2026-08-03, in this clone, minutes after the spec-age step was
 * added to the tracked hook — the installed copy predated it, so the check
 * would not have run at all until someone thought to re-install.
 *
 * A stale hook is the worst shape of gate failure: it reports success for
 * checks it is not running.
 *
 * @license BSD-3-Clause
 */
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const TRACKED = join(HERE, "..", "hooks", "pre-push");

/** Resolve the real hooks dir — worktrees and core.hooksPath both move it. */
const hooksDir = () => {
  try {
    const custom = execFileSync("git", ["config", "--get", "core.hooksPath"], {
      encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (custom) return custom;
  } catch { /* not configured — normal */ }
  try {
    const gitDir = execFileSync("git", ["rev-parse", "--git-path", "hooks"], {
      encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (gitDir) return gitDir;
  } catch { /* not a git repo */ }
  return null;
};

const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex").slice(0, 12);

const say = (msg) => console.log(`[hooks] ${msg}`);

if (!existsSync(TRACKED)) {
  say(`ADVISORY — no tracked hook at ${TRACKED}; nothing to compare.`);
  process.exit(0);
}

const dir = hooksDir();
if (!dir) {
  say("ADVISORY — not a git repo (or git unavailable); skipping.");
  process.exit(0);
}

const installed = join(dir, "pre-push");
if (!existsSync(installed)) {
  say(
    "ADVISORY — no pre-push hook installed in this clone.\n" +
    "        On a CI runner this is expected: .git/hooks is untracked and checkout does not populate it.\n" +
    "        On a developer machine it means the push-time gates (DS invariants, conformance spec\n" +
    "        freshness) are not running. Install: pnpm run hooks:install"
  );
  process.exit(0);
}

const a = sha(TRACKED), b = sha(installed);
if (a === b) {
  say(`OK — installed pre-push matches the tracked script (${a}).`);
  process.exit(0);
}

say(
  `ADVISORY — the installed pre-push hook has DRIFTED from the tracked script.\n` +
  `        tracked   ${TRACKED}  (${a})\n` +
  `        installed ${installed}  (${b})\n` +
  `        install-git-hooks.sh copies rather than links, so the installed copy ages\n` +
  `        whenever the tracked script gains a step — and the new step simply does not run,\n` +
  `        while the hook still reports success for everything it DOES run.\n` +
  `        Re-install: pnpm run hooks:install`
);
process.exit(0);
