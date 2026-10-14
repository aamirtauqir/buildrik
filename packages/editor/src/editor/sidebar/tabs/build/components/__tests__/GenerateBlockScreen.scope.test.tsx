// @vitest-environment jsdom
/**
 * GenerateBlockScreen's real run (no injected generate/apply): what it sends
 * the model and where the block lands. The transport and the apply are
 * stubbed at their module boundary.
 *
 * - The element list is the ACTIVE page (root and its top-level sections
 *   first), not the first 200 elements of the whole site — on a big site the
 *   target was cut off, and the model could anchor on another page.
 * - The new section is pinned to the screen's target, whatever id the model
 *   chose to anchor it on.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render as rtlRender, screen, fireEvent, act } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";

const runPromptOnce = vi.fn();
vi.mock("@/editor/sidebar/tabs/ai/hooks/runPromptOnce", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/editor/sidebar/tabs/ai/hooks/runPromptOnce")>()),
  runPromptOnce: (...a: unknown[]) => runPromptOnce(...a),
}));
const applyAiEdit = vi.fn();
vi.mock("@/editor/sidebar/tabs/ai/applySetStyle", () => ({ applyAiEdit: (...a: unknown[]) => applyAiEdit(...a) }));
vi.mock("@/editor/sidebar/tabs/ai/hooks/useAiQuota", () => ({ useAiQuota: () => null, quotaLeftLabel: () => null }));

import { GenerateBlockScreen } from "../GenerateBlockScreen";

const render = (ui: React.ReactElement) => rtlRender(<ToastProvider>{ui}</ToastProvider>);

interface FakeEl {
  getId: () => string;
  getType: () => string;
  getContent: () => string;
  getParent: () => FakeEl | null;
  getChildren: () => FakeEl[];
  getCustomData: () => undefined;
}

function node(id: string, type: string, parent: FakeEl | null, content = ""): FakeEl {
  const kids: FakeEl[] = [];
  const e: FakeEl = {
    getId: () => id,
    getType: () => type,
    getContent: () => content,
    getParent: () => parent,
    getChildren: () => kids,
    getCustomData: () => undefined,
  };
  parent?.getChildren().push(e);
  return e;
}

function makeComposer() {
  const root = node("root", "container", null);
  const hero = node("hero", "section", root);
  // A deep first section: 250 descendants, which pushed later top-level
  // sections past a 200 cap in a plain depth-first walk.
  for (let i = 0; i < 250; i++) node(`hero-${i}`, "text", hero, `t${i}`);
  const footer = node("footer", "section", root);
  const other = node("other-page-el", "heading", null);
  const all = [root, hero, ...hero.getChildren(), footer];
  const byId = new Map([...all, other].map((e) => [e.getId(), e]));
  const composer = {
    elements: {
      getActivePage: () => ({ name: "Home", root: { id: "root" } }),
      getElement: (id: string) => byId.get(id) ?? null,
      getAllElements: () => [other, ...all],
    },
    selection: { getSelectedIds: () => [], select: vi.fn() },
    history: { undo: vi.fn(), captureUndo: vi.fn() },
    getProjectSettings: () => ({ designTokens: [] }),
    media: { getAssets: () => [] },
  } as unknown as Composer;
  return { composer };
}

const serverEdit = (anchor: string) => ({
  target: "page",
  summary: "1 change",
  rows: [{ field: "section", from: "", to: "Features" }],
  applyOps: {
    preview: {},
    commit: {
      commands: [
        { commandId: "add-section", args: { elementId: anchor, sectionType: "section", children: [{ elementType: "heading", text: "Hi" }] } },
      ],
    },
  },
});

beforeEach(() => {
  runPromptOnce.mockReset();
  applyAiEdit.mockReset();
  applyAiEdit.mockResolvedValue({ applied: 1, proposals: [], undo: () => true });
});

async function generate(composer: Composer) {
  render(<GenerateBlockScreen composer={composer} onBack={vi.fn()} />);
  fireEvent.change(screen.getByTestId("generate-input"), { target: { value: "A features grid" } });
  await act(async () => fireEvent.click(screen.getByTestId("generate-run")));
}

describe("GenerateBlockScreen — real run", () => {
  it("sends the active page's elements, root and top-level sections first, never another page's", async () => {
    const { composer } = makeComposer();
    runPromptOnce.mockResolvedValue({ text: "", plan: null, edit: serverEdit("footer") });
    await generate(composer);
    const scope = runPromptOnce.mock.calls[0][0].scope as { elements: Array<{ id: string }> };
    const ids = scope.elements.map((e) => e.id);
    expect(ids.length).toBeLessThanOrEqual(200);
    expect(ids.slice(0, 3)).toEqual(["root", "hero", "footer"]);
    expect(ids).not.toContain("other-page-el");
  });

  it("pins the new section to the screen's target", async () => {
    const { composer } = makeComposer();
    // The model anchored on a nested element; the block belongs after Footer
    // (the page's last top-level section, the target with nothing selected).
    runPromptOnce.mockResolvedValue({ text: "", plan: null, edit: serverEdit("hero-3") });
    await generate(composer);
    const applied = applyAiEdit.mock.calls[0][1] as ReturnType<typeof serverEdit>;
    const cmd = (applied.applyOps.commit.commands as Array<{ args: { elementId: string } }>)[0];
    expect(cmd.args.elementId).toBe("footer");
    expect(screen.getByTestId("generate-inserted")).toBeTruthy();
  });
});
