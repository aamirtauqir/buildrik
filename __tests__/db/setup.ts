/**
 * D-14a — Postgres-backed test tier, global setup.
 *
 * Runs once before every `*.db.test.ts` file (vitest.db.config.ts). Vitest
 * runs `globalSetup` in the main process, before test-file workers are
 * spawned, so mutating `process.env` here is the documented way to hand
 * values to those workers (they inherit process.env at spawn time).
 *
 * This is the ONLY place DATABASE_URL is allowed to change for this test
 * tier: `@/lib/prisma`'s singleton reads `process.env.DATABASE_URL` when it
 * is constructed, so the env var must be correct before any test file (or a
 * module it imports, transitively) pulls in `@/lib/prisma`.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

/**
 * Unlike Next.js, plain `vitest` never loads `.env.local`. Dev's DATABASE_URL
 * (the source `resolveTestDatabaseUrl` derives `buildrik_test` from) lives
 * there. CI sets DATABASE_URL directly via the workflow env, so this is a
 * no-op when it's already set.
 */
function loadLocalEnvIfNeeded(): void {
  if (process.env.DATABASE_URL || process.env.DATABASE_URL_TEST) return;
  for (const file of [".env.local", ".env"]) {
    const full = path.resolve(process.cwd(), file);
    if (!existsSync(full)) continue;
    process.loadEnvFile(full);
    if (process.env.DATABASE_URL || process.env.DATABASE_URL_TEST) return;
  }
}

function assertLocalHost(url: URL): void {
  if (!LOCAL_HOSTS.has(url.hostname)) {
    throw new Error(
      `D-14a test DB guard: refusing to run against host "${url.hostname}". ` +
        `DATABASE_URL_TEST (or DATABASE_URL, used to derive it) must point at ` +
        `localhost or 127.0.0.1 — never a remote/production database.`,
    );
  }
}

/** DATABASE_URL_TEST if set, otherwise DATABASE_URL with the path swapped to /buildrik_test. */
function resolveTestDatabaseUrl(): URL {
  const explicit = process.env.DATABASE_URL_TEST;
  if (explicit) return new URL(explicit);

  const devUrl = process.env.DATABASE_URL;
  if (!devUrl) {
    throw new Error(
      "D-14a test DB guard: neither DATABASE_URL_TEST nor DATABASE_URL is set — " +
        "cannot derive a test database URL.",
    );
  }
  const url = new URL(devUrl);
  url.pathname = "/buildrik_test";
  return url;
}

function isDuplicateDatabaseError(err: unknown): boolean {
  const meta = (err as { meta?: { code?: string } } | undefined)?.meta;
  const code = (err as { code?: string } | undefined)?.code;
  // Postgres 42P04 = duplicate_database. Prisma's raw-query error surfaces
  // the driver code in `meta.code` (wrapped as a Prisma P2010), and some
  // driver paths surface it directly as `.code`.
  return meta?.code === "42P04" || code === "42P04";
}

async function ensureDatabaseExists(testUrl: URL): Promise<void> {
  const dbName = testUrl.pathname.replace(/^\//, "");
  const adminUrl = new URL(testUrl.toString());
  adminUrl.pathname = "/postgres";

  const admin = new PrismaClient({ datasourceUrl: adminUrl.toString() });
  try {
    await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
  } catch (err) {
    if (!isDuplicateDatabaseError(err)) throw err;
  } finally {
    await admin.$disconnect();
  }
}

export default async function setup(): Promise<void> {
  loadLocalEnvIfNeeded();
  const testUrl = resolveTestDatabaseUrl();
  assertLocalHost(testUrl);

  await ensureDatabaseExists(testUrl);

  const testUrlString = testUrl.toString();
  process.env.DATABASE_URL = testUrlString;

  execSync("npx prisma migrate deploy", {
    cwd: process.cwd(),
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testUrlString },
  });
}
