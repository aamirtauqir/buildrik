import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { DetachInstanceButton } from "../DetachInstanceButton";
import { DSModeProvider } from "@/editor/design-system/state/DSModeContext";

function makeComposer(opts: {
  isInstance?: boolean;
  detachOk?: boolean;
}) {
  return {
    components: {
      isInstance: vi.fn(() => opts.isInstance ?? false),
      detachInstance: vi.fn(async () => opts.detachOk ?? true),
    },
  } as unknown as Parameters<typeof DetachInstanceButton>[0]["composer"];
}

const wrap = (mode: "pro" | "beginner", ui: React.ReactNode) => (
  <DSModeProvider initialMode={mode}>{ui}</DSModeProvider>
);

describe("DetachInstanceButton", () => {
  it("renders nothing in beginner mode even when isInstance=true", () => {
    const composer = makeComposer({ isInstance: true });
    const { container } = render(
      wrap("beginner", <DetachInstanceButton composer={composer} selectedElementId="el-1" />),
    );
    expect(container.querySelector("[data-detach-instance-button]")).toBeNull();
  });

  it("renders nothing when no element is selected", () => {
    const composer = makeComposer({ isInstance: true });
    const { container } = render(
      wrap("pro", <DetachInstanceButton composer={composer} selectedElementId={null} />),
    );
    expect(container.querySelector("[data-detach-instance-button]")).toBeNull();
  });

  it("renders nothing when selected element is not an instance", () => {
    const composer = makeComposer({ isInstance: false });
    const { container } = render(
      wrap("pro", <DetachInstanceButton composer={composer} selectedElementId="el-1" />),
    );
    expect(container.querySelector("[data-detach-instance-button]")).toBeNull();
  });

  it("renders button in pro mode when selected element is an instance", () => {
    const composer = makeComposer({ isInstance: true });
    const { container } = render(
      wrap("pro", <DetachInstanceButton composer={composer} selectedElementId="el-1" />),
    );
    expect(container.querySelector("[data-detach-instance-button]")).toBeTruthy();
  });

  it("clicking the button calls composer.components.detachInstance + onDetached", async () => {
    const composer = makeComposer({ isInstance: true, detachOk: true });
    const onDetached = vi.fn();
    const { container } = render(
      wrap(
        "pro",
        <DetachInstanceButton
          composer={composer}
          selectedElementId="el-42"
          onDetached={onDetached}
        />,
      ),
    );
    const btn = container.querySelector("[data-detach-instance-button]") as HTMLElement;
    fireEvent.click(btn);
    await waitFor(() => {
      expect(composer!.components.detachInstance).toHaveBeenCalledWith("el-42");
      expect(onDetached).toHaveBeenCalledWith("el-42");
    });
  });

  it("does not fire onDetached when detachInstance returns false", async () => {
    const composer = makeComposer({ isInstance: true, detachOk: false });
    const onDetached = vi.fn();
    const { container } = render(
      wrap(
        "pro",
        <DetachInstanceButton
          composer={composer}
          selectedElementId="el-1"
          onDetached={onDetached}
        />,
      ),
    );
    const btn = container.querySelector("[data-detach-instance-button]") as HTMLElement;
    fireEvent.click(btn);
    await waitFor(() => {
      expect(composer!.components.detachInstance).toHaveBeenCalled();
    });
    expect(onDetached).not.toHaveBeenCalled();
  });
});
