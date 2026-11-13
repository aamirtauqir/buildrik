/**
 * instantiateComponentAtSelection — A-15: the one algorithm BuildTab's
 * insertMine and useComponentsState's handleInstantiate both used to
 * duplicate. Selected element as parent, else the active page root, else
 * "no-parent".
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { INSTANTIATE_TOASTS, LIBRARY_TOASTS, insertLibraryComponent, instantiateComponentAtSelection } from "../instantiate";
import type { Composer } from "@/engine";

function makeComposer(opts: {
  selectedIds?: string[];
  rootId?: string | null;
  instantiate?: ReturnType<typeof vi.fn>;
}): Composer {
  return {
    selection: { getSelectedIds: () => opts.selectedIds ?? [] },
    elements: {
      getActivePage: () =>
        opts.rootId === null ? null : { root: { id: opts.rootId ?? "root-1" } },
    },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    components: {
      instantiateComponent: opts.instantiate ?? vi.fn().mockResolvedValue("new-el"),
    },
  } as unknown as Composer;
}

describe("instantiateComponentAtSelection", () => {
  it("uses the selected element as the parent when one is selected", async () => {
    const instantiate = vi.fn().mockResolvedValue("new-el");
    const composer = makeComposer({ selectedIds: ["el-1"], instantiate });

    const result = await instantiateComponentAtSelection(composer, "comp-1");

    expect(result).toBe("ok");
    expect(instantiate).toHaveBeenCalledWith("comp-1", "el-1");
  });

  it("falls back to the active page root when nothing is selected", async () => {
    const instantiate = vi.fn().mockResolvedValue("new-el");
    const composer = makeComposer({ selectedIds: [], rootId: "root-1", instantiate });

    const result = await instantiateComponentAtSelection(composer, "comp-1");

    expect(result).toBe("ok");
    expect(instantiate).toHaveBeenCalledWith("comp-1", "root-1");
  });

  it("returns no-parent with no selection and no active page — never silently no-ops", async () => {
    const instantiate = vi.fn();
    const composer = makeComposer({ selectedIds: [], rootId: null, instantiate });

    const result = await instantiateComponentAtSelection(composer, "comp-1");

    expect(result).toBe("no-parent");
    expect(instantiate).not.toHaveBeenCalled();
  });

  it("returns error when instantiateComponent throws", async () => {
    const instantiate = vi.fn().mockRejectedValue(new Error("boom"));
    const composer = makeComposer({ selectedIds: ["el-1"], instantiate });

    const result = await instantiateComponentAtSelection(composer, "comp-1");

    expect(result).toBe("error");
  });

  /* instantiateComponent returns null when it refuses the placement; that
     is not a success (the detail screen knew, the shared helper said "ok"). */
  it("returns error when the engine refuses the placement (null id)", async () => {
    const composer = makeComposer({ selectedIds: ["el-1"], instantiate: vi.fn().mockResolvedValue(null) });
    expect(await instantiateComponentAtSelection(composer, "comp-1")).toBe("error");
  });
});

/* One library insert for Add's FROM LIBRARY and the Components area's
   "Insert on this site" (2L9 215:44300, B6-K04): reuse this site's copy if it
   has one, else fetch the workspace master and adopt it, then insert. */
describe("insertLibraryComponent", () => {
  const withLibrary = (opts: { existing?: object; adopted?: object; adoptThrows?: Error }) => {
    const composer = makeComposer({ selectedIds: ["el-1"] }) as unknown as {
      components: Record<string, unknown>;
    };
    Object.assign(composer.components, {
      getComponent: vi.fn(() => opts.existing),
      adoptLibraryComponent: vi.fn(async () => {
        if (opts.adoptThrows) throw opts.adoptThrows;
        return opts.adopted;
      }),
    });
    return composer as unknown as Composer;
  };

  it("adopts the fetched master, inserts it and says so", async () => {
    const composer = withLibrary({ adopted: { id: "price" } });
    const fetch = vi.fn(async () => ({ id: "price", name: "Price row" }) as never);
    expect(await insertLibraryComponent(composer, "price", fetch)).toEqual(INSTANTIATE_TOASTS.ok);
    expect(fetch).toHaveBeenCalledWith("price");
    expect(composer.components.instantiateComponent).toHaveBeenCalledWith("price", "el-1");
  });

  it("uses this site's copy without fetching when it has one", async () => {
    const composer = withLibrary({ existing: { id: "price" } });
    const fetch = vi.fn();
    expect(await insertLibraryComponent(composer, "price", fetch)).toEqual(INSTANTIATE_TOASTS.ok);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("says the master is gone, or damaged, instead of failing silently", async () => {
    expect(await insertLibraryComponent(withLibrary({}), "price", vi.fn(async () => null))).toEqual(LIBRARY_TOASTS.gone);
    const damaged = withLibrary({ adoptThrows: new Error("LIBRARY_MASTER_MALFORMED") });
    expect(await insertLibraryComponent(damaged, "price", vi.fn(async () => ({ id: "price" }) as never))).toEqual(LIBRARY_TOASTS.damaged);
  });
});
