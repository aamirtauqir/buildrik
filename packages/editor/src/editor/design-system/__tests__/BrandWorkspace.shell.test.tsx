/**
 * BrandWorkspace — the shell (C1 (i), boards `7315:80955` workspace ·
 * `4418:168885` Import / export · parked `4418:49685` "Brand · empty").
 *
 *   rail Brand → fullpage → the workspace, landing on Colours
 *   ‹ Back / Escape → out, always: edits autosave, so there is nothing to
 *     guard (spec §4; board 7317:80979's discard overlay and 781:4311's
 *     load-error card went with the staging layer — Brand Part 1a Task 10)
 *   Import / export: a bad file → "Import failed" row
 *   first run → "No brand set." with Browse starters · Import
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { getTabMode } from "@/editor/rail/tabsConfig";
import { FullPageRouter } from "@/editor/sidebar/FullPageRouter";
import type { Composer } from "@/engine";
import { requestBrandReturn } from "@/editor/design-system/ui/brandOpenRequest";
import {
  installDomShims,
  makeFakeComposer,
  openPage,
  renderOnRadius,
  renderWorkspace,
  wrap,
} from "@/editor/design-system/ui/__tests__/brandWorkspaceHarness";

beforeEach(installDomShims);

describe("BrandWorkspace › the rail target", () => {
  it("Brand is a fullpage tab, so the rail replaces the canvas instead of opening a drawer", () => {
    expect(getTabMode("design")).toBe("fullpage");
  });

  it("FullPageRouter mounts the workspace in the resource area, landing on Colours", async () => {
    const composer = makeFakeComposer();
    const onClose = vi.fn();
    const { container } = render(
      wrap(
        <React.Suspense fallback={null}>
          <FullPageRouter
            activeTab="design"
            composer={composer as unknown as Composer}
            commonTabProps={{ onClose }}
            projectId="shell-test"
          />
        </React.Suspense>,
      ),
    );
    // Lazy-loaded, like Settings; the module is large enough to outlast the default 1 s.
    expect(await screen.findByTestId("brand-panel", {}, { timeout: 15000 })).toBeTruthy();
    // In place (the resource area beside the rail), like Settings and the Asset library — not a portal.
    expect(container.contains(screen.getByTestId("brand-host"))).toBe(true);
    expect(screen.getByTestId("brand-page-title").textContent).toMatch(/^Colors · \d+$/);
    expect(screen.getByTestId("brand-row-colours").getAttribute("aria-current")).toBe("page");
    // The colour token list is the page.
    expect(document.getElementById("design-section-colours")).toBeTruthy();
    // Back with nothing staged leaves at once.
    fireEvent.click(screen.getByTestId("brand-back-link"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("a deep link lands on the named page", () => {
    const composer = makeFakeComposer();
    const utils = renderWorkspace(composer, { initialPage: "starters" });
    expect(utils.getByTestId("brand-page-title").textContent).toBe("Starters");
    expect(utils.container.querySelector('[data-section-id="starters"]')?.getAttribute("aria-current")).toBe("page");
  });
});

describe("BrandWorkspace › ‹ Back to Editor (nothing staged, nothing to guard)", () => {
  it("leaves at once after an edit — the edit is already in the project", async () => {
    const composer = makeFakeComposer();
    const onClose = vi.fn();
    const utils = await renderOnRadius(composer, { onClose });
    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    fireEvent.blur(utils.radiusInput);
    expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(1);

    fireEvent.click(utils.getByTestId("brand-back-link"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("brand-discard")).toBeNull();
  });

  it("Escape that closes an open menu does not also leave the workspace", async () => {
    const composer = makeFakeComposer();
    const onClose = vi.fn();
    const utils = await renderOnRadius(composer, { onClose });
    fireEvent.click(utils.getByTestId("brand-token-menu"));
    expect(document.querySelector('[role="menu"]')).toBeTruthy();
    act(() => {
      fireEvent.keyDown(document.body, { key: "Escape" });
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Escape is the same door — out at once, edit or no edit", async () => {
    const composer = makeFakeComposer();
    const onClose = vi.fn();
    const utils = await renderOnRadius(composer, { onClose });
    fireEvent.change(utils.radiusInput, { target: { value: "12px" } });
    fireEvent.blur(utils.radiusInput);
    (document.activeElement as HTMLElement | null)?.blur();

    act(() => {
      fireEvent.keyDown(document.body, { key: "Escape" });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("brand-discard")).toBeNull();
  });
});

describe("BrandWorkspace › Import / export failed row (4418:168885)", () => {
  /* G3-123: the board (4418:168885) draws no status pill; the outcome is a
     toast and the card keeps the detail. */
  it("a file that does not parse raises the Import failed toast, no pill", async () => {
    const composer = makeFakeComposer();
    const utils = renderWorkspace(composer);
    openPage(utils, "export");

    fireEvent.click(await utils.findByText(/or paste JSON/i));
    fireEvent.change(utils.getByLabelText(/Paste JSON/i), { target: { value: "{not json" } });
    fireEvent.click(utils.getByText(/^Parse$/i));

    expect(await utils.findByText("Import failed")).toBeTruthy();
    expect(utils.queryByTestId("brand-section-status-import-failed")).toBeNull();
  });
});

describe("BrandWorkspace › first run", () => {
  it("with no saved tokens the landing shows 'No brand set.' with its two doors", async () => {
    const composer = makeFakeComposer([]);
    const utils = renderWorkspace(composer);
    const card = utils.getByTestId("brand-tokens-first-load-banner");
    expect(card.textContent).toContain("No brand set.");

    fireEvent.click(utils.getByTestId("brand-empty-starters"));
    expect(utils.getByTestId("brand-page-title").textContent).toBe("Starters");
    expect(utils.queryByTestId("brand-tokens-first-load-banner")).toBeNull();

    openPage(utils, "colours");
    fireEvent.click(utils.getByTestId("brand-empty-import"));
    expect(utils.getByTestId("brand-page-title").textContent).toBe("Import / export");
  });

  it("with saved tokens there is no first-run card", () => {
    const composer = makeFakeComposer([
      { id: "radius-sm", name: "Small radius", value: "4px", category: "layout", cssVar: "--bd-radius-sm", type: "length" },
    ]);
    const utils = renderWorkspace(composer);
    expect(utils.queryByTestId("brand-tokens-first-load-banner")).toBeNull();
  });

});

describe("BrandWorkspace › 2L9 shell (B6-B01, GAP-ST-T03)", () => {
  it("the door names the page the editor kept open", () => {
    const composer = makeFakeComposer();
    Object.assign(composer.elements as object, { getActivePage: () => ({ id: "p1", name: "About" }) });
    const utils = renderWorkspace(composer);
    expect(utils.getByTestId("brand-back-link").textContent).toBe("Back to Editor · About");
  });

  it("opened from Site settings, the door goes back to the screen it came from — and not to the canvas", () => {
    const composer = makeFakeComposer();
    const onClose = vi.fn();
    requestBrandReturn(composer, { screen: "security" });
    const utils = renderWorkspace(composer, { onClose });
    expect(utils.getByTestId("brand-back-link").textContent).toBe("Back to Site settings");
    fireEvent.click(utils.getByTestId("brand-back-link"));
    expect(composer.emit).toHaveBeenCalledWith("panel:open", { panel: "settings", screen: "security" });
    expect(onClose).not.toHaveBeenCalled();
    // Read once: the next visit is an ordinary one.
    utils.unmount();
    expect(renderWorkspace(makeFakeComposer()).getByTestId("brand-back-link").textContent).toBe("Back to Editor");
  });

  it("every page carries the strap; the header has Review changes and Restore points, and no Undo / Redo (one undo)", () => {
    const utils = renderWorkspace(makeFakeComposer());
    expect(utils.getByTestId("brand-page-strap").textContent).toBe("Changes apply as you edit — undo any time");
    expect(utils.getByTestId("brand-session-edits").textContent).toBe("Review changes");
    expect(utils.getByTestId("brand-restore-points-action")).toBeTruthy();
    const names = [...utils.getByTestId("brand-panel").querySelectorAll("button")].map((b) => b.textContent?.trim() ?? "");
    expect(names.filter((n) => /^(Undo|Redo)\b/.test(n))).toEqual([]);
  });
});

describe("BrandWorkspace › Review changes copy (B6-B41)", () => {
  it("the list is 'Changes this session'", () => {
    const utils = renderWorkspace(makeFakeComposer());
    fireEvent.click(utils.getByTestId("brand-session-edits"));
    expect(utils.getByTestId("brand-session-edits-list").querySelector("h3")?.textContent).toBe("Changes this session");
  });
});

describe("BrandWorkspace › offline (B6-B43)", () => {
  it("says edits still apply; Restore points waits for a connection", () => {
    const spy = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    try {
      const utils = renderWorkspace(makeFakeComposer());
      expect(utils.getByTestId("brand-offline-banner").textContent).toBe(
        "You’re offline. Token edits still apply here and save when you reconnect. Restore points and reading a website need a connection.",
      );
      expect((utils.getByTestId("brand-restore-points-action") as HTMLButtonElement).disabled).toBe(true);
      expect(utils.getByText("Restore points need a connection")).toBeTruthy();
    } finally {
      spy.mockRestore();
    }
  });

  it("back online, the banner goes", () => {
    const spy = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const utils = renderWorkspace(makeFakeComposer());
    spy.mockReturnValue(true);
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(utils.queryByTestId("brand-offline-banner")).toBeNull();
    spy.mockRestore();
  });
});

describe("BrandWorkspace › compact under 1440 (B6-B51…B53)", () => {
  function compactMedia() {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((q: string) => ({
        matches: q === "(max-width: 1439px)", media: q,
        addEventListener: vi.fn(), removeEventListener: vi.fn(),
        addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
      })),
    });
  }

  it("folds the nav behind 'Brand navigation' and the preview behind 'Show website preview'", () => {
    compactMedia();
    const utils = renderWorkspace(makeFakeComposer());
    expect(utils.queryAllByTestId("brand-nav-group")).toHaveLength(0);
    expect(utils.queryByTestId("brand-preview-column")).toBeNull();

    fireEvent.click(utils.getByTestId("brand-compact-nav"));
    expect(utils.getAllByTestId("brand-nav-group")).toHaveLength(3);
    fireEvent.click(utils.getByTestId("brand-row-starters"));
    expect(utils.getByTestId("brand-page-title").textContent).toBe("Starters");
    expect(utils.queryAllByTestId("brand-nav-group")).toHaveLength(0);

    const toggle = utils.getByTestId("brand-compact-preview");
    expect(toggle.textContent).toBe("Show website preview");
    fireEvent.click(toggle);
    expect(utils.getByTestId("brand-preview-column")).toBeTruthy();
    expect(utils.getByTestId("brand-pane").className).toContain("tw:hidden");
    expect(toggle.textContent).toBe("Hide website preview");
  });

  it("at 1440 nothing folds", () => {
    const utils = renderWorkspace(makeFakeComposer());
    expect(utils.queryByTestId("brand-compact-nav")).toBeNull();
    expect(utils.getAllByTestId("brand-nav-group")).toHaveLength(3);
    expect(utils.getByTestId("brand-preview-column")).toBeTruthy();
  });
});
