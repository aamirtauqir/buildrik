/**
 * The Submissions inbox and the editor's Forms screen agree.
 *
 * The empty state said "Submissions from your published site will appear here",
 * while the editor's Settings → Forms screen says the opposite in its own copy:
 * a Form block exports with no action and no submit script, so a published page
 * posts nowhere and `/api/public/forms/[siteId]/[formBlockId]` is never called.
 * Two screens in one product, opposite claims — the dashboard one was the
 * hopeful half.
 *
 * @license BSD-3-Clause
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const panel = readFileSync(join(__dirname, "../submissions-panel.tsx"), "utf8");
const formsScreen = readFileSync(
  join(__dirname, "../../../../editor/src/editor/sidebar/tabs/settings/screens/FormsScreen.tsx"),
  "utf8",
);

describe("submissions empty state", () => {
  it("no longer promises that published forms land here", () => {
    /* The old sentence survives inside the comment that explains why it went,
       so match the RENDERED string, not the file. */
    const rendered = panel.slice(panel.indexOf("filterFormBlockId"));
    expect(rendered).not.toMatch(/: "Submissions from your published site will appear here"/);
  });

  it("says capture isn't wired yet — in BOTH empty states", () => {
    // The table's empty state (forms exist, no rows) …
    expect(panel).toMatch(/wired up yet\. Rows here come from/);
    // … and the no-forms-at-all state, which used to send people to the editor
    // to "start collecting submissions".
    expect(panel).toMatch(/renders on a published page, but capturing/);
    expect(panel).not.toMatch(/> *Add a form block in the editor to start collecting submissions\./);
  });

  it("the page header does not claim published pages feed it", () => {
    const header = readFileSync(
      join(__dirname, "../../../app/dashboard/sites/[id]/feedback/page.tsx"),
      "utf8",
    );
    expect(header).not.toMatch(/description="Form entries captured from your published site\."/);
    expect(header).toMatch(/form endpoint/);
  });

  it("still matches what the editor's Forms screen tells the same user", () => {
    expect(formsScreen).toMatch(/not captured yet/i);
  });
});
