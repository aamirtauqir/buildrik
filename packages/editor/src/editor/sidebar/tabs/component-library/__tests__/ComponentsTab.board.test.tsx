/**
 * 2L9 215:43588 (B6-K02): the Components resource area — navigation with
 * scope counts, "‹ Back to Add", search, sort and "+ Create component" in the
 * header, and 40px rows with a scope chip and uses. (Replaced the drawer test
 * for board 4418:142419: back row, pinned footer.)
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";

vi.mock("@/services/componentSync", () => ({ fetchComponentLibrary: vi.fn(async () => []) }));

import { ComponentsTab } from "@/editor/sidebar/tabs/ComponentsTab";

const c = (id: string, name: string) => ({ id, name, masterTree: {}, createdAt: 1, updatedAt: 1, version: 1 }) as never;

function mount(components: never[]) {
  const composer = createMockComposer({ components });
  Object.assign(composer.components, { isAvailable: () => true, getInstancesOfComponent: () => Array.from({ length: 6 }, (_, i) => ({ elementId: `i${i}` })) });
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
    /* 217:43947 (B6-K26) — the full name in the ink tooltip, not a native title. */
    expect(screen.getByTestId("comp-row-name-hdr")).not.toHaveAttribute("title");
    expect(screen.getAllByRole("tooltip", { hidden: true }).map((t) => t.textContent)).toContain("Site header");
  });

  /* Board 4418:166980: a master made in this session is badged New. */
  it("badges a master created this session New, and only that one", async () => {
    mount([{ ...(c("hero", "Hero") as object), createdAt: Date.now() + 1 } as never, c("hdr", "Site header")]);
    expect((await screen.findByTestId("comp-row-new-hero")).textContent).toBe("New");
    expect(screen.queryByTestId("comp-row-new-hdr")).toBeNull();
  });

  /* 2L9 217:41451 (B6-K17): after Detach all the row reads "0 uses" — no
     notice above the list, no dimmed row — and the summary stays open. */
  it("after Detach all the row reads 0 uses and the summary stays open", async () => {
    const composer = createMockComposer({ components: [c("menu", "Menu card"), c("hdr", "Site header")] });
    const live = new Map<string, string[]>([["menu", ["i1", "i2"]], ["hdr", ["i3"]]]);
    Object.assign(composer.components, {
      isAvailable: () => true,
      getInstancesOfComponent: (id: string) => (live.get(id) ?? []).map((elementId) => ({ elementId })),
      detachInstance: vi.fn(async (elementId: string) => {
        for (const [k, v] of live) live.set(k, v.filter((x) => x !== elementId));
        composer.emit(EVENTS.INSTANCE_DETACHED, { instanceId: elementId });
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
    expect(await screen.findByText(/^Detached 2 instances on \d pages? from Menu card$/)).toBeTruthy();
    expect(screen.queryByTestId("comp-detach-notice")).toBeNull();
    expect(screen.getByTestId("comp-row-count-menu").textContent).toBe("0 uses");
    expect(screen.getByTestId("comp-row-menu").className).not.toContain("tw:opacity-40");
    expect(screen.getByTestId("component-usedon-toggle").textContent).toBe("Not used on any page");
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

  /* 2L9 217:42647 (B6-K21): "Used in … ›" shows the places in the list's
     stead; "‹ Back to {name}" brings the list and the summary back. */
  it("Used in opens the places view and Back returns to the list", async () => {
    mount([c("hdr", "Site header"), c("ftr", "Footer")]);
    fireEvent.click(await screen.findByTestId("comp-row-hdr"));
    fireEvent.click(screen.getByTestId("component-usedon-toggle"));
    expect(screen.getByTestId("comp-usedon")).toBeInTheDocument();
    expect(screen.queryByTestId("comp-row-ftr")).toBeNull();
    expect(screen.queryByTestId("component-master")).toBeNull();
    fireEvent.click(screen.getByTestId("comp-usedon-back"));
    expect(screen.getByTestId("comp-row-ftr")).toBeInTheDocument();
    expect(screen.getByTestId("component-name").textContent).toBe("Site header");
  });

  /* 217:43651 (B6-K25): This page with none — a 14/600 ink title and the
     13 ink-soft how-to under it. */
  it("This page with no masters says so and how to make one", async () => {
    mount([c("hdr", "Site header")]);
    fireEvent.click(await screen.findByRole("tab", { name: "This page · 0" }));
    const empty = screen.getByTestId("comp-empty-page");
    const [title, body] = Array.from(empty.querySelectorAll("p"));
    expect(title.textContent).toBe("No components on this page yet");
    expect(title.className).toContain("tw:text-[14px]");
    expect(title.className).toContain("tw:font-semibold");
    expect(body.textContent).toBe(
      "Select a section on the canvas and choose Save as component… in Layers or the Inspector. Choose This page to keep it here only.",
    );
    expect(body.className).toContain("--bk-ink-soft");
  });

  /* 228:46316 (B6-K41): each row's ⋯ — Insert, Rename, Duplicate, Export…,
     Delete (red). Opening it does not open the row. */
  it("the row menu runs Insert, Rename, Duplicate and Delete", async () => {
    const composer = mount([c("hdr", "Site header"), c("ftr", "Footer")]);
    fireEvent.click(await screen.findByTestId("comp-row-more-hdr"));
    expect(screen.queryByTestId("component-master")).toBeNull();
    const items = ["comp-row-insert", "comp-row-rename", "comp-row-duplicate", "comp-row-export", "comp-row-delete"];
    expect(items.map((id) => screen.getByTestId(id).textContent)).toEqual(["Insert", "Rename", "Duplicate", "Export…", "Delete"]);
    expect(screen.getByTestId("comp-row-delete").className).toMatch(/error|red/);

    fireEvent.click(screen.getByTestId("comp-row-duplicate"));
    await waitFor(() => expect(composer.components.duplicateComponent).toHaveBeenCalledWith("hdr"));

    fireEvent.click(screen.getByTestId("comp-row-more-hdr"));
    fireEvent.click(screen.getByTestId("comp-row-insert"));
    /* The shared insert answers in a toast either way (instantiate.ts). */
    expect(await screen.findByText(/^(Component added to canvas|Open a page first to add this component\.)$/)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("comp-row-more-hdr"));
    fireEvent.click(screen.getByTestId("comp-row-rename"));
    expect(screen.getByTestId("component-master")).toBeInTheDocument();
    expect(screen.getByTestId("component-rename-input")).toHaveValue("Site header");

    fireEvent.click(screen.getByTestId("comp-row-more-ftr"));
    fireEvent.click(screen.getByTestId("comp-row-delete"));
    expect(await screen.findByText("Delete “Footer”?")).toBeInTheDocument();
  });

  /* A Rename from the row menu is one request: a summary opened later must
     not start in rename. */
  it("Rename from the menu does not stick to later summaries", async () => {
    mount([c("hdr", "Site header"), c("ftr", "Footer")]);
    fireEvent.click(await screen.findByTestId("comp-row-more-hdr"));
    fireEvent.click(screen.getByTestId("comp-row-rename"));
    expect(screen.getByTestId("component-rename-input")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByTestId("component-rename-input"), { key: "Escape" });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("component-master")).toBeNull();
    fireEvent.click(screen.getByTestId("comp-row-ftr"));
    expect(screen.queryByTestId("component-rename-input")).toBeNull();
    expect(screen.getByTestId("component-name").textContent).toBe("Footer");
  });

  /* 217:43115 (B6-K23): offline, the site's masters still list; a warning
     note says so, the library count is "—" and the library asks for a
     connection. Import and Export are local files here, so they stay. */
  it("offline: note above the list, library count — and the library waits", async () => {
    const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    try {
      mount([c("hdr", "Site header")]);
      const note = await screen.findByTestId("comp-offline-note");
      expect(note.textContent).toBe("You’re offline. This site’s components still work and sync later. Component library needs a connection.");
      expect(note.className).toContain("--bk-warning-tint");
      expect(screen.getByTestId("comp-row-hdr")).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Component library · —" })).toBeInTheDocument();
      expect(screen.getByTestId("comp-import-open")).not.toBeDisabled();
      fireEvent.click(screen.getByRole("tab", { name: "Component library · —" }));
      expect(screen.getByTestId("comp-offline-note")).toBeInTheDocument();
      expect(screen.queryByTestId("comp-empty-library")).toBeNull();
    } finally {
      online.mockRestore();
    }
  });
});
