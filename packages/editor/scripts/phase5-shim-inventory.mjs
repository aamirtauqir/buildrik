#!/usr/bin/env node
/**
 * Phase 5 shim inventory — barrel-aware consumer audit.
 *
 * For every shim file under packages/editor/src/shared/ui/ tagged with the
 * `PHASE 5 DELETE` marker, report consumers across the FULL editor src/ tree
 * (not just src/editor/). Counts BOTH:
 *   - Direct path imports — both `from "@/shared/ui/{Name}"` and the relative
 *     form (any depth of `../`) ending in `shared/ui/{Name}`.
 *   - Barrel re-exports in `src/shared/ui/index.{ts,tsx}` of the shim symbol
 *     (a barrel export with no consumers is still a "consumer" of the shim
 *     because deletion would break `import { X } from "@/shared/ui"` callsites
 *     resolving via the barrel).
 *
 * Why this exists: T2.B.1 Badge deletion (commit a8f8216) was rolled back in
 * e288230 because the "0 consumers" check looked only at direct paths inside
 * src/editor/ and missed barrel consumers in src/ai/ + src/templates/. Gate 20
 * (in ds-grep-gates.sh) now blocks barrel-import regression; this script gives
 * codemods a programmatic way to verify a shim is truly safe to delete.
 *
 * Output (JSON, machine-readable):
 *   {
 *     "scanRoot": "packages/editor/src",
 *     "shims": [
 *       {
 *         "name": "Badge",
 *         "path": "packages/editor/src/shared/ui/Badge.tsx",
 *         "directConsumers": [{ "file": "...", "line": N }, ...],
 *         "barrelReExport": true | false,
 *         "totalConsumers": N,
 *         "safeToDelete": false
 *       },
 *       ...
 *     ],
 *     "totalShims": N,
 *     "shimsSafeToDelete": N
 *   }
 *
 * Filters (skipped from consumer scan):
 *   - The shim file itself
 *   - shared/vibcoder/ (re-export indirection)
 *   - __tests__/ + *.test.{ts,tsx}
 *   - preview/ (gallery code)
 *   - The barrel index files (counted separately as `barrelReExport`)
 *
 * Usage:
 *   node packages/editor/scripts/phase5-shim-inventory.mjs            # JSON
 *   node packages/editor/scripts/phase5-shim-inventory.mjs --pretty   # human-readable
 *   node packages/editor/scripts/phase5-shim-inventory.mjs --shim=Badge  # single shim
 *   node packages/editor/scripts/phase5-shim-inventory.mjs --strict   # exit 1 if any non-zero
 *
 * @license BSD-3-Clause
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, basename, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..", "..");
const EDITOR_SRC = join(REPO_ROOT, "packages", "editor", "src");
const SHIM_DIR = join(EDITOR_SRC, "shared", "ui");
const BARREL_INDEX_TS = join(SHIM_DIR, "index.ts");
const BARREL_INDEX_TSX = join(SHIM_DIR, "index.tsx");

const args = process.argv.slice(2);
const PRETTY = args.includes("--pretty");
const STRICT = args.includes("--strict");
const SHIM_FILTER = args.find((a) => a.startsWith("--shim="))?.slice("--shim=".length);

const SKIP_DIRS = new Set(["node_modules", "dist", "__tests__", "preview"]);
const SKIP_PATH_PARTS = ["/shared/vibcoder/"];
const SKIP_FILE_REGEX = /\.(test|spec)\.(ts|tsx)$/;

function walk(root) {
  const out = [];
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      out.push(...walk(full));
    } else if (st.isFile()) {
      if (!/\.(ts|tsx)$/.test(entry)) continue;
      if (SKIP_FILE_REGEX.test(entry)) continue;
      if (SKIP_PATH_PARTS.some((p) => full.includes(p))) continue;
      out.push(full);
    }
  }
  return out;
}

function findShims() {
  const shims = [];
  for (const entry of readdirSync(SHIM_DIR)) {
    if (!entry.endsWith(".tsx")) continue;
    const full = join(SHIM_DIR, entry);
    let src;
    try {
      src = readFileSync(full, "utf8");
    } catch {
      continue;
    }
    if (!src.includes("PHASE 5 DELETE")) continue;
    const name = basename(entry, ".tsx");
    if (SHIM_FILTER && name !== SHIM_FILTER) continue;
    shims.push({ name, path: full });
  }
  return shims;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectDirectConsumers(shimName, allFiles, shimPath) {
  const escaped = escapeRegex(shimName);
  const directPath = new RegExp(
    `from\\s+["'](?:@/shared/ui/${escaped}|(?:\\.\\./)+shared/ui/${escaped})["']`,
  );
  const out = [];
  for (const file of allFiles) {
    if (file === shimPath) continue;
    if (file === BARREL_INDEX_TS || file === BARREL_INDEX_TSX) continue;
    let src;
    try {
      src = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const lines = src.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (directPath.test(lines[i])) {
        out.push({ file: relative(REPO_ROOT, file), line: i + 1 });
      }
    }
  }
  return out;
}

function detectBarrelReExport(shimName) {
  const escaped = escapeRegex(shimName);
  // Match: export { Name, ... } from "./Name"
  // OR:    export { Name, type NameProps } from "./Name"
  // OR:    export * from "./Name"
  const reExport = new RegExp(
    `(export\\s*\\{[^}]*\\b${escaped}\\b[^}]*\\}\\s*from\\s*["']\\./${escaped}["'])` +
      `|(export\\s*\\*\\s*from\\s*["']\\./${escaped}["'])`,
  );
  for (const idx of [BARREL_INDEX_TS, BARREL_INDEX_TSX]) {
    if (!existsSync(idx)) continue;
    let src;
    try {
      src = readFileSync(idx, "utf8");
    } catch {
      continue;
    }
    if (reExport.test(src)) return true;
  }
  return false;
}

function main() {
  const shims = findShims();
  if (shims.length === 0) {
    const empty = {
      scanRoot: relative(REPO_ROOT, EDITOR_SRC),
      shims: [],
      totalShims: 0,
      shimsSafeToDelete: 0,
      ...(SHIM_FILTER && { filter: SHIM_FILTER, note: `no PHASE 5 DELETE shim named "${SHIM_FILTER}"` }),
    };
    process.stdout.write(JSON.stringify(empty, null, 2) + "\n");
    process.exit(SHIM_FILTER ? 1 : 0);
  }

  const allFiles = walk(EDITOR_SRC);
  const report = shims.map((shim) => {
    const directConsumers = detectDirectConsumers(shim.name, allFiles, shim.path);
    const barrelReExport = detectBarrelReExport(shim.name);
    const totalConsumers = directConsumers.length + (barrelReExport ? 1 : 0);
    return {
      name: shim.name,
      path: relative(REPO_ROOT, shim.path),
      directConsumers,
      barrelReExport,
      totalConsumers,
      safeToDelete: totalConsumers === 0,
    };
  });

  const result = {
    scanRoot: relative(REPO_ROOT, EDITOR_SRC),
    shims: report,
    totalShims: report.length,
    shimsSafeToDelete: report.filter((s) => s.safeToDelete).length,
  };

  if (PRETTY) {
    console.log(`Phase 5 shim inventory — scanned ${result.scanRoot}`);
    console.log(`${result.totalShims} shims, ${result.shimsSafeToDelete} safe to delete`);
    console.log("");
    for (const s of report) {
      const flag = s.safeToDelete ? "[SAFE]" : "[BLOCKED]";
      const barrel = s.barrelReExport ? " barrel-export" : "";
      console.log(`${flag} ${s.name} — ${s.directConsumers.length} direct consumer(s)${barrel}`);
      if (s.directConsumers.length > 0) {
        for (const c of s.directConsumers) {
          console.log(`  ${c.file}:${c.line}`);
        }
      }
    }
  } else {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  }

  if (STRICT) {
    const blocked = report.filter((s) => !s.safeToDelete);
    if (blocked.length > 0) {
      process.stderr.write(
        `\nFAIL: ${blocked.length} shim(s) have consumers and cannot be deleted.\n`,
      );
      process.exit(1);
    }
  }
}

main();
