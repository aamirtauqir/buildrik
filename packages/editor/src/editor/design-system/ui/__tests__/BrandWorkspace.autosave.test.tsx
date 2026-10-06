/**
 * BrandWorkspace — page switching, and the save model after Brand Part 1a
 * Task 10 (spec §4): every edit is ONE `composer.designSystem.setTokens` write
 * the moment it is made. No draft, no Save / Review & Apply, no dirty dots,
 * no discard. "Review changes" is a non-blocking list of this session's
 * edits with Revert. A read-only site (tokens failed to migrate) says so and
 * disables editing. Ported from the Apply-pipeline suite this replaced.
 *
 * @license BSD-3-Clause
 */

import { render, fireEvent, waitFor, act, within } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import * as React from "react";
import { BrandWorkspace } from "../BrandWorkspace";
import { ProjectTokensApplier } from "../ProjectTokensApplier";
import { useButtonPresets } from "../../state/StylePresetRegistryContext";
import {
  installDomShims,
  makeFakeComposer,
  openPage,
  renderOnRadius,
  renderWorkspace,
  wrap,
} from "./brandWorkspaceHarness";
import { resolveTokenLiteral, setTokenLiteral } from "@buildrik/shared/tokens";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import type { DesignToken } from "@/engine/designSystem/types";

beforeEach(installDomShims);

const written = (composer: ReturnType<typeof makeFakeComposer>, call = 0) =>
  composer.designSystem.setTokens.mock.calls[call][0] as DesignToken[];

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

  it("lists the board's nav in its order, Styles included, the other kinds on Spacing's switch", () => {
    const composer = makeFakeComposer();
    const utils = renderWorkspace(composer);
    /* The label cell only — Colours carries its palette count beside it. */
    const labels = Array.from(utils.container.querySelectorAll('[data-testid^="brand-row-label-"]')).map(
      (r) => r.textContent?.trim(),
    );
    expect(labels).toEqual([
      "Colours", "Colour mode", "Fonts & type styles", "Styles", "Component styles", "Classes",
      "Presets", "Brand checks", "Starters", "Spacing", "Import / export",
    ]);
    expect(utils.container.querySelector('[data-testid="brand-basic-note"]')).toBeNull();
    fireEvent.click(utils.container.querySelector('[data-section-id="spacing"]')!);
    fireEvent.change(utils.getByTestId("brand-kind-switch"), { target: { value: "kind-imagery" } });
    expect(utils.getByTestId("brand-page-title").textContent).toBe("Imagery");
    // Spacing stays the current nav row on a kind page.
    expect(utils.getByTestId("brand-row-spacing").getAttribute("aria-current")).toBe("page");
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
});

describe("BrandWorkspace — autosave (one write per edit, nothing staged)", () => {
  it("a radius edit is written to the project at once — one setTokens, v6, no draft UI", async () => {
    const composer = makeFakeComposer();
    const utils = await renderOnRadius(composer);

    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });

    expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(1);
    expect(resolveTokenLiteral(written(composer), "radius-sm", "light")).toBe("10px");
    expect(composer.settings.designTokensSchemaVersion).toBe(6);
    await waitFor(() => expect(utils.getByTestId("brand-token-value-radius-sm").textContent).toBe("10px"));
    // The staging layer is gone: no save bar, no Draft chip, no dirty dots.
    expect(utils.queryByText("Unsaved brand changes")).toBeNull();
    expect(document.querySelector('[data-screen-savebar="true"]')).toBeNull();
    expect(utils.queryByText("Draft")).toBeNull();
    expect(document.querySelector('[aria-label="unsaved changes"]')).toBeNull();
  });

  it("the canvas repaints from the <style> — no inline var on <html> (one writer)", async () => {
    document.documentElement.removeAttribute("style");
    document.getElementById("bk-site-tokens")?.remove();
    const composer = makeFakeComposer();
    const utils = render(
      wrap(
        <>
          <ProjectTokensApplier composer={composer} />
          <BrandWorkspace composer={composer} />
        </>,
        composer,
      ),
    );

    // Colour Primary through the card's picker, the way a user changes it.
    fireEvent.click(utils.container.querySelector('[data-token-row="color-primary"]')!);
    fireEvent.click(utils.getByTestId("brand-token-action-replace"));
    fireEvent.change(await utils.findByLabelText("Hex color value"), { target: { value: "#C2410C" } });
    fireEvent.click(within(utils.getByTestId("color-picker")).getByRole("button", { name: "Apply" }));
    expect(resolveTokenLiteral(written(composer), "color-primary", "light")).toBe("#C2410C");

    await waitFor(() => {
      const css = document.getElementById("bk-site-tokens")?.textContent ?? "";
      expect(css).toMatch(/#C2410C/i);
    });
    expect(document.documentElement.style.getPropertyValue("--buildrick-design-color-primary")).toBe("");
    expect(document.documentElement.getAttribute("style") ?? "").not.toContain("--buildrick-design-");
  });

  it("follows a token write made elsewhere (⌘Z, Update everywhere) without a reload", async () => {
    const composer = makeFakeComposer();
    const utils = await renderOnRadius(composer);
    act(() => {
      composer.setProjectSettings({ designTokens: setTokenLiteral(DEFAULT_TOKENS, "radius-sm", "light", "12px"), designTokensSchemaVersion: 6 });
    });
    await waitFor(() => expect(utils.getByTestId("brand-token-value-radius-sm").textContent).toBe("12px"));
    expect(utils.queryByText(/changed from another window/)).toBeNull();
  });

  it("a preset edit autosaves into projectSettings.designPresets", async () => {
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
        composer,
      ),
    );

    act(() => {
      buttonReg!.addPreset({ id: "button-test-auto", friendlyName: "Test", category: "button", variant: "primary", bindings: {} });
    });

    await waitFor(() => {
      const presets = composer.settings.designPresets as Array<{ id: string }> | undefined;
      expect(presets?.some((p) => p.id === "button-test-auto")).toBe(true);
    });
    await waitFor(() => expect(buttonReg!.isDirty).toBe(false));
  });
});

describe("BrandWorkspace — Review changes (non-blocking, this session, Revert)", () => {
  it("lists the session's edit as was → now; a run of edits is one row; Revert writes the start value back", async () => {
    const composer = makeFakeComposer();
    const utils = await renderOnRadius(composer);
    const original = utils.getByTestId("brand-token-value-radius-sm").textContent!;
    expect(utils.queryByTestId("brand-session-edits")).toBeNull();

    fireEvent.change(utils.radiusInput, { target: { value: "1" } });
    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });

    fireEvent.click(await utils.findByTestId("brand-session-edits"));
    // Two keystrokes on one value are one row, remembering where it started.
    expect(utils.getByTestId("brand-session-edits").textContent).toBe("Review changes · 1");
    const row = utils.getByTestId("brand-session-edit-radius-sm");
    expect(row.textContent).toContain(original);
    expect(row.textContent).toContain("10px");
    // Non-blocking: the page stays usable, no modal.
    expect(document.querySelector('[aria-modal="true"]')).toBeNull();

    const callsBefore = composer.designSystem.setTokens.mock.calls.length;
    fireEvent.click(utils.getByTestId("brand-session-revert-radius-sm"));
    expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(callsBefore + 1);
    expect(resolveTokenLiteral(written(composer, callsBefore), "radius-sm", "light")).toBe(original);
    await waitFor(() => expect(utils.getByTestId("brand-token-value-radius-sm").textContent).toBe(original));
    expect(utils.queryByTestId("brand-session-edits")).toBeNull();
  });
});

describe("BrandWorkspace — read-only tokens (failed migration)", () => {
  it("says so, disables every edit, and writes nothing", async () => {
    const composer = makeFakeComposer([], { readOnly: true });
    const utils = renderWorkspace(composer);

    expect(utils.getByTestId("brand-read-only-banner").textContent).toBe(
      "We couldn't upgrade this site's brand — nothing was changed. Editing is paused.",
    );
    expect((utils.getByTestId("brand-page-action") as HTMLButtonElement).matches(":disabled")).toBe(true);

    openPage(utils, "kind-radius");
    const row = await waitFor(() => {
      const el = utils.container.querySelector<HTMLElement>('[data-token-row="radius-sm"]');
      if (!el) throw new Error("radius-sm row not rendered");
      return el;
    });
    expect(row.closest("fieldset")?.disabled).toBe(true);
    expect((utils.getByTestId("brand-token-action-replace") as HTMLButtonElement).matches(":disabled")).toBe(true);

    // Even a write that gets past the UI is refused by the one write path.
    expect(composer.designSystem.setTokens([...DEFAULT_TOKENS], "x")).toBe(false);
    expect(composer.settings.designTokens).toEqual([]);
  });
});
