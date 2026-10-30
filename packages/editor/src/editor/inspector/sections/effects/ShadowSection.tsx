/**
 * Shadow — 2L9 161:12525: every box-shadow layer as rows, X offset · Y
 * offset · Blur · Spread · Color · Inset, the header counting "1 layer".
 * A value the rows cannot hold without changing it (a var(), calc(), five
 * lengths) is kept as written with "Edit custom value". The one writer of
 * `box-shadow`. (The Outer / Inner preset selects this replaced drew no
 * 2L9 board.)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import { AuthoredValue, ColorInput, InputWithUnit, Section } from "@/editor/inspector/shared/controls";
import { CheckRow } from "@/editor/inspector/shared/controls/CheckRow";
import { GROUP_TITLE, WIDE_BUTTON } from "@/editor/inspector/shared/controls/controlClasses";
import type { BaseStyleSectionProps } from "../registry/_shared";
import { composeShadowLayers, parseShadowLayers, type ShadowLayer } from "./effectValues";

const NEW_LAYER: ShadowLayer = { inset: false, x: "0px", y: "4px", blur: "12px", spread: "0px", color: "rgba(17, 24, 39, 0.12)" };
const UNITS = ["px", "em", "rem"];
const LENGTHS = [
  ["x", "X offset"],
  ["y", "Y offset"],
  ["blur", "Blur"],
  ["spread", "Spread"],
] as const;

export const ShadowSection: React.FC<BaseStyleSectionProps> = ({ styles, onChange, isOpen, onToggle, composer }) => {
  const raw = styles["box-shadow"];
  const [editLayers, setEditLayers] = React.useState(false);
  const layers = parseShadowLayers(raw);
  const write = (next: readonly ShadowLayer[]) => onChange("box-shadow", composeShadowLayers(next));
  const set = (i: number, patch: Partial<ShadowLayer>) => layers && write(layers.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const count = layers ? layers.length : null;
  const action =
    count === null ? undefined : count ? (
      <span className="tw:text-[12px] tw:text-[var(--bk-ink-soft)]">{count === 1 ? "1 layer" : `${count} layers`}</span>
    ) : undefined;

  return (
    <Section title="Shadow" isOpen={isOpen} onToggle={onToggle} id="inspector-section-shadow" action={action}>
      {layers === null ? (
        <AuthoredValue
          testId="inspector-shadow-authored"
          caption="Authored value"
          value={raw ?? ""}
          note="Kept as written — the layer rows cannot show it without changing it."
          editLabel="Edit custom value"
          accept={() => true}
          onCommit={(v) => onChange("box-shadow", v)}
        />
      ) : (
        <>
          {/* 2L9 A08 247:25026: several layers read back as authored, in order. */}
          {layers.length > 1 ? (
            <div className="tw:flex tw:flex-col tw:gap-1 tw:pb-1" data-testid="inspector-shadow-summary">
              <span className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">Authored shadow</span>
              <span className="tw:rounded-[4px] tw:bg-[var(--bk-bg-subtle)] tw:px-2 tw:py-1.5 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink)] tw:break-words">{raw}</span>
              <span className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">Editing one layer keeps order and inset placement.</span>
              {editLayers ? null : (
                <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => setEditLayers(true)} data-testid="inspector-shadow-edit-layers">
                  Edit layers
                </Button>
              )}
            </div>
          ) : null}
          {(layers.length > 1 && !editLayers ? [] : layers).map((layer, i) => (
            <React.Fragment key={i}>
              {layers.length > 1 && <div className={GROUP_TITLE}>Layer {i + 1}</div>}
              {LENGTHS.map(([key, label]) => (
                <InputWithUnit
                  key={key}
                  label={label}
                  property="box-shadow"
                  units={UNITS}
                  value={layer[key]}
                  onChange={(v) => set(i, { [key]: v || "0px" })}
                />
              ))}
              <ColorInput label="Color" property="box-shadow" value={layer.color} onChange={(v) => set(i, { color: v })} composer={composer} />
              <CheckRow label="Inset" checked={layer.inset} onChange={(on) => set(i, { inset: on })} />
              {layers.length > 1 && (
                <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => write(layers.filter((_, j) => j !== i))}>
                  Remove layer {i + 1}
                </Button>
              )}
            </React.Fragment>
          ))}
          {layers.length > 1 && !editLayers ? null : (
          <div className="tw:pt-2">
            <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => write([...layers, NEW_LAYER])}>
              {layers.length ? "Add layer" : "Add shadow"}
            </Button>
          </div>
          )}
        </>
      )}
    </Section>
  );
};
