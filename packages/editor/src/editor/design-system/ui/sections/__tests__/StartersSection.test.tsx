/**
 * StartersSection — Brand › Starters, Figma 2L9 B6-B07…B11.
 *
 * A row opens a PREVIEW (no write); Apply takes a "starter" restore point,
 * then writes once (one ⌘Z); no restore point → nothing applied, Retry.
 */
import { render, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import * as React from "react";
import { StartersSection, starterColourChanges } from "../StartersSection";
import { TokenRegistryProvider, useColorRegistry } from "@/editor/design-system/state/TokenRegistryContext";
import { DSModeProvider } from "@/editor/design-system/state/DSModeContext";
import { ToastProvider } from "@/editor/chrome-ui";
import { STARTER_DS_REGISTRY } from "@/editor/design-system/starters";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import { validateTokens } from "@buildrik/shared/schemas/design-tokens";
import { makeFakeComposer } from "@/editor/design-system/ui/__tests__/brandWorkspaceHarness";

const take = vi.fn(async (..._a: unknown[]) => true);
vi.mock("@/editor/design-system/state/useBrandRestorePoints", () => ({ takeRestorePoint: (...a: unknown[]) => take(...a) }));
vi.mock("@/services/BuildrikSyncProvider", () => ({ getSiteIdFromUrl: () => "s1" }));

/** Reads the live colour registry from inside the provider. */
const seen: { registry?: ReturnType<typeof useColorRegistry> } = {};
const Probe: React.FC = () => {
  seen.registry = useColorRegistry();
  return null;
};

/** The fake composer plus the Brand preview slot the preview writes to. */
function makeComposer(...args: Parameters<typeof makeFakeComposer>) {
  const c = makeFakeComposer(...args);
  const ds = c.designSystem as unknown as { preview: unknown; setPreview: (p: unknown) => void };
  ds.preview = null;
  ds.setPreview = (p: unknown) => {
    ds.preview = p;
    c.emit("brand:preview-changed");
  };
  return c;
}

let composer = makeComposer();
const wrap = (ui: React.ReactNode) => (
  <ToastProvider>
    <DSModeProvider initialMode="pro">
      <TokenRegistryProvider composer={composer}>
        <Probe />
        {ui}
      </TokenRegistryProvider>
    </DSModeProvider>
  </ToastProvider>
);
const preview = () => (composer.designSystem as unknown as { preview: { tokens: unknown[] } | null }).preview;

beforeEach(() => {
  localStorage.clear();
  take.mockReset();
  take.mockResolvedValue(true);
  composer = makeComposer();
});

describe("StartersSection — list (B6-B07)", () => {
  it("says what the page is for and lists every starter as a › row", () => {
    const { getByTestId, getByText } = render(wrap(<StartersSection composer={composer} projectId="p1" />));
    expect(getByText("Choose a starting point")).toBeTruthy();
    expect(getByText("Preview a palette before applying it to your site.")).toBeTruthy();
    const list = getByTestId("starter-list");
    expect(list.querySelectorAll('[data-testid^="starter-row-"]').length).toBe(STARTER_DS_REGISTRY.length);
    const first = STARTER_DS_REGISTRY[0];
    expect(getByTestId(`starter-row-${first.id}`).getAttribute("title")).toBe(first.description);
  });

  it("ends with From logo or URL only when the caller passes the door (dsAi)", () => {
    const open = vi.fn();
    const off = render(wrap(<StartersSection composer={composer} projectId="p1" />));
    expect(off.queryByTestId("starter-row-from-source")).toBeNull();
    off.unmount();
    const on = render(wrap(<StartersSection composer={composer} projectId="p1" onOpenFromSource={open} />));
    const row = on.getByTestId("starter-row-from-source");
    expect(on.getByTestId("starter-list").lastElementChild?.contains(row)).toBe(true);
    expect(row.textContent).toContain("From logo or URL");
    fireEvent.click(row);
    expect(open).toHaveBeenCalledTimes(1);
  });
});

describe("StartersSection — preview, restore point, apply (B6-B08…B11)", () => {
  it("a row previews the starter without writing; Cancel drops the preview", () => {
    const starter = STARTER_DS_REGISTRY[1];
    const { getByTestId, getByText } = render(wrap(<StartersSection composer={composer} projectId="p1" />));
    fireEvent.click(getByTestId(`starter-row-${starter.id}`));
    expect(getByTestId("starter-preview-name").textContent).toBe(starter.name);
    expect(getByText("Preview only · Your Brand is unchanged")).toBeTruthy();
    expect(getByTestId("starter-preview-impact").textContent).toMatch(/colors? will change\. Typography and spacing stay as they are\.$/);
    expect(composer.designSystem.setTokens).not.toHaveBeenCalled();
    expect(preview()).not.toBeNull();
    fireEvent.click(getByTestId("starter-cancel"));
    expect(preview()).toBeNull();
    expect(getByTestId("starter-list")).toBeTruthy();
  });

  it("Apply takes a starter restore point, then writes ONE valid set with the starter's values", async () => {
    const starter = STARTER_DS_REGISTRY[1];
    const onApplied = vi.fn();
    const { getByTestId } = render(wrap(<StartersSection composer={composer} projectId="p1" onApplied={onApplied} />));
    fireEvent.click(getByTestId(`starter-row-${starter.id}`));
    fireEvent.click(getByTestId("starter-apply"));
    await waitFor(() => expect(onApplied).toHaveBeenCalledWith(starter.name));
    expect(take).toHaveBeenCalledWith(composer, "s1", "starter");
    expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(1);
    const [written] = composer.designSystem.setTokens.mock.calls[0];
    expect(validateTokens(written).ok).toBe(true);
    const tokens = seen.registry?.tokens ?? [];
    expect(resolveTokenLiteral(tokens, "color-primary", "light")).toBe(resolveTokenLiteral(starter.tokens, "color-primary", "light"));
    // The palette primitives survive: a starter is values, not a replacement list.
    expect(tokens.some((t) => t.id === "color-brand-500")).toBe(true);
    expect(preview()).toBeNull();
  });

  it("no restore point → nothing applied, the reason, and Retry", async () => {
    take.mockResolvedValueOnce(false);
    const starter = STARTER_DS_REGISTRY[0];
    const { getByTestId } = render(wrap(<StartersSection composer={composer} projectId="p1" />));
    fireEvent.click(getByTestId(`starter-row-${starter.id}`));
    fireEvent.click(getByTestId("starter-apply"));
    expect((await waitFor(() => getByTestId("starter-failed"))).textContent).toBe(
      "Couldn’t create a restore point. Nothing was applied. Retry or cancel the preview.",
    );
    expect(composer.designSystem.setTokens).not.toHaveBeenCalled();
    expect(getByTestId("starter-apply").textContent).toBe("Retry");
    fireEvent.click(getByTestId("starter-apply"));
    await waitFor(() => expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(1));
  });

  it("writes nothing while the tokens are read-only", async () => {
    composer = makeComposer([], { readOnly: true });
    const { getByTestId } = render(wrap(<StartersSection composer={composer} projectId="p1" />));
    fireEvent.click(getByTestId(`starter-row-${STARTER_DS_REGISTRY[0].id}`));
    fireEvent.click(getByTestId("starter-apply"));
    await waitFor(() => getByTestId("starter-failed"));
    expect(composer.settings.designTokens).toEqual([]);
  });

  it("counts the colour tokens a starter changes", () => {
    const starter = STARTER_DS_REGISTRY[1];
    expect(starterColourChanges(starter, DEFAULT_TOKENS)).toBeGreaterThan(0);
  });
});
