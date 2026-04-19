#!/usr/bin/env node
/**
 * DS V2 patch applier — reads docs/reviews/2026-04-20-ds-v1-shell-token-fix-list-v2.md,
 * applies rows filtered by table + confidence + file.
 *
 * Usage:
 *   node scripts/apply-ds-v2-patch.mjs --list                           # list all files with pending rows
 *   node scripts/apply-ds-v2-patch.mjs --file <rel/path> --preview      # print diff
 *   node scripts/apply-ds-v2-patch.mjs --file <rel/path> --apply        # write diff to disk
 *   node scripts/apply-ds-v2-patch.mjs --table 2 --file ... --preview   # Table 2 (site leaks)
 *
 * @license BSD-3-Clause
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const V2 = path.join(REPO_ROOT, "docs/reviews/2026-04-20-ds-v1-shell-token-fix-list-v2.md");

function args() {
  const a = process.argv.slice(2);
  return {
    list: a.includes("--list"),
    preview: a.includes("--preview"),
    apply: a.includes("--apply"),
    file: ((i) => i >= 0 ? a[i + 1] : null)(a.indexOf("--file")),
    table: ((i) => i >= 0 ? Number(a[i + 1]) : 1)(a.indexOf("--table")),
    confidence: ((i) => i >= 0 ? a[i + 1] : "HIGH")(a.indexOf("--confidence")),
  };
}

function parseTable(tableNumber) {
  const lines = fs.readFileSync(V2, "utf8").split("\n");
  const header = tableNumber === 1
    ? "## Table 1 — Shell consumers to fix"
    : "## Table 2 — Site code reading shell tokens (inverse leak)";
  const idx = lines.findIndex((l) => l.trim() === header);
  if (idx < 0) throw new Error(`Table ${tableNumber} header not found`);

  const rows = [];
  for (let i = idx + 3; i < lines.length; i++) {
    const ln = lines[i];
    if (!ln.startsWith("|")) break;
    const cells = ln.split("|").slice(1, -1).map((s) => s.trim());
    if (cells[0] === "---" || !/^\d+$/.test(cells[0])) continue;
    if (tableNumber === 1) {
      const [num, fileLine, token, category, replacement, notes, confidence] = cells;
      rows.push({ num, fileLine, token, category, replacement, notes, confidence });
    } else {
      const [num, fileLine, token, replacement, confidence, notes] = cells;
      rows.push({ num, fileLine, token, replacement, confidence: confidence || "HIGH", notes });
    }
  }
  return rows;
}

function filterApplyable(rows, confidence) {
  return rows.filter((r) => {
    if (r.confidence !== confidence) return false;
    if (r.category === "LOCAL_SHADOW") return false;
    if (r.replacement === "KEEP_LOCAL") return false;
    if (r.replacement.startsWith("<")) return false;
    return true;
  });
}

function groupByFile(rows) {
  const byFile = new Map();
  for (const r of rows) {
    const [rel, lineStr] = r.fileLine.split(":");
    if (!byFile.has(rel)) byFile.set(rel, []);
    byFile.get(rel).push({ ...r, line: Number(lineStr) });
  }
  return byFile;
}

function previewFile(rel, edits) {
  const abs = path.join(REPO_ROOT, rel);
  if (!fs.existsSync(abs)) return { ok: false, reason: "file not found", rel };

  const text = fs.readFileSync(abs, "utf8");
  const lines = text.split("\n");
  const newLines = [...lines];
  const changes = [];

  for (const edit of edits) {
    const idx = edit.line - 1;
    if (idx < 0 || idx >= newLines.length) {
      changes.push({ line: edit.line, status: "out-of-range" });
      continue;
    }
    const before = newLines[idx];
    const fromPattern = `var(${edit.token})`;
    const toPattern = `var(${edit.replacement})`;
    if (!before.includes(fromPattern)) {
      changes.push({ line: edit.line, status: "not-found", expected: fromPattern, snippet: before });
      continue;
    }
    const after = before.split(fromPattern).join(toPattern);
    newLines[idx] = after;
    changes.push({ line: edit.line, status: "ok", before, after });
  }

  return { ok: true, rel, abs, oldText: text, newText: newLines.join("\n"), changes };
}

function diff(result) {
  console.log(`\n--- ${result.rel}`);
  console.log(`+++ ${result.rel}`);
  for (const c of result.changes) {
    if (c.status === "ok") {
      console.log(`@@ ${c.line} @@`);
      console.log(`- ${c.before}`);
      console.log(`+ ${c.after}`);
    } else {
      console.log(`! ${c.line}: ${c.status}${c.expected ? ` (expected ${c.expected})` : ""}`);
    }
  }
  const okCount = result.changes.filter((c) => c.status === "ok").length;
  const skipCount = result.changes.length - okCount;
  console.log(`\n  ${okCount} applicable, ${skipCount} skipped`);
}

function main() {
  const opts = args();
  const rows = parseTable(opts.table);
  const applyable = filterApplyable(rows, opts.confidence);
  const byFile = groupByFile(applyable);

  if (opts.list) {
    for (const [rel, edits] of [...byFile.entries()].sort()) {
      console.log(`${edits.length.toString().padStart(4)}  ${rel}`);
    }
    console.log(`\nTotal files: ${byFile.size}  Total edits: ${applyable.length}`);
    return;
  }

  if (!opts.file) {
    console.error("Provide --file <path> or --list");
    process.exit(2);
  }

  const edits = byFile.get(opts.file);
  if (!edits || edits.length === 0) {
    console.error(`No pending edits for ${opts.file} in Table ${opts.table} / ${opts.confidence}`);
    process.exit(1);
  }

  const result = previewFile(opts.file, edits);
  if (!result.ok) {
    console.error(`ERROR ${result.reason}`);
    process.exit(1);
  }

  if (opts.preview) {
    diff(result);
    return;
  }

  if (opts.apply) {
    fs.writeFileSync(result.abs, result.newText);
    const okCount = result.changes.filter((c) => c.status === "ok").length;
    console.log(`APPLIED ${result.rel}: ${okCount} edits`);
    return;
  }

  console.error("Pass --preview or --apply");
  process.exit(2);
}

main();
