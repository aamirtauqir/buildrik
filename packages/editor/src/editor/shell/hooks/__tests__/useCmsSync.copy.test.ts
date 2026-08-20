/**
 * The CMS-sync failure toast counts and promises correctly.
 *
 * Read off the live toast after breaking the mirror with a 500: "1 CMS change
 * ARE saved on this device but not yet on the server. They'll retry
 * automatically when you're back online." Two problems in one sentence — the
 * noun pluralised while the verb did not, and the automatic retry only fires on
 * a reconnect (`syncRetryQueue` listens for 'online'), which never comes if the
 * server errored while you were online. The Retry button is the actual remedy.
 *
 * @license BSD-3-Clause
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(join(__dirname, "../useCmsSync.ts"), "utf8");
const description = src.slice(src.indexOf("description:"), src.indexOf("tone: \"error\""));

describe("cms sync failure toast", () => {
  it("agrees with itself about number", () => {
    expect(description).toMatch(/pending === 1 \? " is" : "s are"/);
    expect(description).not.toMatch(/change\$\{pending === 1 \? "" : "s"\} are/);
  });

  it("does not promise an automatic retry that only a reconnect triggers", () => {
    expect(description).not.toMatch(/retry automatically when you're back online/);
    expect(description).toMatch(/Retry now/);
    expect(description).toMatch(/reconnect replays the queue/);
  });

  it("still says where the change IS — on the device, which is true for CMS", () => {
    expect(description).toMatch(/saved on this device/);
  });
});
