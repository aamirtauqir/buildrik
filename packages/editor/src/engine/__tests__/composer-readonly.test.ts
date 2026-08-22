/**
 * A read-only composer runs no command that changes the document.
 *
 * This is the gate client view needs, and the reason it lives in the engine
 * rather than the chrome: KeybindingManager binds `keydown` on WINDOW in the
 * capture phase. Client view had already withheld the rail, the inspector,
 * inline edit, drop, the context menu and the canvas keydown — and clicking an
 * element then pressing Delete still removed it, because none of those gates
 * sit between window and the command. Measured in the running app on a scratch
 * site: 203 elements became 202, and autosave wrote it.
 *
 * The regression this protects is precise: someone adds a mutating command and
 * forgets MUTATING_COMMANDS, or someone "simplifies" the readOnly check away.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
  createTestComposer,
} from "./test-utils/realComposer";

describe("Composer.readOnly", () => {
  beforeEach(() => installEngineBrowserStubs());
  afterEach(() => removeEngineBrowserStubs());

  function setup() {
    const composer = createTestComposer();
    const page = composer.elements.createPage("Home");
    const el = composer.elements.createElement("heading" as never);
    composer.elements.addElement(el, page.root.id);
    composer.selection.select(el);
    return { composer, el, rootId: page.root.id };
  }

  const childCount = (composer: ReturnType<typeof createTestComposer>) =>
    (composer.exportProject().pages?.[0]?.root?.children ?? []).length;

  it("defaults to false — the editor is not read-only by accident", () => {
    const { composer } = setup();
    expect(composer.readOnly).toBe(false);
  });

  /* The gate sits on the KEYBOARD path — CommandCenter.shouldHandleShortcut,
     which only KeybindingManager calls. So the test presses the key rather than
     calling run(): a programmatic run() is not what the window listener does,
     and testing that would prove something else. */
  const pressDelete = () =>
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete", bubbles: true }));

  it("deletes on the Delete key when writable", () => {
    const { composer } = setup();
    expect(childCount(composer)).toBe(1);
    pressDelete();
    expect(childCount(composer)).toBe(0);
  });

  it("ignores the Delete key when read-only", () => {
    const { composer } = setup();
    composer.readOnly = true;
    pressDelete();
    expect(childCount(composer)).toBe(1);
  });
});
