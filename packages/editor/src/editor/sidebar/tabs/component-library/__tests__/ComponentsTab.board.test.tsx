/**
 * Board 4418:142419 (Add › Manage components): a "‹  Add" back row, the
 * intro sentence, section headers with a count, rows without a chevron, and
 * "+ Create component" in the pinned footer.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants";
import { createMockComposer } from "../../../__tests__/test-utils/mockComposer";

vi.mock("@/services/componentSync", () => ({ fetchComponentLibrary: vi.fn(async () => []) }));

import { ComponentsTab } from "../../ComponentsTab";

const c = (id: string, name: string) => ({ id, name, masterTree: {}, createdAt: 1, updatedAt: 1, version: 1 }) as never;

function mount(components: never[]) {
  const composer = createMockComposer({ components });
  Object.assign(composer.components, { isAvailable: () => true, getInstancesOfComponent: () => new Array(6) });
  render(
    <ToastProvider>
      <ComponentsTab composer={composer as never} onCreateNew={vi.fn()} />
    </ToastProvider>,
  );
  return composer;
}

describe("ComponentsTab — board 4418:142419", () => {
  it("draws the back row, intro, counted section header and chevron-less rows", async () => {
    const composer = mount([c("hdr", "Site header"), c("ftr", "Footer")]);
    const back = await screen.findByTestId("comp-back-row");
    expect(back.textContent?.replace(/\s+/g, " ")).toBe("‹ Add");
    fireEvent.click(back);
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_SWITCH_TAB, { tab: "add" });

    expect(screen.getByTestId("comp-intro").textContent).toBe(
      "Manage saved masters for this site. Insert places an instance; edits to a master affect its instances.",
    );
    expect(screen.getByTestId("comp-section-header").textContent).toBe("YOUR COMPONENTS2");
    expect(screen.getByTestId("comp-row-hdr").textContent).toBe("Site header6 on this site");
    expect(screen.getByTestId("comp-footer").textContent).toBe("+ Create component");
  });

  it("the empty state keeps the back row too", async () => {
    mount([]);
    expect((await screen.findByTestId("comp-back-row")).textContent?.replace(/\s+/g, " ")).toBe("‹ Add");
  });
});
