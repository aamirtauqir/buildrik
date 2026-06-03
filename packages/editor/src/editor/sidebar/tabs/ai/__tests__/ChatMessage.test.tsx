import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatMessage } from "../ChatMessage";
import type { ChatMessage as ChatMessageType } from "../types";

function msg(over: Partial<ChatMessageType>): ChatMessageType {
  return {
    id: "m1",
    role: "assistant",
    text: "",
    createdAt: 0,
    ...over,
  } as ChatMessageType;
}

const noop = vi.fn();

describe("ChatMessage edit rendering", () => {
  it("renders the diff rows and Apply/Discard when an edit is pending", () => {
    const onAccept = vi.fn();
    render(
      <ChatMessage
        message={msg({
          edit: {
            target: "el-1",
            summary: "1 change",
            rows: [{ field: "color", from: "", to: "#000" }],
            state: "pending",
            applyOps: { preview: {}, commit: { commands: [] } },
          },
        })}
        onAccept={onAccept}
        onReject={noop}
        onRegenerate={noop}
        onPreviewEnter={noop}
        onPreviewLeave={noop}
      />,
    );
    expect(screen.getByText("color")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Apply changes"));
    expect(onAccept).toHaveBeenCalledWith("m1");
  });

  it("shows applied state (no buttons) once accepted", () => {
    render(
      <ChatMessage
        message={msg({
          edit: {
            target: "el-1",
            summary: "1 change",
            rows: [{ field: "padding", from: "", to: "8px" }],
            state: "applied",
            applyOps: { preview: {}, commit: { commands: [] } },
          },
        })}
        onAccept={noop}
        onReject={noop}
        onRegenerate={noop}
        onPreviewEnter={noop}
        onPreviewLeave={noop}
      />,
    );
    expect(screen.getByText(/Applied/)).toBeTruthy();
    expect(screen.queryByLabelText("Apply changes")).toBeNull();
  });

  it("shows Regenerate for a plain text reply (no edit)", () => {
    render(
      <ChatMessage
        message={msg({ text: "Hello" })}
        onAccept={noop}
        onReject={noop}
        onRegenerate={noop}
        onPreviewEnter={noop}
        onPreviewLeave={noop}
      />,
    );
    expect(screen.getByText(/Regenerate/)).toBeTruthy();
  });
});
