/**
 * Pick mode is gone (design-2l9 REQUESTS A-38): the CMS Conditions page became
 * a read-only index (176:21830) and its "+ New condition" was the last door
 * into canvas pick mode, so `data-bk-pick` is set by nothing. The engine's
 * deselect carve-out for it went with it: a bare Escape deselects, whatever
 * attribute happens to be on the page, and no source reads the flag.
 *
 * @license BSD-3-Clause
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { CommandCenter } from "../CommandCenter";

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === "__tests__" ? [] : sources(p);
    return /\.(ts|tsx|css)$/.test(name) ? [p] : [];
  });
}

describe("pick mode is removed", () => {
  it("no source under src/ reads or sets data-bk-pick", () => {
    const src = join(__dirname, "../../..");
    const readers = sources(src).filter((p) => readFileSync(p, "utf8").includes("data-bk-pick"));
    expect(readers).toEqual([]);
  });

  it("a bare Escape deselects even with a stray data-bk-pick on the page", () => {
    const center = new CommandCenter({ emit: vi.fn(), on: vi.fn(), off: vi.fn() } as never);
    const guard = (center as never as { shouldHandleShortcut(e: KeyboardEvent, id: string): boolean }).shouldHandleShortcut.bind(center);
    const flag = document.createElement("div");
    flag.setAttribute("data-bk-pick", "true");
    document.body.appendChild(flag);
    const e = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    Object.defineProperty(e, "target", { value: document.body });
    expect(guard(e, "deselect")).toBe(true);
    flag.remove();
    center.destroy?.();
  });
});
