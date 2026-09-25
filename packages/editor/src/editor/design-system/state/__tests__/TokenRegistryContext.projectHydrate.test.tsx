/**
 * D-4 — the token registries carry the PROJECT's tokens from load, not from
 * the moment someone opens Brand.
 *
 * The provider seeds from a localStorage cache (DEFAULT_TOKENS on a cold
 * browser) and the only project → registry hydration lived in BrandWorkspace,
 * so the shell-wide DS linter (useDSLint reads these registries) counted
 * issues against the default brand until Brand was clicked.
 *
 * @license BSD-3-Clause
 */
import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { TokenRegistryProvider, useColorRegistry } from "../TokenRegistryContext";
import { DEFAULT_TOKENS } from "@/editor/design-system/constants";

type Listener = (payload: unknown) => void;

function makeComposer(primary: string) {
  const listeners = new Map<string, Listener[]>();
  let settings = {
    designTokensSchemaVersion: 2,
    designTokens: [{ id: "color-primary", name: "Primary", value: primary, category: "colors", cssVar: "--buildrick-design-color-primary", type: "color" }] as unknown[],
  };
  return {
    on: vi.fn((evt: string, cb: Listener) => listeners.set(evt, [...(listeners.get(evt) ?? []), cb])),
    off: vi.fn((evt: string, cb: Listener) => listeners.set(evt, (listeners.get(evt) ?? []).filter((x) => x !== cb))),
    emit: (evt: string) => (listeners.get(evt) ?? []).forEach((c) => c(undefined)),
    colorMode: { resolved: () => "light" as const },
    darkResolver: { resolve: (t: { value: string }) => t.value },
    getProjectSettings: () => settings,
    setPrimary(value: string) {
      settings = { ...settings, designTokens: [{ ...(settings.designTokens[0] as object), value }] };
    },
    clearTokens() {
      settings = { ...settings, designTokens: [] };
    },
  };
}

let seen = "";
function PrimaryProbe() {
  seen = useColorRegistry().tokens.find((t) => t.id === "color-primary")?.value ?? "";
  return null;
}

beforeEach(() => {
  localStorage.clear();
  seen = "";
});

describe("TokenRegistryProvider · project token hydration (D-4)", () => {
  it("reads the project's tokens on mount, with no Brand panel and no local cache", () => {
    const composer = makeComposer("#123456");
    render(
      <TokenRegistryProvider projectId="p1" composer={composer}>
        <PrimaryProbe />
      </TokenRegistryProvider>,
    );
    expect(seen.toLowerCase()).toBe("#123456");
  });

  it("re-reads them when a project loads", () => {
    const composer = makeComposer("#123456");
    render(
      <TokenRegistryProvider projectId="p1" composer={composer}>
        <PrimaryProbe />
      </TokenRegistryProvider>,
    );
    composer.setPrimary("#abcdef");
    act(() => composer.emit("project:loaded"));
    expect(seen.toLowerCase()).toBe("#abcdef");
  });

  /* Review M4: undoing a site's first token edit imports a project with NO
     designTokens; an early return on the empty list left the undone value. */
  it("an empty project token list puts the registries back to the seed", () => {
    const composer = makeComposer("#123456");
    render(
      <TokenRegistryProvider projectId="p1" composer={composer}>
        <PrimaryProbe />
      </TokenRegistryProvider>,
    );
    expect(seen.toLowerCase()).toBe("#123456");
    composer.clearTokens();
    act(() => composer.emit("project:loaded"));
    expect(seen.toLowerCase()).not.toBe("#123456");
    expect(seen).toBe(DEFAULT_TOKENS.find((t) => t.id === "color-primary")?.value);
  });

  it("does not listen to settings changes (Brand stages edits in these registries)", () => {
    const composer = makeComposer("#123456");
    render(
      <TokenRegistryProvider projectId="p1" composer={composer}>
        <PrimaryProbe />
      </TokenRegistryProvider>,
    );
    const subscribed = composer.on.mock.calls.map(([evt]) => evt);
    expect(subscribed).toContain("project:loaded");
    expect(subscribed).not.toContain("settings:change");
  });
});
