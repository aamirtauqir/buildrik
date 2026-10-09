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

const CURSORS = [
  { value: "auto", label: "Auto" },
  { value: "default", label: "Default" },
  { value: "pointer", label: "Pointer (hand)" },
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

const WILL_CHANGE = [
  { value: "auto", label: "Auto" },
  { value: "transform", label: "Transform" },
  { value: "opacity", label: "Opacity" },
  { value: "scroll-position", label: "Scroll" },
  { value: "contents", label: "Contents" },
];

export const EffectsAdvancedSection: React.FC<BaseStyleSectionProps> = ({ styles, onChange, isOpen, onToggle }) => (
  <Section title="Advanced" isOpen={isOpen} onToggle={onToggle} id="inspector-section-effects-advanced">
    <SelectRow label="Cursor" property="cursor" value={styles.cursor || ""} options={CURSORS} onChange={(v) => onChange("cursor", v)} />
    <SelectRow label="Blend" property="mix-blend-mode" value={styles["mix-blend-mode"] || ""} options={BLENDS} onChange={(v) => onChange("mix-blend-mode", v)} />
    <TextInputRow label="Text shadow" placeholder="2px 2px 4px rgba(0,0,0,0.3)" value={styles["text-shadow"] || ""} onChange={(v) => onChange("text-shadow", v)} />
    <SelectRow label="Will change" property="will-change" value={styles["will-change"] || ""} options={WILL_CHANGE} onChange={(v) => onChange("will-change", v)} />
  </Section>
);
