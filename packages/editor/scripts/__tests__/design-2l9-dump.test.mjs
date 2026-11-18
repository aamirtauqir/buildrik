/** dump.mjs (plan Task 0.1): visible-only walk, scrub, encoding, mismatch refusal. */
import { describe, it, expect } from "vitest";
import { mkdtempSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { utf8Length, walkFrame, scrub, encode, decode, finishPage, readCursor, pageScript } from "../design-2l9/dump.mjs";

const text = (characters, extra = {}) => ({ type: "TEXT", name: "t", characters, ...extra });
const frame = (children, extra = {}) => ({ id: "1:1", name: "B3-P01", type: "FRAME", width: 1440, height: 900, x: 0, y: 0, children, ...extra });

describe("walkFrame", () => {
  it("skips a hidden Legacy shell and everything inside it", () => {
    const f = frame([
      { type: "FRAME", name: "Legacy · Topbar", visible: false, x: 0, y: 0, width: 1440, height: 48, children: [text("Old undo")] },
      { type: "FRAME", name: "Shell/Topbar", x: 0, y: 0, width: 1440, height: 48, children: [text("Request review"), { type: "INSTANCE", name: "i", mainComponentName: "Shell/History", children: [] }] },
    ]);
    const r = walkFrame(f);
    expect(r.texts).toEqual(["Shell/Topbar: Request review"]);
    expect(r.texts).not.toContain("Old undo");
    expect(r.instances).toEqual(["Shell/History"]);
    expect(r.boxes.map((b) => b[0])).toEqual(["Shell/Topbar"]);
  });
});

describe("walkFrame instances", () => {
  it("records each outermost instance once and not its nested sub-instances", () => {
    const inner = { type: "INSTANCE", name: "i", mainComponentName: "Icon/Undo", children: [] };
    const outer = (n) => ({ type: "INSTANCE", name: n, mainComponentName: "Shell/History", children: [inner, text("Undo")] });
    const r = walkFrame(frame([outer("a"), outer("b")]));
    expect(r.instances).toEqual(["Shell/History"]);
    expect(r.texts).toEqual(["Undo", "Undo"]);
  });
});

describe("scrub", () => {
  it("removes email- and token-shaped text and counts it", () => {
    expect(scrub("Contact ana@bella.it now")).toEqual({ text: "Contact [scrubbed] now", hits: 1 });
    expect(scrub("plain copy").hits).toBe(0);
  });
});

describe("encode/decode", () => {
  it("round-trips and stores shared strings once", () => {
    const recs = [{ id: "a", texts: ["Publish", "Undo"], instances: ["X"] }, { id: "b", texts: ["Publish"], instances: ["X"] }];
    const enc = encode(recs);
    expect(enc.D.filter((s) => s === "Publish")).toHaveLength(1);
    expect(decode(enc)).toEqual(recs);
  });
});

describe("finishPage", () => {
  it("refuses to write a page whose frame count does not match the live count", () => {
    const dir = mkdtempSync(join(tmpdir(), "dump-"));
    expect(finishPage(dir, "3:1", [walkFrame(frame([]))], 2)).toBe(1);
    expect(existsSync(join(dir, "page-3-1.json"))).toBe(false);
    expect(finishPage(dir, "3:1", [walkFrame(frame([text("hi a@b.co")]))], 1)).toBe(0);
    const out = JSON.parse(readFileSync(join(dir, "page-3-1.json"), "utf8"));
    expect(out.count).toBe(1);
    expect(out.scrubbed).toBe(1);
  });
});

describe("resume", () => {
  it("reads an empty cursor when none exists and starts the page script at the cursor", () => {
    expect(readCursor("/nope/.cursor.json")).toEqual({});
    expect(pageScript("3:1", 42)).toContain("i = 42");
  });
});

describe("utf8Length", () => {
  it("counts bytes, not chars (· is 2 bytes, → is 3)", () => {
    expect(utf8Length("a·→")).toBe(1 + 2 + 3);
    expect(utf8Length("a·→")).toBe(new TextEncoder().encode("a·→").length);
  });
});
