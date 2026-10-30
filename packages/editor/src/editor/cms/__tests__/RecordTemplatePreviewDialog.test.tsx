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

const MENU = {
  id: "col-1",
  name: "Menu items",
  displayField: "name",
  pageTemplatePath: "menu-item.html",
  fields: [
    { id: "f1", name: "Name", slug: "name", type: "text", order: 0 },
    { id: "f2", name: "Description", slug: "description", type: "textarea", order: 1 },
  ],
} as unknown as CMSCollection;
const RECORD = { id: "r1", collectionId: "col-1", data: { name: "Margherita", description: "Tomato and basil." }, status: "published", createdAt: "", updatedAt: "" } as CMSContentItem;

beforeEach(() => renderPreviewMock.mockReset());
afterEach(() => cleanup());

describe("RecordTemplatePreviewDialog", () => {
  /* 183:20974: the SAVED record as its card; the page preview one click away. */
  it("shows the saved record's card, then offers the page preview once it is rendered", async () => {
    renderPreviewMock.mockResolvedValueOnce({ ok: true, html: "<h1>Margherita</h1>" });
    render(
      <RecordTemplatePreviewDialog composer={{} as never} collection={MENU} record={RECORD} onClose={vi.fn()} onChooseTemplate={vi.fn()} />,
    );
    expect(screen.getByTestId("cms-record-template-preview-subtitle")).toHaveTextContent("Margherita · Last saved version");
    expect(screen.getByTestId("cms-record-preview-card")).toHaveTextContent("MargheritaTomato and basil.");
    expect(await screen.findByTestId("cms-record-template-preview-open")).toHaveTextContent("Open page preview");
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
    fireEvent.click(await screen.findByTestId("cms-record-template-preview-open"));
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

  it("without a composer, or when the page render throws, the card stays and no page preview is offered", async () => {
    render(<RecordTemplatePreviewDialog composer={null} collection={MENU} record={RECORD} onClose={vi.fn()} onChooseTemplate={vi.fn()} />);
    expect(screen.getByTestId("cms-record-preview-card")).toHaveTextContent("Margherita");
    expect(renderPreviewMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("cms-record-template-preview-open")).toBeNull();
    cleanup();
    renderPreviewMock.mockRejectedValueOnce(new Error("boom"));
    render(
      <RecordTemplatePreviewDialog composer={{} as never} collection={MENU} record={RECORD} onClose={vi.fn()} onChooseTemplate={vi.fn()} />,
    );
    await Promise.resolve();
    expect(screen.queryByTestId("cms-record-template-preview-open")).toBeNull();
    expect(screen.getByTestId("cms-record-preview-card")).toHaveTextContent("Margherita");
  });

  it("Close calls onClose", async () => {
    renderPreviewMock.mockResolvedValueOnce({ ok: true, html: "<p>x</p>" });
    const onClose = vi.fn();
    render(
      <RecordTemplatePreviewDialog composer={{} as never} collection={MENU} record={RECORD} onClose={onClose} onChooseTemplate={vi.fn()} />,
    );
    fireEvent.click(screen.getByTestId("cms-record-template-preview-close"));
    expect(onClose).toHaveBeenCalled();
  });
});
