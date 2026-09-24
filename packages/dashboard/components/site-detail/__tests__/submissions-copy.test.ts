/**
 * The Submissions inbox and the editor's Forms screen agree.
 *
 * Both once said capture wasn't wired: a Form block exported with no action,
 * so a published page posted nowhere. Since a10f19233 the publish worker points
 * every action-less form at `/api/public/forms/[siteId]/[formBlockId]`, so both
 * screens now say submissions arrive here — the same sentence, in both places.
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

  it("says published Form blocks feed this inbox — in BOTH empty states", () => {
    // The no-forms-at-all state and the table's empty state (forms exist, no rows).
    expect(panel.match(/Publish a page with a Form block and its submissions arrive here\./g)).toHaveLength(2);
    expect(panel).not.toMatch(/wired up yet/);
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
    expect(formsScreen).toMatch(/Publish a page with a Form block and its submissions arrive here\./);
  });
});
