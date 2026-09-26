/**
 * instantiateComponentAtSelection — A-15: the one algorithm BuildTab's
 * insertMine and useComponentsState's handleInstantiate both used to
 * duplicate. Selected element as parent, else the active page root, else
 * "no-parent".
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { instantiateComponentAtSelection } from "../instantiate";
import type { Composer } from "../../../../../engine";

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
});
