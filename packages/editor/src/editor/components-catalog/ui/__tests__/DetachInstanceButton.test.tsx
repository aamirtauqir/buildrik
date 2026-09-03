import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { DetachInstanceButton } from "../DetachInstanceButton";
import { DSModeProvider } from "@/editor/design-system/state/DSModeContext";
import { ToastProvider } from "@/editor/chrome-ui";

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

/* The button reports a refused detach now, so it needs the toast context the
   studio always provides — `AquibraStudio` wraps the whole tree in one, so
   every real mount has it and only these tests did not. */
const wrap = (mode: "pro" | "beginner", ui: React.ReactNode) => (
  <ToastProvider>
    <DSModeProvider initialMode={mode}>{ui}</DSModeProvider>
  </ToastProvider>
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
    /* One click used to detach outright. The component-library door has
       confirmed this since it shipped, so the same action had two answers
       depending on which door you came through. */
    expect(composer!.components.detachInstance).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Detach" }));
    await waitFor(() => {
      expect(composer!.components.detachInstance).toHaveBeenCalledWith("el-42");
      expect(onDetached).toHaveBeenCalledWith("el-42");
    });
  });

  it("says so when the detach is refused, instead of looking like it worked", async () => {
    /* `if (ok)` with nothing on the else, beside a catch that swallowed: the
       button was pressed, the link stayed, and nothing on screen said so. */
    const composer = makeComposer({ isInstance: true, detachOk: false });
    const { container } = render(
      wrap("pro", <DetachInstanceButton composer={composer} selectedElementId="el-7" />),
    );
    fireEvent.click(container.querySelector("[data-detach-instance-button]") as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: "Detach" }));
    await waitFor(() => expect(screen.getByText(/Couldn't detach this instance/)).toBeTruthy());
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
    fireEvent.click(screen.getByRole("button", { name: "Detach" }));
    await waitFor(() => {
      expect(composer!.components.detachInstance).toHaveBeenCalled();
    });
    expect(onDetached).not.toHaveBeenCalled();
  });
});
