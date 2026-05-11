/**
 * Unification spec §550 — EditorClient observability beacon.
 * Asserts reportColdLoad emits structured editor.cold_load_ms log + dataset tag.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

// Mock the editor dynamic import so we don't pull in the full Composer here.
vi.mock("@buildrik/editor", () => ({
  AquibraStudio: (props: any) => <div data-testid="studio" {...props} />,
}));

// Mock next/dynamic to call the loader synchronously and inline the result —
// avoids React.lazy suspense boundary overhead in a unit test.
vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: (loader: () => Promise<any>) => {
    let Comp: any = null;
    loader().then((m) => {
      Comp = m.default ?? m;
    });
    return function DynamicStub(props: any) {
      return Comp ? <Comp {...props} /> : <div data-testid="loading" />;
    };
  },
}));

import { EditorClient } from "../EditorClient";

describe("EditorClient — cold-load beacon", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });
  afterEach(() => {
    infoSpy.mockRestore();
    delete document.body.dataset.routeUnified;
  });

  it("logs editor.cold_load_ms metric with route_unified + siteId", async () => {
    render(<EditorClient siteId="site-X" />);
    await waitFor(() => expect(infoSpy).toHaveBeenCalled());
    const payload = infoSpy.mock.calls[0][0] as string;
    expect(typeof payload).toBe("string");
    const parsed = JSON.parse(payload);
    expect(parsed.metric).toBe("editor.cold_load_ms");
    expect(parsed.siteId).toBe("site-X");
    expect(parsed.route_unified).toBe(true);
    expect(typeof parsed.value).toBe("number");
    expect(typeof parsed.ts).toBe("number");
  });

  it("tags document.body.dataset.routeUnified='true' on mount + clears on unmount", async () => {
    const { unmount } = render(<EditorClient siteId="site-Y" />);
    await waitFor(() => expect(document.body.dataset.routeUnified).toBe("true"));
    unmount();
    expect(document.body.dataset.routeUnified).toBeUndefined();
  });
});
