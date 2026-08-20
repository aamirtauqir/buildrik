/**
 * A failed mirror offers the retry that exists.
 *
 * The version and component toasts said "It'll retry when you save the next
 * version / next edit a component, or reconnect". `SyncRetryQueue.run` replays
 * only the op it is handed, so a later save mirrors itself and leaves the
 * failed one queued — the promised trigger does not exist. Meanwhile
 * `retryVersionSync` / `retryComponentSync` were exported and called by nothing,
 * so the user's only real remedy was unreachable.
 *
 * Walked live for versions: blocked siteVersions.create with a 500, created a
 * version, got the toast, un-blocked, pressed Retry — and the version appeared
 * in site_versions on the server.
 *
 * @license BSD-3-Clause
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const version = readFileSync(join(__dirname, "../useVersionSync.ts"), "utf8");
const component = readFileSync(join(__dirname, "../useComponentSync.ts"), "utf8");
const cms = readFileSync(join(__dirname, "../useCmsSync.ts"), "utf8");
const queue = readFileSync(join(__dirname, "../../../../services/syncRetryQueue.ts"), "utf8");

describe("sync failure toasts", () => {
  it("all three offer Retry now", () => {
    for (const [name, src] of [["version", version], ["component", component], ["cms", cms]] as const) {
      expect(src, name).toMatch(/label: "Retry now"/);
    }
    expect(version).toMatch(/void retryVersionSync\(\)/);
    expect(component).toMatch(/void retryComponentSync\(\)/);
  });

  it("none promise that the next save flushes the queue", () => {
    /* The old sentences survive in the comments explaining why they went, so
       read the toast DESCRIPTION rather than the file. */
    const description = (src: string) =>
      src.slice(src.indexOf("description:"), src.indexOf("tone: \"error\""));
    expect(description(version)).not.toMatch(/retry when you save the next version/);
    expect(description(component)).not.toMatch(/retry when you next edit a component/);
    expect(description(version)).toMatch(/reconnect replays the queue/);
    expect(description(component)).toMatch(/reconnect replays the queue/);
  });

  it("…because run() replays a single op, not the queue", () => {
    const run = queue.slice(queue.indexOf("async run("), queue.indexOf("/** Replay every queued op"));
    expect(run).toMatch(/this\.queue\.set\(key/);
    expect(run).not.toMatch(/this\.retry\(\)/);
  });
});
