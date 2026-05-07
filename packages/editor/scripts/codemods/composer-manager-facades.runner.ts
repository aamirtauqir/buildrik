/**
 * D3 codemod dry-run runner.
 *
 * Walks `packages/editor/src/**` (skipping codemod-skip rules + Composer.ts),
 * applies the composer-manager-facades transform in-memory, and emits a
 * report:
 *
 *   - per-rename count (cmsManager: N sites, drag: M sites, ...)
 *   - per-file change list (file path → array of [old, new] snippets)
 *   - total touched files / lines
 *   - timestamp + commit hash for traceability
 *
 * No code is written to disk in dry-run mode (default). Pass `--apply` to
 * actually rewrite files.
 *
 * @license BSD-3-Clause
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { glob } from "glob";
import jscodeshift from "jscodeshift";
import type { FileInfo, API } from "jscodeshift";
import transform, { RENAME_MAP } from "./composer-manager-facades";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const editorRoot = resolve(__dirname, "../..");
const srcRoot = resolve(editorRoot, "src");

const apply = process.argv.includes("--apply");

interface FileChange {
  path: string;
  /** Diff snippets, line-paired. */
  diff: { line: number; before: string; after: string }[];
}

interface Report {
  generatedAt: string;
  commit: string;
  apply: boolean;
  totals: {
    filesScanned: number;
    filesChanged: number;
    sitesChanged: number;
    perRule: Record<string, number>;
  };
  changes: FileChange[];
}

function getCommit(): string {
  // execFileSync — no shell, no injection surface. Args are hardcoded.
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: editorRoot,
    })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

function lineDiff(before: string, after: string): FileChange["diff"] {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const out: FileChange["diff"] = [];
  const max = Math.max(beforeLines.length, afterLines.length);
  for (let i = 0; i < max; i++) {
    const b = beforeLines[i] ?? "";
    const a = afterLines[i] ?? "";
    if (b !== a) out.push({ line: i + 1, before: b.trim(), after: a.trim() });
  }
  return out;
}

// Count occurrences per rule by simple regex on the original source — gives
// a per-rule tally even if the AST transform conflates renames.
function countPerRule(source: string): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const oldName of Object.keys(RENAME_MAP)) {
    // Match `composer.<name>` or `this.<name>` followed by a non-identifier char.
    const re = new RegExp(
      `(?:composer|this)\\.${oldName}(?![A-Za-z0-9_$])`,
      "g",
    );
    const matches = source.match(re);
    if (matches) tally[oldName] = matches.length;
  }
  return tally;
}

async function main() {
  const files = await glob("**/*.{ts,tsx}", {
    cwd: srcRoot,
    absolute: true,
    ignore: [
      "**/*.d.ts",
      "**/__tests__/**",
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "**/preview/**",
    ],
  });

  const report: Report = {
    generatedAt: new Date().toISOString(),
    commit: getCommit(),
    apply,
    totals: {
      filesScanned: files.length,
      filesChanged: 0,
      sitesChanged: 0,
      perRule: {},
    },
    changes: [],
  };

  const j = jscodeshift.withParser("tsx");
  const api: API = {
    jscodeshift: j,
    j,
    stats: () => {},
    report: () => {},
  };

  for (const absPath of files) {
    let source: string;
    try {
      source = readFileSync(absPath, "utf8");
    } catch {
      continue;
    }

    const file: FileInfo = { path: absPath, source };
    let result: string | undefined | null;
    try {
      result = transform(file, api, {}) as string | undefined | null;
    } catch (err) {
      console.error(`[codemod] PARSE FAILED: ${absPath}\n  ${err}`);
      continue;
    }

    if (typeof result !== "string" || result === source) continue;

    const relPath = relative(editorRoot, absPath);
    const diff = lineDiff(source, result);
    if (diff.length === 0) continue;

    const ruleHits = countPerRule(source);
    for (const [name, count] of Object.entries(ruleHits)) {
      report.totals.perRule[name] = (report.totals.perRule[name] ?? 0) + count;
    }
    report.totals.filesChanged += 1;
    report.totals.sitesChanged += diff.length;
    report.changes.push({ path: relPath, diff });

    if (apply) {
      writeFileSync(absPath, result, "utf8");
    }
  }

  const reportPath = resolve(
    editorRoot,
    "scripts/codemods/composer-manager-facades.dry-run.json",
  );
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("=== D3 codemod dry-run ===");
  console.log(`Commit:        ${report.commit}`);
  console.log(`Mode:          ${apply ? "APPLY (wrote files)" : "DRY-RUN"}`);
  console.log(`Files scanned: ${report.totals.filesScanned}`);
  console.log(`Files changed: ${report.totals.filesChanged}`);
  console.log(`Sites changed: ${report.totals.sitesChanged}`);
  console.log("Per-rule:");
  for (const [name, n] of Object.entries(report.totals.perRule).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${name.padEnd(20)} ${n}`);
  }
  console.log(`Report: ${relative(process.cwd(), reportPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
