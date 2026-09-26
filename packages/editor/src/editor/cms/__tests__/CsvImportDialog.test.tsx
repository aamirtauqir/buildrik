/**
 * CsvImportDialog — upload → preview/map columns → create records (fix-all
 * round, 2026-09-25). Both server calls (`importCsvPreview`, `importCsv`)
 * are mocked; parsing itself is covered server-side (cms.service.test.ts,
 * lib/csv.test.ts).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import type { CMSCollection } from "@/shared/types/cms";

const { api } = vi.hoisted(() => ({
  api: {
    cms: {
      entries: {
        importCsvPreview: { mutate: vi.fn() },
        importCsv: { mutate: vi.fn() },
      },
    },
  },
}));

const hydrateMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@/services/api-client", () => ({ getBuildrikClient: () => api }));
vi.mock("@/shared/utils/runtimeEnv", () => ({ DASHBOARD_URL: "http://localhost:3000" }));
vi.mock("@/services/BuildrikSyncProvider", () => ({ getSiteIdFromUrl: () => "site-1" }));
vi.mock("@/services/cmsSync", () => ({ hydrateCmsFromServer: (...a: unknown[]) => hydrateMock(...a) }));

import { CsvImportDialog } from "../CsvImportDialog";

const MENU = {
  id: "col-1",
  name: "Menu items",
  slug: "menu-items",
  fields: [
    { id: "f1", name: "Name", slug: "name", type: "text", order: 0 },
    { id: "f2", name: "Price", slug: "price", type: "text", order: 1 },
  ],
} as unknown as CMSCollection;

function selectFile(text: string, name = "records.csv") {
  const file = new File([text], name, { type: "text/csv" });
  const input = screen.getByTestId("cms-csv-import-input") as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}

beforeEach(() => {
  api.cms.entries.importCsvPreview.mutate.mockReset();
  api.cms.entries.importCsv.mutate.mockReset();
  hydrateMock.mockClear();
});
afterEach(() => cleanup());

describe("CsvImportDialog", () => {
  it("uploads, previews with a suggested mapping, and imports through the same server write manual creation uses", async () => {
    api.cms.entries.importCsvPreview.mutate.mockResolvedValueOnce({
      headers: ["Name", "Price"],
      totalRows: 2,
      sampleRows: [{ Name: "Margherita", Price: "12" }],
      suggestedMapping: { name: "Name", price: "Price" },
    });
    api.cms.entries.importCsv.mutate.mockResolvedValueOnce({ imported: 2, total: 2, errors: [] });
    const onImported = vi.fn();
    const onClose = vi.fn();
    render(<CsvImportDialog collection={MENU} onClose={onClose} onImported={onImported} />);

    fireEvent.click(screen.getByTestId("cms-csv-import-pick"));
    selectFile("Name,Price\nMargherita,12\nDiavola,14");

    await screen.findByTestId("cms-csv-import-summary");
    expect(api.cms.entries.importCsvPreview.mutate).toHaveBeenCalledWith({
      siteId: "site-1",
      collectionId: "col-1",
      csv: "Name,Price\nMargherita,12\nDiavola,14",
    });
    expect(screen.getByTestId("cms-csv-map-name")).toHaveValue("Name");
    expect(screen.getByTestId("cms-csv-map-price")).toHaveValue("Price");

    fireEvent.click(screen.getByTestId("cms-csv-import-confirm"));
    await waitFor(() =>
      expect(api.cms.entries.importCsv.mutate).toHaveBeenCalledWith({
        siteId: "site-1",
        collectionId: "col-1",
        csv: "Name,Price\nMargherita,12\nDiavola,14",
        columnMapping: { name: "Name", price: "Price" },
      }),
    );
    await waitFor(() => expect(hydrateMock).toHaveBeenCalled());
    expect(onImported).toHaveBeenCalled();
    expect(await screen.findByTestId("cms-csv-import-result")).toHaveTextContent("Imported 2 of 2 rows");
  });

  it("shows per-row errors without losing the imported count", async () => {
    api.cms.entries.importCsvPreview.mutate.mockResolvedValueOnce({
      headers: ["Name"],
      totalRows: 2,
      sampleRows: [],
      suggestedMapping: { name: "Name" },
    });
    api.cms.entries.importCsv.mutate.mockResolvedValueOnce({
      imported: 1,
      total: 2,
      errors: [{ row: 2, message: "No mapped column had a value" }],
    });
    render(<CsvImportDialog collection={MENU} onClose={vi.fn()} onImported={vi.fn()} />);
    fireEvent.click(screen.getByTestId("cms-csv-import-pick"));
    selectFile("Name\nMargherita\n");
    await screen.findByTestId("cms-csv-import-summary");
    fireEvent.click(screen.getByTestId("cms-csv-import-confirm"));
    const result = await screen.findByTestId("cms-csv-import-result");
    expect(result).toHaveTextContent("Imported 1 of 2 rows");
    expect(result).toHaveTextContent("Row 2: No mapped column had a value");
  });

  it("a field left unmapped can be changed to — Skip — and back", async () => {
    api.cms.entries.importCsvPreview.mutate.mockResolvedValueOnce({
      headers: ["Name", "Price"],
      totalRows: 1,
      sampleRows: [],
      suggestedMapping: { name: "Name", price: "Price" },
    });
    render(<CsvImportDialog collection={MENU} onClose={vi.fn()} onImported={vi.fn()} />);
    fireEvent.click(screen.getByTestId("cms-csv-import-pick"));
    selectFile("Name,Price\nMargherita,12");
    await screen.findByTestId("cms-csv-import-summary");
    fireEvent.change(screen.getByTestId("cms-csv-map-price"), { target: { value: "" } });
    expect(screen.getByTestId("cms-csv-map-price")).toHaveValue("");
    fireEvent.click(screen.getByTestId("cms-csv-import-confirm"));
    await waitFor(() =>
      expect(api.cms.entries.importCsv.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ columnMapping: { name: "Name" } }),
      ),
    );
  });

  it("surfaces a server refusal (e.g. row cap) instead of a blank screen", async () => {
    api.cms.entries.importCsvPreview.mutate.mockRejectedValueOnce(new Error("This file has 900 rows — the limit is 500."));
    render(<CsvImportDialog collection={MENU} onClose={vi.fn()} onImported={vi.fn()} />);
    fireEvent.click(screen.getByTestId("cms-csv-import-pick"));
    selectFile("Name\nA");
    expect(await screen.findByTestId("cms-csv-import-error")).toHaveTextContent("limit is 500");
  });

  it("Cancel closes without importing anything", async () => {
    const onClose = vi.fn();
    render(<CsvImportDialog collection={MENU} onClose={onClose} onImported={vi.fn()} />);
    fireEvent.click(screen.getByTestId("cms-csv-import-cancel"));
    expect(onClose).toHaveBeenCalled();
    expect(api.cms.entries.importCsvPreview.mutate).not.toHaveBeenCalled();
  });
});
