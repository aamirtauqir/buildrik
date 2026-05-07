/**
 * Tests for shared/types/modals helpers added in PR1 of audit remediation.
 *
 * Covers the runModalSubmit helper's three contract guarantees:
 *   1. Sync onSubmit success → onClose called.
 *   2. Sync/async onSubmit throw → onError called, onClose NOT called.
 *   3. No onError handler + throw → console.error fallback fires (no silent swallow).
 *
 * @license BSD-3-Clause
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { runModalSubmit } from "../modals";

describe("runModalSubmit", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls onClose on successful async submit", async () => {
    const onSubmit = vi.fn(async (_x: number) => {});
    const onClose = vi.fn();
    const onError = vi.fn();

    await runModalSubmit([42] as const, onSubmit, onClose, onError);

    expect(onSubmit).toHaveBeenCalledWith(42);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("invokes onError and skips onClose when async submit rejects", async () => {
    const failure = new Error("network down");
    const onSubmit = vi.fn(async () => {
      throw failure;
    });
    const onClose = vi.fn();
    const onError = vi.fn();

    await runModalSubmit([], onSubmit, onClose, onError);

    expect(onError).toHaveBeenCalledWith(failure);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("invokes onError when sync submit throws", async () => {
    const failure = new Error("validation");
    const onSubmit = vi.fn(() => {
      throw failure;
    }) as unknown as () => Promise<void>;
    const onClose = vi.fn();
    const onError = vi.fn();

    await runModalSubmit([], onSubmit, onClose, onError);

    expect(onError).toHaveBeenCalledWith(failure);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("falls back to console.error when no onError handler provided (no silent swallow)", async () => {
    const failure = new Error("orphan failure");
    const onSubmit = vi.fn(async () => {
      throw failure;
    });
    const onClose = vi.fn();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await runModalSubmit([], onSubmit, onClose);

    expect(consoleSpy).toHaveBeenCalledWith(
      "[Modal] submit failed (no onError handler)",
      failure
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("type-checks generic args correctly (compile-time check)", async () => {
    type ConfigArg = readonly [{ name: string; count: number }];
    const onSubmit = vi.fn(async (cfg: { name: string; count: number }) => cfg.name);
    const onClose = vi.fn();

    const cfg: ConfigArg = [{ name: "test", count: 3 }];
    await runModalSubmit<ConfigArg, string>(cfg, onSubmit, onClose);

    expect(onSubmit).toHaveBeenCalledWith({ name: "test", count: 3 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
