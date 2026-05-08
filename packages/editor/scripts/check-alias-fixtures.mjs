#!/usr/bin/env node
/**
 * gate:ds-alias — enforce that every documented alias-error category
 * has a matching fixture under
 *   src/engine/aliasResolver/__fixtures__/.
 *
 * Required fixtures (one per category):
 *   - valid-alias.json
 *   - cycle-2-node.json
 *   - cycle-3-node.json
 *   - depth-2.json
 *
 * Add a new category? Add the fixture file and append it here.
 *
 * Run from packages/editor/ via `pnpm run gate:ds-alias`.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const REQUIRED = [
  "valid-alias.json",
  "cycle-2-node.json",
  "cycle-3-node.json",
  "depth-2.json",
];

const root = resolve(
  process.cwd(),
  "src/engine/aliasResolver/__fixtures__"
);

const missing = REQUIRED.filter((f) => !existsSync(resolve(root, f)));

if (missing.length > 0) {
  console.error(
    `[gate:ds-alias] missing alias fixtures in ${root}:\n  ${missing.join("\n  ")}`
  );
  process.exit(1);
}

console.log(`[gate:ds-alias] OK — ${REQUIRED.length} fixtures present`);
