/**
 * AdvancedScreen tests — debounced (500ms) HTML/CSS validation via fake
 * timers, dirty wiring, flush-handler contract.
 *
 * All timer advances that change state are wrapped in act(). waitFor is
 * avoided in this file — RTL's polling does not reliably cooperate with
 * vitest fake timers; assertions run synchronously after act-wrapped
 * fireEvent / advanceTimersByTime calls instead.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import * as React from "react";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";
import { AdvancedScreen } from "../AdvancedScreen";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function setup(opts: {
  onDirtyChange?: (d: boolean) => void;
  registerFlushHandler?: (h: (() => void) | null) => void;
  settings?: Record<string, unknown>;
} = {}) {
  const composer = createMockComposer({ projectSettings: opts.settings ?? {} });
  const utils = render(
    <AdvancedScreen
      composer={composer}
      onDirtyChange={opts.onDirtyChange}
      registerFlushHandler={opts.registerFlushHandler}
    />,
  );
  return { composer, ...utils };
}

const headBox = () => screen.getByLabelText("Head Scripts") as HTMLTextAreaElement;
const bodyBox = () => screen.getByLabelText("Body Scripts") as HTMLTextAreaElement;
const cssBox = () => screen.getByLabelText("Global CSS") as HTMLTextAreaElement;

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe("AdvancedScreen — rendering + prefill", () => {
  it("renders the three code sections + warning banner, prefilled from customCode", () => {
    setup({
      settings: {
        customCode: {
          headScripts: "<meta charset=\"utf-8\">",
          bodyScripts: "<script>x()</script>",
          globalCss: ".a { color: red; }",
        },
      },
    });
    expect(screen.getByText(/Custom code runs on all pages/)).toBeTruthy();
    expect(headBox().value).toBe('<meta charset="utf-8">');
    expect(bodyBox().value).toBe("<script>x()</script>");
    expect(cssBox().value).toBe(".a { color: red; }");
  });
});

describe("AdvancedScreen — debounced HTML validation (head scripts)", () => {
  it("does not validate until 500ms after the last keystroke", () => {
    setup();
    fireEvent.change(headBox(), { target: { value: "<div>" } });
    expect(screen.queryByRole("status")).toBeNull();
    advance(499);
    expect(screen.queryByRole("status")).toBeNull();
    advance(1);
    expect(screen.getByText(/Unclosed tag/)).toBeTruthy();
  });

  it("re-typing before the debounce window elapses resets the timer (only latest value validates)", () => {
    setup();
    fireEvent.change(headBox(), { target: { value: "<div>" } });
    advance(300);
    fireEvent.change(headBox(), { target: { value: "<div></div>" } });
    advance(499);
    expect(screen.queryByRole("status")).toBeNull();
    advance(1);
    // Latest (balanced) value validated — no stale error from the first value.
    expect(screen.queryByText(/Unclosed tag/)).toBeNull();
    expect(screen.getByText(/HTML looks good/)).toBeTruthy();
  });

  it("valid HTML shows the success line", () => {
    setup();
    fireEvent.change(headBox(), { target: { value: '<meta charset="utf-8">' } });
    advance(500);
    expect(screen.getByText(/HTML looks good/)).toBeTruthy();
  });

  it("forbidden tags produce an error", () => {
    setup();
    fireEvent.change(headBox(), { target: { value: "<iframe src='x'></iframe>" } });
    advance(500);
    expect(screen.getByText(/Forbidden tag/)).toBeTruthy();
  });

  it("inline event handlers produce a warning (still valid, no success line)", () => {
    setup();
    fireEvent.change(headBox(), { target: { value: '<script onload="x()"></script>' } });
    advance(500);
    expect(screen.getByText(/Inline event handlers detected/)).toBeTruthy();
    expect(screen.queryByText(/HTML looks good/)).toBeNull();
  });

  it("clearing the textarea removes validation feedback immediately (no debounce wait)", () => {
    setup();
    fireEvent.change(headBox(), { target: { value: "<div>" } });
    advance(500);
    expect(screen.getByText(/Unclosed tag/)).toBeTruthy();
    fireEvent.change(headBox(), { target: { value: "" } });
    expect(screen.queryByText(/Unclosed tag/)).toBeNull();
  });
});

describe("AdvancedScreen — debounced CSS validation", () => {
  it("unbalanced braces show an error after the 500ms debounce", () => {
    setup();
    fireEvent.change(cssBox(), { target: { value: ".a { color: red;" } });
    advance(499);
    expect(screen.queryByText(/unclosed brace/)).toBeNull();
    advance(1);
    expect(screen.getByText(/1 unclosed brace — missing \}/)).toBeTruthy();
  });

  it("stray closing brace shows the extra-brace error", () => {
    setup();
    fireEvent.change(cssBox(), { target: { value: ".a { color: red; } }" } });
    advance(500);
    expect(screen.getByText(/extra closing brace/)).toBeTruthy();
  });

  it("balanced CSS shows the success line", () => {
    setup();
    fireEvent.change(cssBox(), { target: { value: ".a { color: red; }" } });
    advance(500);
    expect(screen.getByText(/CSS brace balance looks good/)).toBeTruthy();
  });
});

describe("AdvancedScreen — body scripts have no validator", () => {
  it("typing into Body Scripts never produces validation feedback", () => {
    setup();
    fireEvent.change(bodyBox(), { target: { value: "<div>" } });
    advance(1000);
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("AdvancedScreen — dirty wiring + flush handler", () => {
  it("starts clean; typing in any textarea marks dirty", () => {
    const onDirtyChange = vi.fn();
    setup({ onDirtyChange });
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    fireEvent.change(bodyBox(), { target: { value: "<script>x()</script>" } });
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
  });

  it("registers a flush handler and clears it on unmount", () => {
    const registerFlushHandler = vi.fn();
    const { unmount } = setup({ registerFlushHandler });
    expect(registerFlushHandler).toHaveBeenCalledWith(expect.any(Function));
    unmount();
    expect(registerFlushHandler).toHaveBeenLastCalledWith(null);
  });

  it("flush writes the typed head/body/css buffers into composer customCode", () => {
    let flush: (() => void) | null = null;
    const registerFlushHandler = vi.fn((h: (() => void) | null) => {
      flush = h;
    });
    const { composer } = setup({ registerFlushHandler });

    fireEvent.change(headBox(), { target: { value: "<meta name=\"a\">" } });
    fireEvent.change(bodyBox(), { target: { value: "<script>b()</script>" } });
    fireEvent.change(cssBox(), { target: { value: ".c { top: 0; }" } });

    expect(flush).toBeTypeOf("function");
    act(() => flush!());

    expect(composer.setProjectSettings).toHaveBeenCalledTimes(1);
    const settings = composer.getProjectSettings() as {
      customCode: { headScripts: string; bodyScripts: string; globalCss: string };
    };
    expect(settings.customCode).toEqual({
      headScripts: '<meta name="a">',
      bodyScripts: "<script>b()</script>",
      globalCss: ".c { top: 0; }",
    });
  });
});
