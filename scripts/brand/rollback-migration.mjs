#!/usr/bin/env node
// Operator-only: roll a site's brand tokens back to its pre-migration snapshot
// and hold it (no re-migration until cleared). Usage:
//   npx tsx --tsconfig packages/dashboard/tsconfig.json scripts/brand/rollback-migration.mjs <siteId>            # rollback + hold
//   npx tsx --tsconfig packages/dashboard/tsconfig.json scripts/brand/rollback-migration.mjs <siteId> --dry-run  # print the snapshot, write nothing
//   npx tsx --tsconfig packages/dashboard/tsconfig.json scripts/brand/rollback-migration.mjs <siteId> --clear    # clear the hold
import { fileURLToPath } from "node:url";

const USAGE = "usage: rollback-migration.mjs <siteId> [--dry-run | --clear]";

/** Returns the process exit code. `loadSvc` is injected so the argument
 *  handling and dry-run are testable without a database, and so a bad
 *  invocation exits before the service (and Prisma) is even loaded. */
export async function main(argv, loadSvc, log = console) {
  const [siteId, flag, extra] = argv;
  if (!siteId || siteId.startsWith("--") || extra !== undefined || (flag !== undefined && flag !== "--dry-run" && flag !== "--clear")) {
    log.error(USAGE);
    return 2;
  }
  try {
    return await run(await loadSvc(), siteId, flag, log);
  } catch (e) {
    log.error(e instanceof Error ? e.message : String(e));
    return 1;
  }
}

async function run(svc, siteId, flag, log) {
  if (flag === "--clear") {
    await svc.clearTokenMigrationHold(siteId);
    log.log(`hold cleared for ${siteId}`);
    return 0;
  }
  if (flag === "--dry-run") {
    const snap = await svc.getLatestMigrationSnapshot(siteId);
    if (!snap) {
      log.log(`dry run: ${siteId} has no migration snapshot; a rollback would fail`);
      return 1;
    }
    log.log(
      `dry run: would restore snapshot ${snap.id} (created ${snap.createdAt.toISOString()}, ` +
        `tokens v${snap.tokensSchemaVersion}, ${snap.tokenCount} tokens) and set the hold; nothing written`,
    );
    return 0;
  }
  const r = await svc.rollbackTokenMigration(siteId);
  log.log(`rolled back ${siteId} to tokens v${r.restoredVersion}; hold set`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(await main(process.argv.slice(2), () => import("../../server/services/theme.service.ts")));
}
