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
import { installDomShims, makeFakeComposer, openPage, renderOnRadius, renderWorkspace } from "./brandWorkspaceHarness";
import { requestBrandToken } from "../brandOpenRequest";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken } from "@/engine/designSystem/types";

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

  it("import writes a modified colour token to the site at once — one write, no draft", async () => {
    const composer = makeFakeComposer();
    const utils = renderWorkspace(composer);
    openPage(utils, "export");

    // ID collision → default "replace" strategy → applyCount=1.
    await importViaPaste(utils, COLOR_PAYLOAD("color-primary", "Primary", "#FF00AA"));

    // G3-123: no status pill band — the import toast says it.
    expect(await utils.findByText(/^Imported · /)).toBeTruthy();
    expect(utils.queryByTestId("brand-section-status-imported")).toBeNull();
    expect(utils.queryByTestId("brand-section-status")).toBeNull();
    expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(1);
    expect(resolveTokenLiteral(composer.settings.designTokens as DesignToken[], "color-primary", "light")).toBe("#FF00AA");
    expect(utils.queryByText("Unsaved brand changes")).toBeNull();
  });

  it("ADD via import lands the new token in the site's tokens", async () => {
    const composer = makeFakeComposer();
    const utils = renderWorkspace(composer);
    openPage(utils, "export");

    await importViaPaste(utils, COLOR_PAYLOAD("color-brand-new", "Brand New", "#00FF99"));

    await waitFor(() => {
      expect((composer.settings.designTokens as DesignToken[]).some((t) => t.id === "color-brand-new")).toBe(true);
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

  /* L5-019: the flag is a build-wide switch, not a workspace setting, so the
     tooltip blamed the workspace for something no one in it can change. */
  it("flag off: the reason says it is coming, not that the workspace is off", () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(false);
    const utils = renderWorkspace(makeAiComposer());
    openComponents(utils);
    expect(utils.queryByText(/switched on for this workspace/)).toBeNull();
    expect(utils.getByText(/Coming soon/)).toBeTruthy();
  });
});

describe("BrandWorkspace › the Light / Dark switch is preview-only (L4-021, BRP1-M8)", () => {
  /** A site in the given Dark mode whose composer has the preview layer and
   *  a colorMode spy — the switch must never touch the latter. */
  function makePreviewComposer(darkMode: "off" | "auto") {
    const composer = makeFakeComposer();
    composer.settings.darkMode = darkMode;
    const colorMode = { get: vi.fn(() => "light"), set: vi.fn(), resolved: vi.fn(() => "light") };
    const ds = composer.designSystem as unknown as { preview: unknown; setPreview: (p: unknown) => void };
    ds.preview = null;
    ds.setPreview = (p: unknown) => {
      ds.preview = p;
      composer.emit("brand:preview-changed");
    };
    Object.assign(composer, { colorMode });
    return { composer, colorMode, ds };
  }

  it("Dark paints the saved brand dark through the preview layer; nothing is saved, nothing enters ⌘Z", () => {
    const { composer, colorMode, ds } = makePreviewComposer("auto");
    const before = JSON.stringify(composer.settings);
    const utils = renderWorkspace(composer);
    expect(utils.getByTestId("brand-live-preview").contains(utils.getByTestId("brand-colour-mode-seg"))).toBe(true);
    act(() => {
      fireEvent.click(utils.getByTestId("brand-colour-mode-seg-dark"));
    });
    expect(ds.preview).toMatchObject({ theme: "dark", darkMode: "auto" });
    expect(utils.getByTestId("brand-panel").getAttribute("data-ds-preview")).toBe("dark");
    expect(colorMode.set).not.toHaveBeenCalled();
    expect(composer.designSystem.setTokens).not.toHaveBeenCalled();
    expect(JSON.stringify(composer.settings)).toBe(before);
    act(() => {
      fireEvent.click(utils.getByTestId("brand-colour-mode-seg-light"));
    });
    expect(ds.preview).toBeNull();
    expect(utils.getByTestId("brand-panel").getAttribute("data-ds-preview")).toBe("light");
  });

  it("closing Brand mid-preview puts the canvas back to the saved brand", () => {
    const { composer, ds } = makePreviewComposer("auto");
    const utils = renderWorkspace(composer);
    act(() => {
      fireEvent.click(utils.getByTestId("brand-colour-mode-seg-dark"));
    });
    utils.unmount();
    expect(ds.preview).toBeNull();
  });

  it("an Off site previews light only: Dark is disabled (8224:241285)", () => {
    const { composer } = makePreviewComposer("off");
    const utils = renderWorkspace(composer);
    expect(utils.getByTestId("brand-panel").getAttribute("data-ds-preview")).toBe("light");
    expect((utils.getByTestId("brand-colour-mode-seg-dark") as HTMLButtonElement).disabled).toBe(true);
  });

  it("turning Dark mode Off mid-preview drops the preview to light", () => {
    const { composer, ds } = makePreviewComposer("auto");
    const utils = renderWorkspace(composer);
    act(() => {
      fireEvent.click(utils.getByTestId("brand-colour-mode-seg-dark"));
    });
    act(() => {
      composer.setProjectSettings({ darkMode: "off" });
    });
    expect(ds.preview).toBeNull();
    expect(utils.getByTestId("brand-panel").getAttribute("data-ds-preview")).toBe("light");
  });
});

describe("BrandWorkspace › Component styles — a section row hands off to Add › Blocks", () => {
  it("clean: closes Brand, switches to Add and asks for BLOCKS", () => {
    const composer = makeFakeComposer();
    const onClose = vi.fn();
    const utils = renderWorkspace(composer, { onClose });
    act(() => openPage(utils, "component-styles"));
    const row = utils.container.querySelector<HTMLElement>("[data-section-row]")!;
    fireEvent.click(row);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(composer.emit).toHaveBeenCalledWith("ui:switch-tab", { tab: "add" });
    expect(composer.emit).toHaveBeenCalledWith("ui:insert-open-group", { group: "blocks" });
  });

  it("after an edit it still hands off at once — nothing is staged to guard", async () => {
    const composer = makeFakeComposer();
    const onClose = vi.fn();
    const utils = await renderOnRadius(composer, { onClose });
    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    fireEvent.blur(utils.radiusInput);
    act(() => openPage(utils, "component-styles"));
    fireEvent.click(utils.container.querySelector<HTMLElement>("[data-section-row]")!);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(composer.emit).toHaveBeenCalledWith("ui:switch-tab", { tab: "add" });
  });
});

/* G3-156: the inspector's bound chip opens Brand ON its token. */
describe("BrandWorkspace — opens on a requested token", () => {
  it("a pending chip request lands on the token's page with its card open", async () => {
    const composer = makeFakeComposer();
    requestBrandToken(composer, "radius-sm");
    const utils = renderWorkspace(composer);
    await waitFor(() => expect(utils.getByTestId("brand-page-title").textContent).toBe("Radius"));
    expect(utils.container.querySelector('[data-token-row="radius-sm"]')?.getAttribute("aria-selected")).toBe("true");
    // Read once: a second mount lands on the default page.
    utils.unmount();
    const again = renderWorkspace(composer);
    expect(again.getByTestId("brand-page-title").textContent).toBe("Colours");
  });
});

describe("BrandWorkspace › Brand from logo or website (BRP1-M11)", () => {
  it("Starters opens it behind dsAi; the Starters row stays current and the guide card sits in the preview column", async () => {
    const utils = renderWorkspace(makeFakeComposer());
    openPage(utils, "starters");
    fireEvent.click(await waitFor(() => utils.getByTestId("starter-row-from-source")));
    expect(utils.getByTestId("brand-page-title").textContent).toBe("Brand from logo or website");
    expect(utils.getByTestId("brand-row-starters").getAttribute("aria-current")).toBe("page");
    expect(utils.getByTestId("brand-from-source")).toBeTruthy();
    expect(utils.getByTestId("brand-from-source-guide")).toBeTruthy();
  });

  it("is not offered when dsAi is off", async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(false);
    const utils = renderWorkspace(makeFakeComposer());
    openPage(utils, "starters");
    await waitFor(() => utils.getByTestId("starter-list"));
    expect(utils.queryByTestId("starter-row-from-source")).toBeNull();
    openPage(utils, "colours");
    expect(utils.queryByTestId("brand-colours-from-source")).toBeNull();
  });

  it("Colours' actions row offers it as 'From logo or URL' (8222:232627)", () => {
    const utils = renderWorkspace(makeFakeComposer());
    const action = utils.getByTestId("brand-colours-from-source");
    expect(action.textContent).toBe("From logo or URL");
    expect(utils.getByTestId("brand-colours-actions").lastElementChild).toBe(action);
    fireEvent.click(action);
    expect(utils.getByTestId("brand-page-title").textContent).toBe("Brand from logo or website");
    expect(utils.getByTestId("brand-from-source")).toBeTruthy();
  });
});
