/**
 * The Brand workspace's test harness: the three providers `StudioPanels`
 * mounts it under, a fake composer with just enough surface for the token
 * read and write, and the two moves every page test makes — open a page, reach the
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
import { validateTokens } from "@buildrik/shared/schemas/design-tokens";

export type ComposerProp = NonNullable<React.ComponentProps<typeof BrandWorkspace>["composer"]>;

/** A composer with the surface Brand reads, and the ONE token write it makes:
 *  `designSystem.setTokens` validates, writes, and emits SETTINGS_CHANGE the
 *  way the engine does. `readOnly` refuses it. */
export function makeFakeComposer(designTokens: unknown[] = [], { readOnly = false, readOnlyReason = null }: { readOnly?: boolean; readOnlyReason?: string | null } = {}) {
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
       SETTINGS_CHANGE, synchronously). */
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
    designSystem: {
      readOnly,
      readOnlyReason,
      setTokens: vi.fn((next: unknown[], _label: string) => {
        if (readOnly || !validateTokens(next).ok) return false;
        Object.assign(settings, { designTokens: next, designTokensSchemaVersion: 6 });
        emit("settings:change", settings);
        return true;
      }),
    },
    elements: { getAll: () => [], getAllElements: () => [] },
    dsLinter: { lint: () => [] },
    settings,
  } as unknown as ComposerProp & {
    emit: (e: string, ...a: unknown[]) => void;
    designSystem: { setTokens: ReturnType<typeof vi.fn> };
    settings: Record<string, unknown>;
  };
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

export const wrap = (ui: React.ReactNode, composer: ComposerProp | null = null, projectId = "brand-workspace-test") => (
  <ToastProvider>
    <DSModeProvider initialMode="pro">
      <TokenRegistryProvider composer={composer}>
        <StylePresetRegistryProvider projectId={projectId}>{ui}</StylePresetRegistryProvider>
      </TokenRegistryProvider>
    </DSModeProvider>
  </ToastProvider>
);

export function renderWorkspace(
  composer: ComposerProp,
  props: Partial<React.ComponentProps<typeof BrandWorkspace>> = {},
) {
  return render(wrap(<BrandWorkspace composer={composer} {...props} />, composer));
}

/** Click a nav row. The eleven other kinds are Spacing's header kind switch. */
export function openPage(utils: ReturnType<typeof render>, id: BrandPageId) {
  if (id.startsWith("kind-")) {
    const row = utils.container.querySelector<HTMLButtonElement>('[data-section-id="spacing"]');
    if (!row) throw new Error("Spacing row not found");
    fireEvent.click(row);
    fireEvent.change(utils.getByTestId("brand-kind-switch"), { target: { value: id } });
    return;
  }
  const row = utils.container.querySelector<HTMLButtonElement>(`[data-section-id="${id}"]`);
  if (!row) throw new Error(`Brand nav row ${id} not found`);
  fireEvent.click(row);
}

/** The workspace on the Radius page with "Small" (radius-sm) selected and its
 *  card's value field open — the non-colour / type / spacing kind that proves
 *  the 14-registry aggregation. C1 (ii): values are edited on the card
 *  (row → Change), not inline in the table. */
export async function renderOnRadius(
  composer: ComposerProp,
  props: Partial<React.ComponentProps<typeof BrandWorkspace>> = {},
) {
  const utils = renderWorkspace(composer, props);
  openPage(utils, "kind-radius");
  const row = (await waitFor(() => {
    const el = utils.container.querySelector<HTMLElement>('[data-token-row="radius-sm"]');
    if (!el) throw new Error("radius-sm row not rendered");
    return el;
  }))!;
  fireEvent.click(row);
  fireEvent.click(utils.getByTestId("brand-token-action-replace"));
  const radiusInput = (await waitFor(() => utils.getByLabelText("Value") as HTMLInputElement))!;
  return { ...utils, radiusInput };
}
