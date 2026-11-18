/**
 * Advanced (Effects) — closed with its summary "Cursor: auto · Blend:
 * normal" (board 3). Cursor, blend mode, text shadow, will-change: the rows
 * of the old "More effects" that are neither shadow, filter nor motion. The
 * one writer of cursor, mix-blend-mode, text-shadow and will-change.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section, SelectRow, TextInputRow } from "@/editor/inspector/shared/controls";
import type { BaseStyleSectionProps } from "../registry/_shared";
import { GROUP_TITLE } from "@/editor/inspector/shared/controls/controlClasses";

const CURSORS = [
  { value: "auto", label: "Auto" },
  { value: "default", label: "Default" },
  { value: "pointer", label: "Pointer" },
  { value: "move", label: "Move" },
  { value: "text", label: "Text" },
  { value: "wait", label: "Wait" },
  { value: "help", label: "Help" },
  { value: "not-allowed", label: "Not allowed" },
  { value: "crosshair", label: "Crosshair" },
  { value: "grab", label: "Grab" },
  { value: "grabbing", label: "Grabbing" },
  { value: "zoom-in", label: "Zoom in" },
  { value: "zoom-out", label: "Zoom out" },
];

const BLENDS = [
  { value: "normal", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "darken", label: "Darken" },
  { value: "lighten", label: "Lighten" },
  { value: "color-dodge", label: "Colour dodge" },
  { value: "color-burn", label: "Colour burn" },
  { value: "difference", label: "Difference" },
  { value: "exclusion", label: "Exclusion" },
];

/* 2L9 A09 247:25554: Cursor · Blend mode · Will change (as written, a list
   like "transform, opacity"), then Text shadow as its exact authored CSS. */
export const EffectsAdvancedSection: React.FC<BaseStyleSectionProps> = ({ styles, onChange, isOpen, onToggle }) => (
  <Section title="Advanced effects" isOpen={isOpen} onToggle={onToggle} id="inspector-section-effects-advanced">
    <SelectRow label="Cursor" property="cursor" value={styles.cursor || ""} options={CURSORS} onChange={(v) => onChange("cursor", v)} />
    <SelectRow label="Blend mode" property="mix-blend-mode" value={styles["mix-blend-mode"] || ""} options={BLENDS} onChange={(v) => onChange("mix-blend-mode", v)} />
    <TextInputRow label="Will change" property="will-change" placeholder="auto" value={styles["will-change"] || ""} onChange={(v) => onChange("will-change", v)} />
    <div className={GROUP_TITLE}>Text shadow</div>
    <TextInputRow label="Custom CSS" property="text-shadow" placeholder="0 1px 2px rgb(0 0 0 / 12%)" value={styles["text-shadow"] || ""} onChange={(v) => onChange("text-shadow", v)} />
    <p className="tw:m-0 tw:py-2 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">Exact authored expression is preserved.</p>
  </Section>
);
