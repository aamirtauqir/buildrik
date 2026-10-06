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
import {
  installDomShims,
  makeFakeComposer,
  openPage,
  renderOnRadius,
  renderWorkspace,
  wrap,
} from "../ui/__tests__/brandWorkspaceHarness";

beforeEach(installDomShims);

describe("BrandWorkspace › the rail target", () => {
  it("Brand is a fullpage tab, so the rail replaces the canvas instead of opening a drawer", () => {
    expect(getTabMode("design")).toBe("fullpage");
  });

  it("FullPageRouter mounts the workspace edge-to-edge in the overlay root, landing on Colours", async () => {
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
    const host = await screen.findByTestId("brand-host", {}, { timeout: 15000 });
    // A portal, like Settings and the Asset library — not the fullpage slot.
    expect(container.contains(host)).toBe(false);
    expect(screen.getByTestId("brand-panel")).toBeTruthy();
    expect(screen.getByTestId("brand-page-title").textContent).toBe("Colours");
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

describe("BrandWorkspace › ‹ Back to canvas (nothing staged, nothing to guard)", () => {
  it("leaves at once after an edit — the edit is already in the project", async () => {
    const composer = makeFakeComposer();
    const onClose = vi.fn();
    const utils = await renderOnRadius(composer, { onClose });
    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
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
