// @vitest-environment jsdom
/**
 * Gap walk 93 #5: on an insecure origin (http LAN) `navigator.clipboard` is
 * undefined, and Layers ⋯ Copy link threw an uncaught TypeError. Every copy
 * goes through writeClipboardText: it never throws synchronously, falls back
 * to the legacy copy command where the async API is missing, and rejects
 * when nothing could copy — so callers can say so.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { writeClipboardText } from "../clipboard";

const realClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, "clipboard", { value, configurable: true });
}

afterEach(() => {
  if (realClipboard) Object.defineProperty(navigator, "clipboard", realClipboard);
  else setClipboard(undefined);
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("writeClipboardText", () => {
  it("uses the async clipboard when it exists", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    await writeClipboardText("hello");
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("falls back to the copy command on an insecure origin, and cleans up", async () => {
    setClipboard(undefined);
    const exec = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", { value: exec, configurable: true });
    await expect(writeClipboardText("http://lan/edit?el=1")).resolves.toBeUndefined();
    expect(exec).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull();
  });

  /* M-4: select() moves focus to the offscreen textarea; the caller's
     control (a menu row, the rename field) must get it back. */
  it("gives focus back to what had it before the fallback copy", async () => {
    setClipboard(undefined);
    Object.defineProperty(document, "execCommand", { value: vi.fn().mockReturnValue(true), configurable: true });
    const field = document.createElement("input");
    document.body.appendChild(field);
    field.focus();
    await writeClipboardText("x");
    expect(document.activeElement).toBe(field);
  });

  it("rejects — never throws synchronously — when nothing can copy", async () => {
    setClipboard(undefined);
    Object.defineProperty(document, "execCommand", { value: vi.fn().mockReturnValue(false), configurable: true });
    let p: Promise<void> | undefined;
    expect(() => { p = writeClipboardText("x"); }).not.toThrow();
    await expect(p).rejects.toThrow();
  });
});

/* One shared path: a call site that reaches for navigator.clipboard itself
   is how the Layers crash happened while Pages (guarded by hand) did not. */
describe("writeClipboardText is the only writer", () => {
  it("no editor source outside clipboard.ts writes through navigator.clipboard", async () => {
    const { readdirSync, readFileSync, statSync } = await import("node:fs");
    const { join, resolve, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) {
          if (name !== "__tests__" && name !== "node_modules") walk(p);
        } else if (/\.tsx?$/.test(name) && !p.endsWith(join("shared", "utils", "clipboard.ts"))) {
          if (/navigator\??\.clipboard[\s?]*\.writeText/.test(readFileSync(p, "utf8"))) offenders.push(p.slice(root.length + 1));
        }
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });
});
