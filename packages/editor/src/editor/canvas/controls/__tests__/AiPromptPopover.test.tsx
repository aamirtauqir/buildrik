import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Composer } from "../../../../engine";
import type { DiffEdit } from "../../../sidebar/tabs/ai/types";

const { streamState, applyAiEditMock } = vi.hoisted(() => ({
  streamState: {
    text: "",
    edit: null as DiffEdit | null,
    streaming: false,
    stopped: false,
    error: null as string | null,
    start: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
  },
  applyAiEditMock: vi.fn(),
}));

vi.mock("@/editor/sidebar/tabs/ai/hooks/useStreamPrompt", () => ({
  useStreamPrompt: () => streamState,
}));
vi.mock("@/editor/sidebar/tabs/ai/applySetStyle", () => ({
  applyAiEdit: applyAiEditMock,
}));

import { AiPromptPopover } from "../AiPromptPopover";

const composer = {} as Composer;

function renderPopover(onClose = vi.fn()) {
  render(
    <AiPromptPopover
      composer={composer}
      elementId="el-1"
      top={100}
      left={50}
      onClose={onClose}
    />,
  );
  return onClose;
}

beforeEach(() => {
  streamState.edit = null;
  streamState.streaming = false;
  streamState.error = null;
  streamState.start.mockReset();
  applyAiEditMock.mockReset();
});

describe("AiPromptPopover", () => {
  it("idle: shows the prompt input and starts a style-command stream on generate", () => {
    renderPopover();
    const input = screen.getByLabelText("AI prompt");
    fireEvent.change(input, { target: { value: "make this dark" } });
    fireEvent.click(screen.getByLabelText("Generate change"));
    expect(streamState.start).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "make this dark",
        intent: "style-command",
        scope: { kind: "element", id: "el-1" },
      }),
    );
  });

  it("diff state: Apply runs the edit and closes", () => {
    streamState.edit = {
      target: "el-1",
      summary: "1 style change",
      rows: [{ field: "color", from: "", to: "#000" }],
      state: "pending",
      applyOps: { preview: {}, commit: { commands: [] } },
    };
    const onClose = renderPopover();
    expect(screen.getByText("color")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Apply changes"));
    expect(applyAiEditMock).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("diff state: Discard closes without applying", () => {
    streamState.edit = {
      target: "el-1",
      summary: "1 style change",
      rows: [{ field: "padding", from: "", to: "8px" }],
      state: "pending",
      applyOps: { preview: {}, commit: { commands: [] } },
    };
    const onClose = renderPopover();
    fireEvent.click(screen.getByLabelText("Discard"));
    expect(applyAiEditMock).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("error state: renders the error message", () => {
    streamState.error = "Daily limit reached";
    renderPopover();
    expect(screen.getByRole("alert").textContent).toContain(
      "Daily limit reached",
    );
  });
});
