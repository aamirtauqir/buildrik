/**
 * Arc D6.c — Auto-fix history-awareness verification.
 *
 * End-to-end test: real Composer + real TokenRegistryProvider + real
 * TokensSection mounting TokenDetailView. Clicks Auto-fix, asserts the
 * registry value mutates, then calls composer.history.undo() and asserts
 * the registry value reverts to the pre-fix value.
 *
 * Outcome classification:
 *   PASS    → Cmd+Z reverts. Auto-fix path already routes through composer.
 *   MISSING → undo did not revert. Registry change never reached composer.
 *   NOISY   → multiple entries pushed per Auto-fix (would surface as N+ undos
 *             needed to revert).
 *
 * See spec packages/editor/docs/superpowers/specs/2026-05-16-ds-engine-deferrals-d6.md.
 *
 * @license BSD-3-Clause
 */

import { render, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import * as React from "react";
import { Composer } from "@/engine/Composer";
import { TokenRegistryProvider } from "@/editor/design-system/state/TokenRegistryContext";
import { TokensSection } from "@/editor/design-system/ui/sections/TokensSection";
import { DSModeProvider } from "@/editor/design-system/state/DSModeContext";
import { ToastProvider } from "@/editor/chrome-ui";
import type { LintIssue } from "@/engine/designSystem/LintState";

describe("Arc D6.c · Auto-fix history-awareness", () => {
  let originalGetContext: any;

  beforeAll(() => {
    // jsdom indexedDB polyfill — Composer.initialize opens MediaStorage.
    if (typeof globalThis.indexedDB === "undefined") {
      const fireOnSuccess = (req: any) => {
        Promise.resolve().then(() => req.onsuccess?.());
      };
      Object.defineProperty(globalThis, "indexedDB", {
        value: {
          open: () => {
            const req = {
              onsuccess: () => {}, onerror: () => {}, onupgradeneeded: () => {},
              result: {
                createObjectStore: () => ({ createIndex: () => {} }),
                transaction: () => ({
                  objectStore: () => ({
                    get: () => { const r = { result: undefined }; fireOnSuccess(r); return r; },
                    put: () => { const r = {}; fireOnSuccess(r); return r; },
                    getAll: () => { const r = { result: [] }; fireOnSuccess(r); return r; },
                    index: () => ({ getAll: () => { const r = { result: [] }; fireOnSuccess(r); return r; } }),
                  }),
                }),
                close: () => {}, objectStoreNames: { contains: () => false },
              },
            };
            fireOnSuccess(req);
            return req;
          },
          deleteDatabase: () => ({ onsuccess: () => {}, onerror: () => {} }),
        },
        writable: true, configurable: true,
      });
    }

    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (contextId: string) {
      if (contextId === "2d") {
        return {
          fillStyle: "", strokeStyle: "", lineWidth: 1, canvas: this,
          getImageData: () => ({ data: new Uint8ClampedArray(4) }),
          putImageData: () => {}, drawImage: () => {}, fillRect: () => {},
          clearRect: () => {}, strokeRect: () => {}, beginPath: () => {},
          closePath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {},
          fill: () => {}, arc: () => {}, rect: () => {}, clip: () => {},
          save: () => {}, restore: () => {}, translate: () => {}, scale: () => {},
          rotate: () => {}, transform: () => {}, setTransform: () => {},
          createLinearGradient: () => ({ addColorStop: () => {} }),
          createRadialGradient: () => ({ addColorStop: () => {} }),
          createPattern: () => null, measureText: () => ({ width: 0 }),
          font: "", textAlign: "start", textBaseline: "alphabetic",
        } as any;
      }
      return originalGetContext.call(this, contextId);
    };
  });

  afterAll(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((q: string) => ({
        matches: false, media: q,
        addEventListener: vi.fn(), removeEventListener: vi.fn(),
        addListener: vi.fn(), removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  const projectId = "autofix-history-test";

  // Pre-seed a color token + matching lint issue so Auto-fix has work to do.
  // Hex chosen so applyContrastFix("darken-22") returns a different value.
  const seedToken = {
    id: "color-primary",
    name: "Primary",
    value: "#3B82F6",
    category: "colors" as const,
    cssVar: "--buildrick-design-color-primary",
    type: "color" as const,
    kind: "color" as const,
  };

  function seed(composer: Composer) {
    // Persist the token via setProjectSettings so projectSettings has a known
    // baseline for the History to checkpoint.
    composer.setProjectSettings({
      ...composer.getProjectSettings(),
      designTokens: [seedToken],
      designTokensSchemaVersion: 2,
    });

    // Seed a lint issue against the token so TokenDetailView shows Auto-fix.
    const issue: LintIssue = {
      type: "contrast",
      severity: "warn",
      message: "Contrast 2.8:1 vs surface — WCAG AA needs 4.5",
      autoFixHint: "darken-22",
    };
    composer.designSystem.lintState.setIssues(seedToken.id, [issue]);
  }

  const wrap = (composer: Composer, children: React.ReactNode) => (
    <ToastProvider>
      <DSModeProvider initialMode="pro">
        <TokenRegistryProvider projectId={projectId} composer={composer as any}>
          {children}
        </TokenRegistryProvider>
      </DSModeProvider>
    </ToastProvider>
  );

  it("Click Auto-fix → registry value mutates AND composer.history.undo() reverts", async () => {
    // Pre-seed localStorage so registry mounts with the lint-flagged token.
    localStorage.setItem(
      `buildrick-design-tokens-${projectId}-v1`,
      JSON.stringify({ schemaVersion: 2, tokens: [seedToken] }),
    );

    const composer = new Composer({} as any);
    // History coalesce defaults to 500ms which would batch seed() and
    // Auto-fix into a single recorded entry. Zero it for deterministic
    // multi-entry capture in test.
    composer.history.setCoalesceDelay(0);
    seed(composer);
    // Let the seed checkpoint flush.
    await new Promise((r) => setTimeout(r, 20));

    const { container, getByText } = render(
      wrap(composer, <TokensSection composer={composer} />),
    );

    // Drill into the token. Find the row by token id, then click its "open
    // detail" trigger. The ColorTokenList rows wire onClick on the row
    // container; we synthesize the same via TokensRouter onRowClick — by
    // clicking the token's "swatch + value" row interior.
    const colorRow = await waitFor(() => {
      const el = container.querySelector(
        `[data-token-row="${seedToken.id}"]`,
      ) as HTMLElement | null;
      if (!el) throw new Error("token row not found");
      return el;
    });

    fireEvent.click(colorRow);

    // Now in TokenDetailView. Auto-fix button visible.
    const autoFixBtn = await waitFor(() => getByText(/Auto-?fix/i));
    expect(autoFixBtn).toBeTruthy();

    // Snapshot value before Auto-fix.
    const valueInputBefore = container.querySelector(
      'input[aria-label="Light value"]',
    ) as HTMLInputElement;
    const preFixValue = valueInputBefore.value;
    expect(preFixValue.toLowerCase()).toBe(seedToken.value.toLowerCase());

    // Click Auto-fix → engine applyAutoFix writes through setProjectSettings
    // inside a "Auto-fix contrast" transaction → PROJECT_CHANGED records a
    // history entry. The project:changed subscriber in TokensSection
    // re-hydrates the React registries so the input value reflects the fix.
    act(() => {
      fireEvent.click(autoFixBtn);
    });
    // Let the post-fix checkpoint flush (coalesce delay = 0 still uses
    // setTimeout(0) chain internally — give it a tick).
    await new Promise((r) => setTimeout(r, 20));

    // After auto-fix the Light value input should reflect a different value.
    await waitFor(() => {
      const after = (container.querySelector(
        'input[aria-label="Light value"]',
      ) as HTMLInputElement).value;
      expect(after.toLowerCase()).not.toBe(preFixValue.toLowerCase());
    });

    const postFixValue = (container.querySelector(
      'input[aria-label="Light value"]',
    ) as HTMLInputElement).value;

    // Call composer.history.undo() — Cmd+Z equivalent. The spec's contract:
    // this must revert the registry value to preFixValue.
    await act(async () => {
      composer.history.undo();
      await new Promise((r) => setTimeout(r, 20));
    });

    await waitFor(() => {
      const reverted = (container.querySelector(
        'input[aria-label="Light value"]',
      ) as HTMLInputElement).value;
      expect(reverted.toLowerCase()).toBe(preFixValue.toLowerCase());
    }, { timeout: 2000 }).catch((err) => {
      // Surface the actual mid-state for the diagnostic.
      const current = (container.querySelector(
        'input[aria-label="Light value"]',
      ) as HTMLInputElement).value;
      throw new Error(
        `composer.history.undo() did not revert registry value.\n` +
          `  pre-fix: ${preFixValue}\n` +
          `  post-fix: ${postFixValue}\n` +
          `  after-undo: ${current}\n` +
          `  → Outcome: MISSING (registry change never reached composer history).\n` +
          `  Underlying: ${(err as Error).message}`,
      );
    });
  });

  // W4 set-token rides the SAME engine→project:changed→re-hydrate→undo path as
  // Auto-fix. This asserts composer.designSystem.setDesignToken (the AI write)
  // updates the live registry value AND that Cmd+Z reverts it — the propagation
  // + undo contract the AI relies on (it never touches the React hooks).
  it("set-token (W4): setDesignToken updates the registry value AND undo reverts", async () => {
    localStorage.setItem(
      `buildrick-design-tokens-${projectId}-v1`,
      JSON.stringify({ schemaVersion: 2, tokens: [seedToken] }),
    );

    const composer = new Composer({} as any);
    composer.history.setCoalesceDelay(0);
    seed(composer);
    await new Promise((r) => setTimeout(r, 20));

    const { container } = render(
      wrap(composer, <TokensSection composer={composer} />),
    );

    const colorRow = await waitFor(() => {
      const el = container.querySelector(
        `[data-token-row="${seedToken.id}"]`,
      ) as HTMLElement | null;
      if (!el) throw new Error("token row not found");
      return el;
    });
    fireEvent.click(colorRow);

    const valueInputBefore = await waitFor(() => {
      const el = container.querySelector(
        'input[aria-label="Light value"]',
      ) as HTMLInputElement | null;
      if (!el) throw new Error("value input not found");
      return el;
    });
    const preValue = valueInputBefore.value;
    expect(preValue.toLowerCase()).toBe(seedToken.value.toLowerCase());

    // The AI write path: engine-side, no React hooks.
    let written: string | null = null;
    await act(async () => {
      written = composer.designSystem.setDesignToken(seedToken.id, "#123456");
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(written).toBe("#123456");

    await waitFor(() => {
      const after = (container.querySelector(
        'input[aria-label="Light value"]',
      ) as HTMLInputElement).value;
      expect(after.toLowerCase()).toBe("#123456");
    });

    await act(async () => {
      composer.history.undo();
      await new Promise((r) => setTimeout(r, 20));
    });

    await waitFor(() => {
      const reverted = (container.querySelector(
        'input[aria-label="Light value"]',
      ) as HTMLInputElement).value;
      expect(reverted.toLowerCase()).toBe(preValue.toLowerCase());
    });
  });

  it("set-token (W4): rejects an unknown id and an unsafe/type-mismatched value", () => {
    const composer = new Composer({} as any);
    seed(composer);
    // Unknown id → null (never writes a token that isn't registered).
    expect(composer.designSystem.setDesignToken("color-ghost", "#000")).toBeNull();
    // Color token with a non-color value → null.
    expect(composer.designSystem.setDesignToken(seedToken.id, "16px")).toBeNull();
    // Unsafe value → null.
    expect(composer.designSystem.setDesignToken(seedToken.id, "url(http://x)")).toBeNull();
    // No-op (same value) → null.
    expect(composer.designSystem.setDesignToken(seedToken.id, seedToken.value)).toBeNull();
    // Valid change → returns the value.
    expect(composer.designSystem.setDesignToken(seedToken.id, "#0a0a0a")).toBe("#0a0a0a");
  });
});
