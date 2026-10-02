/**
 * Countdown runtime for the Countdown widget (Inspector v4 board 11, Q5).
 *
 * Same single-source model as `sliderRuntime.ts`: ONE function, run directly
 * by the canvas (`editor/canvas/hooks/useCountdownRuntime.ts`) and serialized
 * with `Function.prototype.toString()` into the published page by the
 * dashboard (`lib/publish-widgets.ts`). Keep it free of imports and of any
 * module-level reference — everything it uses is declared inside it.
 *
 * Reads what the type block writes on the countdown element:
 *   data-countdown-end      "YYYY-MM-DDTHH:MM" — a wall-clock time read in the
 *                           VISITOR's time zone ("Uses the visitor's time zone.")
 *   data-countdown-done     "message" (default) | "hide"
 *   data-countdown-message  text shown when done (message mode)
 * and writes the remaining days / hours / minutes / seconds into the
 * element's `.buildrick-countdown-value` spans, in that order (a
 * `data-countdown-unit="days|hours|minutes|seconds"` on a span names it
 * explicitly). Only elements carrying `data-countdown-end` are touched, so a
 * countdown saved before v4 stays exactly as it was.
 *
 * Idempotent per element (`data-bk-countdown-init`); returns a cleanup that
 * stops every timer it started.
 *
 * @license BSD-3-Clause
 */

export interface CountdownRuntimeOptions {
  /** The clock — tests pass a fixed one. */
  now?: () => number;
  /** The canvas: "Hide" dims the element instead of removing it, so it stays
   *  selectable while you edit it. */
  editor?: boolean;
}

export function initCountdownRuntime(root: ParentNode, opts: CountdownRuntimeOptions = {}): () => void {
  const timers: Array<ReturnType<typeof setInterval>> = [];
  const now = opts.now || Date.now;
  const units = ["days", "hours", "minutes", "seconds"];

  function parseEnd(value: string | null): number | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || "");
    if (!m) return null;
    const t = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime();
    return isNaN(t) ? null : t;
  }

  function pad(n: number): string {
    return n < 10 ? "0" + n : String(n);
  }

  const els = root.querySelectorAll<HTMLElement>("[data-countdown-end]");
  els.forEach(function (el) {
    if (el.getAttribute("data-bk-countdown-init") === "1") return;
    const end = parseEnd(el.getAttribute("data-countdown-end"));
    if (end === null) return;
    el.setAttribute("data-bk-countdown-init", "1");

    const spans = Array.prototype.slice.call(el.querySelectorAll(".buildrick-countdown-value, [data-countdown-unit]")) as HTMLElement[];
    const slots: Record<string, HTMLElement | undefined> = {};
    spans.forEach(function (span, i) {
      const named = span.getAttribute("data-countdown-unit");
      const unit = named && units.indexOf(named) !== -1 ? named : units[i];
      if (unit && !slots[unit]) slots[unit] = span;
    });

    function finish(): void {
      const mode = el.getAttribute("data-countdown-done") === "hide" ? "hide" : "message";
      if (mode === "hide") {
        if (opts.editor) el.style.opacity = "0.4";
        else el.style.display = "none";
        return;
      }
      const message = el.getAttribute("data-countdown-message") || "";
      if (!message) return;
      const grid = el.querySelector<HTMLElement>(".buildrick-countdown-grid");
      if (grid) grid.style.display = "none";
      else spans.forEach(function (s) { (s.parentElement || s).style.display = "none"; });
      let note = el.querySelector<HTMLElement>(".buildrick-countdown-message");
      if (!note) {
        note = document.createElement("p");
        note.className = "buildrick-countdown-message";
        el.appendChild(note);
      }
      note.textContent = message;
    }

    function tick(): boolean {
      const left = Math.max(0, end! - now());
      const secs = Math.floor(left / 1000);
      const parts: Record<string, number> = {
        days: Math.floor(secs / 86400),
        hours: Math.floor((secs % 86400) / 3600),
        minutes: Math.floor((secs % 3600) / 60),
        seconds: secs % 60,
      };
      units.forEach(function (u) {
        const slot = slots[u];
        if (slot) slot.textContent = u === "days" ? String(parts[u]) : pad(parts[u]);
      });
      if (left <= 0) {
        finish();
        return false;
      }
      return true;
    }

    if (!tick()) return;
    const timer = setInterval(function () {
      if (!tick()) clearInterval(timer);
    }, 1000);
    timers.push(timer);
  });

  return function () {
    timers.forEach(function (t) { clearInterval(t); });
  };
}
