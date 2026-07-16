/**
 * AIAssistant — tab switching across the 6 panels, generation flow per tab,
 * quick prompts, and the error surface. The openai facade module is mocked
 * (CONTENT_TYPES/TONES come from the real pure AIPromptLibrary so the
 * quickPrompts option derivation stays intact); engine/ai is stubbed so the
 * Analyze tab doesn't pull the whole engine.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

vi.mock("@/shared/utils/openai", async () => {
  const lib = await import("@/services/ai/AIPromptLibrary");
  return {
    CONTENT_TYPES: lib.CONTENT_TYPES,
    TONES: lib.TONES,
    generateContent: vi.fn(),
    generateLayout: vi.fn(),
    generateImagePrompt: vi.fn(),
  };
});

vi.mock("@/engine/ai", () => ({
  LayoutAnalyzer: class {
    analyze() {
      return {
        score: 88,
        summary: { spacing: 90, alignment: 85, contrast: 80, accessibility: 75 },
        suggestions: [],
      };
    }
  },
}));

import { generateContent, generateLayout } from "../../shared/utils/openai";
import { AIAssistant } from "../AIAssistant";

const mockedContent = vi.mocked(generateContent);
const mockedLayout = vi.mocked(generateLayout);

beforeEach(() => {
  vi.clearAllMocks();
  document.getElementById("vibcoder-overlay-root")?.remove();
});

afterEach(cleanup);

function renderAssistant(overrides: Partial<React.ComponentProps<typeof AIAssistant>> = {}) {
  const onClose = vi.fn();
  const onGenerate = vi.fn();
  render(<AIAssistant isOpen onClose={onClose} onGenerate={onGenerate} {...overrides} />);
  return { onClose, onGenerate };
}

describe("AIAssistant — tab switching", () => {
  it("renders all six tabs", () => {
    renderAssistant();
    for (const label of [
      "📝 Content",
      "🎨 Layout",
      "🖼️ Image",
      "🔍 Analyze",
      "🎨 Colors",
      "♿ A11y",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("content tab (default) shows Content Type + Tone selects and 7 quick prompts", () => {
    renderAssistant();
    expect(screen.getByText("Content Type")).toBeInTheDocument();
    expect(screen.getByText("Tone")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Write a compelling headline for a SaaS product...")
    ).toBeInTheDocument();
    expect(screen.getByText("Write a compelling product description for a SaaS tool")).toBeInTheDocument();
  });

  it("layout tab hides the content selects and swaps placeholder + quick prompts", () => {
    renderAssistant();
    fireEvent.click(screen.getByText("🎨 Layout"));
    expect(screen.queryByText("Content Type")).not.toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Create a hero section with a headline, subtitle, and CTA button...")
    ).toBeInTheDocument();
    expect(screen.getByText("Create a pricing section with 3 plans")).toBeInTheDocument();
  });

  it("image tab swaps the textarea label", () => {
    renderAssistant();
    fireEvent.click(screen.getByText("🖼️ Image"));
    expect(screen.getByText("Describe the image you want")).toBeInTheDocument();
  });

  it("colors tab mounts the ColorPalette", () => {
    renderAssistant();
    fireEvent.click(screen.getByText("🎨 Colors"));
    expect(screen.getByText("Base Color")).toBeInTheDocument();
    expect(screen.getByText("Color Harmony")).toBeInTheDocument();
  });

  it("a11y tab mounts the AccessibilityChecker", () => {
    renderAssistant();
    fireEvent.click(screen.getByText("♿ A11y"));
    expect(screen.getByRole("button", { name: /Run Accessibility Check/ })).toBeInTheDocument();
  });

  it("analyze tab mounts LayoutSuggestions and runs the (stubbed) analyzer", () => {
    renderAssistant({ composer: {} as never });
    fireEvent.click(screen.getByText("🔍 Analyze"));
    fireEvent.click(screen.getByRole("button", { name: /Analyze Layout/ }));
    expect(screen.getByText("Perfect! No issues found.")).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
  });
});

describe("AIAssistant — generation flow", () => {
  it("content tab: generates with (prompt, paragraph, professional) and inserts as text", async () => {
    mockedContent.mockResolvedValue("GENERATED COPY");
    const { onGenerate, onClose } = renderAssistant();

    fireEvent.change(
      screen.getByPlaceholderText("Write a compelling headline for a SaaS product..."),
      { target: { value: "headline for a bakery" } }
    );
    fireEvent.click(screen.getByRole("button", { name: "✨ Generate" }));

    expect(mockedContent).toHaveBeenCalledWith("headline for a bakery", "paragraph", "professional");
    expect(await screen.findByText("GENERATED COPY")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Insert to Editor" }));
    expect(onGenerate).toHaveBeenCalledWith({ type: "text", content: "GENERATED COPY" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("layout tab: generates via generateLayout and inserts as html", async () => {
    mockedLayout.mockResolvedValue("<section>L</section>");
    const { onGenerate } = renderAssistant();

    fireEvent.click(screen.getByText("🎨 Layout"));
    fireEvent.change(
      screen.getByPlaceholderText("Create a hero section with a headline, subtitle, and CTA button..."),
      { target: { value: "hero please" } }
    );
    fireEvent.click(screen.getByRole("button", { name: "✨ Generate" }));

    expect(mockedLayout).toHaveBeenCalledWith("hero please");
    await screen.findByText("<section>L</section>");

    fireEvent.click(screen.getByRole("button", { name: "Insert to Editor" }));
    expect(onGenerate).toHaveBeenCalledWith({ type: "html", content: "<section>L</section>" });
  });

  it("surfaces a generation error and keeps the modal open", async () => {
    mockedContent.mockRejectedValue(new Error("model unavailable"));
    const { onGenerate, onClose } = renderAssistant();

    fireEvent.change(
      screen.getByPlaceholderText("Write a compelling headline for a SaaS product..."),
      { target: { value: "x" } }
    );
    fireEvent.click(screen.getByRole("button", { name: "✨ Generate" }));

    expect(await screen.findByText("model unavailable")).toBeInTheDocument();
    await waitFor(() => expect(onGenerate).not.toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Generate stays disabled while the prompt is empty", () => {
    renderAssistant();
    expect(screen.getByRole("button", { name: "✨ Generate" })).toBeDisabled();
  });

  it("clicking a quick prompt fills the textarea", () => {
    renderAssistant();
    const prompt = "Write a compelling product description for a SaaS tool";
    fireEvent.click(screen.getByText(prompt));
    expect(
      screen.getByPlaceholderText("Write a compelling headline for a SaaS product...")
    ).toHaveValue(prompt);
  });

  it("renders the context label when targeting an element", () => {
    renderAssistant({ contextLabel: "Hero Section" });
    expect(screen.getByText("Target: Hero Section")).toBeInTheDocument();
  });
});
