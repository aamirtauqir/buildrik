import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatThread } from "../ChatThread";
import type { ChatMessage } from "../types";

function msg(over: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: over.id ?? "m-1",
    role: over.role ?? "user",
    text: over.text ?? "Hello",
    streaming: over.streaming ?? false,
    stopped: over.stopped ?? false,
    edit: over.edit,
    createdAt: over.createdAt ?? Date.now(),
  };
}

describe("ChatThread", () => {
  it("renders empty state when no messages", () => {
    render(<ChatThread messages={[]} onAccept={vi.fn()} onReject={vi.fn()} onRegenerate={vi.fn()} />);
    expect(screen.getByText(/Try a quick action/i)).toBeInTheDocument();
  });

  it("renders user and assistant messages with role labels", () => {
    render(
      <ChatThread
        messages={[msg({ id: "u", role: "user", text: "hello" }), msg({ id: "a", role: "assistant", text: "hi" })]}
        onAccept={vi.fn()} onReject={vi.fn()} onRegenerate={vi.fn()}
      />,
    );
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("Assistant")).toBeInTheDocument();
  });

  it("shows blinking cursor for streaming assistant message", () => {
    render(
      <ChatThread
        messages={[msg({ id: "a", role: "assistant", text: "thinking", streaming: true })]}
        onAccept={vi.fn()} onReject={vi.fn()} onRegenerate={vi.fn()}
      />,
    );
    expect(document.querySelector(".bd-ai-msg-streaming")).toBeInTheDocument();
  });

  it("shows '(stopped)' tag when streaming was aborted", () => {
    render(
      <ChatThread
        messages={[msg({ id: "a", role: "assistant", text: "partial", stopped: true })]}
        onAccept={vi.fn()} onReject={vi.fn()} onRegenerate={vi.fn()}
      />,
    );
    expect(screen.getByText(/\(stopped\)/i)).toBeInTheDocument();
  });

  it("renders Regenerate link only on assistant messages that are not streaming", () => {
    render(
      <ChatThread
        messages={[msg({ id: "u", role: "user", text: "hi" }), msg({ id: "a", role: "assistant", text: "hi back" })]}
        onAccept={vi.fn()} onReject={vi.fn()} onRegenerate={vi.fn()}
      />,
    );
    const links = screen.getAllByRole("button", { name: /regenerate/i });
    expect(links).toHaveLength(1);
  });
});
