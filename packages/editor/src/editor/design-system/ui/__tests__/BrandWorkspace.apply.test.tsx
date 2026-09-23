/**
 * BrandWorkspace — page switching, unsaved-edit survival, the 14-kind
 * aggregation, and the Apply pipeline (composer.setProjectSettings + persist +
 * markSaved fan-out). Ported from the drawer's `DesignSystemTab.guard-apply` and
 * `.aggregation` suites when the drawer was replaced by the workspace (C1 (i)).
 *
 * There is no navigation guard BETWEEN pages, and there never should be:
 * `TokenRegistryProvider` sits above the whole shell, so staged edits survive a
 * page change and even a full unmount — navigating never lost anything. The
 * one guard is on the way OUT (`BrandWorkspace.shell.test.tsx`).
 *
 * The Apply pipeline is exercised through the footer's Save -> ReviewModal
 * confirm, which is the only route a user has.
 *
 * @license BSD-3-Clause
 */

import { fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { APPLY_CHANGES_LABEL } from "../DesignTabFooter";
import { BrandWorkspace } from "../BrandWorkspace";
import { useButtonPresets } from "../../state/StylePresetRegistryContext";
import { CURRENT_SCHEMA_VERSION } from "../../migrations";
import {
  installDomShims,
  makeFakeComposer,
  openPage,
  renderOnRadius,
  renderWorkspace,
  wrap,
} from "./brandWorkspaceHarness";

beforeEach(installDomShims);

/* The route a user actually has: the footer's primary button -> ReviewModal
   -> "Apply N changes". The label is read from the constant rather than
   spelled: it moved from "Apply Changes" to board 154:78's "Save" on
   2026-08-27, and a test that hard-codes copy breaks on every wording
   decision instead of on behaviour. */
async function applyViaFooter(utils: ReturnType<typeof renderWorkspace>) {
  const bar = utils.container.querySelector('[data-screen-savebar="true"]');
  if (!bar) throw new Error("footer savebar not rendered");
  const applyBtn = [...bar.querySelectorAll("button")].find(
    (b) => (b.textContent || "").trim() === APPLY_CHANGES_LABEL,
  );
  if (!applyBtn) throw new Error(`footer ${APPLY_CHANGES_LABEL} not found`);
  fireEvent.click(applyBtn);
  fireEvent.click(await utils.findByText(/^Apply \d+ changes?$/));
}

describe("BrandWorkspace — pages", () => {
  it("lands on Colours and switches pages directly", async () => {
    const composer = makeFakeComposer();
    const utils = renderWorkspace(composer);
    expect(utils.getByTestId("brand-page-title").textContent).toBe("Colours");
    expect(document.getElementById("design-section-colours")).toBeTruthy();

    openPage(utils, "presets");
    await waitFor(() => {
      expect(document.getElementById("design-section-presets")).toBeTruthy();
      expect(document.getElementById("design-section-colours")).toBeNull();
    });
    expect(utils.getByTestId("brand-page-title").textContent).toBe("Presets");
    expect(utils.getByTestId("brand-row-presets").getAttribute("aria-current")).toBe("page");
  });

  it("lists the board's nav in its order, Styles omitted, the undesigned kinds behind a disclosure", () => {
    const composer = makeFakeComposer();
    const utils = renderWorkspace(composer);
    /* The label cell only — Colours carries its palette count beside it. */
    const labels = Array.from(utils.container.querySelectorAll('[data-testid^="brand-row-label-"]')).map(
      (r) => r.textContent?.trim(),
    );
    expect(labels).toEqual([
      "Colours", "Colour mode", "Fonts & type styles", "Component styles", "Classes",
      "Presets", "Brand checks", "Starters", "Spacing", "Import / export",
    ]);
    fireEvent.click(utils.getByTestId("brand-more-kinds"));
    expect(utils.container.querySelector('[data-section-id="kind-radius"]')).toBeTruthy();
    expect(utils.container.querySelector('[data-section-id="kind-imagery"]')).toBeTruthy();
  });

  it("editing a radius token surfaces the dirty signal (14-kind aggregation)", async () => {
    const composer = makeFakeComposer();
    const utils = await renderOnRadius(composer);
    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    await waitFor(() => {
      expect(utils.getByText("Unsaved brand changes")).toBeTruthy();
    });
    // The nav row for that kind carries the dot; the chip reads Draft.
    expect(
      utils.getByTestId("brand-row-kind-radius").querySelector('[aria-label="unsaved changes"]'),
    ).toBeTruthy();
    expect(utils.getByText("Draft")).toBeTruthy();
  });

  it("the edit survives the trip to another page and back", async () => {
    const composer = makeFakeComposer();
    const utils = await renderOnRadius(composer);

    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    openPage(utils, "presets");
    expect(document.getElementById("design-section-presets")).toBeTruthy();

    openPage(utils, "kind-radius");
    await waitFor(() => {
      expect(utils.getByTestId("brand-token-value-radius-sm").textContent).toBe("10px");
    });
  });

  it("footer Discard reverts a dirty TOKEN and the dirty signal clears", async () => {
    const composer = makeFakeComposer();
    const utils = await renderOnRadius(composer);
    const original = utils.radiusInput.value;

    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    await utils.findByText("Unsaved brand changes");

    fireEvent.click(utils.getByText("Discard"));

    await waitFor(() => {
      expect(utils.getByTestId("brand-token-value-radius-sm").textContent).toBe(original);
    });
    expect(utils.queryByText("Unsaved brand changes")).toBeNull();
  });

  // §2-B13 (FIXED): Discard calls discardAll on the 11 STYLE PRESET registries
  // as well as the 14 token registries, so a preset-only dirty state is
  // reverted and the Presets row's dot clears.
  it("footer Discard reverts a dirty STYLE PRESET so the dirty signal clears", async () => {
    const composer = makeFakeComposer();

    let buttonReg: ReturnType<typeof useButtonPresets> | null = null;
    function Capture() {
      buttonReg = useButtonPresets();
      return null;
    }

    const utils = renderWorkspace(composer);
    utils.rerender(
      wrap(
        <>
          <Capture />
          <BrandWorkspace composer={composer} />
        </>,
      ),
    );

    act(() => {
      buttonReg!.addPreset({
        id: "button-test-dirty",
        friendlyName: "Test",
        category: "button",
        variant: "primary",
        bindings: {},
      });
    });

    await waitFor(() => {
      expect(utils.getByText("Unsaved brand changes")).toBeTruthy();
    });
    expect(buttonReg!.isDirty).toBe(true);
    expect(
      utils.getByTestId("brand-row-presets").querySelector('[aria-label="unsaved changes"]'),
    ).toBeTruthy();

    fireEvent.click(utils.getByText("Discard"));

    await waitFor(() => {
      expect(utils.getByText("Brand is up to date")).toBeTruthy();
    });
    expect(buttonReg!.isDirty).toBe(false);
  });
});

describe("BrandWorkspace — Apply pipeline (footer -> ReviewModal)", () => {
  it("persists tokens + presets + schema version through composer.setProjectSettings and clears dirty", async () => {
    const composer = makeFakeComposer();
    const setSpy = vi.spyOn(composer, "setProjectSettings");
    const utils = await renderOnRadius(composer);

    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    await applyViaFooter(utils);

    await waitFor(() => expect(setSpy).toHaveBeenCalledTimes(1));
    const arg = setSpy.mock.calls[0][0] as {
      designTokens: Array<{ id: string; value: string; category: string }>;
      designTokensSchemaVersion: number;
      designPresets: Array<{ id: string; category: string; bindings: unknown }>;
    };

    expect(arg.designTokens.find((t) => t.id === "radius-sm" && t.value === "10px")).toBeDefined();
    expect(arg.designTokensSchemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(Array.isArray(arg.designPresets)).toBe(true);
    expect(arg.designPresets.length).toBeGreaterThan(0);

    // Success toast + dirty cleared. Applying does NOT move you.
    expect(await utils.findByText("Design tokens applied successfully")).toBeTruthy();
    // The engine echoes the write as SETTINGS_CHANGE; that is not another window.
    expect(utils.queryByText(/changed from another window/)).toBeNull();
    await waitFor(() => {
      expect(document.querySelector('[aria-label="unsaved changes"]')).toBeNull();
    });
    expect(document.getElementById("design-section-kind-radius")).toBeTruthy();
    // The onboarding "Set your brand" wire — announced only after the whole
    // apply succeeded.
    expect(composer.emit).toHaveBeenCalledWith("brand:applied", undefined);
  });

  it("shows the error toast and stays recoverable when setProjectSettings throws", async () => {
    const composer = makeFakeComposer();
    vi.spyOn(composer, "setProjectSettings").mockImplementation(() => {
      throw new Error("boom");
    });
    const utils = await renderOnRadius(composer);

    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    await applyViaFooter(utils);

    expect(await utils.findByText("Failed to apply tokens. Try again.")).toBeTruthy();
    // A failed apply must not tick the onboarding step (codex, plan review).
    expect(composer.emit).not.toHaveBeenCalledWith("brand:applied", undefined);
  });
});

describe("BrandWorkspace — engine undo preserves unsaved edits", () => {
  const STORED = [
    {
      id: "radius-sm",
      name: "Small radius",
      value: "4px",
      category: "layout",
      cssVar: "--bd-radius-sm",
      type: "length",
    },
  ];

  it("history:undo does NOT wipe staged edits when the workspace is dirty", async () => {
    // Stored settings carry radius-sm at its default 4px so the load path
    // takes the designTokens branch (non-empty) and hydrates all kinds.
    const composer = makeFakeComposer(STORED);
    const utils = await renderOnRadius(composer);

    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    await waitFor(() => {
      expect(utils.getByText("Unsaved brand changes")).toBeTruthy();
    });

    // Engine-level undo (canvas action) — nothing to do with Brand.
    act(() => {
      composer.emit("history:undo");
    });

    await waitFor(() => {
      expect(utils.getByTestId("brand-token-value-radius-sm").textContent).toBe("10px");
      expect(utils.getByText("Unsaved brand changes")).toBeTruthy();
    });
  });

  it("history:undo still reloads from settings when clean (no staged edits to protect)", async () => {
    const composer = makeFakeComposer(STORED);
    const utils = await renderOnRadius(composer);

    act(() => {
      composer.emit("history:undo");
    });

    await waitFor(() => {
      expect(utils.getByTestId("brand-token-value-radius-sm").textContent).toBe("4px");
      expect(document.querySelector('[aria-label="unsaved changes"]')).toBeNull();
    });
  });
});
