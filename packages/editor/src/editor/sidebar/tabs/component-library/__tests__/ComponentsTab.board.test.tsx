/**
 * 2L9 215:43588 (B6-K02): the Components resource area — navigation with
 * scope counts, "‹ Back to Add", search, sort and "+ Create component" in the
 * header, and 40px rows with a scope chip and uses. (Replaced the drawer test
 * for board 4418:142419: back row, pinned footer.)
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";

vi.mock("@/services/componentSync", () => ({ fetchComponentLibrary: vi.fn(async () => []) }));

import { ComponentsTab } from "@/editor/sidebar/tabs/ComponentsTab";

const c = (id: string, name: string) => ({ id, name, masterTree: {}, createdAt: 1, updatedAt: 1, version: 1 }) as never;

function mount(components: never[]) {
  const composer = createMockComposer({ components });
  Object.assign(composer.components, { isAvailable: () => true, getInstancesOfComponent: () => new Array(6) });
  render(
    <ToastProvider>
      <ComponentsTab composer={composer as never} />
    </ToastProvider>,
  );
  return composer;
}

describe("ComponentsTab — 2L9 215:43588 (B6-K02) resource area", () => {
  it("draws the navigation, the header and 40px rows with scope chip and uses", async () => {
    const composer = mount([c("hdr", "Site header"), c("ftr", "Footer")]);
    /* 215:46716 — "‹ Back to Add" returns to Add. */
    const back = await screen.findByTestId("comp-back-row");
    expect(back.textContent).toBe("‹ Back to Add");
    fireEvent.click(back);
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_SWITCH_TAB, { tab: "add" });

    /* 215:46695 — the scopes as a vertical list with counts, This site chosen. */
    expect(screen.getAllByRole("tab").map((t) => t.getAttribute("aria-label"))).toEqual(["This page · 0", "This site · 2", "Component library · 0"]);
    expect(screen.getByRole("tab", { name: "This site · 2" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "This site · 2" }).className).toContain("--bk-accent-subtle");
    expect(screen.getByTestId("comp-import-open").textContent).toBe("Import package…");

    /* 215:46714 — + Create component sits in the header, not a footer. */
    expect(screen.getByTestId("comp-create").textContent).toBe("+ Create component");
    expect(screen.queryByTestId("comp-footer")).toBeNull();

    /* 215:46932 / 215:46933 — "This site · N", then 40px rows. */
    expect(screen.getByTestId("comp-section-header").textContent).toBe("This site · 2");
    expect(screen.getByTestId("comp-row-hdr").className).toContain("tw:h-10");
    expect(screen.getByTestId("comp-row-scope-hdr").textContent).toBe("This site");
    expect(screen.getByTestId("comp-row-count-hdr").textContent).toBe("6 uses");
    /* 2L9 217:43947 — the full name on hover, however the row truncates it. */
    expect(screen.getByTestId("comp-row-name-hdr")).toHaveAttribute("title", "Site header");
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
        <ComponentsTab composer={composer as never} />
      </ToastProvider>,
    );
    fireEvent.click(await screen.findByTestId("comp-row-menu"));
    fireEvent.click(await screen.findByTestId("component-more"));
    fireEvent.click(await screen.findByTestId("component-detach-all"));
    fireEvent.click(screen.getByTestId("component-detach-all-confirm-confirm"));
    const notice = await screen.findByTestId("comp-detach-notice");
    expect(notice.textContent).toBe("2 instances detachedMenu card is still saved. Existing page content keeps its appearance.");
    expect(screen.getByTestId("comp-row-count-menu").textContent).toBe("0 linked instances");
    expect(screen.getByTestId("comp-row-menu").className).toContain("tw:opacity-40");
    expect(screen.getByTestId("comp-row-hdr").className).not.toContain("tw:opacity-40");
  });

  it("the empty state keeps the navigation and the way back", async () => {
    mount([]);
    expect((await screen.findByTestId("comp-back-row")).textContent).toBe("‹ Back to Add");
    expect(screen.getByTestId("comp-nav")).toBeInTheDocument();
    expect(screen.getByTestId("comp-empty").textContent).toMatch(/^No components yet\./);
  });

  /* 215:47035 — choosing a row opens its summary beside the list; the list
     stays and the row reads as chosen. Escape closes the summary. */
  it("a chosen row opens the summary pane beside the list", async () => {
    mount([c("hdr", "Site header"), c("ftr", "Footer")]);
    fireEvent.click(await screen.findByTestId("comp-row-hdr"));
    expect(screen.getByTestId("component-master")).toBeInTheDocument();
    expect(screen.getByTestId("component-name").textContent).toBe("Site header");
    expect(screen.getByTestId("comp-row-ftr")).toBeInTheDocument();
    expect(screen.getByTestId("comp-row-hdr")).toHaveAttribute("aria-current", "true");
    expect(screen.getByTestId("comp-row-hdr").className).toContain("--bk-accent-subtle");
    fireEvent.click(screen.getByTestId("comp-row-ftr"));
    expect(screen.getByTestId("component-name").textContent).toBe("Footer");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("component-master")).toBeNull();
  });
});
