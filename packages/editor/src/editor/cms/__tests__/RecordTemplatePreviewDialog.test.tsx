/**
 * RecordTemplatePreviewDialog — "Preview saved record" (7116:76427). Opens
 * the collection's template page rendered with one record's data, read-only.
 * `renderRecordTemplatePreview` is mocked; its own logic (token substitution,
 * escaping) is exercised directly in recordTemplatePreview.test.ts.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";

const renderPreviewMock = vi.fn();
vi.mock("../recordTemplatePreview", () => ({
  renderRecordTemplatePreview: (...a: unknown[]) => renderPreviewMock(...a),
}));

import { RecordTemplatePreviewDialog } from "../RecordTemplatePreviewDialog";

const MENU = { id: "col-1", name: "Menu items", pageTemplatePath: "menu-item.html" } as unknown as CMSCollection;
const RECORD = { id: "r1", collectionId: "col-1", data: { name: "Margherita" }, status: "published", createdAt: "", updatedAt: "" } as CMSContentItem;

beforeEach(() => renderPreviewMock.mockReset());
afterEach(() => cleanup());

describe("RecordTemplatePreviewDialog", () => {
  it("renders the template preview in an iframe once the render resolves", async () => {
    renderPreviewMock.mockResolvedValueOnce({ ok: true, html: "<h1>Margherita</h1>" });
    render(
      <RecordTemplatePreviewDialog composer={{} as never} collection={MENU} record={RECORD} onClose={vi.fn()} onChooseTemplate={vi.fn()} />,
    );
    const frame = (await screen.findByTestId("cms-record-template-preview-frame")) as HTMLIFrameElement;
    expect(frame.srcdoc).toBe("<h1>Margherita</h1>");
    expect(screen.getByTestId("cms-record-template-preview-open")).toBeEnabled();
  });

  it("Open in new tab renders the page only inside a sandbox=\"\" iframe, never as a same-origin blob page (I-1a)", async () => {
    const html = "<html><head><script>parent.stolen=1</script></head><body><h1>Margherita</h1></body></html>";
    renderPreviewMock.mockResolvedValueOnce({ ok: true, html });
    const tab = { document: document.implementation.createHTMLDocument(""), opener: {} as unknown };
    const openSpy = vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
    const blobSpy = vi.spyOn(URL, "createObjectURL");
    render(
      <RecordTemplatePreviewDialog composer={{} as never} collection={MENU} record={RECORD} onClose={vi.fn()} onChooseTemplate={vi.fn()} />,
    );
    await screen.findByTestId("cms-record-template-preview-frame");
    fireEvent.click(screen.getByTestId("cms-record-template-preview-open"));
    expect(openSpy).toHaveBeenCalledWith("about:blank", "_blank");
    expect(blobSpy).not.toHaveBeenCalled();
    expect(tab.opener).toBeNull();
    const frames = tab.document.querySelectorAll("iframe");
    expect(frames).toHaveLength(1);
    expect(frames[0].getAttribute("sandbox")).toBe("");
    expect(frames[0].getAttribute("srcdoc")).toBe(html);
    // The record's page never reaches the new tab's own (app-origin) document.
    expect(tab.document.querySelector("script")).toBeNull();
    expect(tab.document.querySelector("h1")).toBeNull();
    openSpy.mockRestore();
    blobSpy.mockRestore();
  });

  it("offers Choose a template page when the collection has no template bound", async () => {
    renderPreviewMock.mockResolvedValueOnce({ ok: false, reason: "no-template" });
    const onChooseTemplate = vi.fn();
    render(
      <RecordTemplatePreviewDialog composer={{} as never} collection={MENU} record={RECORD} onClose={vi.fn()} onChooseTemplate={onChooseTemplate} />,
    );
    expect(await screen.findByTestId("cms-record-template-preview-error")).toHaveTextContent("no template page set yet");
    fireEvent.click(screen.getByTestId("cms-record-template-preview-choose"));
    expect(onChooseTemplate).toHaveBeenCalled();
  });

  it("says the composer isn't ready rather than hanging when composer is null", async () => {
    render(<RecordTemplatePreviewDialog composer={null} collection={MENU} record={RECORD} onClose={vi.fn()} onChooseTemplate={vi.fn()} />);
    expect(await screen.findByTestId("cms-record-template-preview-error")).toHaveTextContent("isn't ready yet");
    expect(renderPreviewMock).not.toHaveBeenCalled();
  });

  it("shows a generic refusal when rendering throws", async () => {
    renderPreviewMock.mockRejectedValueOnce(new Error("boom"));
    render(
      <RecordTemplatePreviewDialog composer={{} as never} collection={MENU} record={RECORD} onClose={vi.fn()} onChooseTemplate={vi.fn()} />,
    );
    expect(await screen.findByTestId("cms-record-template-preview-error")).toHaveTextContent("Couldn't render this preview");
  });

  it("Close calls onClose", async () => {
    renderPreviewMock.mockResolvedValueOnce({ ok: true, html: "<p>x</p>" });
    const onClose = vi.fn();
    render(
      <RecordTemplatePreviewDialog composer={{} as never} collection={MENU} record={RECORD} onClose={onClose} onChooseTemplate={vi.fn()} />,
    );
    await screen.findByTestId("cms-record-template-preview-frame");
    fireEvent.click(screen.getByTestId("cms-record-template-preview-close"));
    expect(onClose).toHaveBeenCalled();
  });
});
