/**
 * DesignSystemTab — section switching, dirty guard (TabGuardModal) and the
 * Apply pipeline (composer.setProjectSettings + persist + markSaved fan-out).
 *
 * The Apply pipeline is exercised through the guard's "Save and switch"
 * button, which calls handleApply() directly — the ReviewModal confirm path
 * is known to hang under jsdom/vitest 4 (see the skipped test in
 * DesignSystemTab.aggregation.test.tsx).
 *
 * Also pins two §2 bugs:
 *   - §2-B13 guard/footer Discard only resets the 14 TOKEN registries and
 *     skips the 11 preset registries (it.todo below).
 *   - §2-B1 engine history:undo / history:redo trigger loadFromComposer(),
 *     which wipes unsaved DS-tab edits (documenting test below).
 *
 * @license BSD-3-Clause
 */

import { render, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { DesignSystemTab } from "../DesignSystemTab";
import { TokenRegistryProvider } from "../../state/TokenRegistryContext";
import { StylePresetRegistryProvider } from "../../state/StylePresetRegistryContext";
import { DSModeProvider } from "../../state/DSModeContext";
import { ToastProvider } from "@/editor/shared/vibcoder";
import { CURRENT_SCHEMA_VERSION } from "../../migrations";

type ComposerProp = NonNullable<Parameters<typeof DesignSystemTab>[0]["composer"]>;

function makeFakeComposer(designTokens: unknown[] = []) {
  const settings: Record<string, unknown> = {
    designTokens,
    designTokensSchemaVersion: 2,
  };
  const handlers = new Map<string, Set<(...a: unknown[]) => void>>();
  return {
    getProjectSettings: () => settings,
    setProjectSettings: (next: Record<string, unknown>) => Object.assign(settings, next),
    on: (e: string, h: (...a: unknown[]) => void) => {
      if (!handlers.has(e)) handlers.set(e, new Set());
      handlers.get(e)!.add(h);
    },
    off: (e: string, h: (...a: unknown[]) => void) => {
      handlers.get(e)?.delete(h);
    },
    emit: (e: string, ...a: unknown[]) => {
      handlers.get(e)?.forEach((h) => h(...a));
    },
    elements: { getAll: () => [], getAllElements: () => [] },
    dsLinter: { lint: () => [] },
    settings,
  } as unknown as ComposerProp;
}

const PROJECT_ID = "guard-apply-test";

const wrap = (ui: React.ReactNode) => (
  <ToastProvider>
    <DSModeProvider initialMode="pro">
      <TokenRegistryProvider projectId={PROJECT_ID}>
        <StylePresetRegistryProvider projectId={PROJECT_ID}>{ui}</StylePresetRegistryProvider>
      </TokenRegistryProvider>
    </DSModeProvider>
  </ToastProvider>
);

beforeEach(() => {
  localStorage.clear();
});

async function renderTab(composer: ComposerProp) {
  const utils = render(wrap(<DesignSystemTab composer={composer} />));
  const radiusInput = (await waitFor(
    () => utils.getByLabelText("Small radius value") as HTMLInputElement
  ))!;
  return { ...utils, radiusInput };
}

function sectionTab(utils: ReturnType<typeof render>, label: string): HTMLButtonElement {
  const tab = utils.getAllByRole("tab").find((t) => t.textContent?.startsWith(label));
  if (!tab) throw new Error(`section tab ${label} not found`);
  return tab as HTMLButtonElement;
}

describe("DesignSystemTab — section switching (clean)", () => {
  it("switches sections directly when nothing is dirty — no guard modal", async () => {
    const composer = makeFakeComposer();
    const utils = await renderTab(composer);

    fireEvent.click(sectionTab(utils, "Styles"));

    expect(utils.queryByText("Unsaved changes")).toBeNull();
    await waitFor(() => {
      expect(document.getElementById("design-tabpanel-styles")).toBeTruthy();
      expect(document.getElementById("design-tabpanel-tokens")).toBeNull();
    });
  });

  it("clicking the already-active section is a no-op", async () => {
    const composer = makeFakeComposer();
    const utils = await renderTab(composer);
    fireEvent.click(sectionTab(utils, "Tokens"));
    expect(document.getElementById("design-tabpanel-tokens")).toBeTruthy();
    expect(utils.queryByText("Unsaved changes")).toBeNull();
  });
});

describe("DesignSystemTab — dirty guard (TabGuardModal)", () => {
  it("switching sections with unsaved edits opens the guard and blocks the switch", async () => {
    const composer = makeFakeComposer();
    const utils = await renderTab(composer);

    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    fireEvent.click(sectionTab(utils, "Styles"));

    expect(await utils.findByText("Unsaved changes")).toBeTruthy();
    // Still on Tokens — the switch was intercepted.
    expect(document.getElementById("design-tabpanel-tokens")).toBeTruthy();
    expect(document.getElementById("design-tabpanel-styles")).toBeNull();
  });

  it("'Stay' keeps the section, the modal closes, and the edit survives", async () => {
    const composer = makeFakeComposer();
    const utils = await renderTab(composer);

    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    fireEvent.click(sectionTab(utils, "Styles"));
    await utils.findByText("Unsaved changes");

    fireEvent.click(utils.getByText("Stay"));

    expect(utils.queryByText("Unsaved changes")).toBeNull();
    expect(document.getElementById("design-tabpanel-tokens")).toBeTruthy();
    expect((utils.getByLabelText("Small radius value") as HTMLInputElement).value).toBe("10px");
  });

  it("'Discard Tokens' reverts token edits and completes the switch", async () => {
    const composer = makeFakeComposer();
    const utils = await renderTab(composer);
    const original = utils.radiusInput.value;

    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    fireEvent.click(sectionTab(utils, "Styles"));
    await utils.findByText("Unsaved changes");

    fireEvent.click(utils.getByText("Discard Tokens"));

    await waitFor(() => {
      expect(document.getElementById("design-tabpanel-styles")).toBeTruthy();
    });

    // Coming back to Tokens must NOT re-trigger the guard (clean again) and
    // the input must show the pre-edit value.
    fireEvent.click(sectionTab(utils, "Tokens"));
    expect(utils.queryByText("Unsaved changes")).toBeNull();
    await waitFor(() => {
      expect((utils.getByLabelText("Small radius value") as HTMLInputElement).value).toBe(original);
    });
  });

  it.todo(
    "§2-B13: guard Discard (handleGuardDiscard) and footer Discard (handleDiscard) call discardAll on the 14 token registries only — the 11 STYLE PRESET registries keep their dirty edits, so 'Discard' leaves preset changes staged and the Styles dot lit"
  );
});

describe("DesignSystemTab — Apply pipeline (via guard 'Save and switch')", () => {
  it("persists tokens + presets + schema version through composer.setProjectSettings and clears dirty", async () => {
    const composer = makeFakeComposer();
    const setSpy = vi.spyOn(composer, "setProjectSettings");
    const utils = await renderTab(composer);

    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    fireEvent.click(sectionTab(utils, "Styles"));
    await utils.findByText("Unsaved changes");

    fireEvent.click(utils.getByText("Save and switch"));

    await waitFor(() => expect(setSpy).toHaveBeenCalledTimes(1));
    const arg = setSpy.mock.calls[0][0] as {
      designTokens: Array<{ id: string; value: string; category: string }>;
      designTokensSchemaVersion: number;
      designPresets: Array<{ id: string; category: string; bindings: unknown }>;
    };

    // Edited radius kind token persisted.
    const radiusRecord = arg.designTokens.find(
      (t) => t.id === "radius-sm" && t.value === "10px"
    );
    expect(radiusRecord).toBeDefined();
    // Version stamp + preset fan-out (S2) ride the same settings write.
    expect(arg.designTokensSchemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(Array.isArray(arg.designPresets)).toBe(true);
    expect(arg.designPresets.length).toBeGreaterThan(0);

    // Switch completed + success toast + dirty cleared.
    await waitFor(() => {
      expect(document.getElementById("design-tabpanel-styles")).toBeTruthy();
    });
    expect(await utils.findByText("Design tokens applied successfully")).toBeTruthy();
    await waitFor(() => {
      expect(document.querySelector('[aria-label="unsaved changes"]')).toBeNull();
    });
  });

  it("shows the error toast and stays recoverable when setProjectSettings throws", async () => {
    const composer = makeFakeComposer();
    vi.spyOn(composer, "setProjectSettings").mockImplementation(() => {
      throw new Error("boom");
    });
    const utils = await renderTab(composer);

    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    fireEvent.click(sectionTab(utils, "Styles"));
    await utils.findByText("Unsaved changes");
    fireEvent.click(utils.getByText("Save and switch"));

    expect(await utils.findByText("Failed to apply tokens. Try again.")).toBeTruthy();
  });
});

describe("DesignSystemTab — §2-B1 engine undo wipes unsaved DS edits (pinned)", () => {
  it("documents the bug: history:undo triggers loadFromComposer, which replaces staged edits with stored settings", async () => {
    // Stored settings carry radius-sm at its default 4px so the load path
    // takes the designTokens branch (non-empty) and hydrates all kinds.
    const composer = makeFakeComposer([
      {
        id: "radius-sm",
        name: "Small radius",
        value: "4px",
        category: "layout",
        cssVar: "--bd-radius-sm",
        type: "length",
      },
    ]);
    const utils = await renderTab(composer);

    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    await waitFor(() => {
      expect(document.querySelector('[aria-label="unsaved changes"]')).toBeTruthy();
    });

    // Engine-level undo (canvas action) — nothing to do with the DS tab.
    act(() => {
      (composer as unknown as { emit: (e: string) => void }).emit("history:undo");
    });

    // ← current behavior: the staged 10px edit is gone, silently.
    await waitFor(() => {
      expect((utils.getByLabelText("Small radius value") as HTMLInputElement).value).toBe("4px");
      expect(document.querySelector('[aria-label="unsaved changes"]')).toBeNull();
    });
  });

  it.todo(
    "§2-B1 fix: history:undo/redo reload should preserve (or merge-warn about) unsaved DS-tab edits instead of silently wiping them — flip the documenting test above when fixed"
  );
});
