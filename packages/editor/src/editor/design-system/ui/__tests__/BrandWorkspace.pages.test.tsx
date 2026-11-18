/**
 * BrandWorkspace — the pages the drawer's sections became. Ported from
 * `DesignSystemTab.export-section`, `.styles-section`, `.ai-entry` and
 * `.dark-preview` when the drawer was replaced by the workspace (C1 (i)).
 *
 * @license BSD-3-Clause
 */

import { fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { isFeatureEnabled } from "@/shared/utils/featureFlags";
import { installDomShims, makeFakeComposer, openPage, renderOnRadius, renderWorkspace } from "./brandWorkspaceHarness";
import { requestBrandToken } from "../brandOpenRequest";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken } from "@/engine/designSystem/types";

/* Brand from logo or website is gated on `dsAi`. Default the mock ON; the
   flag-off test flips it. */
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
   Parse → "Apply N valid". */
async function importViaPaste(utils: ReturnType<typeof renderWorkspace>, payload: string) {
  fireEvent.click(utils.getByText(/or paste JSON/i));
  fireEvent.change(utils.getByLabelText(/Paste JSON/i), { target: { value: payload } });
  fireEvent.click(utils.getByText(/^Parse$/i));
  await utils.findByText(/^Apply 1 valid$/);
  fireEvent.click(utils.getByText(/^Apply 1 valid$/));
}

describe("BrandWorkspace › Import / export", () => {
  it("B6-B15: an ordinary page — header, strap, preview column — with Import | Export tabs", async () => {
    const utils = renderWorkspace(makeFakeComposer());
    openPage(utils, "export");
    await waitFor(() => utils.getByTestId("brand-io-card"));
    expect(utils.getByTestId("brand-page-title").textContent).toBe("Import / export");
    expect(utils.getByTestId("brand-page-strap")).toBeTruthy();
    expect(utils.getByTestId("brand-preview-column")).toBeTruthy();
    expect(utils.getByTestId("brand-import-head").textContent).toBe("Import tokens");
    expect(utils.getByTestId("import-drop-zone").textContent).toContain("Choose JSON file");
    fireEvent.click(utils.getByTestId("brand-io-tab-export"));
    expect(utils.getByTestId("export-preview")).toBeTruthy();
  });

  it("import writes a modified colour token to the site at once — one write, no draft", async () => {
    const composer = makeFakeComposer();
    const utils = renderWorkspace(composer);
    openPage(utils, "export");

    // ID collision → default "replace" strategy → applyCount=1.
    await importViaPaste(utils, COLOR_PAYLOAD("color-primary", "Primary", "#FF00AA"));

    // G3-123: no status pill band — the import toast says it.
    expect(await utils.findByText(/^Imported \d+ tokens?\. One Undo reverts the import\./)).toBeTruthy();
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
    const utils = renderWorkspace(makeFakeComposer());
    openPage(utils, "export");
    fireEvent.click(await waitFor(() => utils.getByTestId("brand-io-tab-export")));
    expect(utils.container.textContent).not.toMatch(/Figma Variables JSON|Coming soon/);
    for (const id of ["css", "json", "tailwind"]) expect(utils.getByTestId(`format-row-${id}`)).toBeTruthy();
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

// re-baseline: Brand › Type styles · Presets — "✦ Generate with AI" removed (no AI entry points, owner 2026-10-17).
describe("BrandWorkspace › Type styles · Presets — no AI entry", () => {
  it("offers no Generate with AI", () => {
    const utils = renderWorkspace(makeFakeComposer());
    act(() => {
      openPage(utils, "styles");
    });
    expect(utils.container.querySelector("[data-open-ai-assist]")).toBeNull();
    expect(utils.queryByText(/Generate with AI/)).toBeNull();
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

  it("the canvas theme toggle's dark look (BRP1-M12) shows here and is Brand's to turn back: Light clears it", () => {
    const { composer, ds } = makePreviewComposer("auto");
    ds.setPreview({ tokens: [], darkMode: "auto", theme: "dark", source: "canvas" });
    const utils = renderWorkspace(composer);
    expect(utils.getByTestId("brand-panel").getAttribute("data-ds-preview")).toBe("dark");
    const light = utils.getByTestId("brand-colour-mode-seg-light") as HTMLButtonElement;
    expect(light.disabled).toBe(false);
    act(() => {
      fireEvent.click(light);
    });
    expect(ds.preview).toBeNull();
    expect(utils.getByTestId("brand-panel").getAttribute("data-ds-preview")).toBe("light");
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

describe("BrandWorkspace › Type styles · Presets — Browse section blocks in Add › (B6-B26)", () => {
  it("clean: closes Brand, switches to Add and asks for BLOCKS", () => {
    const composer = makeFakeComposer();
    const onClose = vi.fn();
    const utils = renderWorkspace(composer, { onClose });
    act(() => openPage(utils, "styles"));
    fireEvent.click(utils.getByTestId("brand-browse-blocks"));
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
    act(() => openPage(utils, "styles"));
    fireEvent.click(utils.getByTestId("brand-browse-blocks"));
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
    expect(again.getByTestId("brand-page-title").textContent).toMatch(/^Colors · \d+$/);
  });
});

describe("BrandWorkspace › From logo or URL (BRP1-M11, behind dsAi — authority code:dsai-flag)", () => {
  it("Starters opens it behind dsAi; the Starters row stays current and the guide card sits in the preview column", async () => {
    const utils = renderWorkspace(makeFakeComposer());
    openPage(utils, "starters");
    fireEvent.click(await waitFor(() => utils.getByTestId("starter-row-from-source")));
    expect(utils.getByTestId("brand-page-title").textContent).toBe("From logo or URL");
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
  });

  it("Colors draws only the board's two actions — the door is Starters' (B6-B01, B6-B07)", () => {
    const utils = renderWorkspace(makeFakeComposer());
    const actions = utils.getByTestId("brand-page-actions");
    expect([...actions.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["+ Add color", "Generate scale"]);
  });
});
