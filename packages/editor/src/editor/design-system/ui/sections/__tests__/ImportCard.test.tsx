import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { ImportCard } from "../ImportCard";
import { TokenRegistryProvider, useColorRegistry } from "../../../state/TokenRegistryContext";
import { ToastProvider } from "@/editor/shared/vibcoder";

const wrap = (ui: React.ReactNode) => (
  <ToastProvider>
    <TokenRegistryProvider projectId="import-card-test">{ui}</TokenRegistryProvider>
  </ToastProvider>
);

beforeEach(() => {
  localStorage.clear();
});

describe("ImportCard", () => {
  it("shows error when JSON is malformed", async () => {
    const { getByLabelText, getByText, findByText } = render(wrap(<ImportCard />));
    fireEvent.change(getByLabelText(/Paste JSON/i), { target: { value: "{not json" } });
    fireEvent.click(getByText(/Preview/i));
    expect(await findByText(/parse error/i)).toBeTruthy();
  });

  it("shows diff summary after parsing valid JSON", async () => {
    const { getByLabelText, getByText, findByText } = render(wrap(<ImportCard />));
    const payload = JSON.stringify([
      {
        id: "color-imported", name: "Imported", value: "#0055FF",
        category: "colors", cssVar: "--buildrick-design-color-imported", type: "color",
        kind: "color",
      },
    ]);
    fireEvent.change(getByLabelText(/Paste JSON/i), { target: { value: payload } });
    fireEvent.click(getByText(/Preview/i));
    expect(await findByText(/1 added/i)).toBeTruthy();
  });

  it("Apply button stages tokens through registries (modifies dirty state)", async () => {
    const Probe: React.FC<{ onColors: (count: number, dirty: boolean) => void }> = ({ onColors }) => {
      const c = useColorRegistry();
      React.useEffect(() => { onColors(c.tokens.length, c.isDirty); }, [c.tokens, c.isDirty, onColors]);
      return null;
    };

    let lastCount = 0;
    let lastDirty = false;
    const onColors = (n: number, d: boolean) => { lastCount = n; lastDirty = d; };

    const { getByLabelText, getByText, findByText } = render(
      wrap(
        <>
          <Probe onColors={onColors} />
          <ImportCard />
        </>,
      ),
    );
    const initialCount = lastCount;

    const payload = JSON.stringify([
      {
        id: "color-stage-add", name: "Stage Add", value: "#FF00AA",
        category: "colors", cssVar: "--buildrick-design-color-stage-add", type: "color",
        kind: "color",
      },
    ]);
    fireEvent.change(getByLabelText(/Paste JSON/i), { target: { value: payload } });
    fireEvent.click(getByText(/Preview/i));
    await findByText(/1 added/i);
    fireEvent.click(getByText(/Apply Import/i));

    await waitFor(() => {
      expect(lastCount).toBe(initialCount + 1);
      expect(lastDirty).toBe(true);
    });
  });
});
