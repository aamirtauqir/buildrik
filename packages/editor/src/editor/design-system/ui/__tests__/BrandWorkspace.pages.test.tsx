/**
 * BrandWorkspace — the pages the drawer's sections became. Ported from
 * `DesignSystemTab.export-section`, `.styles-section`, `.ai-entry` and
 * `.dark-preview` when the drawer was replaced by the workspace (C1 (i)).
 *
 * @license BSD-3-Clause
 */

import { fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIAssistService } from "../../../../engine/designSystem/services/AIAssistService";
import { EventEmitter } from "../../../../engine/EventEmitter";
import { isFeatureEnabled } from "@/shared/utils/featureFlags";
import { installDomShims, makeFakeComposer, openPage, renderWorkspace } from "./brandWorkspaceHarness";

/* The AI entry is gated on the SAME flag that decides whether an AIClient is
   built at all (useComposerInit.ts:132). Default the mock ON so the entry
   tests exercise the wired path; the flag-off test flips it. */
vi.mock("@/shared/utils/featureFlags", () => ({
  isFeatureEnabled: vi.fn(() => true),
}));

beforeEach(() => {
  vi.mocked(isFeatureEnabled).mockReturnValue(true);
  installDomShims();
  if (typeof URL.createObjectURL !== "function") {
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: () => "blob:mock" });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: () => undefined });
  }
});

const COLOR_PAYLOAD = (id: string, name: string, value: string) =>
  JSON.stringify([
    { id, name, value, category: "colors", cssVar: `--buildrick-design-${id}`, type: "color", kind: "color" },
  ]);

/* D4 rewrite: drop-zone primary, paste textarea collapsed. Expand paste →
   Parse → "Apply N valid only". */
async function importViaPaste(utils: ReturnType<typeof renderWorkspace>, payload: string) {
  fireEvent.click(utils.getByText(/or paste JSON/i));
  fireEvent.change(utils.getByLabelText(/Paste JSON/i), { target: { value: payload } });
  fireEvent.click(utils.getByText(/^Parse$/i));
  await utils.findByText(/Apply 1 valid only/i);
  fireEvent.click(utils.getByText(/Apply 1 valid only/i));
}

describe("BrandWorkspace › Import / export", () => {
  it("4418:168885: a panel with its own title and ✕ — no page header, no preview column", async () => {
    const utils = renderWorkspace(makeFakeComposer());
    openPage(utils, "export");
    const card = await waitFor(() => utils.getByTestId("brand-io-card"));
    expect(card.contains(utils.getByTestId("brand-page-title"))).toBe(true);
    expect(utils.queryByTestId("brand-preview-column")).toBeNull();
    expect(utils.getByTestId("import-drop-zone").textContent).toContain("Drop tokens.json — JSON only");
    fireEvent.click(utils.getByTestId("brand-io-close"));
    expect(utils.getByTestId("brand-page-title").textContent).toBe("Colours");
  });

  it("4418:168885: Dark strategy, EXPORT and IMPORT share one panel, above the preview", async () => {
    const utils = renderWorkspace(makeFakeComposer());
    openPage(utils, "export");
    const card = await waitFor(() => utils.getByTestId("brand-io-card"));
    expect(card.contains(utils.getByTestId("brand-export-dark-row"))).toBe(true);
    expect(card.contains(utils.getByTestId("brand-export-head"))).toBe(true);
    expect(card.contains(utils.getByTestId("brand-import-head"))).toBe(true);
    const preview = utils.getByTestId("export-preview");
    // 4418:168885: the Preview sits inside the panel, after IMPORT.
    expect(card.contains(preview)).toBe(true);
    expect(utils.getByTestId("brand-import-head").compareDocumentPosition(preview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows the import card + export preview", async () => {
    const composer = makeFakeComposer();
    const utils = renderWorkspace(composer);
    openPage(utils, "export");

    await waitFor(() => {
      expect(utils.getByTestId("export-preview")).toBeTruthy();
    });
    // Board 153:120 heads the block "IMPORT", a caps section header matching EXPORT.
    expect(utils.getAllByText("IMPORT").length).toBeGreaterThan(0);
    expect(utils.getByText(/Custom properties/i)).toBeTruthy();
  });

  it("import flow stages a modified colour token and lights the dirty signal", async () => {
    const composer = makeFakeComposer();
    const utils = renderWorkspace(composer);
    openPage(utils, "export");

    // ID collision → default "replace" strategy → applyCount=1.
    await importViaPaste(utils, COLOR_PAYLOAD("color-primary", "Primary", "#FF00AA"));

    await waitFor(() => {
      expect(utils.getByText("Unsaved brand changes")).toBeTruthy();
    });
    expect(utils.getByTestId("brand-section-status-imported")).toBeTruthy();
  });

  it("ADD via import lights the dirty marker (adds count, not just modifications)", async () => {
    const composer = makeFakeComposer();
    const utils = renderWorkspace(composer);
    openPage(utils, "export");

    await importViaPaste(utils, COLOR_PAYLOAD("color-brand-new", "Brand New", "#00FF99"));

    await waitFor(() => {
      expect(utils.getByText("Unsaved brand changes")).toBeTruthy();
    });
  });

  /* C5 G3-149: the greyed "Figma Variables JSON — Coming soon" row is gone
     (4418:168885 omits it); the three live formats each keep a Download. */
  it("offers three formats and no Figma row", async () => {
    const composer = makeFakeComposer();
    const utils = renderWorkspace(composer);
    openPage(utils, "export");

    await waitFor(() => expect(utils.getByTestId("format-row-css")).toBeTruthy());
    expect(utils.container.textContent).not.toMatch(/Figma Variables JSON|Coming soon/);
    expect(utils.container.querySelector('[data-download-format="figma"]')).toBeNull();
    for (const id of ["css", "json", "tailwind"]) {
      expect(utils.container.querySelector(`[data-download-format="${id}"]`)).toBeTruthy();
    }
  });
});

describe("BrandWorkspace › Presets (StylesSection drill-in)", () => {
  it("shows the list view with 11 category rows", async () => {
    const composer = makeFakeComposer();
    const utils = renderWorkspace(composer);
    openPage(utils, "presets");

    await waitFor(() => {
      expect(utils.container.querySelector("[data-styles-router]")).toBeTruthy();
      expect(utils.container.querySelector("[data-list-view]")).toBeTruthy();
      expect(utils.container.querySelectorAll("[data-category-row]").length).toBe(11);
      expect(utils.container.querySelector("[data-preset-detail-pane]")).toBeNull();
    });
  });

  it("clicking the Card category row drills into Card detail view", async () => {
    const composer = makeFakeComposer();
    const utils = renderWorkspace(composer);
    openPage(utils, "presets");

    const cardRow = (await waitFor(() =>
      utils.container.querySelector('[data-category-row="card"]'),
    )) as HTMLButtonElement;
    fireEvent.click(cardRow);

    await waitFor(() => {
      expect(utils.container.querySelector("[data-detail-view]")).toBeTruthy();
      const pane = utils.container.querySelector("[data-preset-detail-pane]") as HTMLElement;
      expect(pane.getAttribute("data-category")).toBe("card");
    });
  });
});

describe("BrandWorkspace › Component styles — AI assist entry", () => {
  function makeAiComposer() {
    const composer = makeFakeComposer();
    const events = new EventEmitter();
    Object.assign(composer, {
      colorMode: { get: vi.fn(() => "light"), set: vi.fn(), resolved: vi.fn(() => "light") },
      aiAssistService: new AIAssistService(events, { generate: vi.fn() }),
    });
    return composer;
  }

  function openComponents(utils: ReturnType<typeof renderWorkspace>) {
    act(() => {
      openPage(utils, "component-styles");
    });
    return utils.container.querySelector<HTMLButtonElement>("[data-open-ai-assist]")!;
  }

  it("the page offers the AI entry as its header action (7316:82755)", () => {
    const utils = renderWorkspace(makeAiComposer());
    const btn = openComponents(utils);
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain("Generate with AI");
    expect(btn.getAttribute("data-testid")).toBe("brand-page-action");
    expect(utils.getByTestId("brand-page-body").contains(btn)).toBe(false);
  });

  it("clicking the button opens AIPromptModal with the composer's service", () => {
    const utils = renderWorkspace(makeAiComposer());
    expect(utils.queryByText("Generate component with AI")).toBeNull();

    const btn = openComponents(utils);
    act(() => {
      fireEvent.click(btn);
    });

    expect(utils.getByText("Generate component with AI")).toBeTruthy();
    expect(utils.getByLabelText("Component description")).toBeTruthy();
    expect(utils.getByText("Generate")).toBeTruthy();
  });

  it("flag off: the entry is blocked and cannot open the modal", () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(false);
    const utils = renderWorkspace(makeAiComposer());
    const btn = openComponents(utils);

    expect(btn.getAttribute("aria-disabled")).toBe("true");
    act(() => {
      fireEvent.click(btn);
    });
    expect(utils.queryByText("Generate component with AI")).toBeNull();
  });
});

describe("BrandWorkspace › dark preview chrome (T10)", () => {
  function makeModeComposer(initial: "light" | "dark") {
    let resolved = initial;
    const composer = makeFakeComposer();
    const colorMode = {
      get: vi.fn(() => resolved),
      set: vi.fn((next: "light" | "dark") => {
        resolved = next;
        composer.emit("colorMode:changed", { mode: next, resolved: next });
      }),
      resolved: vi.fn(() => resolved),
    };
    Object.assign(composer, { colorMode });
    return { composer, colorMode };
  }

  it("initial light / dark mode: the root carries data-ds-preview", () => {
    for (const mode of ["light", "dark"] as const) {
      const { composer } = makeModeComposer(mode);
      const utils = renderWorkspace(composer);
      expect(utils.getByTestId("brand-panel").getAttribute("data-ds-preview")).toBe(mode);
      utils.unmount();
    }
  });

  it("colorMode:changed light→dark: attribute flips", () => {
    const { composer, colorMode } = makeModeComposer("light");
    const utils = renderWorkspace(composer);
    expect(utils.getByTestId("brand-panel").getAttribute("data-ds-preview")).toBe("light");

    act(() => {
      colorMode.set("dark");
    });

    expect(utils.getByTestId("brand-panel").getAttribute("data-ds-preview")).toBe("dark");
  });

  it("Colour mode (7316:80949): the Light / Dark switch sits in the preview card, and flips it", () => {
    const { composer } = makeModeComposer("light");
    const utils = renderWorkspace(composer);
    // Only on Colour mode.
    expect(utils.queryByTestId("brand-colour-mode-seg")).toBeNull();
    openPage(utils, "colour-mode");
    const seg = utils.getByTestId("brand-colour-mode-seg");
    expect(utils.getByTestId("brand-live-preview").contains(seg)).toBe(true);
    expect(utils.getByTestId("brand-page-body").contains(seg)).toBe(false);
    act(() => {
      fireEvent.click(utils.getByTestId("brand-colour-mode-seg-dark"));
    });
    expect(utils.getByTestId("brand-panel").getAttribute("data-ds-preview")).toBe("dark");
  });

  it("unsubscribes on unmount", () => {
    const { composer } = makeModeComposer("light");
    const utils = renderWorkspace(composer);
    utils.unmount();
    expect(composer.off).toHaveBeenCalledWith("colorMode:changed", expect.any(Function));
  });
});
