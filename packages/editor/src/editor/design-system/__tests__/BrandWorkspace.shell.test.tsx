/**
 * BrandWorkspace — the shell (C1 (i), boards `7315:80955` workspace ·
 * `7317:80979` "Discard brand changes?" · `4418:168885` Import / export ·
 * parked `4418:49685` "Brand · empty" · `781:4311` load-error).
 *
 *   rail Brand → fullpage → the workspace, landing on Colours
 *   ‹ Back / Escape with staged edits → the discard overlay; without → out
 *   Import / export: a bad file → "Import failed" row
 *   first run → "No brand set." with Browse starters · Import
 *   settings unreadable → the load-error card with Try again
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

describe("BrandWorkspace › ‹ Back to canvas with a draft (7317:80979)", () => {
  it("raises the discard overlay; Keep editing stays with the edit intact", async () => {
    const composer = makeFakeComposer();
    const onClose = vi.fn();
    const utils = await renderOnRadius(composer, { onClose });
    const input = utils.radiusInput;
    fireEvent.change(input, { target: { value: "10px" } });
    await utils.findByText("Unsaved brand changes");

    fireEvent.click(utils.getByTestId("brand-back-link"));

    const dialog = await screen.findByTestId("brand-discard");
    expect(dialog.textContent).toContain("Discard brand changes?");
    expect(screen.getByTestId("brand-discard-body").textContent).toBe(
      "Your brand edit has not been saved. Discard it and leave Brand, or keep editing.",
    );
    // 7317:80979: Discard (danger) first, Keep editing (primary, focused) last.
    const buttons = [...dialog.querySelectorAll("button")].map((b) => b.getAttribute("data-testid")).filter((t) => t?.startsWith("brand-discard-"));
    expect(buttons).toEqual(["brand-discard-confirm", "brand-discard-keep"]);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("brand-discard-keep"));
    await waitFor(() => expect(screen.queryByTestId("brand-discard")).toBeNull());
    expect(onClose).not.toHaveBeenCalled();
    expect((utils.getByLabelText("Value") as HTMLInputElement).value).toBe("10px");
  });

  it("Discard changes reverts the staged edits and leaves", async () => {
    const composer = makeFakeComposer();
    const onClose = vi.fn();
    const utils = await renderOnRadius(composer, { onClose });
    const input = utils.radiusInput;
    const original = input.value;
    fireEvent.change(input, { target: { value: "10px" } });
    await utils.findByText("Unsaved brand changes");

    fireEvent.click(utils.getByTestId("brand-back-link"));
    fireEvent.click(await screen.findByTestId("brand-discard-confirm"));

    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect((utils.getByLabelText("Value") as HTMLInputElement).value).toBe(original);
    });
    expect(utils.queryByText("Unsaved brand changes")).toBeNull();
    // The footer's own discard, with its Undo toast.
    expect(await utils.findByText("1 change discarded")).toBeTruthy();
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
    expect(screen.queryByTestId("brand-discard")).toBeNull();
  });

  it("Escape is the same door, guarded the same way", async () => {
    const composer = makeFakeComposer();
    const onClose = vi.fn();
    const utils = await renderOnRadius(composer, { onClose });
    const input = utils.radiusInput;
    fireEvent.change(input, { target: { value: "12px" } });
    await utils.findByText("Unsaved brand changes");

    act(() => {
      fireEvent.keyDown(document.body, { key: "Escape" });
    });
    expect(await screen.findByTestId("brand-discard")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();

    // Answer it, then Escape with nothing staged leaves directly.
    fireEvent.click(screen.getByTestId("brand-discard-confirm"));
    expect(onClose).toHaveBeenCalledTimes(1);
    act(() => {
      fireEvent.keyDown(document.body, { key: "Escape" });
    });
    expect(onClose).toHaveBeenCalledTimes(2);
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

describe("BrandWorkspace › first run and load error", () => {
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

  it("settings that cannot be read show the load-error card, and Try again recovers", async () => {
    const composer = makeFakeComposer();
    let broken = true;
    const settings = composer.getProjectSettings();
    vi.spyOn(composer, "getProjectSettings").mockImplementation(() => {
      if (broken) throw new Error("design tokens unavailable");
      return settings;
    });
    const utils = renderWorkspace(composer);

    const card = utils.getByTestId("panel-load-error");
    expect(card.textContent).toContain("Couldn't load your brand system.");
    expect(card.textContent).toContain("Your tokens are safe");
    expect(utils.queryByTestId("brand-page-body")).toBeNull();

    broken = false;
    fireEvent.click(utils.getByTestId("panel-load-error-retry"));
    await waitFor(() => expect(utils.queryByTestId("panel-load-error")).toBeNull());
    expect(utils.getByTestId("brand-page-body")).toBeTruthy();
  });
});
