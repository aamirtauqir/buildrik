/**
 * AccessibilityChecker — pure client-side checks driven through the component
 * (checkAccessibility is module-private): img-alt, empty buttons/links,
 * heading order, contrast, font-size — plus the drifted 0.03928 luminance
 * constant pin from the audit.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Composer } from "../../engine";
import { AccessibilityChecker } from "../AccessibilityChecker";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Fake element tree + composer
// ---------------------------------------------------------------------------

interface FakeEl {
  getId: () => string;
  getType: () => string;
  getAttributes: () => Record<string, string>;
  getContent: () => string;
  getStyles: () => Record<string, string>;
  getChildren: () => FakeEl[];
}

// Every leaf defaults to a11y-clean styles so tests only trip the rule under
// test (the checker's own defaults — bg "var(--bd-bg-card)" — hit the NaN
// hole pinned in the it.todo below).
const CLEAN = { color: "#000000", backgroundColor: "#ffffff", fontSize: "16px" };

function el(
  type: string,
  opts: {
    id?: string;
    attrs?: Record<string, string>;
    content?: string;
    styles?: Record<string, string>;
    children?: FakeEl[];
  } = {}
): FakeEl {
  const { id = `${type}-1`, attrs = {}, content = "", styles = {}, children = [] } = opts;
  return {
    getId: () => id,
    getType: () => type,
    getAttributes: () => attrs,
    getContent: () => content,
    getStyles: () => styles,
    getChildren: () => children,
  };
}

function makeComposer(children: FakeEl[]): Composer {
  const root = el("container", { id: "root", children });
  return {
    elements: {
      getActivePage: () => ({ root: { id: "root" } }),
      getElement: (id: string) => (id === "root" ? root : null),
    },
  } as unknown as Composer;
}

function runCheck(children: FakeEl[], onSelectElement?: (id: string) => void) {
  render(<AccessibilityChecker composer={makeComposer(children)} onSelectElement={onSelectElement} />);
  fireEvent.click(screen.getByRole("button", { name: /Run Accessibility Check/ }));
}

// ---------------------------------------------------------------------------

describe("AccessibilityChecker — img-alt", () => {
  it("flags images with no alt attribute as errors", () => {
    runCheck([el("image", { id: "img-1", styles: CLEAN })]);
    expect(screen.getByText("Image is missing alt text")).toBeInTheDocument();
    expect(screen.getByText("img-alt")).toBeInTheDocument();
  });

  it("PIN: alt=\"\" fires BOTH the decorative-image info AND the missing-alt error", () => {
    // Current behavior pinned: the missing-alt gate is `!attrs.alt`, which is
    // truthy for the empty string, so a deliberately-decorative image
    // (alt="") is double-reported — see it.todo below.
    runCheck([el("image", { attrs: { alt: "" }, styles: CLEAN })]);
    expect(
      screen.getByText("Empty alt text - ensure this image is decorative")
    ).toBeInTheDocument();
    expect(screen.getByText("Image is missing alt text")).toBeInTheDocument();
  });

  it.todo(
    "AUDIT BUG: decorative images (alt=\"\") should NOT also raise the img-alt error — " +
      "the missing-alt check should test attrs.alt === undefined, not !attrs.alt"
  );

  it("passes images with meaningful alt", () => {
    runCheck([el("image", { attrs: { alt: "Team photo" }, styles: CLEAN })]);
    expect(screen.getByText("No accessibility issues found!")).toBeInTheDocument();
  });
});

describe("AccessibilityChecker — empty interactive elements", () => {
  it("flags a button with no content", () => {
    runCheck([el("button", { content: "   ", styles: CLEAN })]);
    expect(screen.getByText("Button has no accessible name")).toBeInTheDocument();
  });

  it("flags a link with no content", () => {
    runCheck([el("link", { content: "", styles: CLEAN })]);
    expect(screen.getByText("Link has no accessible name")).toBeInTheDocument();
  });
});

describe("AccessibilityChecker — heading structure", () => {
  it("flags a skipped heading level (h1 → h3)", () => {
    runCheck([
      el("heading", { id: "h-1", attrs: { "data-level": "1" }, content: "A", styles: CLEAN }),
      el("heading", { id: "h-2", attrs: { "data-level": "3" }, content: "B", styles: CLEAN }),
    ]);
    expect(screen.getByText("Heading level skipped: h1 to h3")).toBeInTheDocument();
  });

  it("flags a page whose headings never include an h1", () => {
    runCheck([el("heading", { attrs: { "data-level": "2" }, content: "B", styles: CLEAN })]);
    expect(screen.getByText("Page should have an h1 heading")).toBeInTheDocument();
  });

  it("accepts a well-ordered h1 → h2 outline", () => {
    runCheck([
      el("heading", { id: "h-1", attrs: { "data-level": "1" }, content: "A", styles: CLEAN }),
      el("heading", { id: "h-2", attrs: { "data-level": "2" }, content: "B", styles: CLEAN }),
    ]);
    expect(screen.getByText("No accessibility issues found!")).toBeInTheDocument();
  });
});

describe("AccessibilityChecker — color contrast", () => {
  it("flags near-identical fg/bg (#000 on #111 ≈ 1.1:1) as a contrast issue", () => {
    runCheck([
      el("text", {
        content: "hi",
        styles: { color: "#000000", backgroundColor: "#111111", fontSize: "16px" },
      }),
    ]);
    expect(screen.getByText(/Low contrast ratio: 1\.1:1/)).toBeInTheDocument();
    expect(screen.getByText("color-contrast")).toBeInTheDocument();
  });

  it("passes maximal contrast (#fff on #000 = 21:1)", () => {
    runCheck([
      el("paragraph", {
        content: "hi",
        styles: { color: "#ffffff", backgroundColor: "#000000", fontSize: "16px" },
      }),
    ]);
    expect(screen.getByText("No accessibility issues found!")).toBeInTheDocument();
  });

  it("PIN (audit): luminance uses the WCAG 2.x 0.03928 sRGB threshold constant", () => {
    // The audit flagged this constant as drifted from the sRGB-standard
    // 0.04045. For 8-bit hex channels the two thresholds are behaviorally
    // indistinguishable (no integer channel value falls between them), so the
    // drift cannot be pinned through the UI — pin the source instead so any
    // silent change to the luminance math surfaces in review.
    // vitest root is packages/editor, so cwd-relative works for both the
    // editor run and the dashboard node_modules dual-run (same real file).
    const source = readFileSync(
      resolve(process.cwd(), "src/ai/AccessibilityChecker.tsx"),
      "utf8"
    );
    expect(source).toContain("0.03928");
    expect(source).toContain("c / 12.92");
  });

  it.todo(
    "AUDIT BUG: contrast check silently no-ops for non-hex colors — the checker's own " +
      "defaults (backgroundColor 'var(--bd-bg-card)') produce NaN luminance, so NaN < 4.5 " +
      "is false and un-styled text is never contrast-checked"
  );
});

describe("AccessibilityChecker — font size + interaction", () => {
  it("warns on fonts smaller than 12px", () => {
    runCheck([
      el("text", { content: "tiny", styles: { ...CLEAN, fontSize: "10px" } }),
    ]);
    expect(screen.getByText("Font size may be too small for readability")).toBeInTheDocument();
  });

  it("summarizes counts by severity and re-checks on demand", () => {
    runCheck([
      el("image", { id: "img-1", styles: CLEAN }), // error
      el("text", { content: "tiny", styles: { ...CLEAN, fontSize: "10px" } }), // warning
    ]);
    expect(screen.getByText("Errors")).toBeInTheDocument();
    expect(screen.getByText("Warnings")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Re-check/ })).toBeInTheDocument();
  });

  it("clicking an issue with an elementId calls onSelectElement", () => {
    const onSelect = vi.fn();
    runCheck([el("image", { id: "img-9", styles: CLEAN })], onSelect);
    fireEvent.click(screen.getByText("Image is missing alt text"));
    expect(onSelect).toHaveBeenCalledWith("img-9");
  });

  it("traverses nested children (issue found two levels deep)", () => {
    runCheck([
      el("container", {
        id: "c-1",
        children: [el("container", { id: "c-2", children: [el("image", { id: "deep-img", styles: CLEAN })] })],
      }),
    ]);
    expect(screen.getByText("Image is missing alt text")).toBeInTheDocument();
  });

  it("with a null composer the check completes cleanly (no issues, no crash)", () => {
    render(<AccessibilityChecker composer={null} />);
    fireEvent.click(screen.getByRole("button", { name: /Run Accessibility Check/ }));
    expect(screen.getByText("No accessibility issues found!")).toBeInTheDocument();
  });
});
