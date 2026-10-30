/**
 * The canvas record bar (design-2l9 173:12022): shown only on a collection's
 * template page; ‹ › and the picker move the engine's preview choice, Show
 * drafts its draft switch. Nothing is written to the page.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import type { CMSContentItem } from "@/shared/types/cms";
import { CanvasRecordBar } from "../CanvasRecordBar";

const rec = (id: string, title: string, status: CMSContentItem["status"] = "published"): CMSContentItem => ({
  id, collectionId: "blog", data: { title }, status, createdAt: "", updatedAt: "",
});
const BLOG = { id: "blog", name: "Blog", slug: "blog", displayField: "title", fields: [{ id: "f", name: "Title", slug: "title", type: "text", order: 0 }] };

function fake(template: string | null) {
  let choice: string | null = null;
  let drafts = false;
  const rows = [rec("a", "First"), rec("d", "Draft one", "draft"), rec("b", "Second")];
  const listeners = new Map<string, Set<() => void>>();
  const on = (e: string, cb: () => void) => void (listeners.get(e) ?? listeners.set(e, new Set()).get(e)!).add(cb);
  const off = (e: string, cb: () => void) => void listeners.get(e)?.delete(cb);
  const fire = () => listeners.get("cms:preview-record-changed")?.forEach((cb) => cb());
  const candidates = () => rows.filter((r) => r.status === "published" || drafts);
  const bindings = {
    templateCollectionOf: vi.fn(() => template),
    previewCandidates: vi.fn(async () => candidates()),
    getPreviewRecord: vi.fn(async () => candidates().find((r) => r.id === choice) ?? candidates()[0] ?? null),
    getShowDrafts: () => drafts,
    setPreviewRecord: vi.fn((_c: string, id: string | null) => { choice = id; fire(); }),
    setShowDrafts: vi.fn((on: boolean) => { drafts = on; fire(); }),
  };
  const composer = {
    on, off,
    elements: { getActivePage: () => ({ id: "pg" }) },
    cms: { bindings, collections: { on, off, getCollection: () => BLOG } },
  };
  return { composer: composer as never, bindings };
}

afterEach(() => cleanup());

describe("CanvasRecordBar", () => {
  it("is absent on a page that is no collection's template", async () => {
    const { composer } = fake(null);
    render(<CanvasRecordBar composer={composer} />);
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByTestId("canvas-record-bar")).toBeNull();
  });

  it("previews the first published record, steps with ‹ ›, and picks from the list", async () => {
    const { composer, bindings } = fake("blog");
    render(<CanvasRecordBar composer={composer} />);
    await waitFor(() => expect(screen.getByTestId("canvas-record-pick")).toHaveTextContent("First"));
    expect(screen.getByTestId("canvas-record-prev")).toBeDisabled();
    fireEvent.click(screen.getByTestId("canvas-record-next"));
    expect(bindings.setPreviewRecord).toHaveBeenCalledWith("blog", "b");
    await waitFor(() => expect(screen.getByTestId("canvas-record-pick")).toHaveTextContent("Second"));
    expect(screen.getByTestId("canvas-record-next")).toBeDisabled();
    fireEvent.click(screen.getByTestId("canvas-record-pick"));
    expect(screen.getByTestId("canvas-record-count")).toHaveTextContent("Showing published records · 2");
    fireEvent.click(screen.getByTestId("canvas-record-option-a"));
    await waitFor(() => expect(screen.getByTestId("canvas-record-pick")).toHaveTextContent("First"));
  });

  it("Show drafts adds drafts to what can be previewed", async () => {
    const { composer, bindings } = fake("blog");
    render(<CanvasRecordBar composer={composer} />);
    await waitFor(() => expect(screen.getByTestId("canvas-record-bar")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("canvas-record-drafts"));
    expect(bindings.setShowDrafts).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByTestId("canvas-record-pick"));
    await waitFor(() => expect(screen.getByTestId("canvas-record-option-d")).toHaveTextContent("Draft one"));
    expect(screen.getByTestId("canvas-record-count")).toHaveTextContent("Showing published and draft records · 3");
  });
});
