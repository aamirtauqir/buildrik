/**
 * PreviewOverlay tests — in-shell preview (shell state 7): sandboxed iframe
 * render, "‹ Back to canvas" + Escape exit, hidden when no html.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => ({
    siteDetail: { sharing: { list: { query: () => new Promise(() => {}) }, create: { mutate: vi.fn() } } },
  }),
}));

import { PreviewOverlay } from "../PreviewOverlay";
import { ToastProvider } from "@/editor/chrome-ui";

afterEach(() => cleanup());

describe("PreviewOverlay", () => {
  it("renders nothing without html", () => {
    render(<PreviewOverlay html={null} onDone={vi.fn()} />);
    expect(screen.queryByTestId("preview-overlay")).toBeNull();
  });

  /* BD-34 (2026-10-20): Preview runs the site's scripts so interactions
     behave as published — in an opaque-origin sandbox. allow-scripts WITHOUT
     allow-same-origin: the frame cannot reach the editor's cookies, storage
     or DOM. The html is still sanitized; only the editor's own runtime and
     the frame bridge are added back. */
  it("runs scripts in an opaque-origin sandbox: allow-scripts, never allow-same-origin", () => {
    render(<PreviewOverlay html="<h1>hi</h1>" onDone={vi.fn()} />);
    const frame = screen.getByTitle("Site preview") as HTMLIFrameElement;
    const tokens = (frame.getAttribute("sandbox") ?? "").split(/\s+/);
    expect(tokens).toContain("allow-scripts");
    expect(tokens).not.toContain("allow-same-origin");
    const doc = frame.getAttribute("srcDoc") ?? frame.getAttribute("srcdoc") ?? "";
    expect(doc.startsWith("<h1>hi</h1>")).toBe(true);
    expect(doc).toContain("bk-preview");
  });

  it("adds the interaction runtime only when the page has interactions", () => {
    const { unmount } = render(<PreviewOverlay html="<body><p>x</p></body>" onDone={vi.fn()} />);
    const plain = (screen.getByTitle("Site preview") as HTMLIFrameElement).getAttribute("srcdoc") ?? "";
    expect(plain).not.toContain("data-buildrick-interactions]");
    unmount();
    render(<PreviewOverlay html={'<body><p data-buildrick-interactions="[]">x</p></body>'} onDone={vi.fn()} />);
    const withRuntime = (screen.getByTitle("Site preview") as HTMLIFrameElement).getAttribute("srcdoc") ?? "";
    expect(withRuntime).toContain("[data-buildrick-interactions]");
    expect(withRuntime.indexOf("<script>")).toBeLessThan(withRuntime.lastIndexOf("</body>"));
  });

  /* REA #18: the published page gets each widget's runtime (publishPostProcess)
     and the preview sanitizer strips every script, so tabs, accordions and
     modals previewed dead. The same runtimes are added back here. */
  it("adds the widget runtimes the published page gets", () => {
    render(<PreviewOverlay html={'<body><div role="tablist"></div></body>'} onDone={vi.fn()} />);
    const doc = (screen.getByTitle("Site preview") as HTMLIFrameElement).getAttribute("srcdoc") ?? "";
    expect(doc).toContain("data-buildrick-tabs-runtime");
  });

  /* REA #18: a previewed form is shown but cannot submit (the frame has no
     allow-forms), and the preview says so rather than leaving a dead button. */
  it("says that forms don't submit in preview, only when the page has one", () => {
    const { unmount } = render(<PreviewOverlay html="<body><p>x</p></body>" onDone={vi.fn()} />);
    expect(screen.queryByTestId("preview-notice-forms")).toBeNull();
    unmount();
    render(<PreviewOverlay html={'<body><form><input name="a"></form></body>'} onDone={vi.fn()} />);
    expect(screen.getByTestId("preview-notice-forms")).toHaveTextContent(/don.t submit in preview/i);
    const frame = screen.getByTitle("Site preview") as HTMLIFrameElement;
    expect((frame.getAttribute("sandbox") ?? "").split(/\s+/)).not.toContain("allow-forms");
  });

  /* REA #18: an image with no file chosen showed the browser's broken-image
     glyph and its alt text, unexplained; the canvas draws a placeholder. */
  it("names images with no file chosen", () => {
    render(<PreviewOverlay html={'<body><img alt="Image"><img src="" alt="b"><img src="https://x/y.png"></body>'} onDone={vi.fn()} />);
    expect(screen.getByTestId("preview-notice-images")).toHaveTextContent(/2 images have no file chosen/i);
    const doc = (screen.getByTitle("Site preview") as HTMLIFrameElement).getAttribute("srcdoc") ?? "";
    expect(doc).toContain('img:not([src]),img[src=""]');
  });

  /* REA #18: draft collection records vanished from Preview with no word. */
  it("says how many draft records the page's lists leave out", () => {
    const { unmount } = render(<PreviewOverlay html="<body><p>x</p></body>" hiddenDrafts={0} onDone={vi.fn()} />);
    expect(screen.queryByTestId("preview-notice-drafts")).toBeNull();
    unmount();
    render(<PreviewOverlay html="<body><p>x</p></body>" hiddenDrafts={1} onDone={vi.fn()} />);
    expect(screen.getByTestId("preview-notice-drafts")).toHaveTextContent(/1 draft item isn.t shown/i);
  });

  /* Board 4418:165611 (C5 G1-086): the way out is "‹ Back to canvas" in the
     preview's own bar; the Done pill is gone, and each device names its width. */
  it("'‹ Back to canvas' exits, and each device names its width", () => {
    const onDone = vi.fn();
    render(<PreviewOverlay html="<p>x</p>" onDone={onDone} />);
    expect(screen.queryByRole("button", { name: "Done" })).toBeNull();
    expect(screen.getByTestId("bp-cell-desktop")).toHaveTextContent("Desktop1320px");
    expect(screen.getByTestId("bp-cell-tablet")).toHaveTextContent("Tablet768px");
    expect(screen.getByTestId("bp-cell-mobile")).toHaveTextContent("Mobile375px");
    fireEvent.click(screen.getByRole("button", { name: "‹ Back to canvas" }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("Escape exits", () => {
    const onDone = vi.fn();
    render(<PreviewOverlay html="<p>x</p>" onDone={onDone} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  /* Board 807:8663. The row was recorded unbuildable on "PreviewOverlay has no
     device frame"; DeviceFramePreview has existed all along and the overlay
     simply did not use it. Asserted through the frame's own geometry — the
     screen div carries the device width — rather than through a class name,
     because a class can be present while the frame renders nothing. */
  const frame = () => screen.getByTitle("Site preview") as HTMLIFrameElement;

  it("a narrow device puts the page inside the device frame, and desktop does not", () => {
    render(<PreviewOverlay html="<p>x</p>" onDone={vi.fn()} />);
    expect(frame().parentElement?.style.width).toBe("");

    fireEvent.click(screen.getByRole("button", { name: /^Mobile/ }));
    expect(frame().parentElement?.style.width).toBe("375px");

    fireEvent.click(screen.getByRole("button", { name: /^Tablet/ }));
    expect(frame().parentElement?.style.width).toBe("768px");

    fireEvent.click(screen.getByRole("button", { name: /^Desktop/ }));
    expect(frame().parentElement?.style.width).toBe("");
  });

  it("the device row is reachable while the overlay covers the canvas", () => {
    render(<PreviewOverlay html="<p>x</p>" onDone={vi.fn()} />);
    // The editor's own device control is under the overlay, so the preview has
    // to carry one or the responsive check cannot be done here at all.
    expect(screen.getByRole("group", { name: "Breakpoint" })).toBeInTheDocument();
  });

  /* B1 / G1-022: the preview bar carries Share (boards 4418:165611 · 165563 ·
     120075), which opens the same share modal as the site menu row. Hidden
     without a site — there is no share link to mint. */
  it("hides Share button when siteId is null", () => {
    render(<PreviewOverlay html="<p>x</p>" onDone={vi.fn()} siteId={null} />);
    expect(screen.queryByTestId("preview-share-button")).toBeNull();
  });

  it("Share opens the share modal", async () => {
    render(
      <ToastProvider>
        <PreviewOverlay html="<p>x</p>" onDone={vi.fn()} siteId="site-abc" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByTestId("preview-share-button"));
    expect(await screen.findByTestId("preview-share-modal")).toHaveTextContent("Share preview");
  });

  /* DEF-shell-share-dialog-hidden-under-preview: Escape used to close the
     preview (and the modal with it, since the modal is its child) in one
     keystroke — the preview's `window`-capture handler ran before the
     modal's own `document`-capture trap. Escape must close only the topmost
     dialog; the preview stays until a second Escape. */
  it("Escape with the Share modal open closes only the modal, not the preview", async () => {
    const onDone = vi.fn();
    render(
      <ToastProvider>
        <PreviewOverlay html="<p>x</p>" onDone={onDone} siteId="site-abc" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByTestId("preview-share-button"));
    expect(await screen.findByTestId("preview-share-modal")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.queryByTestId("preview-share-modal")).toBeNull();
    expect(screen.getByTestId("preview-overlay")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

/* L5-051: an internal link inside the preview blanked the frame, and the
   preview could show only the page that was open. */
describe("PreviewOverlay — pages", () => {
  const pages = [
    { id: "home", name: "Home", slug: "home", isHome: true },
    { id: "contact", name: "Contact", slug: "contact" },
  ];

  it("names the page shown and switches to another from the page menu", () => {
    const onShowPage = vi.fn();
    render(<PreviewOverlay html="<p>x</p>" onDone={vi.fn()} pages={pages} currentPageId="home" onShowPage={onShowPage} />);
    const select = screen.getByLabelText("Preview page") as HTMLSelectElement;
    expect(select.value).toBe("home");
    fireEvent.change(select, { target: { value: "contact" } });
    expect(onShowPage).toHaveBeenCalledWith("contact");
  });

  /* The frame has no same-origin access, so its bridge posts link clicks
     up; the shell answers only messages from its own frame. */
  it("an internal link opens that page in the preview instead of blanking it", () => {
    const onShowPage = vi.fn();
    render(
      <PreviewOverlay html='<a href="/contact">Get a quote</a>' onDone={vi.fn()} pages={pages} currentPageId="home" onShowPage={onShowPage} />,
    );
    const frame = screen.getByTitle("Site preview") as HTMLIFrameElement;
    const post = (href: string, source: unknown = frame.contentWindow) =>
      act(() => {
        window.dispatchEvent(new MessageEvent("message", { data: { source: "bk-preview", type: "link", href }, source: source as Window }));
      });
    post("/contact");
    expect(onShowPage).toHaveBeenLastCalledWith("contact");
    post("/");
    expect(onShowPage).toHaveBeenLastCalledWith("home");
    onShowPage.mockClear();
    post("/contact", window);
    expect(onShowPage).not.toHaveBeenCalled();
  });
});
