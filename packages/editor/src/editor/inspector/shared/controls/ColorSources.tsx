/**
 * ColorSources — 2L9 B05 (247:30075): a multi-selection whose colour reads
 * "Mixed" only because the targets name it differently (two tokens, or a
 * token and a hex) while every one of them resolves to the SAME colour.
 *
 *   Same value · multiple sources
 *   Heading 1      Brand / Primary
 *   Heading 2      Brand / Link
 *   [ Make local color change ]
 *
 * Shown only when that is true; a real difference stays plain "Mixed".
 * "Make local color change" writes the one resolved colour to every target as
 * its own value, one Undo. Read-only (lock, conflict) refuses it, as every
 * Inspector write does.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import { useColorRegistry } from "@/editor/design-system/state/TokenRegistryContext";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import { extractVarName, isTokenVar } from "../tokenBindingDetection";
import { colourTokenLabel } from "./ColorInput";
import { useInspectorField, useInspectorSources } from "./InspectorFieldContext";
import { WIDE_BUTTON } from "./controlClasses";

const norm = (v: string) => {
  const t = v.trim().toLowerCase();
  return /^[0-9a-f]{6}$/.test(t) ? `#${t}` : t;
};

export function ColorSources({ property, onChange }: { property: string; onChange: (property: string, value: string) => void }) {
  const field = useInspectorField(property);
  const sources = useInspectorSources(property);
  const { tokens } = useColorRegistry();
  if (!field.mixed || sources.length < 2) return null;
  const read = sources.map((s) => {
    if (!isTokenVar(s.value)) return { ...s, resolved: norm(s.value), label: `Local ${s.value.trim().toUpperCase()}` };
    const varName = extractVarName(s.value);
    const token = tokens.find((t) => t.cssVar === varName);
    return {
      ...s,
      resolved: token ? norm(resolveTokenLiteral(tokens, token.id, "light") ?? "") : "",
      label: token ? colourTokenLabel(token.id) : s.value,
    };
  });
  const one = read[0].resolved;
  if (!one || read.some((r) => r.resolved !== one)) return null;
  return (
    <div className="tw:flex tw:flex-col tw:gap-2 tw:pb-2" data-testid="inspector-color-sources">
      <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">Same value · multiple sources</p>
      {read.map((r) => (
        <div key={r.id} className="tw:grid tw:grid-cols-[88px_minmax(0,1fr)] tw:items-center tw:gap-2">
          <span className="tw:truncate tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">{r.name}</span>
          <span className="tw:truncate tw:rounded-[4px] tw:bg-[var(--bk-bg-subtle)] tw:px-2 tw:py-1 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink)]">
            {r.label}
          </span>
        </div>
      ))}
      <Button
        type="button"
        size="xs"
        color="light"
        className={WIDE_BUTTON}
        aria-disabled={field.readOnly || undefined}
        onClick={() => {
          if (!field.readOnly) field.discrete(() => onChange(property, one.toUpperCase()));
        }}
        data-testid="inspector-color-make-local"
      >
        Make local color change
      </Button>
    </div>
  );
}
