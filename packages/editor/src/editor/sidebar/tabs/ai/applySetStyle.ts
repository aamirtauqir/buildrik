import { z } from "zod";
import type { Composer } from "@/engine/Composer";

/**
 * v1 in-canvas AI command: `set-style`. Desktop / normal-state inline styles
 * only (the `el.setStyle` path) — pseudo-state and breakpoint styles live in a
 * different store and are out of scope for the thin slice.
 *
 * The schema is the single validation gate: an AI-emitted batch is parsed
 * against it server-side (before streaming) AND here before applying. The
 * property allow-list + value block-list together prevent CSS-injection vectors
 * reaching `el.setStyle`.
 */

const ALLOWED_PROPERTIES = [
  "color",
  "background",
  "background-color",
  "opacity",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "width",
  "height",
  "gap",
  "display",
  "text-align",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "border-radius",
  "border-width",
  "border-color",
  "border-style",
  "box-shadow",
] as const;

// Reject the known CSS-injection / data-exfiltration vectors. The property
// allow-list already blocks `-moz-binding`/`behavior`; this guards shorthand
// properties (e.g. `background`) whose value could smuggle a `url(...)`.
const UNSAFE_VALUE = /url\s*\(|expression\s*\(|binding\s*\(|javascript:|data:/i;

export const setStyleArgsSchema = z.object({
  elementId: z.string().min(1),
  property: z.enum(ALLOWED_PROPERTIES),
  value: z
    .string()
    .min(1)
    .max(200)
    .refine((v) => !UNSAFE_VALUE.test(v), {
      message: "Unsafe CSS value rejected",
    }),
});

export type SetStyleArgs = z.infer<typeof setStyleArgsSchema>;

/**
 * Apply one validated set-style command. Does NOT open a transaction — the
 * caller (the accept handler) wraps the whole batch in one outer transaction so
 * the edit is a single undo step (see plan Unit 3 / Unit 0 finding #3).
 */
export function applySetStyle(composer: Composer, args: SetStyleArgs): void {
  const el = composer.elements.getElement(args.elementId);
  if (!el || typeof el.setStyle !== "function") {
    throw new Error(`set-style: element not found (${args.elementId})`);
  }
  el.setStyle(args.property, args.value);
}
