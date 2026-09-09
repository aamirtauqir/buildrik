/* Drives a REAL dragstart on a real canvas element and reports what the drag
   actually puts on screen — the ghost, the source affordance. Not a recipe:
   measure.mjs has no drag step, and board 301:1979 draws none of this. */
import * as pw from "playwright-core";
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:5050/", { waitUntil: "networkidle" });
await p.waitForSelector('[data-testid="insert-el-Container"]', { timeout: 20000 });
await p.click('[data-testid="insert-el-Container"]');
await p.waitForSelector('[data-testid="inspector-context-row"]');
const r = await p.evaluate(() => {
  const all = [...document.querySelectorAll('[data-testid="canvas"] [data-buildrick-id]')];
  const el = all.find((n) => n.getAttribute("draggable") === "true") ?? all[all.length - 1];
  if (!el) return { error: "no canvas element", count: all.length };
  const dt = new DataTransfer();
  const ev = new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: dt, clientX: 400, clientY: 300 });
  el.dispatchEvent(ev);
  const ghost = document.querySelector(".bd-drag-ghost");
  const gs = ghost ? getComputedStyle(ghost) : null;
  const label = ghost?.lastElementChild;
  const ls = label ? getComputedStyle(label) : null;
  const es = getComputedStyle(el);
  return {
    ghostFound: Boolean(ghost),
    ghost: gs && {
      background: gs.backgroundColor, border: gs.border, radius: gs.borderTopLeftRadius,
      width: gs.width, height: gs.height, opacity: gs.opacity, boxShadow: gs.boxShadow.slice(0, 60),
    },
    ghostLabel: ls && { fontSize: ls.fontSize, color: ls.color, background: ls.backgroundColor, transform: ls.textTransform },
    source: { opacity: es.opacity, classes: el.className, dragging: el.classList.contains("bd-dragging") },
    canvasDragActive: document.querySelector('[data-testid="canvas"]')?.getAttribute("data-drag-active"),
    picked: { id: el.getAttribute("data-buildrick-id"), draggable: el.getAttribute("draggable"), tag: el.tagName },
    total: all.length,
    picked: { id: el.getAttribute("data-buildrick-id"), draggable: el.getAttribute("draggable"), tag: el.tagName },
    total: all.length,
  };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
