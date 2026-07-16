/**
 * AIAssistantBar — content/layout modes, Enter-to-generate wiring into the
 * composer, Escape, credits event, and the toast error path.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";

vi.mock("@/shared/utils/openai", () => ({
  generateContent: vi.fn(),
  generateLayout: vi.fn(),
  generateImagePrompt: vi.fn(),
}));

import { ToastProvider } from "@/editor/shared/vibcoder/Toast";
import { generateContent, generateLayout } from "../../shared/utils/openai";
import { AIAssistantBar } from "../AIAssistantBar";

const mockedContent = vi.mocked(generateContent);
const mockedLayout = vi.mocked(generateLayout);

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

function makeComposer(selectedIds: string[] = ["sel-1"]) {
  const setContent = vi.fn();
  const importHTMLToActivePage = vi.fn();
  const composer = {
    selection: { getSelectedIds: () => selectedIds },
    elements: {
      getElement: vi.fn(() => ({ setContent })),
      importHTMLToActivePage,
    },
  };
  return { composer: composer as never, setContent, importHTMLToActivePage };
}

function renderBar(
  opts: { composer?: never; isOpen?: boolean } = {}
) {
  const { composer = makeComposer().composer, isOpen = true } = opts;
  const onClose = vi.fn();
  const utils = render(
    <ToastProvider>
      <AIAssistantBar isOpen={isOpen} onClose={onClose} composer={composer} />
    </ToastProvider>
  );
  return { onClose, ...utils };
}

const input = () => screen.getByRole("textbox") as HTMLInputElement;

describe("AIAssistantBar — modes + visibility", () => {
  it("renders nothing when closed", () => {
    renderBar({ isOpen: false });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("defaults to content mode; toggling to Layout swaps the placeholder", () => {
    renderBar();
    expect(input()).toHaveAttribute("placeholder", "Write a headline...");
    fireEvent.click(screen.getByText("Layout"));
    expect(input()).toHaveAttribute("placeholder", "Create a hero section...");
    fireEvent.click(screen.getByText("Content"));
    expect(input()).toHaveAttribute("placeholder", "Write a headline...");
  });
});

describe("AIAssistantBar — generation wiring", () => {
  it("content mode: Enter writes the generated copy into the selected element and closes", async () => {
    mockedContent.mockResolvedValue("Fresh headline");
    const { composer, setContent } = makeComposer(["sel-9"]);
    const { onClose } = renderBar({ composer });

    fireEvent.change(input(), { target: { value: "headline please" } });
    fireEvent.keyDown(input(), { key: "Enter" });

    expect(mockedContent).toHaveBeenCalledWith("headline please", "paragraph", "professional");
    await waitFor(() => expect(setContent).toHaveBeenCalledWith("Fresh headline"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockedLayout).not.toHaveBeenCalled();
  });

  it("content mode with no selection: generates but writes nowhere, still closes (pinned)", async () => {
    mockedContent.mockResolvedValue("orphan copy");
    const { composer, setContent } = makeComposer([]);
    const { onClose } = renderBar({ composer });

    fireEvent.change(input(), { target: { value: "hi" } });
    fireEvent.keyDown(input(), { key: "Enter" });

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(setContent).not.toHaveBeenCalled();
  });

  it("layout mode: Enter imports the generated HTML into the active page", async () => {
    mockedLayout.mockResolvedValue("<section>generated</section>");
    const { composer, importHTMLToActivePage } = makeComposer();
    const { onClose } = renderBar({ composer });

    fireEvent.click(screen.getByText("Layout"));
    fireEvent.change(input(), { target: { value: "hero section" } });
    fireEvent.keyDown(input(), { key: "Enter" });

    expect(mockedLayout).toHaveBeenCalledWith("hero section");
    await waitFor(() =>
      expect(importHTMLToActivePage).toHaveBeenCalledWith("<section>generated</section>")
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("empty prompt: Enter is a no-op", () => {
    renderBar();
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(mockedContent).not.toHaveBeenCalled();
    expect(mockedLayout).not.toHaveBeenCalled();
  });

  it("Escape closes the bar without generating", () => {
    const { onClose } = renderBar();
    fireEvent.keyDown(input(), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockedContent).not.toHaveBeenCalled();
  });

  it("generation failure raises the error toast and keeps the bar open", async () => {
    mockedContent.mockRejectedValue(new Error("down"));
    const { onClose } = renderBar();

    fireEvent.change(input(), { target: { value: "hi" } });
    fireEvent.keyDown(input(), { key: "Enter" });

    expect(await screen.findByText("AI Generation Failed")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("AIAssistantBar — credits indicator", () => {
  it("is hidden until an ai-credits-update event arrives, then shows the remaining count", () => {
    renderBar();
    expect(screen.queryByLabelText(/AI credits remaining/)).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new CustomEvent("ai-credits-update", { detail: { remaining: 7 } }));
    });
    expect(screen.getByLabelText("7 AI credits remaining")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("ignores malformed credit events", () => {
    renderBar();
    act(() => {
      window.dispatchEvent(new CustomEvent("ai-credits-update", { detail: { remaining: "x" } }));
    });
    expect(screen.queryByLabelText(/AI credits remaining/)).not.toBeInTheDocument();
  });
});
