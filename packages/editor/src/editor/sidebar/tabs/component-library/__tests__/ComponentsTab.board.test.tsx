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

  /* Board 4418:166980: a master made in this session is badged New. */
  it("badges a master created this session New, and only that one", async () => {
    mount([{ ...(c("hero", "Hero") as object), createdAt: Date.now() + 1 } as never, c("hdr", "Site header")]);
    expect((await screen.findByTestId("comp-row-new-hero")).textContent).toBe("New");
    expect(screen.queryByTestId("comp-row-new-hdr")).toBeNull();
  });

  /* Board 4418:143126: after Detach all, the list opens on "N instances
     detached" + "{name} is still saved…", and that master's row is dimmed
     with "0 linked instances". */
  it("reports a Detach all on the list and dims the master's row", async () => {
    const composer = createMockComposer({ components: [c("menu", "Menu card"), c("hdr", "Site header")] });
    const live = new Map<string, string[]>([["menu", ["i1", "i2"]], ["hdr", ["i3"]]]);
    Object.assign(composer.components, {
      isAvailable: () => true,
      getInstancesOfComponent: (id: string) => (live.get(id) ?? []).map((elementId) => ({ elementId })),
      detachInstance: vi.fn(async (elementId: string) => {
        for (const [k, v] of live) live.set(k, v.filter((x) => x !== elementId));
        return true;
      }),
      isInstance: () => false,
    });
    render(
      <ToastProvider>
        <ComponentsTab composer={composer as never} onCreateNew={vi.fn()} />
      </ToastProvider>,
    );
    fireEvent.click(await screen.findByTestId("comp-row-menu"));
    fireEvent.click(await screen.findByTestId("component-detach-all"));
    fireEvent.click(screen.getByTestId("component-detach-all-confirm-confirm"));
    const notice = await screen.findByTestId("comp-detach-notice");
    expect(notice.textContent).toBe("2 instances detachedMenu card is still saved. Existing page content keeps its appearance.");
    expect(screen.getByTestId("comp-row-count-menu").textContent).toBe("0 linked instances");
    expect(screen.getByTestId("comp-row-menu").className).toContain("tw:opacity-40");
    expect(screen.getByTestId("comp-row-hdr").className).not.toContain("tw:opacity-40");
  });

  it("the empty state keeps the back row too", async () => {
    mount([]);
    expect((await screen.findByTestId("comp-back-row")).textContent?.replace(/\s+/g, " ")).toBe("‹ Add");
  });
});
