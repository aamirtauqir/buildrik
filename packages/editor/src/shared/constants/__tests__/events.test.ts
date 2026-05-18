/**
 * Regression test for the EVENTS constants.
 *
 * Two invariants:
 *   1. No duplicate KEYS — vite warns on these but TS doesn't catch the
 *      object-literal shadow. C2 cleaned 3 such dupes; this asserts they
 *      stay gone.
 *   2. No duplicate VALUES — different keys mapped to the same emitted
 *      string make subscribers indistinguishable. C2-followup cleaned 3
 *      unused dupes; one remaining (SYNC_ERROR ↔ COLLAB_SYNC_ERROR) is
 *      a known collision documented in events.ts itself.
 *
 * Run: `npx vitest run src/shared/constants/__tests__/events.test.ts`
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it } from "vitest";
import { EVENTS } from "../events";

// Cloud-sync stack removed; SyncManager no longer emits "sync:error", so the
// COLLAB_SYNC_ERROR/SYNC_ERROR collision is gone. Set kept for future entries.
const KNOWN_COLLISIONS = new Set<string>([]);

describe("EVENTS constants invariants", () => {
  it("has no duplicate keys", () => {
    // JS objects can't have literal duplicate keys at runtime (the second wins),
    // but the source file CAN. Read it as text to catch source-level dupes
    // that vite warns about.
    const fs = require("node:fs") as typeof import("node:fs");
    const path = require("node:path") as typeof import("node:path");
    const src = fs.readFileSync(
      path.resolve(__dirname, "../events.ts"),
      "utf8",
    );
    // Match `KEY: "value"` form, capturing the key name.
    const keyMatches = src.match(/^\s+([A-Z_][A-Z0-9_]*):\s*"/gm) ?? [];
    const keys = keyMatches.map((m) => m.trim().split(":")[0].trim());

    const counts = new Map<string, number>();
    for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1);
    const dupes = [...counts.entries()].filter(([, c]) => c > 1);

    expect(dupes).toEqual([]);
  });

  it("has no duplicate values (except documented known collisions)", () => {
    const valueCounts = new Map<string, string[]>();
    for (const [key, value] of Object.entries(EVENTS)) {
      const v = value as string;
      const existing = valueCounts.get(v) ?? [];
      existing.push(key);
      valueCounts.set(v, existing);
    }

    const collisions = [...valueCounts.entries()]
      .filter(([, keys]) => keys.length > 1)
      .filter(([value]) => !KNOWN_COLLISIONS.has(value));

    expect(collisions).toEqual([]);
  });
});
