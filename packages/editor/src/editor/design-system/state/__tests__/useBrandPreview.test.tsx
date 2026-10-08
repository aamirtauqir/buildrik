// @vitest-environment jsdom
import * as React from "react";
import { render, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { useBrandPreview } from "../useBrandPreview";

function fake() {
  const handlers = new Map<string, Set<() => void>>();
  const c = {
    settings: { designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode: "off" } as Record<string, unknown>,
    getProjectSettings: () => c.settings,
    designSystem: { preview: null as unknown, setPreview: (p: unknown) => { c.designSystem.preview = p; } },
    on: (e: string, h: () => void) => { if (!handlers.has(e)) handlers.set(e, new Set()); handlers.get(e)!.add(h); },
    off: (e: string, h: () => void) => handlers.get(e)?.delete(h),
    emit: (e: string) => handlers.get(e)?.forEach((h) => h()),
  };
  return c;
}

function Harness({ c, onApi }: { c: ReturnType<typeof fake>; onApi: (api: ReturnType<typeof useBrandPreview>) => void }) {
  onApi(useBrandPreview(c as never));
  return null;
}

describe("useBrandPreview (spec D17: previews revert)", () => {
  it("shows, recomputes when settings change (⌘Z mid-preview), and clears on unmount", () => {
    const c = fake();
    let api!: ReturnType<typeof useBrandPreview>;
    const view = render(<Harness c={c} onApi={(a) => { api = a; }} />);
    let calls = 0;
    act(() => api.show((tokens) => { calls += 1; return { tokens, darkMode: "auto", theme: "dark" }; }));
    expect(c.designSystem.preview).toMatchObject({ theme: "dark" });
    act(() => { c.settings = { ...c.settings, darkMode: "off" }; c.emit("settings:change"); });
    expect(calls).toBe(2);
    view.unmount();
    expect(c.designSystem.preview).toBeNull();
  });

  it("clear() puts the saved brand back and stops listening", () => {
    const c = fake();
    let api!: ReturnType<typeof useBrandPreview>;
    render(<Harness c={c} onApi={(a) => { api = a; }} />);
    let calls = 0;
    act(() => api.show((tokens) => { calls += 1; return { tokens, darkMode: "auto" }; }));
    act(() => api.clear());
    act(() => c.emit("settings:change"));
    expect(c.designSystem.preview).toBeNull();
    expect(calls).toBe(1);
  });

  it("one slot, last owner wins: a replaced owner stops repainting and never clears the newer preview (L4-021)", () => {
    const c = fake();
    let a!: ReturnType<typeof useBrandPreview>;
    let b!: ReturnType<typeof useBrandPreview>;
    render(<><Harness c={c} onApi={(x) => { a = x; }} /><Harness c={c} onApi={(x) => { b = x; }} /></>);
    act(() => a.show((tokens) => ({ tokens, darkMode: "auto", theme: "dark" })));
    act(() => b.show((tokens) => ({ tokens, darkMode: "auto" })));
    act(() => c.emit("settings:change"));
    expect(c.designSystem.preview).toMatchObject({ darkMode: "auto" });
    expect(c.designSystem.preview).not.toHaveProperty("theme");
    act(() => a.clear());
    expect(c.designSystem.preview).not.toBeNull();
    expect(a.active).toBe(false);
    act(() => b.clear());
    expect(c.designSystem.preview).toBeNull();
  });
});
