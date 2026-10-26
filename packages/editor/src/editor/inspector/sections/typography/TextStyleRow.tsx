/**
 * Text style — the Brand type styles are their font-size tokens (F-11), so a
 * style binds `font-size` to that token's var() (owner answer 4). "Custom"
 * unbinds to the size the token stood for, so nothing on the canvas moves.
 *
 * Heads Style › Typography: the binding is a style write that follows the
 * breakpoint and state, so it left the type block when the block moved to
 * Content (2L9 page 04).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SelectRow } from "@/editor/inspector/shared/controls";
import { extractVarName, cssVarToTokenId, resolveTokenVar } from "@/editor/inspector/shared/tokenBindingDetection";
import { useTypeRegistry } from "@/editor/design-system/state/TokenRegistryContext";
import { typeStyleRows } from "@/editor/design-system/ui/sections/TypographySection";

export interface TextStyleRowProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
}

export function TextStyleRow({ styles, onChange }: TextStyleRowProps) {
  const { tokens } = useTypeRegistry();
  const options = React.useMemo(() => typeStyleRows(tokens).map((row) => ({ value: row.id, label: row.name })), [tokens]);
  const size = styles["font-size"] ?? "";
  const varName = extractVarName(size);
  const bound = varName ? cssVarToTokenId(varName) : null;
  const value = bound && options.some((o) => o.value === bound) ? bound : "";
  const choose = (id: string) => {
    if (id) {
      const token = tokens.find((t) => t.id === id);
      if (token) onChange("font-size", `var(${token.cssVar})`);
      return;
    }
    if (varName) onChange("font-size", resolveTokenVar(size) || size);
  };
  return <SelectRow label="Text style" value={value} onChange={choose} options={options} placeholder="Custom" property="font-size" />;
}
