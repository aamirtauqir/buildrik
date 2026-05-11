/**
 * Unification spec §550 — EditorClient key={siteId} forces full remount when
 * the siteId prop changes. Without this, Composer state from previous site
 * could autosave into wrong site (eng review D4 / codex critical).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

const mountIds: string[] = [];

// Synchronous mock of @buildrik/editor so we can observe per-siteId mounts
// without next/dynamic's async loader getting in the way.
vi.mock("@buildrik/editor", () => ({
  AquibraStudio: function Stub(props: { style?: React.CSSProperties }) {
    // Walk component owner ref via a marker DOM attribute — we'll read siteId
    // from EditorErrorBoundary's siteId prop, which EditorClient sets to the
    // same value as key. The cleanest deterministic signal is mount-via-effect.
    return <div data-testid="aquibra" {...props} />;
  },
}));

// Replace next/dynamic with an identity passthrough that immediately returns
// the underlying component (no async loader timing).
vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: (loader: () => Promise<any>) => {
    let resolved: any = null;
    void loader().then((m) => {
      resolved = m.default ?? m.AquibraStudio ?? m;
    });
    return function DynamicProxy(props: any) {
      // Synchronous fallback: render the eventual component once resolved.
      return resolved
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (resolved as any)(props)
        : <div data-testid="loading" />;
    };
  },
}));

import { EditorClient } from "../EditorClient";

describe("EditorClient key-remount", () => {
  beforeEach(() => {
    mountIds.length = 0;
    vi.spyOn(console, "info").mockImplementation(() => {});
  });
  afterEach(() => {
    delete document.body.dataset.routeUnified;
    vi.restoreAllMocks();
  });

  it("logs a distinct cold_load_ms beacon for each siteId change", async () => {
    const infoSpy = console.info as unknown as ReturnType<typeof vi.spyOn>;
    const { rerender } = render(<EditorClient siteId="A" />);
    await waitFor(() => {
      const ids = (infoSpy as any).mock.calls
        .map((c: any[]) => {
          try { return JSON.parse(c[0] as string).siteId; } catch { return undefined; }
        })
        .filter(Boolean);
      expect(ids).toContain("A");
    });
    rerender(<EditorClient siteId="B" />);
    await waitFor(() => {
      const ids = (infoSpy as any).mock.calls
        .map((c: any[]) => {
          try { return JSON.parse(c[0] as string).siteId; } catch { return undefined; }
        })
        .filter(Boolean);
      expect(ids).toContain("A");
      expect(ids).toContain("B");
    });
  });

  it("sets document.body.dataset.routeUnified across siteId swaps", async () => {
    const { rerender } = render(<EditorClient siteId="A" />);
    await waitFor(() => expect(document.body.dataset.routeUnified).toBe("true"));
    rerender(<EditorClient siteId="B" />);
    expect(document.body.dataset.routeUnified).toBe("true");
  });
});
