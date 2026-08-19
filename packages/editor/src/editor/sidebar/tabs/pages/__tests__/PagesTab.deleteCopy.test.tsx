/**
 * What the two page-delete confirms in the Pages panel promise.
 *
 * The bulk one said "This cannot be undone." Bulk delete is the same
 * `deletePage` call in a loop and the loop lands in ONE history entry —
 * measured in the running editor: selected two pages, deleted them, pressed
 * ⌘Z once, both came back. Telling a user an action is irreversible when it is
 * not is the expensive direction to be wrong in.
 *
 * The single one said "permanently removed … you can undo immediately after",
 * which contradicts itself and points at a toast this door never raises (only
 * the page-tab bar does).
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "..", "PagesTab.tsx"), "utf8");
const messages = [...src.matchAll(/message=(?:"([^"]+)"|\{`([\s\S]+?)`\})/g)].map((m) =>
  (m[1] ?? m[2]).replace(/\$\{[\s\S]+?\}/g, "…").replace(/\s+/g, " ")
);

describe("Pages panel delete confirmations", () => {
  it("has both confirms", () => {
    expect(messages).toHaveLength(2);
  });

  it("never tells the user a page delete is irreversible", () => {
    expect(messages.join(" ")).not.toMatch(/cannot be undone|permanently removed/i);
  });

  it("names undo in both", () => {
    for (const m of messages) expect(m, m).toMatch(/undo/i);
  });

  it("tells the bulk case that one undo covers the whole batch", () => {
    const bulk = messages.find((m) => m.includes("removed from this site"));
    expect(bulk).toMatch(/One undo/i);
  });
});
