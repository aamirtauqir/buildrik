/**
 * ContentTab tests — drill-in routing over a fake engine: root sections +
 * counts, empty state (board 149:7), collection → record save, fields add,
 * variables add (registers the live "site" source), conditions list + remove
 * + pick-to-create.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act, within } from "@testing-library/react";
import { ContentTab } from "../ContentTab";
import { cmsWorkspace } from "@/editor/cms/cmsWorkspaceStore";
import { makeEngine, MENU, ITEM } from "@/editor/cms/__tests__/fakeCmsEngine";
import { CMSValidationError } from "@/engine/cms/CollectionManager";

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe("ContentTab", () => {
  it("empty project shows the board 149:7 empty state with the create CTA", async () => {
    const { composer } = makeEngine();
    render(<ContentTab composer={composer as never} onCreateCollection={vi.fn()} />);
    expect(await screen.findByTestId("content-empty")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create a collection" })).toBeInTheDocument();
  });

  it("root lists collections with record counts and the Data rows", async () => {
    const { composer } = makeEngine({ collections: [MENU], items: [ITEM] });
    render(<ContentTab composer={composer as never} />);
    expect(await screen.findByText("Menu items")).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("1").length).toBeGreaterThan(0)); // record count
    for (const row of ["Sources", "Variables", "Conditions"]) {
      expect(screen.getByText(row)).toBeInTheDocument();
    }
  });

  it("root rows carry the board 148:2 leading glyph, and 'New collection' is a row, not a button", async () => {
    const onCreateCollection = vi.fn();
    const { composer } = makeEngine({ collections: [MENU], items: [ITEM] });
    render(<ContentTab composer={composer as never} onCreateCollection={onCreateCollection} />);
    await screen.findByText("Menu items");

    // Every List row (collections + the three Data rows) now fills the icon
    // slot board 232:6 calls out — this used to render blank, which read as
    // the label starting 24px further left than its board.
    for (const label of ["Menu items", "Sources", "Variables", "Conditions"]) {
      const row = screen.getByText(label).closest('[role="button"]');
      expect(row?.querySelector("svg")).toBeTruthy();
    }

    // Board 148:20 is a bare row (a "+" glyph + accent-text label), not the
    // small inset Button this used to render as.
    const newCollectionRow = screen.getByRole("button", { name: "New collection" });
    expect(newCollectionRow.tagName).toBe("DIV");
    fireEvent.click(newCollectionRow);
    expect(onCreateCollection).toHaveBeenCalledTimes(1);
  });

  it("variables: moves legacy browser-only variables into the project, then adds and persists there", async () => {
    localStorage.setItem(
      "buildrick-site-variables-test-proj",
      JSON.stringify([{ key: "name", value: "Bella Cucina" }]),
    );
    const { composer, sources } = makeEngine();
    render(<ContentTab composer={composer as never} />);
    fireEvent.click(await screen.findByText("Variables"));
    expect(await screen.findByText("{{site.name}}")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "+ New variable" }));
    fireEvent.change(screen.getByLabelText("Variable key"), { target: { value: "phone" } });
    fireEvent.change(screen.getByLabelText("Variable value"), { target: { value: "+44 20" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("{{site.phone}}")).toBeInTheDocument();
    expect(sources.get("site")?.data).toEqual({ name: "Bella Cucina", phone: "+44 20" });
    expect(composer.getProjectSettings().siteVariables).toEqual([
      { key: "name", value: "Bella Cucina" },
      { key: "phone", value: "+44 20" },
    ]);
  });

  it("conditions: lists element condition bindings with summaries and removes them", async () => {
    const { composer, elements } = makeEngine({ collections: [MENU], items: [] });
    const removeDataBinding = vi.fn();
    elements.push({
      getId: () => "el-9",
      getType: () => "badge",
      getContent: () => "Sold out",
      getDataBindings: () => ({
        condition: {
          type: "condition",
          sourceId: "",
          path: "",
          condition: { operator: "==", left: "available", right: "false" },
        },
      }),
      removeDataBinding,
    });
    render(<ContentTab composer={composer as never} />);
    fireEvent.click(await screen.findByText("Conditions"));
    expect(await screen.findByText("when available is false")).toBeInTheDocument();
    /* Board 151:87 names the row after the element, not after its tag — the
       label was "badge · Sold out" until 2026-09-08. */
    expect(screen.getByText("Sold out")).toBeInTheDocument();
    /* Board 151:87 puts the row actions behind a `⋯`, so removal is two
       clicks now: open the row menu, then choose. */
    fireEvent.click(screen.getByRole("button", { name: /Actions for/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Remove condition" }));
    expect(removeDataBinding).toHaveBeenCalledWith("condition");
  });

  it("condition create: pick result opens the form and binds through the engine", async () => {
    const { composer, elements } = makeEngine({ collections: [MENU], items: [] });
    elements.push({
      getId: () => "el-5",
      getType: () => "section",
      getContent: () => "",
      getDataBindings: () => ({}),
      removeDataBinding: vi.fn(),
    });
    render(<ContentTab composer={composer as never} />);
    fireEvent.click(await screen.findByText("Conditions"));
    fireEvent.click(screen.getByRole("button", { name: "+ New condition" }));
    act(() => composer.emit("inspector:pick-result", "el-5"));
    const path = await screen.findByLabelText("Condition path");
    fireEvent.change(path, { target: { value: "site.open" } });
    fireEvent.change(screen.getByLabelText("Condition value"), { target: { value: "true" } });
    fireEvent.click(screen.getByRole("button", { name: "Add condition" }));
    expect(composer.data.bindCondition).toHaveBeenCalledWith(
      elements[0],
      expect.objectContaining({ operator: "==", left: "site.open", right: "true" }),
    );
  });

  /* Regression. `CollectionView` renders the Dynamic pages row only when
     `onOpenDynamicPages` is supplied, and ContentTab never supplied it, so the
     row board 149:50 draws had never rendered once. This fails without the
     wiring. */
  it("subscribes to DataManager's own events so the Sources view cannot go stale", async () => {
    const { composer } = makeEngine({ collections: [MENU], items: [] });
    render(<ContentTab composer={composer as never} />);
    await screen.findByText("Collections");
    const subscribed = (composer.data.on as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(subscribed).toEqual(
      expect.arrayContaining([
        "source:registered",
        "source:updated",
        "source:unregistered",
        "sample:imported",
      ]),
    );
  });

  it("says it is watching only when there is a source to watch (board 303:2083)", async () => {
    const { composer } = makeEngine({ collections: [MENU], items: [] });
    render(<ContentTab composer={composer as never} />);
    fireEvent.click(await screen.findByText("Sources"));
    // Only the live `site` variables source is registered here, and the panel
    // filters that one out — so there is nothing to watch and no claim to make.
    expect(screen.queryByTestId("sources-watching")).toBeNull();
  });

  it("sources: JSON import goes through importSampleData; bad JSON shows the error", async () => {
    const { composer } = makeEngine({ collections: [MENU], items: [] });
    render(<ContentTab composer={composer as never} />);
    fireEvent.click(await screen.findByText("Sources"));
    // Board 151:46 names this "+ Connect a source".
    fireEvent.click(await screen.findByRole("button", { name: "+ Connect a source" }));
    const box = screen.getByLabelText("Source JSON");
    fireEvent.change(box, { target: { value: "{nope" } });
    fireEvent.click(screen.getByRole("button", { name: "Add source" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Not valid JSON");
    fireEvent.change(box, { target: { value: '{"products": [{"name": "A"}]}' } });
    fireEvent.click(screen.getByRole("button", { name: "Add source" }));
    await waitFor(() => expect(composer.data.importSampleData).toHaveBeenCalled());
    expect(await screen.findByText("products")).toBeInTheDocument();
  });

  /* Walked live 2026-08-18: typing into a new record and clicking the crumb
     returned to the collection and threw the value away without a word. The
     view already knows it is dirty — it renders "Unsaved changes · Discard ·
     Save" — so the crumb was the one exit that discarded silently. */
  it("a collection row opens it in the CMS workspace and stays selected (4428:143182)", async () => {
    cmsWorkspace.reset();
    const { composer } = makeEngine({ collections: [MENU], items: [ITEM] });
    render(<ContentTab composer={composer as never} />);
    const row = await screen.findByTestId("content-collection-col-1");
    fireEvent.click(row);
    expect(cmsWorkspace.get()).toMatchObject({ collectionId: "col-1", tab: "records", recordId: null });
    // the drawer stays on its list, with the open collection marked
    await waitFor(() => expect(screen.getByTestId("content-collection-col-1")).toHaveAttribute("aria-current", "true"));
    expect(screen.getByTestId("content-open-sources")).toBeInTheDocument();
    cmsWorkspace.reset();
  });
});
