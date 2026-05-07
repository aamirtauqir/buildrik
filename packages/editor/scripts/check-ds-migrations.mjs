#!/usr/bin/env node
/**
 * gate:ds-migrations — every file matching
 *   src/editor/design-system/migrations/projectMigrations/<NNNN>-*.ts
 * MUST have:
 *   __fixtures__/<NNNN>.before.json
 *   __fixtures__/<NNNN>.after.json
 * Otherwise the gate fails with a non-zero exit code.
 *
 * Run from packages/editor/ via `pnpm run gate:ds-migrations`.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(
  process.cwd(),
  "src/editor/design-system/migrations/projectMigrations"
);
const FIXTURE_DIR = path.join(ROOT, "__fixtures__");

if (!fs.existsSync(ROOT)) {
  console.error(`[gate:ds-migrations] FAIL — projectMigrations folder not found at ${ROOT}`);
  console.error(`(Are you running this from packages/editor/?)`);
  process.exit(1);
}

const migrationFiles = fs
  .readdirSync(ROOT)
  .filter((f) => /^\d{4}-.+\.ts$/.test(f) && !f.endsWith(".test.ts"));

const violations = [];
for (const file of migrationFiles) {
  const id = file.slice(0, 4);
  const before = path.join(FIXTURE_DIR, `${id}.before.json`);
  const after = path.join(FIXTURE_DIR, `${id}.after.json`);
  if (!fs.existsSync(before)) violations.push(`missing ${path.relative(process.cwd(), before)}`);
  if (!fs.existsSync(after)) violations.push(`missing ${path.relative(process.cwd(), after)}`);
}

if (violations.length > 0) {
  console.error("[gate:ds-migrations] FAIL");
  for (const v of violations) console.error(" -", v);
  process.exit(1);
}

console.log(`[gate:ds-migrations] PASS · ${migrationFiles.length} migration(s) verified`);
