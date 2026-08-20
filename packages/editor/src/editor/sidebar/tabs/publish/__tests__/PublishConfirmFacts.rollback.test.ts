/**
 * The confirm step's rollback line has to match the retention.
 *
 * On a first publish it read "Every version stays restorable". Publish history
 * keeps twenty: `runPublishJob` nulls the stored payload on COMPLETED jobs
 * beyond the 20 most recent (PUBLISH_HISTORY_RETAINED), and `getPublishHistory`
 * marks a job rollbackable only when that payload survives. The Publish
 * History panel already tells the truth — "roll back to any of the last 20" —
 * so the two surfaces disagreed about the same guarantee.
 *
 * Read live from the wizard: step 2 showed "Rollback — Every version stays
 * restorable" on a site that had never been published.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const facts = readFileSync(join(__dirname, "..", "PublishConfirmFacts.tsx"), "utf8");
const history = readFileSync(
  join(__dirname, "..", "..", "..", "..", "shell", "PublishHistory.tsx"),
  "utf8"
);

describe("publish confirm — rollback line", () => {
  it("does not promise every version back", () => {
    const rendered = facts.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
    expect(rendered).not.toMatch(/Every version stays restorable/);
  });

  it("names the same retention the history panel does", () => {
    expect(facts).toMatch(/last 20 versions stay restorable/);
    expect(history).toMatch(/last 20/);
  });
});
