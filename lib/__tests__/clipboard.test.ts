// @vitest-environment jsdom
/**
 * M-5: the dashboard's copy buttons called navigator.clipboard.writeText
 * directly, which is undefined on an insecure (http LAN) origin — a
 * synchronous TypeError. writeClipboardText never throws synchronously, falls
 * back to the legacy copy command, and rejects when nothing copied.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { writeClipboardText } from "../clipboard";

const realClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
const setClipboard = (value: unknown) => Object.defineProperty(navigator, "clipboard", { value, configurable: true });
const setExec = (ok: boolean) =>
  Object.defineProperty(document, "execCommand", { value: vi.fn().mockReturnValue(ok), configurable: true });

afterEach(() => {
  if (realClipboard) Object.defineProperty(navigator, "clipboard", realClipboard);
  else setClipboard(undefined);
  document.body.innerHTML = "";
});

describe("writeClipboardText (dashboard)", () => {
  it("uses the async clipboard when it exists", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    await writeClipboardText("tok_123");
    expect(writeText).toHaveBeenCalledWith("tok_123");
  });

  it("falls back to the copy command, cleans up, and gives focus back", async () => {
    setClipboard(undefined);
    setExec(true);
    const field = document.createElement("button");
    document.body.appendChild(field);
    field.focus();
    await expect(writeClipboardText("x")).resolves.toBeUndefined();
    expect(document.querySelector("textarea")).toBeNull();
    expect(document.activeElement).toBe(field);
  });

  it("rejects — never throws synchronously — when nothing can copy", async () => {
    setClipboard(undefined);
    setExec(false);
    let p: Promise<void> | undefined;
    expect(() => {
      p = writeClipboardText("x");
    }).not.toThrow();
    await expect(p).rejects.toThrow();
  });
});

describe("writeClipboardText is the dashboard's only writer", () => {
  it("no dashboard source writes through navigator.clipboard directly", () => {
    const root = resolve(__dirname, "../../packages/dashboard");
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) {
          if (!["node_modules", ".next", "__tests__"].includes(name)) walk(p);
        } else if (/\.tsx?$/.test(name) && /navigator\??\.clipboard[\s?]*\.writeText/.test(readFileSync(p, "utf8"))) {
          offenders.push(p.slice(root.length + 1));
        }
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });
});
