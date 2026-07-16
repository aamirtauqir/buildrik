/**
 * AICopilot — quick actions, input-type detection, preview sanitizer
 * narrowing (pinned per audit), and the error path.
 *
 * The openai facade is mocked; DOMPurify inside the component runs for real
 * so the preview-sanitizer pins exercise actual sanitization.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("@/shared/utils/openai", () => ({
  generateContent: vi.fn(),
  generateLayout: vi.fn(),
  generateImagePrompt: vi.fn(),
}));

import { generateContent, generateLayout, generateImagePrompt } from "../../shared/utils/openai";
import { AICopilot } from "../AICopilot";

const mockedLayout = vi.mocked(generateLayout);
const mockedContent = vi.mocked(generateContent);
const mockedImage = vi.mocked(generateImagePrompt);

beforeEach(() => {
  vi.clearAllMocks();
  document.getElementById("vibcoder-overlay-root")?.remove();
});

afterEach(cleanup);

function renderCopilot() {
  const onClose = vi.fn();
  const onInsert = vi.fn();
  render(<AICopilot isOpen onClose={onClose} onInsert={onInsert} />);
  return { onClose, onInsert };
}

const textarea = () =>
  screen.getByPlaceholderText("Describe what you want to create...") as HTMLTextAreaElement;

// The send button is the only <button> sharing the input row with the textarea.
const sendButton = () => textarea().parentElement!.querySelector("button")!;

describe("AICopilot — shell", () => {
  it("shows the welcome message and all 6 quick actions", () => {
    renderCopilot();
    expect(screen.getByText(/I'm your AI Copilot/)).toBeInTheDocument();
    for (const label of [
      "Hero Section",
      "Features Grid",
      "Pricing Table",
      "Testimonials",
      "CTA Section",
      "Contact Form",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});

describe("AICopilot — quick actions + insert", () => {
  it("quick action sends its canned prompt through generateLayout and previews the HTML", async () => {
    mockedLayout.mockResolvedValue('<section class="hero"><h1>Big Promise</h1></section>');
    renderCopilot();

    fireEvent.click(screen.getByText("Hero Section"));

    expect(mockedLayout).toHaveBeenCalledTimes(1);
    expect(mockedLayout.mock.calls[0][0]).toMatch(/hero section/i);

    expect(await screen.findByText("Generated Layout:")).toBeInTheDocument();
    expect(screen.getByText("Big Promise")).toBeInTheDocument(); // sanitized preview rendered
  });

  it("'Insert to Canvas' hands the RAW generated HTML to onInsert with type 'html'", async () => {
    // PIN: the copilot preview sanitizes only for display; insertion passes the
    // original string through — the canonical sanitize happens downstream in
    // the engine (insertHTMLToElement → sanitizeHTML).
    const raw = '<section onclick="evil()"><h1>Hi</h1></section>';
    mockedLayout.mockResolvedValue(raw);
    const { onInsert } = renderCopilot();

    fireEvent.click(screen.getByText("Hero Section"));
    fireEvent.click(await screen.findByText("Insert to Canvas"));

    expect(onInsert).toHaveBeenCalledWith(raw, "html");
  });
});

describe("AICopilot — preview sanitizer narrowing (pinned per audit)", () => {
  it("strips script/onclick/video but keeps style and data-* (weaker-than-intended allowlist)", async () => {
    mockedLayout.mockResolvedValue(
      '<section data-buildrick-type="hero" onclick="evil()">' +
        "<script>window.pwned=1</script>" +
        '<video src="x.mp4"></video>' +
        '<div style="color:red">ok</div>' +
        "</section>"
    );
    renderCopilot();
    fireEvent.click(screen.getByText("Hero Section"));
    await screen.findByText("ok");

    const body = document.body.innerHTML;
    // Hard security floor (same as canonical):
    expect(body).not.toContain("<script");
    expect(body).not.toContain("onclick");
    // NARROWER than canonical sanitizeHTML — video is not in the preview's
    // ALLOWED_TAGS list:
    expect(body).not.toContain("<video");
    // WEAKER than the ALLOWED_ATTR list implies — pinned current behavior:
    // DOMPurify's ALLOW_DATA_ATTR defaults to true and is independent of
    // ALLOWED_ATTR, so data-* attributes sail through the "narrow" allowlist,
    // and the style attribute (arbitrary CSS) survives too.
    expect(body).toContain('data-buildrick-type="hero"');
    expect(screen.getByText("ok")).toHaveAttribute("style", "color:red");
  });
});

describe("AICopilot — input-type detection (send button)", () => {
  it("image-ish prompts route to generateImagePrompt", async () => {
    mockedImage.mockResolvedValue("https://img.example/1.png");
    renderCopilot();
    fireEvent.change(textarea(), { target: { value: "a photo of mountains" } });
    fireEvent.click(sendButton());
    expect(mockedImage).toHaveBeenCalledWith("a photo of mountains");
    expect(await screen.findByAltText("Generated")).toBeInTheDocument();
  });

  it("layout-ish prompts route to generateLayout", async () => {
    mockedLayout.mockResolvedValue("<section>x</section>");
    renderCopilot();
    fireEvent.change(textarea(), { target: { value: "please create a hero for my site" } });
    fireEvent.click(sendButton());
    expect(mockedLayout).toHaveBeenCalledTimes(1);
    await screen.findByText("Generated Layout:");
  });

  it("everything else routes to generateContent(paragraph, professional)", async () => {
    mockedContent.mockResolvedValue("Some copy.");
    renderCopilot();
    fireEvent.change(textarea(), { target: { value: "write something nice" } });
    fireEvent.click(sendButton());
    expect(mockedContent).toHaveBeenCalledWith(
      "write something nice",
      "paragraph",
      "professional"
    );
    expect(await screen.findByText("Some copy.")).toBeInTheDocument();
  });

  it("PIN: pressing Enter bypasses detectInputType — always generates a LAYOUT", async () => {
    // handleKeyDown calls handleSend() with no type argument, whose default is
    // "layout"; only the send button runs detectInputType. Pinned as-is.
    mockedLayout.mockResolvedValue("<section>x</section>");
    renderCopilot();
    fireEvent.change(textarea(), { target: { value: "write something nice" } });
    fireEvent.keyDown(textarea(), { key: "Enter" });

    expect(mockedLayout).toHaveBeenCalledTimes(1);
    expect(mockedContent).not.toHaveBeenCalled();
    await screen.findByText("Generated Layout:");
  });

  it.todo(
    "AUDIT BUG: Enter-to-send should route through detectInputType like the send button " +
      "instead of defaulting every prompt to layout generation"
  );
});

describe("AICopilot — error path", () => {
  it("surfaces a generation failure inside the assistant message", async () => {
    mockedLayout.mockRejectedValue(new Error("quota exhausted"));
    renderCopilot();
    fireEvent.click(screen.getByText("Hero Section"));
    expect(await screen.findByText("Error: quota exhausted")).toBeInTheDocument();
  });
});
