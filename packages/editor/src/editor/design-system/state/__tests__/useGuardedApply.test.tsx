// @vitest-environment jsdom
import { render, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useGuardedApply } from "../useGuardedApply";

function Harness({ onApi }: { onApi: (api: ReturnType<typeof useGuardedApply>) => void }) {
  onApi(useGuardedApply());
  return null;
}

describe("useGuardedApply (spec test 29: double-click Apply → one transaction)", () => {
  it("runs the work once while it is in flight, and reports busy until it settles", async () => {
    let api!: ReturnType<typeof useGuardedApply>;
    render(<Harness onApi={(a) => { api = a; }} />);
    let release!: (v: boolean) => void;
    let runs = 0;
    const work = () => { runs += 1; return new Promise<boolean>((r) => { release = r; }); };

    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => {
      first = api.run(work);
      second = api.run(work);
    });
    expect(runs).toBe(1);
    await expect(second).resolves.toBe(false);
    expect(api.busy).toBe(true);
    await act(async () => { release(true); await first; });
    await expect(first).resolves.toBe(true);
    expect(api.busy).toBe(false);
  });

  it("frees the guard after a rejected work, so Apply can be retried", async () => {
    let api!: ReturnType<typeof useGuardedApply>;
    render(<Harness onApi={(a) => { api = a; }} />);
    await act(async () => { await expect(api.run(() => Promise.reject(new Error("x")))).rejects.toThrow("x"); });
    expect(api.busy).toBe(false);
    await act(async () => { await expect(api.run(async () => true)).resolves.toBe(true); });
  });
});
