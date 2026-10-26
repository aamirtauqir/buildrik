/**
 * .brcomponent packages (2L9 B6-K28…K31): export a master with the ones
 * nested in it; import checks before it adds, and never overwrites.
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import type { ComponentDefinition } from "@/shared/types/components";

const download = vi.fn();
vi.mock("@/editor/export/ExportUtils", () => ({ downloadFile: (...a: unknown[]) => download(...a) }));

import { buildPackage, parsePackage, summarize } from "../componentPackage";
import { ExportPackageDialog } from "../ExportPackageDialog";
import { ImportPackageDialog } from "../ImportPackageDialog";

const def = (id: string, name: string, tree: object, pageId?: string) =>
  ({ id, name, masterTree: { id: `${id}-root`, type: "container", ...tree }, createdAt: 1, updatedAt: 1, version: 1, ...(pageId ? { pageId } : {}) }) as ComponentDefinition;

const BUTTON = def("btn", "Button group", { classes: ["btn"], styles: { fontFamily: "Fraunces, serif" } });
const HERO = def(
  "hero",
  "Hero card",
  {
    classes: ["hero", "card"],
    children: [
      { id: "img", type: "image", attributes: { src: "https://cdn.example/a.jpg" } },
      { id: "bg", type: "container", styles: { backgroundImage: "url('https://cdn.example/b.jpg')" } },
      { id: "i", type: "container", data: { componentInstance: { componentId: "btn" } } },
    ],
  },
  "page-home",
);

afterEach(cleanup);

describe("componentPackage", () => {
  it("packs the main component and the masters nested in it, without page scope", () => {
    const pkg = buildPackage("hero", [HERO, BUTTON, def("other", "Other", {})])!;
    expect(pkg.components.map((c) => c.id)).toEqual(["hero", "btn"]);
    expect(pkg.components[0].pageId).toBeNull();
    const s = summarize(pkg);
    expect(s.images).toEqual(["https://cdn.example/a.jpg", "https://cdn.example/b.jpg"]);
    expect(s.fonts).toEqual(["Fraunces"]);
    expect(s.nested).toEqual(["Button group"]);
    expect(s.classes).toBe(3);
  });

  it("reads a package back, and refuses what is not one", () => {
    const text = JSON.stringify(buildPackage("hero", [HERO, BUTTON]));
    expect("pkg" in parsePackage(text, text.length)).toBe(true);
    expect(parsePackage("{nope", 5)).toEqual({ error: expect.stringContaining("isn’t a component package") });
    expect(parsePackage(text, 60 * 1024 * 1024)).toEqual({ error: "This file is over 50 MB, the package limit." });
  });
});

describe("ExportPackageDialog (220:42920)", () => {
  it("says what is included and downloads the file with a receipt", async () => {
    const onClose = vi.fn();
    render(
      <ToastProvider>
        <ExportPackageDialog component={HERO} all={[HERO, BUTTON]} onClose={onClose} />
      </ToastProvider>,
    );
    expect(screen.getByText("Exporting main component Hero card. Exporting never changes, saves or publishes your site.")).toBeInTheDocument();
    expect(screen.getByTestId("comp-export-included")).toHaveTextContent("Nested componentsButton group");
    expect(screen.getByTestId("comp-export-file")).toHaveTextContent(/^hero-card\.brcomponent · about \d+ KB$/);
    fireEvent.click(screen.getByTestId("comp-export-download"));
    expect(download).toHaveBeenCalledWith(expect.stringContaining('"rootId":"hero"'), "hero-card.brcomponent", "application/json");
    expect(await screen.findByText("Download started: hero-card.brcomponent. Your site was not changed.")).toBeInTheDocument();
  });
});

describe("ImportPackageDialog (220:43545)", () => {
  it("checks the file, adds only what is new, and keeps what is already here", async () => {
    const adopt = vi.fn(async (c: ComponentDefinition) => c);
    const composer = { components: { getAllComponents: () => [BUTTON], adoptLibraryComponent: adopt } };
    const onClose = vi.fn();
    render(
      <ToastProvider>
        <ImportPackageDialog composer={composer as never} onClose={onClose} />
      </ToastProvider>,
    );
    expect(screen.getByText("Add components from a .brcomponent package. Nothing is added until the last step.")).toBeInTheDocument();
    const text = JSON.stringify(buildPackage("hero", [HERO, BUTTON]));
    const file = new File([text], "fieldwork.brcomponent", { type: "application/json" });
    fireEvent.change(screen.getByTestId("comp-import-input"), { target: { files: [file] } });
    expect(await screen.findByTestId("comp-import-selected")).toHaveTextContent("fieldwork.brcomponent");
    expect(screen.getByTestId("comp-import-selected")).toHaveTextContent("2 main components");
    fireEvent.click(screen.getByTestId("comp-import-continue"));
    expect(screen.getByTestId("comp-import-check")).toHaveTextContent("Hero cardNew");
    expect(screen.getByTestId("comp-import-check")).toHaveTextContent("Button groupAlready on this site · kept as is");
    expect(adopt).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("comp-import-run"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(adopt.mock.calls.map((c) => c[0].id)).toEqual(["hero"]);
  });

  it("names a file that is not a package", async () => {
    render(
      <ToastProvider>
        <ImportPackageDialog composer={{ components: { getAllComponents: () => [] } } as never} onClose={vi.fn()} />
      </ToastProvider>,
    );
    fireEvent.change(screen.getByTestId("comp-import-input"), { target: { files: [new File(["hello"], "notes.txt")] } });
    expect(await screen.findByTestId("comp-import-error")).toHaveTextContent("This isn’t a component package.");
    expect(screen.getByTestId("comp-import-continue")).toBeDisabled();
  });
});
