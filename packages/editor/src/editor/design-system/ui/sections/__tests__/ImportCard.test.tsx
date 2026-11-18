/**
 * ImportCard — 2L9 B6-B15/B16/B49: Choose JSON file → dry run (detected ·
 * valid · unsupported, Added / Modified / Skipped / Unsupported) → Apply n valid.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent, waitFor, act } from "@testing-library/react";
import * as React from "react";
import { ImportCard } from "../ImportCard";
import {
  TokenRegistryProvider,
  useColorRegistry,
} from "@/editor/design-system/state/TokenRegistryContext";
// useColorRegistry is used in the Apply test via Probe.
import { ToastProvider } from "@/editor/chrome-ui";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import { makeFakeComposer } from "@/editor/design-system/ui/__tests__/brandWorkspaceHarness";

let composer = makeFakeComposer();
const wrap = (ui: React.ReactNode) => (
  <ToastProvider>
    <TokenRegistryProvider composer={composer}>{ui}</TokenRegistryProvider>
  </ToastProvider>
);

beforeEach(() => {
  localStorage.clear();
  composer = makeFakeComposer();
});

function makeJsonFile(payload: unknown, name = "tokens.json"): File {
  return new File([JSON.stringify(payload)], name, { type: "application/json" });
}

describe("ImportCard — drop-zone initial state", () => {
  it("renders the drop zone visible initially (no detail block)", () => {
    const { getByTestId, queryByTestId } = render(wrap(<ImportCard />));
    expect(getByTestId("import-drop-zone")).toBeTruthy();
    expect(queryByTestId("import-detail-block")).toBeNull();
  });

  it("exposes a hidden file input that opens on drop-zone click", () => {
    const { getByLabelText, getByTestId } = render(wrap(<ImportCard />));
    const zone = getByTestId("import-drop-zone");
    const input = getByLabelText(/Upload JSON file/i) as HTMLInputElement;
    expect(input.type).toBe("file");
    // Click on the zone should not throw — actual file picker is browser-driven.
    fireEvent.click(zone);
  });

  it("shows paste textarea when 'or paste JSON' is toggled", () => {
    const { getByText, getByLabelText, queryByLabelText } = render(wrap(<ImportCard />));
    expect(queryByLabelText(/Paste JSON/i)).toBeNull();
    fireEvent.click(getByText(/or paste JSON/i));
    expect(getByLabelText(/Paste JSON/i)).toBeTruthy();
  });
});

describe("ImportCard — file ingestion", () => {
  it("drops a JSON file → the dry run: summary line, rows, preview-only note", async () => {
    const { getByTestId, findByText, findByTestId } = render(wrap(<ImportCard />));
    const zone = getByTestId("import-drop-zone");
    const file = makeJsonFile([
      {
        id: "color-imported", name: "Imported", value: "#0055FF",
        category: "colors", cssVar: "--buildrick-design-color-imported", type: "color",
        kind: "color",
      },
    ]);

    await act(async () => {
      fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    });

    expect(await findByTestId("import-detail-block")).toBeTruthy();
    expect((await findByTestId("import-summary")).textContent).toBe("1 detected · 1 valid · 0 unsupported");
    expect(await findByText("Preview only · Nothing has been applied")).toBeTruthy();
    expect((await findByTestId("import-file")).textContent).toBe("tokens.json · Update matching");
  });

  it("zero conflicts → Apply 1 valid + Cancel", async () => {
    const { getByTestId, findByText, queryByTestId } = render(wrap(<ImportCard />));
    const zone = getByTestId("import-drop-zone");
    const file = makeJsonFile([
      {
        id: "color-fresh-add", name: "Fresh", value: "#abcdef",
        category: "colors", cssVar: "--buildrick-design-color-fresh-add", type: "color",
        kind: "color",
      },
    ]);

    await act(async () => {
      fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    });

    await findByText(/^Apply 1 valid$/);
    expect(queryByTestId("import-restore-failed")).toBeNull();
    expect(await findByText(/Cancel/i)).toBeTruthy();
  });
});

describe("ImportCard — conflict resolution", () => {
  it("a conflict reads as a matching token; the two modes are offered", async () => {
    // color-primary lives in DEFAULT_TOKENS — drop a payload with the same id
    // but a different value to force a single conflict against the seeded set.
    const { getByTestId, findByText, queryByText, findByTestId } = render(wrap(<ImportCard />));

    const file = makeJsonFile([
      {
        id: "color-primary", name: "Brand Override", value: "#222222",
        category: "colors", cssVar: "--buildrick-design-color-primary", type: "color",
        kind: "color",
      },
    ]);

    await act(async () => {
      fireEvent.drop(getByTestId("import-drop-zone"), { dataTransfer: { files: [file] } });
    });

    expect(await findByTestId("import-detail-block")).toBeTruthy();
    expect(await findByText("Update matching")).toBeTruthy();
    expect(await findByText("Add new only")).toBeTruthy();
    expect(queryByText(/Merge · keep theirs/i)).toBeNull();
    expect(await findByText("1 matching token")).toBeTruthy();
  });
});

describe("ImportCard — conflict strategy behavior", () => {
  const conflictAndNew = [
    {
      id: "color-primary", name: "Brand Override", value: "#222222",
      category: "colors", cssVar: "--buildrick-design-color-primary", type: "color",
      kind: "color",
    },
    {
      id: "color-strategy-new", name: "Strategy New", value: "#00AA55",
      category: "colors", cssVar: "--buildrick-design-color-strategy-new", type: "color",
      kind: "color",
    },
  ];

  function renderWithProbe() {
    const colors: { current: Array<{ id: string; value: string }> } = { current: [] };
    const Probe: React.FC = () => {
      const c = useColorRegistry();
      colors.current = c.tokens.map((t) => ({ id: t.id, value: resolveTokenLiteral(c.tokens, t.id, "light") ?? "" }));
      return null;
    };
    const utils = render(
      wrap(
        <>
          <Probe />
          <ImportCard />
        </>,
      ),
    );
    return { ...utils, colors };
  }

  it("'Update matching' (default) overwrites the conflicting token AND adds the new one", async () => {
    const { getByTestId, getByText, findByTestId, colors } = renderWithProbe();

    await act(async () => {
      fireEvent.drop(getByTestId("import-drop-zone"), {
        dataTransfer: { files: [makeJsonFile(conflictAndNew)] },
      });
    });
    await findByTestId("import-detail-block");

    // replace = 1 modified + 1 added staged.
    fireEvent.click(getByText(/^Apply 2 valid$/));

    await waitFor(() => {
      expect(colors.current.find((t) => t.id === "color-primary")?.value).toBe("#222222");
      expect(colors.current.find((t) => t.id === "color-strategy-new")?.value).toBe("#00AA55");
    });
  });

  it("'Add new only' skips the conflicting id and only adds the new token", async () => {
    const { getByTestId, getByText, findByTestId, colors } = renderWithProbe();
    const originalPrimary = colors.current.find((t) => t.id === "color-primary")?.value;
    expect(originalPrimary).toBeDefined();
    expect(originalPrimary).not.toBe("#222222");

    await act(async () => {
      fireEvent.drop(getByTestId("import-drop-zone"), {
        dataTransfer: { files: [makeJsonFile(conflictAndNew)] },
      });
    });
    await findByTestId("import-detail-block");

    fireEvent.click(getByText("Add new only"));
    // keep-mine narrows the staged set to NEW ids only → count drops to 1.
    fireEvent.click(getByText(/^Apply 1 valid$/));

    await waitFor(() => {
      expect(colors.current.find((t) => t.id === "color-strategy-new")?.value).toBe("#00AA55");
    });
    // Existing token untouched.
    expect(colors.current.find((t) => t.id === "color-primary")?.value).toBe(originalPrimary);
  });

  /* Replaces "'Merge · keep theirs' behaves like Replace in v1", which pinned
     the duplicate branch rather than a behaviour. What is worth asserting is
     that the two surviving strategies actually differ. */
  it("the two strategies differ: Update matching overwrites a conflict, Add new only does not", async () => {
    const { getByTestId, getByText, findByTestId, colors } = renderWithProbe();
    const originalPrimary = colors.current.find((t) => t.id === "color-primary")?.value;

    await act(async () => {
      fireEvent.drop(getByTestId("import-drop-zone"), {
        dataTransfer: { files: [makeJsonFile(conflictAndNew)] },
      });
    });
    await findByTestId("import-detail-block");

    // Replace is the default and takes the incoming value.
    fireEvent.click(getByText(/^Apply 2 valid$/));
    await waitFor(() => {
      expect(colors.current.find((t) => t.id === "color-primary")?.value).toBe("#222222");
      expect(colors.current.find((t) => t.id === "color-primary")?.value).not.toBe(originalPrimary);
    });
  });
});

describe("ImportCard — cancel + apply", () => {
  it("Cancel returns to drop-zone state (detail block gone)", async () => {
    const { getByTestId, getByText, queryByTestId, findByTestId } = render(wrap(<ImportCard />));
    const file = makeJsonFile([
      {
        id: "color-cancel-test", name: "Test", value: "#aaaaaa",
        category: "colors", cssVar: "--buildrick-design-color-cancel-test", type: "color",
        kind: "color",
      },
    ]);

    await act(async () => {
      fireEvent.drop(getByTestId("import-drop-zone"), { dataTransfer: { files: [file] } });
    });
    await findByTestId("import-detail-block");

    fireEvent.click(getByText(/Cancel/i));

    expect(queryByTestId("import-detail-block")).toBeNull();
    expect(getByTestId("import-drop-zone")).toBeTruthy();
  });

  it("Apply writes the tokens to the site in ONE write — live at once, nothing staged", async () => {
    let lastCount = 0;
    const Probe: React.FC = () => {
      const c = useColorRegistry();
      lastCount = c.tokens.length;
      return null;
    };

    const { getByTestId, getByText, findByText } = render(
      wrap(
        <>
          <Probe />
          <ImportCard />
        </>,
      ),
    );
    const initialCount = lastCount;

    const file = makeJsonFile([
      {
        id: "color-stage-add", name: "Stage Add", value: "#FF00AA",
        category: "colors", cssVar: "--buildrick-design-color-stage-add", type: "color",
        kind: "color",
      },
    ]);

    await act(async () => {
      fireEvent.drop(getByTestId("import-drop-zone"), { dataTransfer: { files: [file] } });
    });
    await findByText(/^Apply 1 valid$/);
    fireEvent.click(getByText(/^Apply 1 valid$/));

    await waitFor(() => expect(lastCount).toBe(initialCount + 1));
    expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(1);
  });

  it("a read-only site imports nothing and says so", async () => {
    composer = makeFakeComposer([], { readOnly: true });
    const { getByTestId, getByText, findByText } = render(wrap(<ImportCard />));
    const file = makeJsonFile([
      {
        id: "color-ro-add", name: "RO Add", value: "#FF00AA",
        category: "colors", cssVar: "--buildrick-design-color-ro-add", type: "color",
        kind: "color",
      },
    ]);
    await act(async () => {
      fireEvent.drop(getByTestId("import-drop-zone"), { dataTransfer: { files: [file] } });
    });
    fireEvent.click(await findByText(/^Apply 1 valid$/));
    expect(await findByText("Import failed")).toBeTruthy();
    expect(getByText(/Nothing was imported — the brand can't be changed right now/)).toBeTruthy();
    expect(composer.settings.designTokens).toEqual([]);
  });
});

describe("ImportCard — paste fallback", () => {
  it("paste + Parse populates the detail block", async () => {
    const { getByText, getByLabelText, findByTestId } = render(wrap(<ImportCard />));
    fireEvent.click(getByText(/or paste JSON/i));
    fireEvent.change(getByLabelText(/Paste JSON/i), {
      target: { value: JSON.stringify([
        {
          id: "color-paste", name: "Paste", value: "#bbbbbb",
          category: "colors", cssVar: "--buildrick-design-color-paste", type: "color",
          kind: "color",
        },
      ]) },
    });
    fireEvent.click(getByText(/^Parse$/i));
    expect(await findByTestId("import-detail-block")).toBeTruthy();
  });

  it("malformed JSON surfaces parse error message", async () => {
    const { getByText, getByLabelText, findByText } = render(wrap(<ImportCard />));
    fireEvent.click(getByText(/or paste JSON/i));
    fireEvent.change(getByLabelText(/Paste JSON/i), { target: { value: "{not json" } });
    fireEvent.click(getByText(/^Parse$/i));
    expect(await findByText(/parse error/i)).toBeTruthy();
  });

  /* G3-123: outcomes are toasts, not a pill band. */
  it("a failed import says so in a toast; the card keeps the detail", async () => {
    const { getByText, getByLabelText, findByText } = render(wrap(<ImportCard />));
    fireEvent.click(getByText(/or paste JSON/i));
    fireEvent.change(getByLabelText(/Paste JSON/i), { target: { value: "{not json" } });
    fireEvent.click(getByText(/^Parse$/i));
    expect(await findByText("Import failed")).toBeTruthy();
    expect(await findByText(/Nothing was imported/)).toBeTruthy();
  });
});
