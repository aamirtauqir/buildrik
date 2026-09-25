// @vitest-environment jsdom
/**
 * GenerateBlockScreen — G2-117: composer 5946:51667 → thinking 6881:82175 →
 * inserted 6881:78961 (Undo · Done). The AI run is stubbed; live AI is not
 * verified here.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render as rtlRender, screen, fireEvent, act, within } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import * as React from "react";
import type { Composer } from "@/engine";
import { GenerateBlockScreen, generateTarget, type GenerateFn } from "../GenerateBlockScreen";
import { AiRunError, type ServerEdit } from "../../../ai/hooks/runPromptOnce";

vi.mock("../../../ai/hooks/useAiQuota", () => ({ useAiQuota: () => null, quotaLeftLabel: () => null }));

const render = (ui: React.ReactElement) => rtlRender(<ToastProvider>{ui}</ToastProvider>);

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
  const kids: unknown[] = [hero, footer];
  root.getChildren = () => kids;
  const byId: Record<string, unknown> = { root, hero, footer, h1: heading };
  const undo = vi.fn();
  const select = vi.fn();
  /** What a real insert does: a new top-level section lands after Hero. */
  const insertFeatures = () => {
    const features = el("features", "section", root, [], "Features");
    byId.features = features;
    kids.splice(1, 0, features);
  };
  const composer = {
    elements: { getActivePage: () => ({ name: "Home", root: { id: "root" } }), getElement: (id: string) => byId[id] ?? null },
    selection: { getSelectedIds: () => selected, select },
    history: { undo },
  } as unknown as Composer;
  return { composer, undo, select, insertFeatures };
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

  /* Board 6881:74045: the new section is selected, and Done leaves on
     "Block added · Undo". */
  it("selects the inserted section, and Done toasts 'Block added · Undo'", async () => {
    const { composer, select, insertFeatures, undo } = makeComposer(["h1"]);
    const onBack = vi.fn();
    const generate: GenerateFn = async () => {
      insertFeatures();
      return edit;
    };
    render(<GenerateBlockScreen composer={composer} onBack={onBack} generate={generate} />);
    fireEvent.change(screen.getByTestId("generate-input"), { target: { value: "A features grid" } });
    await act(async () => fireEvent.click(screen.getByTestId("generate-run")));
    expect(select).toHaveBeenCalledWith(expect.objectContaining({ getId: expect.any(Function) }));
    expect((select.mock.calls[0][0] as { getId: () => string }).getId()).toBe("features");
    fireEvent.click(screen.getByTestId("generate-done"));
    expect(onBack).toHaveBeenCalled();
    const toast = (await screen.findByText("Block added")).closest("[data-testid^=toast-item-]") as HTMLElement;
    fireEvent.click(within(toast).getByRole("button", { name: "Undo" }));
    expect(undo).toHaveBeenCalledTimes(1);
  });

  const fail = async (kind: "not-configured" | "quota" | "other") => {
    const generate = vi.fn(() => Promise.reject(new AiRunError("x", kind)));
    const onBack = vi.fn();
    render(<GenerateBlockScreen composer={makeComposer().composer} onBack={onBack} generate={generate} />);
    fireEvent.change(screen.getByTestId("generate-input"), { target: { value: "Make the Hero warmer" } });
    await act(async () => fireEvent.click(screen.getByTestId("generate-run")));
    return { generate, onBack, card: screen.getByTestId("generate-error") };
  };

  /* 6881:76122: the composer goes, the prompt is echoed, the owner is the way on. */
  it("no provider: prompt echoed, owner link, hand-off to Add", async () => {
    const { card, onBack } = await fail("not-configured");
    expect(screen.queryByTestId("generate-input")).toBeNull();
    expect(card.textContent).toContain("Your prompt: Make the Hero warmer");
    expect(card.textContent).toContain("AI isn't available on this workspace.");
    expect(card.textContent).toContain("No AI provider is configured for this deployment.");
    expect(screen.getByRole("link", { name: /View workspace owner/ }).getAttribute("href")).toContain("/dashboard/settings/team");
    fireEvent.click(screen.getByRole("button", { name: "Continue by hand in Add" }));
    expect(onBack).toHaveBeenCalled();
  });

  /* 6881:75906: out of credit — billing link, field kept. */
  it("quota: out of credit, billing link, field kept", async () => {
    const { card } = await fail("quota");
    expect(card.textContent).toContain("AI is out of credit.");
    expect(card.textContent).toContain("Nothing was changed.");
    expect(card.textContent).toContain("Resets at midnight UTC.");
    expect(screen.getByRole("link", { name: /Workspace billing/ }).getAttribute("href")).toContain("/dashboard/settings/billing");
    expect(screen.getByTestId("generate-input")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue by hand in Add" })).toBeTruthy();
  });

  /* 6881:76336: the service did not answer — retry runs it again. */
  it("service error: says so, Try again re-runs the prompt", async () => {
    const { card, generate } = await fail("other");
    expect(card.textContent).toContain("The AI service didn't respond.");
    expect(card.textContent).toContain("Your prompt is still here");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Try again" })));
    expect(generate).toHaveBeenCalledTimes(2);
  });
});
