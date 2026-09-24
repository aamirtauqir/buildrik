// @vitest-environment jsdom
/**
 * GenerateBlockScreen — G2-117: composer 5946:51667 → thinking 6881:82175 →
 * inserted 6881:78961 (Undo · Done). The AI run is stubbed; live AI is not
 * verified here.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import * as React from "react";
import type { Composer } from "@/engine";
import { GenerateBlockScreen, generateTarget, type GenerateFn } from "../GenerateBlockScreen";
import { AiRunError, type ServerEdit } from "../../../ai/hooks/runPromptOnce";

const el = (id: string, type: string, parent: unknown, children: unknown[] = [], layerName?: string) => {
  const e = {
    getId: () => id,
    getType: () => type,
    getParent: () => parent,
    getChildren: () => children,
    getCustomData: (k: string) => (k === "layerName" ? layerName : undefined),
  };
  return e;
};

function makeComposer(selected: string[] = []) {
  const root = el("root", "container", null) as ReturnType<typeof el> & { getChildren: () => unknown[] };
  const hero = el("hero", "section", root, [], "Hero");
  const footer = el("footer", "section", root, [], "Footer");
  const heading = el("h1", "heading", hero);
  root.getChildren = () => [hero, footer];
  const byId: Record<string, unknown> = { root, hero, footer, h1: heading };
  const undo = vi.fn();
  const composer = {
    elements: { getActivePage: () => ({ name: "Home", root: { id: "root" } }), getElement: (id: string) => byId[id] ?? null },
    selection: { getSelectedIds: () => selected },
    history: { undo },
  } as unknown as Composer;
  return { composer, undo };
}

const edit: ServerEdit = {
  target: "page",
  summary: "Added a features section",
  rows: [{ field: "Features", from: "", to: "3 columns with icons" }],
  applyOps: { preview: {}, commit: {} },
};

describe("generateTarget", () => {
  it("is after the selection's top-level section, else after the last one", () => {
    expect(generateTarget(makeComposer(["h1"]).composer)).toEqual({ afterId: "hero", label: "Home · after Hero" });
    expect(generateTarget(makeComposer([]).composer)).toEqual({ afterId: "footer", label: "Home · after Footer" });
  });
});

describe("GenerateBlockScreen", () => {
  it("composer: target band, TRY prompts fill the field, Generate enables once described", () => {
    render(<GenerateBlockScreen composer={makeComposer(["h1"]).composer} onBack={vi.fn()} generate={vi.fn()} />);
    expect(screen.getByTestId("generate-target").textContent).toBe("Target: Home · after Hero");
    expect(screen.getByTestId("generate-run")).toBeDisabled();
    expect(screen.getByText("Describe the block above to enable")).toBeTruthy();
    fireEvent.click(screen.getAllByTestId("generate-example")[0]);
    expect((screen.getByTestId("generate-input") as HTMLTextAreaElement).value).toBe("A three-column feature grid with icons");
    expect(screen.getByTestId("generate-run")).not.toBeDisabled();
  });

  it("thinking → inserted with what changed; Undo is one history step; Done goes back", async () => {
    let resolve!: (e: ServerEdit) => void;
    const generate: GenerateFn = vi.fn(() => new Promise<ServerEdit>((r) => (resolve = r)));
    const onBack = vi.fn();
    const { composer, undo } = makeComposer(["h1"]);
    render(<GenerateBlockScreen composer={composer} onBack={onBack} generate={generate} />);
    fireEvent.change(screen.getByTestId("generate-input"), { target: { value: "A features grid" } });
    fireEvent.click(screen.getByTestId("generate-run"));
    expect(screen.getByTestId("generate-thinking").textContent).toBe("Generating your block…");
    expect(screen.getByTestId("generate-target").textContent).toBe("Insert into: Home · after Hero");
    expect(generate).toHaveBeenCalledWith(composer, "A features grid", { afterId: "hero", label: "Home · after Hero" });
    await act(async () => resolve(edit));
    const done = screen.getByTestId("generate-inserted");
    expect(done.textContent).toContain("Block inserted after Hero");
    expect(done.textContent).toContain("Features → 3 columns with icons");
    fireEvent.click(screen.getByTestId("generate-undo"));
    expect(undo).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("generate-run"));
    await act(async () => resolve(edit));
    fireEvent.click(screen.getByTestId("generate-done"));
    expect(onBack).toHaveBeenCalled();
  });

  it("Stop drops the run in flight", async () => {
    let resolve!: (e: ServerEdit) => void;
    const generate: GenerateFn = () => new Promise<ServerEdit>((r) => (resolve = r));
    render(<GenerateBlockScreen composer={makeComposer().composer} onBack={vi.fn()} generate={generate} />);
    fireEvent.change(screen.getByTestId("generate-input"), { target: { value: "x" } });
    fireEvent.click(screen.getByTestId("generate-run"));
    fireEvent.click(screen.getByTestId("generate-stop"));
    await act(async () => resolve(edit));
    expect(screen.queryByTestId("generate-inserted")).toBeNull();
    expect(screen.getByTestId("generate-run")).toBeTruthy();
  });

  it("names a missing provider and a spent quota", async () => {
    const generate: GenerateFn = () => Promise.reject(new AiRunError("no key", "not-configured"));
    render(<GenerateBlockScreen composer={makeComposer().composer} onBack={vi.fn()} generate={generate} />);
    fireEvent.change(screen.getByTestId("generate-input"), { target: { value: "x" } });
    await act(async () => fireEvent.click(screen.getByTestId("generate-run")));
    expect(screen.getByTestId("generate-error").textContent).toContain("AI drafting isn't configured yet");
  });
});
