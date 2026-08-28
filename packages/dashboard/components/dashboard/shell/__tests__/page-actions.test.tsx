/**
 * The failure mode a portal has and a prop does not: silence.
 *
 * `PageHeaderActions` renders into a DOM node the settings layout puts inside
 * `PageHeader actions`. Nothing connects the two but a string id, so if the
 * layout stops rendering the slot — a refactor, a conditional, a rename — the
 * Team, Plans, Usage and Billing action rows do not error and do not warn.
 * They just stop existing. That is the shape this repo has been bitten by
 * before: a finished surface with no door.
 *
 * These tests hold the two ends of that string together.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { PageHeaderActionsSlot, PageHeaderActions } from "../page-actions";

const DASHBOARD_ROOT = path.resolve(__dirname, "../../../..");
const read = (rel: string) => readFileSync(path.join(DASHBOARD_ROOT, rel), "utf-8");

/** Pages that put their actions on the settings layout's title row. */
const PORTAL_CONSUMERS = [
  "app/dashboard/settings/team/page.tsx",
  "app/dashboard/settings/plans/page.tsx",
  "app/dashboard/settings/usage/page.tsx",
  "app/dashboard/settings/billing/page.tsx",
];

describe("page header actions slot", () => {
  it("the settings layout renders the slot, or every consumer goes silent", () => {
    const layout = read("app/dashboard/settings/layout.tsx");
    expect(layout).toContain("PageHeaderActionsSlot");
    expect(layout, "the slot must be passed to PageHeader's actions prop").toMatch(
      /actions=\{<PageHeaderActionsSlot\s*\/>\}/,
    );
  });

  it("the slot and the portal agree on the id", () => {
    const { container } = render(<PageHeaderActionsSlot />);
    const slotId = container.firstElementChild?.id;
    expect(slotId, "the slot rendered no id").toBeTruthy();
    // The portal targets the same constant; if someone splits them into two
    // literals this catches it.
    expect(read("components/dashboard/shell/page-actions.tsx")).toContain(`SLOT_ID = "${slotId}"`);
  });

  it("renders its children into the slot, not where it sits", () => {
    render(
      <div>
        <header data-testid="header">
          <PageHeaderActionsSlot />
        </header>
        <main data-testid="body">
          <PageHeaderActions>
            <button>Invite</button>
          </PageHeaderActions>
        </main>
      </div>,
    );
    expect(screen.getByTestId("header")).toContainElement(screen.getByRole("button", { name: "Invite" }));
    expect(screen.getByTestId("body")).not.toContainElement(screen.getByRole("button", { name: "Invite" }));
  });

  it("renders nothing at all when no slot exists, rather than throwing", () => {
    const { container } = render(
      <PageHeaderActions>
        <button>Invite</button>
      </PageHeaderActions>,
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("button", { name: "Invite" })).toBeNull();
  });

  it("every consumer still goes through the portal, not a band of its own", () => {
    for (const rel of PORTAL_CONSUMERS) {
      const src = read(rel);
      expect(src, `${rel} no longer uses PageHeaderActions`).toContain("<PageHeaderActions>");
      expect(src, `${rel} imports it`).toContain('from "@/components/dashboard/shell/page-actions"');
    }
  });
});
