/**
 * PreviewOverlay tests — in-shell preview (shell state 7): sandboxed iframe
 * render, "‹ Back to canvas" + Escape exit, hidden when no html.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
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

  /* No allow-scripts, so nothing in the frame ever runs (the html is also
     sanitized). allow-same-origin only lets the shell read the frame's links
     (L5-051: a click on an internal link blanked the frame). */
  it("renders the sanitized html in a sandbox that runs no scripts", () => {
    render(<PreviewOverlay html="<h1>hi</h1>" onDone={vi.fn()} />);
    const frame = screen.getByTitle("Site preview") as HTMLIFrameElement;
    expect(frame.getAttribute("srcDoc") ?? frame.getAttribute("srcdoc")).toBe("<h1>hi</h1>");
    expect(frame.getAttribute("sandbox")).toBe("allow-same-origin");
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

  it("an internal link opens that page in the preview instead of blanking it", () => {
    const onShowPage = vi.fn();
    render(
      <PreviewOverlay html='<a href="/contact">Get a quote</a>' onDone={vi.fn()} pages={pages} currentPageId="home" onShowPage={onShowPage} />,
    );
    const frame = screen.getByTitle("Site preview") as HTMLIFrameElement;
    const doc = frame.contentDocument!;
    doc.body.innerHTML = '<a href="/contact">Get a quote</a><a href="contact.html">b</a><a href="/">c</a>';
    fireEvent.load(frame);
    const [a, b, c] = Array.from(doc.querySelectorAll("a"));
    const click = (el: Element) => {
      const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
      el.dispatchEvent(ev);
      return ev.defaultPrevented;
    };
    expect(click(a)).toBe(true);
    expect(onShowPage).toHaveBeenLastCalledWith("contact");
    click(b);
    expect(onShowPage).toHaveBeenLastCalledWith("contact");
    click(c);
    expect(onShowPage).toHaveBeenLastCalledWith("home");
  });
});
