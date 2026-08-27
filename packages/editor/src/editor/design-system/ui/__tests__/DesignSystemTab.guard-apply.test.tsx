/**
 * DesignSystemTab — section switching, unsaved-edit survival, and the Apply
 * pipeline (composer.setProjectSettings + persist + markSaved fan-out).
 *
 * The navigation guard this file used to pin was REMOVED on 2026-08-25. Its
 * premise was false: `TokenRegistryProvider` sits above the whole sidebar
 * (`StudioPanels.tsx:384`), so staged edits survive a section change and even a
 * full unmount — navigating away never lost anything. What the guard did
 * instead was wedge the panel after a token import, because importing stages
 * tokens, which makes the panel dirty, after which every navigation (Back
 * included) opened a modal that renders clipped inside the panel. The tests
 * below now pin the real contract: you can navigate while dirty, and the edit
 * is still there when you come back.
 *
 * The Apply pipeline is exercised through the footer's "Apply Changes" ->
 * ReviewModal confirm, which is the only route a user has.
 *
 * Also pins one §2 bug:
 *   - §2-B13 footer Discard only resets the 14 TOKEN registries and
 *     skips the 11 preset registries (it.todo below).
 *   - §2-B1 engine history:undo / history:redo trigger loadFromComposer(),
 *     which wipes unsaved DS-tab edits (documenting test below).
 *
 * @license BSD-3-Clause
 */

import { render, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { APPLY_CHANGES_LABEL } from "../DesignTabFooter";
import { DesignSystemTab } from "../DesignSystemTab";
import { TokenRegistryProvider } from "../../state/TokenRegistryContext";
import { StylePresetRegistryProvider, useButtonPresets } from "../../state/StylePresetRegistryContext";
import { DSModeProvider } from "../../state/DSModeContext";
import { ToastProvider } from "@/editor/chrome-ui";
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

/* M5: Brand opens on the root drill-in list, so reaching the Tokens controls
   is now an explicit navigation step rather than the default mount. */
/* Tokens is a drill-in now (board 152:52): the destination lists KINDS and the
   radius control lives one level further in. */
function enterKind(utils: ReturnType<typeof render>, kind: string) {
  const row = utils.container.querySelector<HTMLButtonElement>(`[data-kind-id="${kind}"]`);
  if (!row) throw new Error(`token kind row ${kind} not found`);
  fireEvent.click(row);
}

async function renderTab(composer: ComposerProp) {
  const utils = render(wrap(<DesignSystemTab composer={composer} />));
  enterSection(utils, "tokens");
  enterKind(utils, "radius");
  const radiusInput = (await waitFor(
    () => utils.getByLabelText("Small radius value") as HTMLInputElement
  ))!;
  return { ...utils, radiusInput };
}

/* Switching sections is two moves: leave to the root, then enter the next
   destination. The crumb walks ONE level, so from inside a token kind that is
   two clicks to the Brand root — out of the kind, then out of Tokens. */
function leaveToRoot(utils: ReturnType<typeof render>) {
  for (let i = 0; i < 3; i++) {
    if (utils.container.querySelector("[data-section-id]")) return;   // at root
    const crumb = utils.container.querySelector<HTMLButtonElement>("[data-crumb-back]");
    if (!crumb) return;
    fireEvent.click(crumb);
  }
}

function enterSection(utils: ReturnType<typeof render>, id: string) {
  const row = utils.container.querySelector<HTMLButtonElement>(`[data-section-id="${id}"]`);
  if (!row) throw new Error(`Brand root row ${id} not found`);
  fireEvent.click(row);
}

function switchSection(utils: ReturnType<typeof render>, id: string) {
  leaveToRoot(utils);
  enterSection(utils, id);
}

describe("DesignSystemTab — section switching (clean)", () => {
  it("switches sections directly when nothing is dirty", async () => {
    const composer = makeFakeComposer();
    const utils = await renderTab(composer);

    switchSection(utils, "styles");

    expect(utils.queryByText("Unsaved changes")).toBeNull();
    await waitFor(() => {
      expect(document.getElementById("design-section-styles")).toBeTruthy();
      expect(document.getElementById("design-section-tokens")).toBeNull();
    });
  });

  it("re-entering the section just left works", async () => {
    const composer = makeFakeComposer();
    const utils = await renderTab(composer);
    switchSection(utils, "tokens");
    expect(document.getElementById("design-section-tokens")).toBeTruthy();
    expect(utils.queryByText("Unsaved changes")).toBeNull();
  });
});

describe("DesignSystemTab — navigating with unsaved edits", () => {
  it("leaving a dirty section reaches the root instead of being intercepted", async () => {
    const composer = makeFakeComposer();
    const utils = await renderTab(composer);

    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    leaveToRoot(utils);

    /* This used to assert the opposite — that the move was blocked and a
       modal appeared. Nothing on this path discards anything, so blocking it
       protected nothing and wedged the panel after an import. */
    await waitFor(() => {
      expect(utils.container.querySelector("[data-section-id]")).toBeTruthy();
    });
    expect(utils.queryByText("Unsaved changes")).toBeNull();
  });

  it("the edit survives the trip out to the root and back", async () => {
    const composer = makeFakeComposer();
    const utils = await renderTab(composer);

    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    leaveToRoot(utils);
    enterSection(utils, "styles");
    expect(document.getElementById("design-section-styles")).toBeTruthy();

    switchSection(utils, "tokens");
    enterKind(utils, "radius");
    await waitFor(() => {
      expect((utils.getByLabelText("Small radius value") as HTMLInputElement).value).toBe("10px");
    });
  });

  it("footer Discard reverts a dirty TOKEN and the dirty signal clears", async () => {
    const composer = makeFakeComposer();
    const utils = await renderTab(composer);
    const original = utils.radiusInput.value;

    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    await utils.findByText("Unsaved brand changes");

    fireEvent.click(utils.getByText("Discard"));

    await waitFor(() => {
      expect((utils.getByLabelText("Small radius value") as HTMLInputElement).value).toBe(original);
    });
    expect(utils.queryByText("Unsaved brand changes")).toBeNull();
  });

  // §2-B13 (FIXED): guard Discard (handleGuardDiscard) and footer Discard
  // (handleDiscard) now call discardAll on the 11 STYLE PRESET registries as
  // well as the 14 token registries, so a preset-only dirty state is reverted
  // and the Styles tab dot clears.
  it("footer Discard reverts a dirty STYLE PRESET so the dirty signal clears", async () => {
    const composer = makeFakeComposer();

    // Capture the button-preset registry (shared context) so the test can
    // dirty it the way a future binding editor would.
    let buttonReg: ReturnType<typeof useButtonPresets> | null = null;
    function Capture() {
      buttonReg = useButtonPresets();
      return null;
    }

    const utils = render(
      wrap(
        <>
          <Capture />
          <DesignSystemTab composer={composer} />
        </>,
      ),
    );
    enterSection(utils, "tokens");
    enterKind(utils, "radius");
    await waitFor(() => utils.getByLabelText("Small radius value"));

    /* The per-section dirty DOT moved from the tab bar to the root row, so it
       is only readable at the root — and you cannot walk back to the root while
       dirty, because that is precisely the move the guard intercepts. The
       always-visible signal inside a section is the footer ("Unsaved brand
       changes" / "Brand is up to date"), which is what this test reads. That is not a
       weaker assertion: it is the one a user actually has in front of them
       while editing. */

    // Dirty a PRESET (not a token) — the Styles side goes dirty.
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

    // Footer Discard must revert the preset registry too (§2-B13 fix).
    fireEvent.click(utils.getByText("Discard"));

    await waitFor(() => {
      expect(utils.getByText("Brand is up to date")).toBeTruthy();
    });
    expect(buttonReg!.isDirty).toBe(false);
  });
});

/* The guard's "Save and switch" was this file's route into handleApply, and it
   is gone with the guard. The route below is the one a user actually has:
   the footer's primary button -> ReviewModal -> "Apply N changes". */
async function applyViaFooter(utils: ReturnType<typeof render>) {
  /* Read the label from the constant rather than spelling it: it moved from
     "Apply Changes" to board 154:78's "Save" on 2026-08-27, and a test that
     hard-codes copy breaks on every wording decision instead of on behaviour.
     The label appears more than once in the tree, so scope to the savebar. */
  const bar = utils.container.querySelector('[data-screen-savebar="true"]');
  if (!bar) throw new Error("footer savebar not rendered");
  const applyBtn = [...bar.querySelectorAll("button")].find(
    (b) => (b.textContent || "").trim() === APPLY_CHANGES_LABEL,
  );
  if (!applyBtn) throw new Error(`footer ${APPLY_CHANGES_LABEL} not found`);
  fireEvent.click(applyBtn);
  fireEvent.click(await utils.findByText(/^Apply \d+ changes?$/));
}

describe("DesignSystemTab — Apply pipeline (footer -> ReviewModal)", () => {
  it("persists tokens + presets + schema version through composer.setProjectSettings and clears dirty", async () => {
    const composer = makeFakeComposer();
    const setSpy = vi.spyOn(composer, "setProjectSettings");
    const utils = await renderTab(composer);

    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    await applyViaFooter(utils);

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

    // Success toast + dirty cleared. Applying from the footer does NOT move
    // you — that was the guard's behaviour, and it is gone.
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
    await applyViaFooter(utils);

    expect(await utils.findByText("Failed to apply tokens. Try again.")).toBeTruthy();
  });
});

describe("DesignSystemTab — §2-B1 engine undo preserves unsaved DS edits (fixed)", () => {
  it("history:undo does NOT wipe staged DS-tab edits when the tab is dirty", async () => {
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
      expect(utils.getByText("Unsaved brand changes")).toBeTruthy();
    });

    // Engine-level undo (canvas action) — nothing to do with the DS tab.
    act(() => {
      (composer as unknown as { emit: (e: string) => void }).emit("history:undo");
    });

    // The dirty guard keeps the staged 10px edit and the unsaved-changes dot;
    // the canvas undo does not silently reload stored settings over them.
    await waitFor(() => {
      expect((utils.getByLabelText("Small radius value") as HTMLInputElement).value).toBe("10px");
      expect(utils.getByText("Unsaved brand changes")).toBeTruthy();
    });
  });

  it("history:undo still reloads from settings when the tab is clean (no staged edits to protect)", async () => {
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

    // No edits → clean. A canvas undo may safely reload; nothing is wiped.
    act(() => {
      (composer as unknown as { emit: (e: string) => void }).emit("history:undo");
    });

    await waitFor(() => {
      expect((utils.getByLabelText("Small radius value") as HTMLInputElement).value).toBe("4px");
      expect(document.querySelector('[aria-label="unsaved changes"]')).toBeNull();
    });
  });
});
