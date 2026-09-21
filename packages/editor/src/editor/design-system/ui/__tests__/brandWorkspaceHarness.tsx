/**
 * The Brand workspace's test harness: the three providers `StudioPanels`
 * mounts it under, a fake composer with just enough surface for the load
 * path, and the two moves every page test makes — open a page, reach the
 * radius control (the non-colour / type / spacing kind that proves the
 * 14-registry aggregation).
 *
 * @license BSD-3-Clause
 */
import { render, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import * as React from "react";
import { BrandWorkspace, type BrandPageId } from "../BrandWorkspace";
import { TokenRegistryProvider } from "../../state/TokenRegistryContext";
import { StylePresetRegistryProvider } from "../../state/StylePresetRegistryContext";
import { DSModeProvider } from "../../state/DSModeContext";
import { ToastProvider } from "@/editor/chrome-ui";

export type ComposerProp = NonNullable<React.ComponentProps<typeof BrandWorkspace>["composer"]>;

export function makeFakeComposer(designTokens: unknown[] = []) {
  const settings: Record<string, unknown> = {
    designTokens,
    designTokensSchemaVersion: 2,
  };
  const handlers = new Map<string, Set<(...a: unknown[]) => void>>();
  const emit = (e: string, ...a: unknown[]) => {
    handlers.get(e)?.forEach((h) => h(...a));
  };
  return {
    getProjectSettings: () => settings,
    /* Emits the way the engine does (`Composer.setProjectSettings` →
       SETTINGS_CHANGE, synchronously) — the workspace's own Apply must not
       mistake that echo for another window's write. */
    setProjectSettings: (next: Record<string, unknown>) => {
      Object.assign(settings, next);
      emit("settings:change", settings);
    },
    on: vi.fn((e: string, h: (...a: unknown[]) => void) => {
      if (!handlers.has(e)) handlers.set(e, new Set());
      handlers.get(e)!.add(h);
    }),
    off: vi.fn((e: string, h: (...a: unknown[]) => void) => {
      handlers.get(e)?.delete(h);
    }),
    emit: vi.fn(emit),
    elements: { getAll: () => [], getAllElements: () => [] },
    dsLinter: { lint: () => [] },
    settings,
  } as unknown as ComposerProp & { emit: (e: string, ...a: unknown[]) => void };
}

export function installDomShims() {
  localStorage.clear();
  if (!(document as Document & { fonts?: unknown }).fonts) {
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { load: () => Promise.resolve([]) },
    });
  }
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: false, media: q,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      addListener: vi.fn(), removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

export const wrap = (ui: React.ReactNode, projectId = "brand-workspace-test") => (
  <ToastProvider>
    <DSModeProvider initialMode="pro">
      <TokenRegistryProvider projectId={projectId}>
        <StylePresetRegistryProvider projectId={projectId}>{ui}</StylePresetRegistryProvider>
      </TokenRegistryProvider>
    </DSModeProvider>
  </ToastProvider>
);

export function renderWorkspace(
  composer: ComposerProp,
  props: Partial<React.ComponentProps<typeof BrandWorkspace>> = {},
) {
  return render(wrap(<BrandWorkspace composer={composer} {...props} />));
}

/** Click a nav row. The ten undesigned kinds sit behind "More token kinds". */
export function openPage(utils: ReturnType<typeof render>, id: BrandPageId) {
  if (id.startsWith("kind-") && !utils.container.querySelector(`[data-section-id="${id}"]`)) {
    fireEvent.click(utils.getByTestId("brand-more-kinds"));
  }
  const row = utils.container.querySelector<HTMLButtonElement>(`[data-section-id="${id}"]`);
  if (!row) throw new Error(`Brand nav row ${id} not found`);
  fireEvent.click(row);
}

/** The workspace on the Radius page with its "Small radius" control resolved. */
export async function renderOnRadius(composer: ComposerProp) {
  const utils = renderWorkspace(composer);
  openPage(utils, "kind-radius");
  const radiusInput = (await waitFor(
    () => utils.getByLabelText("Small radius value") as HTMLInputElement,
  ))!;
  return { ...utils, radiusInput };
}
