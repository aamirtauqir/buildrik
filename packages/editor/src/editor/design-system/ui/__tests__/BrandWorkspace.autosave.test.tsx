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
import { describe, it, expect, beforeEach, vi } from "vitest";
import * as React from "react";
import { BrandWorkspace } from "../BrandWorkspace";
import { ProjectTokensApplier } from "../ProjectTokensApplier";
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
    fireEvent.blur(utils.radiusInput);
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
    fireEvent.blur(utils.radiusInput);

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

  it("a refused value toasts once — the blur after Enter does not send the same draft again", async () => {
    const composer = makeFakeComposer();
    composer.designSystem.setTokens.mockImplementation(() => false);
    const utils = await renderOnRadius(composer);
    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    fireEvent.keyDown(utils.radiusInput, { key: "Enter" });
    fireEvent.blur(utils.radiusInput);
    expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(utils.getAllByText(/wasn't applied/)).toHaveLength(1));
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

});

describe("BrandWorkspace — Review changes (non-blocking, every Brand write this session, Revert)", () => {
  const rows = (utils: ReturnType<typeof renderWorkspace>) => utils.queryAllByTestId("brand-session-edit");
  const openList = async (utils: ReturnType<typeof renderWorkspace>) =>
    fireEvent.click(await utils.findByTestId("brand-session-edits"));

  it("a value edit is a row (was → now); Revert writes the set back exactly — the edit's custom-* primitive goes too", async () => {
    const composer = makeFakeComposer();
    const utils = renderWorkspace(composer);
    // Drawn at 0 too (8222:230854): the empty list says so.
    expect(utils.getByTestId("brand-session-edits").textContent).toBe("Review changes · 0");
    await openList(utils);
    expect(utils.getByText("No changes to review yet.")).toBeTruthy();
    fireEvent.click(utils.getByTestId("brand-session-close"));
    const seedIds = DEFAULT_TOKENS.map((t) => t.id).sort();

    // A semantic colour edit adds its own custom-<id> primitive (setTokenLiteral).
    fireEvent.click(utils.container.querySelector('[data-token-row="color-primary"]')!);
    fireEvent.click(utils.getByTestId("brand-token-action-replace"));
    fireEvent.change(await utils.findByLabelText("Hex color value"), { target: { value: "#C2410C" } });
    fireEvent.click(within(utils.getByTestId("color-picker")).getByRole("button", { name: "Apply" }));
    const afterEdit = (composer.settings.designTokens as DesignToken[]).map((t) => t.id).sort();
    expect(afterEdit.length).toBeGreaterThan(seedIds.length);

    await openList(utils);
    expect(utils.getByTestId("brand-session-edits").textContent).toBe("Review changes · 1");
    expect(within(rows(utils)[0]).getByTestId("brand-session-edit-title").textContent).toBe("Primary · Light");
    expect(rows(utils)[0].textContent).toMatch(/→ #C2410C/i);
    // Non-blocking: no modal.
    expect(document.querySelector('[aria-modal="true"]')).toBeNull();

    fireEvent.click(within(rows(utils)[0]).getByTestId("brand-session-revert"));
    const reverted = composer.settings.designTokens as DesignToken[];
    expect(reverted.map((t) => t.id).sort()).toEqual(seedIds);
    expect(resolveTokenLiteral(reverted, "color-primary", "light")).toBe(resolveTokenLiteral(DEFAULT_TOKENS, "color-primary", "light"));
    await waitFor(() => expect(utils.getByTestId("brand-session-edits").textContent).toBe("Review changes · 0"));
  });

  /* L4-026: ⌘Z put the tokens back, but the list still showed the edit under
     "Already applied and saved". A row whose tokens are back where the write
     found them is undone — it leaves the list, and a redo brings it back. */
  it("an edit undone (tokens back as the write found them) leaves the list; redo brings it back", async () => {
    const composer = makeFakeComposer();
    const utils = renderWorkspace(composer);
    const before = composer.settings.designTokens;
    fireEvent.click(utils.container.querySelector('[data-token-row="color-primary"]')!);
    fireEvent.click(utils.getByTestId("brand-token-action-replace"));
    fireEvent.change(await utils.findByLabelText("Hex color value"), { target: { value: "#C2410C" } });
    fireEvent.click(within(utils.getByTestId("color-picker")).getByRole("button", { name: "Apply" }));
    const edited = composer.settings.designTokens;
    expect(utils.getByTestId("brand-session-edits").textContent).toBe("Review changes · 1");

    // ⌘Z — the engine restores the settings snapshot and emits SETTINGS_CHANGE.
    act(() => (composer as unknown as { setProjectSettings: (s: object) => void }).setProjectSettings({ designTokens: before }));
    await waitFor(() => expect(utils.getByTestId("brand-session-edits").textContent).toBe("Review changes · 0"));

    act(() => (composer as unknown as { setProjectSettings: (s: object) => void }).setProjectSettings({ designTokens: edited }));
    await waitFor(() => expect(utils.getByTestId("brand-session-edits").textContent).toBe("Review changes · 1"));
  });

  it("the card's Auto-fix is a recorded write: a row, and Revert restores", async () => {
    const composer = makeFakeComposer();
    const issue = { type: "contrast", severity: "warning", message: "Contrast 2.8:1", autoFixHint: "darken-22" };
    Object.assign(composer.designSystem, {
      lintState: {
        getVisibleIssues: (id: string) => (id === "color-primary" ? [issue] : []),
        setAllIssues: () => {},
        suppress: () => {},
        suppressedCount: () => 0,
        on: () => {},
        off: () => {},
      },
      computeAutoFix: () => "#0B2F8C",
      /* The engine path writes around Brand's log — the card must not use it. */
      applyAutoFix: vi.fn(() => {
        composer.setProjectSettings({ designTokens: setTokenLiteral(DEFAULT_TOKENS, "color-primary", "light", "#0B2F8C"), designTokensSchemaVersion: 6 });
        return "#0B2F8C";
      }),
    });
    const utils = renderWorkspace(composer);
    const original = resolveTokenLiteral(DEFAULT_TOKENS, "color-primary", "light");
    fireEvent.click(utils.container.querySelector('[data-token-row="color-primary"]')!);
    fireEvent.click(await utils.findByText("Auto-fix"));

    expect(resolveTokenLiteral(composer.settings.designTokens as DesignToken[], "color-primary", "light")).toBe("#0B2F8C");
    expect((composer.designSystem as unknown as { applyAutoFix: ReturnType<typeof vi.fn> }).applyAutoFix).not.toHaveBeenCalled();
    await openList(utils);
    expect(rows(utils)).toHaveLength(1);
    expect(rows(utils)[0].textContent).toMatch(/→ #0B2F8C/i);

    fireEvent.click(within(rows(utils)[0]).getByTestId("brand-session-revert"));
    expect(resolveTokenLiteral(composer.settings.designTokens as DesignToken[], "color-primary", "light")).toBe(original);
  });

  it("a write that changes nothing logs no row (re-applying the starter you are on)", async () => {
    const composer = makeFakeComposer();
    const utils = renderWorkspace(composer);
    openPage(utils, "starters");
    const second = () => utils.container.querySelectorAll<HTMLElement>('[role="radio"]')[1];
    fireEvent.click(second());
    openPage(utils, "colours");
    const after1 = utils.getByTestId("brand-session-edits").textContent;
    openPage(utils, "starters");
    fireEvent.click(second());
    openPage(utils, "colours");
    expect(utils.getByTestId("brand-session-edits").textContent).toBe(after1);
    expect(after1).not.toBe("Review changes · 0");
  });

  it("an import is a row per token it added", async () => {
    const composer = makeFakeComposer();
    const utils = renderWorkspace(composer);
    openPage(utils, "export");
    fireEvent.click(await utils.findByText(/or paste JSON/i));
    fireEvent.change(utils.getByLabelText(/Paste JSON/i), {
      target: { value: JSON.stringify([{ id: "color-imported", name: "Imported", value: "#00FF99", category: "colors", cssVar: "--buildrick-design-color-imported", type: "color", kind: "color" }]) },
    });
    fireEvent.click(utils.getByText(/^Parse$/i));
    fireEvent.click(await utils.findByText(/Apply 1 valid only/i));

    openPage(utils, "colours");
    await openList(utils);
    const titles = utils.getAllByTestId("brand-session-edit-title").map((t) => t.textContent);
    expect(titles).toContain("Imported · Added");
  });

  it("each row has its own Revert: a later edit to ANOTHER token leaves it live; only its own token changing makes it stale", async () => {
    const composer = makeFakeComposer();
    const utils = await renderOnRadius(composer);
    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    fireEvent.blur(utils.radiusInput);
    fireEvent.change(utils.radiusInput, { target: { value: "12px" } });
    fireEvent.blur(utils.radiusInput);

    await openList(utils);
    const [newest, older] = rows(utils);
    expect(within(newest).getByTestId("brand-session-revert")).not.toBeDisabled();
    expect(within(older).getByTestId("brand-session-stale").textContent).toBe("Changed since — use ⌘Z");
    expect(within(older).getByTestId("brand-session-revert")).toBeDisabled();
    expect(within(newest).queryByTestId("brand-session-stale")).toBeNull();

    // ⌘Z (any write made outside the log) that moves the token makes the newest stale too.
    act(() => {
      composer.setProjectSettings({ designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6 });
    });
    await waitFor(() => expect(within(rows(utils)[0]).getByTestId("brand-session-revert")).toBeDisabled());
  });

  it("deleting a token another token aliases is refused with a toast — nothing written", async () => {
    /* A site-added primitive and a semantic token aliasing it: seed tokens
       offer "Reset to default" instead of Delete (OQ-7), so the refusal is
       proven on the site's own tokens. */
    const seedPrimitive = DEFAULT_TOKENS.find((p) => p.kind === "color" && p.layer === "primitive")!;
    const seedSemantic = DEFAULT_TOKENS.find((t) => t.kind === "color" && t.layer === "semantic" && "alias" in t.modes.light)!;
    const sand: DesignToken = { ...seedPrimitive, id: "sand-500", name: "Sand 500", cssVar: "--buildrick-design-sand-500", legacyNames: undefined, modes: { light: { value: "#C2B280" } } };
    const accent: DesignToken = { ...seedSemantic, id: "color-sand", name: "Sand", cssVar: "--buildrick-design-color-sand", legacyNames: undefined, modes: { light: { alias: "sand-500" } } };
    const composer = makeFakeComposer();
    composer.settings.designTokens = [sand, accent];
    composer.settings.designTokensSchemaVersion = 6;
    const utils = renderWorkspace(composer);
    fireEvent.click(await waitFor(() => utils.container.querySelector(`[data-token-row="${sand.id}"]`)!));
    fireEvent.click(utils.getByTestId("brand-token-menu"));
    fireEvent.click(utils.getByRole("menuitem", { name: /Delete/ }));
    /* Nothing uses it on the page (the alias is a token, not an element): the
       plain confirm (BRP1-M6), then the write is refused. */
    fireEvent.click(await utils.findByTestId("brand-token-delete-confirm"));
    expect(await utils.findByText(new RegExp(`Deleting "${sand.name}" wasn't applied`))).toBeTruthy();
    expect(composer.settings.designTokens).toEqual([sand, accent]);
  });

  it("a seed token's Delete is Reset to default (OQ-7) — one write back to the seed value", async () => {
    const seed = DEFAULT_TOKENS.find((t) => t.id === "color-primary")!;
    const edited = setTokenLiteral(DEFAULT_TOKENS, "color-primary", "light", "#C2410C");
    const composer = makeFakeComposer();
    composer.settings.designTokens = edited;
    composer.settings.designTokensSchemaVersion = 6;
    const utils = renderWorkspace(composer);
    fireEvent.click(await waitFor(() => utils.container.querySelector('[data-token-row="color-primary"]')!));
    fireEvent.click(utils.getByTestId("brand-token-menu"));
    expect(utils.queryByRole("menuitem", { name: /Delete/ })).toBeNull();
    fireEvent.click(utils.getByRole("menuitem", { name: "Reset to default" }));
    const saved = composer.settings.designTokens as DesignToken[];
    expect(saved.find((t) => t.id === "color-primary")).toEqual(seed);
    expect(await utils.findByText(/reset to default · Undo ⌘Z/)).toBeTruthy();
  });
});

describe("BrandWorkspace — read-only notice by reason", () => {
  it.each([
    ["switch_off", "Brand editing is paused while we upgrade brand tokens."],
    ["held", "This site's brand was rolled back — editing is paused."],
  ])("%s says its own thing", (readOnlyReason, copy) => {
    const utils = renderWorkspace(makeFakeComposer([], { readOnly: true, readOnlyReason }));
    expect(utils.getByTestId("brand-read-only-banner").textContent).toBe(copy);
  });
});

describe("BrandWorkspace — read-only tokens (failed migration)", () => {
  it("says so, disables every edit, and writes nothing", async () => {
    const composer = makeFakeComposer([], { readOnly: true });
    const utils = renderWorkspace(composer);

    expect(utils.getByTestId("brand-read-only-banner").textContent).toBe(
      "We couldn't upgrade this site's brand — nothing was changed. Editing is paused.",
    );
    // 8222:229015: the header's actions are inert too.
    expect(utils.getByTestId("brand-session-edits")).toBeDisabled();
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

describe("BrandWorkspace — the preview's Light / Dark switch is on every page", () => {
  it.each(["colours", "fonts", "colour-mode"] as const)("%s carries it", (page) => {
    const composer = makeFakeComposer();
    Object.assign(composer, {
      colorMode: { get: () => "light", set: vi.fn(), resolved: () => "light" },
    });
    const utils = renderWorkspace(composer);
    openPage(utils, page);
    expect(utils.getByTestId("brand-colour-mode-seg")).toBeTruthy();
  });
});
