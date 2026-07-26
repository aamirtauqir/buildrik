/**
 * ImportCard tests — covers drop-zone → detail block → conflict resolution → apply.
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
} from "../../../state/TokenRegistryContext";
// useColorRegistry is used in the Apply test via Probe.
import { ToastProvider } from "@/editor/ui";

const wrap = (ui: React.ReactNode) => (
  <ToastProvider>
    <TokenRegistryProvider projectId="import-card-test">{ui}</TokenRegistryProvider>
  </ToastProvider>
);

beforeEach(() => {
  localStorage.clear();
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
  it("drops a JSON file → detail block surfaces with Detected/Valid", async () => {
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
    expect(await findByText(/Detected/i)).toBeTruthy();
    expect(await findByText(/Design tokens JSON/i)).toBeTruthy();
  });

  it("zero errors + zero conflicts → Apply + Cancel only, no Resolve box", async () => {
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

    await findByText(/Apply 1 valid only/i);
    expect(queryByTestId("import-resolve-box")).toBeNull();
    expect(await findByText(/Cancel/i)).toBeTruthy();
  });
});

describe("ImportCard — conflict resolution", () => {
  it("conflicts > 0 → Resolve box + 3 strategy buttons visible", async () => {
    // color-primary lives in DEFAULT_TOKENS — drop a payload with the same id
    // but a different value to force a single conflict against the seeded set.
    const { getByTestId, findByText, findByTestId } = render(wrap(<ImportCard />));

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

    expect(await findByTestId("import-resolve-box")).toBeTruthy();
    expect(await findByText(/^Replace$/i)).toBeTruthy();
    expect(await findByText(/Merge · keep mine/i)).toBeTruthy();
    expect(await findByText(/Merge · keep theirs/i)).toBeTruthy();
    expect(await findByText(/1 ID collisions/i)).toBeTruthy();
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
      colors.current = c.tokens.map((t) => ({ id: t.id, value: t.value }));
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

  it("'Replace' (default) overwrites the conflicting token AND adds the new one", async () => {
    const { getByTestId, getByText, findByTestId, colors } = renderWithProbe();

    await act(async () => {
      fireEvent.drop(getByTestId("import-drop-zone"), {
        dataTransfer: { files: [makeJsonFile(conflictAndNew)] },
      });
    });
    await findByTestId("import-resolve-box");

    // replace = 1 modified + 1 added staged.
    fireEvent.click(getByText(/Apply 2 valid only/i));

    await waitFor(() => {
      expect(colors.current.find((t) => t.id === "color-primary")?.value).toBe("#222222");
      expect(colors.current.find((t) => t.id === "color-strategy-new")?.value).toBe("#00AA55");
    });
  });

  it("'Merge · keep mine' skips the conflicting id and only adds the new token", async () => {
    const { getByTestId, getByText, findByTestId, colors } = renderWithProbe();
    const originalPrimary = colors.current.find((t) => t.id === "color-primary")?.value;
    expect(originalPrimary).toBeDefined();
    expect(originalPrimary).not.toBe("#222222");

    await act(async () => {
      fireEvent.drop(getByTestId("import-drop-zone"), {
        dataTransfer: { files: [makeJsonFile(conflictAndNew)] },
      });
    });
    await findByTestId("import-resolve-box");

    fireEvent.click(getByText(/Merge · keep mine/i));
    // keep-mine narrows the staged set to NEW ids only → count drops to 1.
    fireEvent.click(getByText(/Apply 1 valid only/i));

    await waitFor(() => {
      expect(colors.current.find((t) => t.id === "color-strategy-new")?.value).toBe("#00AA55");
    });
    // Existing token untouched.
    expect(colors.current.find((t) => t.id === "color-primary")?.value).toBe(originalPrimary);
  });

  it("'Merge · keep theirs' behaves like Replace in v1 (all incoming staged)", async () => {
    const { getByTestId, getByText, findByTestId, colors } = renderWithProbe();

    await act(async () => {
      fireEvent.drop(getByTestId("import-drop-zone"), {
        dataTransfer: { files: [makeJsonFile(conflictAndNew)] },
      });
    });
    await findByTestId("import-resolve-box");

    fireEvent.click(getByText(/Merge · keep theirs/i));
    fireEvent.click(getByText(/Apply 2 valid only/i));

    await waitFor(() => {
      expect(colors.current.find((t) => t.id === "color-primary")?.value).toBe("#222222");
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

  it("Apply stages tokens through registries (modifies dirty state)", async () => {
    const Probe: React.FC<{ onColors: (count: number, dirty: boolean) => void }> = ({ onColors }) => {
      const c = useColorRegistry();
      React.useEffect(() => { onColors(c.tokens.length, c.isDirty); }, [c.tokens, c.isDirty, onColors]);
      return null;
    };

    let lastCount = 0;
    let lastDirty = false;
    const onColors = (n: number, d: boolean) => { lastCount = n; lastDirty = d; };

    const { getByTestId, getByText, findByText } = render(
      wrap(
        <>
          <Probe onColors={onColors} />
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
    await findByText(/Apply 1 valid only/i);
    fireEvent.click(getByText(/Apply 1 valid only/i));

    await waitFor(() => {
      expect(lastCount).toBe(initialCount + 1);
      expect(lastDirty).toBe(true);
    });
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
});
