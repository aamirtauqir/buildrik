// @vitest-environment jsdom
/**
 * writeClipboardText — the one copy path for the dashboard AND the editor
 * (M-5: each app used to carry its own identical copy). On an insecure
 * (http LAN) origin `navigator.clipboard` is undefined, and a bare
 * `navigator.clipboard.writeText` threw a synchronous TypeError (gap walk 93
 * #5 — Layers ⋯ Copy link). This never throws synchronously, falls back to
 * the legacy copy command, gives focus back, and rejects when nothing copied.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { writeClipboardText } from "../clipboard";

const realClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
const setClipboard = (value: unknown) => Object.defineProperty(navigator, "clipboard", { value, configurable: true });
const setExec = (exec: unknown) => Object.defineProperty(document, "execCommand", { value: exec, configurable: true });

afterEach(() => {
  if (realClipboard) Object.defineProperty(navigator, "clipboard", realClipboard);
  else setClipboard(undefined);
  document.body.innerHTML = "";
});

describe("writeClipboardText", () => {
  it("uses the async clipboard when it exists", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    await writeClipboardText("tok_123");
    expect(writeText).toHaveBeenCalledWith("tok_123");
  });

  it("falls back to the copy command on an insecure origin, cleans up, and gives focus back", async () => {
    setClipboard(undefined);
    const exec = vi.fn().mockReturnValue(true);
    setExec(exec);
    const field = document.createElement("input");
    document.body.appendChild(field);
    field.focus();
    await expect(writeClipboardText("http://lan/edit?el=1")).resolves.toBeUndefined();
    expect(exec).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull();
    expect(document.activeElement).toBe(field);
  });

  it("rejects — never throws synchronously — when nothing can copy", async () => {
    setClipboard(undefined);
    setExec(vi.fn().mockReturnValue(false));
    let p: Promise<void> | undefined;
    expect(() => {
      p = writeClipboardText("x");
    }).not.toThrow();
    await expect(p).rejects.toThrow();
  });
});

/* One shared path: a call site that reaches for navigator.clipboard itself
   is how the Layers crash happened; a second copy of the helper is how the
   two apps' versions would drift. */
describe("writeClipboardText is the only writer, defined once", () => {
  const repo = resolve(__dirname, "../../../..");
  const self = resolve(__dirname, "../clipboard.ts");
  const sources: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) {
        if (!["node_modules", ".next", "__tests__", "dist"].includes(name)) walk(p);
      } else if (/\.tsx?$/.test(name) && p !== self) {
        sources.push(p);
      }
    }
  };
  for (const dir of ["lib", "packages/dashboard", "packages/editor/src", "packages/shared"]) walk(join(repo, dir));

  it("no dashboard, editor or lib source writes through navigator.clipboard directly", () => {
    const offenders = sources.filter((p) => /navigator\??\.clipboard[\s?]*\.writeText/.test(readFileSync(p, "utf8")));
    expect(offenders.map((p) => p.slice(repo.length + 1))).toEqual([]);
  });

  it("no other file defines its own writeClipboardText", () => {
    const offenders = sources.filter((p) => /function\s+writeClipboardText\b/.test(readFileSync(p, "utf8")));
    expect(offenders.map((p) => p.slice(repo.length + 1))).toEqual([]);
  });
});
