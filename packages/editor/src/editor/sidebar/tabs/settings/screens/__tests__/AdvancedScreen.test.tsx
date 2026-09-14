/**
 * AdvancedScreen tests — Clone 3397:32456 Custom code: the three cards and
 * their code fields, the server read behind head/body (3953:49260 /
 * 3953:49386), the save-error banner (3951:26607), the debounced (500ms)
 * HTML/CSS validation via fake timers, dirty wiring and the flush contract.
 *
 * Timer advances that change state are wrapped in act(). waitFor is used
 * only under real timers (the load block) — RTL's polling does not reliably
 * cooperate with vitest fake timers, so the validation blocks assert
 * synchronously after act-wrapped fireEvent / advanceTimersByTime.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor, cleanup } from "@testing-library/react";
import * as React from "react";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";

const { api } = vi.hoisted(() => ({
  api: {
    siteDetail: {
      settings: { get: { query: vi.fn() } },
    },
  },
}));

vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => api,
}));

import { AdvancedScreen } from "../AdvancedScreen";

const getMock = api.siteDetail.settings.get.query;

beforeEach(() => {
  getMock.mockReset().mockResolvedValue({ headCode: null, bodyCode: null });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function setup(opts: {
  projectId?: string | null;
  onDirtyChange?: (d: boolean) => void;
  registerFlushHandler?: (h: (() => void) | null) => void;
  onLoadStateChange?: (s: "loading" | "ready" | "error") => void;
  saveError?: string | null;
  settings?: Record<string, unknown>;
} = {}) {
  const composer = createMockComposer({ projectSettings: opts.settings ?? {} });
  const utils = render(
    <AdvancedScreen
      composer={composer}
      projectId={opts.projectId === undefined ? null : opts.projectId}
      onDirtyChange={opts.onDirtyChange}
      registerFlushHandler={opts.registerFlushHandler}
      onLoadStateChange={opts.onLoadStateChange}
      saveError={opts.saveError}
    />,
  );
  return { composer, ...utils };
}

const headBox = () => screen.getByLabelText("Head scripts") as HTMLTextAreaElement;
const bodyBox = () => screen.getByLabelText("Body scripts") as HTMLTextAreaElement;
const cssBox = () => screen.getByLabelText("Global CSS") as HTMLTextAreaElement;

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe("AdvancedScreen — the frame's three cards, read from the Site row", () => {
  it("draws Head scripts / Body scripts (end) / Global CSS with their side labels and field ids", () => {
    setup();
    expect(screen.getByTestId("set-card-head-scripts")).toHaveTextContent("Head scripts");
    expect(screen.getByTestId("set-card-body-scripts")).toHaveTextContent("Body scripts (end)");
    expect(screen.getByTestId("set-card-global-css")).toHaveTextContent("Global CSS");
    expect(screen.getByTestId("set-card-head-scripts")).toHaveTextContent("<head>");
    expect(screen.getByTestId("set-card-body-scripts")).toHaveTextContent("</body>");
    expect(screen.getByTestId("set-card-global-css")).toHaveTextContent("styles");
    expect(headBox().id).toBe("code-head");
    expect(bodyBox().id).toBe("code-body");
    expect(cssBox().id).toBe("code-css");
    // The frame draws no banner over the cards; the validator under each
    // field is what says an inline script will not ship.
    expect(screen.queryByText(/inline JavaScript is removed/i)).toBeNull();
  });

  it("without a projectId prefills all three from the composer's customCode", () => {
    setup({
      settings: {
        customCode: {
          headScripts: "<meta charset=\"utf-8\">",
          bodyScripts: "<script>x()</script>",
          globalCss: ".a { color: red; }",
        },
      },
    });
    expect(headBox().value).toBe('<meta charset="utf-8">');
    expect(bodyBox().value).toBe("<script>x()</script>");
    expect(cssBox().value).toBe(".a { color: red; }");
    expect(getMock).not.toHaveBeenCalled();
  });

  /* Head and body are Site columns — what the publish worker injects — so
     the row wins over the composer's copy; CSS is not, so the composer's
     copy stands. */
  it("with a projectId, head and body come from the Site row and CSS from the composer", async () => {
    getMock.mockResolvedValue({ headCode: "<meta name=\"row\">", bodyCode: "<script src=\"https://x/y.js\"></script>" });
    setup({
      projectId: "s1",
      settings: { customCode: { headScripts: "<meta name=\"stale\">", bodyScripts: "", globalCss: ".c { top: 0; }" } },
    });
    await waitFor(() => expect(headBox().value).toBe('<meta name="row">'));
    expect(bodyBox().value).toBe('<script src="https://x/y.js"></script>');
    expect(cssBox().value).toBe(".c { top: 0; }");
    expect(getMock).toHaveBeenCalledWith({ siteId: "s1" });
  });

  it("shows the CUSTOM CODE load card while the row is on its way, then the error line + Try again", async () => {
    getMock.mockRejectedValueOnce(new Error("network"));
    const onLoadStateChange = vi.fn();
    setup({ projectId: "s1", onLoadStateChange });
    expect(screen.getByTestId("set-load-title")).toHaveTextContent("Custom code");
    expect(screen.getByTestId("set-load-card")).toHaveTextContent("Head, body and CSS injections for this site.");
    expect(screen.getByTestId("set-load-state")).toHaveTextContent("Loading…");
    expect(onLoadStateChange).toHaveBeenLastCalledWith("loading");

    await waitFor(() => expect(screen.getByTestId("set-load-retry")).toBeInTheDocument());
    expect(screen.getByTestId("set-load-state")).toHaveTextContent(
      "Couldn't load your custom code. Check your connection, then try again.",
    );
    expect(onLoadStateChange).toHaveBeenLastCalledWith("error");

    fireEvent.click(screen.getByTestId("set-load-retry"));
    await waitFor(() => expect(screen.getByTestId("set-card-head-scripts")).toBeInTheDocument());
    expect(onLoadStateChange).toHaveBeenLastCalledWith("ready");
  });

  it("renders the shell's saveError above the cards", () => {
    setup({ saveError: "Custom code was not saved. Your changes are still here. Review the values, then retry." });
    expect(screen.getByTestId("set-save-error")).toHaveTextContent(/Custom code was not saved/);
    expect(screen.getByTestId("set-card-head-scripts")).toBeInTheDocument();
  });
});

describe("AdvancedScreen — debounced HTML validation (head scripts)", () => {
  beforeEach(() => vi.useFakeTimers());

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
    /* Allowlisted tag, because an unbalanced-then-balanced <div> now also
       carries the "removed when published" warning and would never reach the
       success line this test is about. */
    fireEvent.change(headBox(), { target: { value: "<noscript>" } });
    advance(300);
    fireEvent.change(headBox(), { target: { value: "<noscript></noscript>" } });
    advance(499);
    expect(document.getElementById("head-validation-feedback")).toBeNull();
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
  beforeEach(() => vi.useFakeTimers());

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

describe("AdvancedScreen — body scripts validate on the same rules", () => {
  beforeEach(() => vi.useFakeTimers());

  /* Body scripts go through the SAME export sanitizer as head scripts
     (ExportEngine calls sanitizeHeadCode on both) and this field used to show
     no feedback at all, so an inline script here was dropped even more quietly
     than in the field above. */
  it("reports an unclosed tag typed into Body Scripts", () => {
    setup();
    fireEvent.change(bodyBox(), { target: { value: "<div>" } });
    expect(document.getElementById("body-validation-feedback")).toBeNull();
    advance(500);
    expect(document.getElementById("body-validation-feedback")?.textContent).toMatch(
      /Unclosed tag/
    );
  });

  it("warns that an inline script will not reach the published page", () => {
    setup();
    fireEvent.change(bodyBox(), { target: { value: "<script>track()</script>" } });
    advance(500);
    expect(document.getElementById("body-validation-feedback")?.textContent).toMatch(
      /Inline <script> is removed when the site is published/
    );
  });

  it("clearing the field clears its feedback without waiting for the debounce", () => {
    setup();
    fireEvent.change(bodyBox(), { target: { value: "<div>" } });
    advance(500);
    expect(document.getElementById("body-validation-feedback")).not.toBeNull();
    fireEvent.change(bodyBox(), { target: { value: "" } });
    expect(document.getElementById("body-validation-feedback")).toBeNull();
  });
});

describe("AdvancedScreen — dirty wiring + flush handler", () => {
  beforeEach(() => vi.useFakeTimers());

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
