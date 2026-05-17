/**
 * BindingEditor (S2.1 B3) — list of BindingRows + Add Binding affordance.
 *
 * Owns a single bindings record (Record<cssProperty, {tokenId}>) and emits
 * onChange whenever a row mutates. Caller (GenericPresetList) routes
 * onChange into registry.updatePreset({ bindings: next }) which lights the
 * normal dirty pipeline.
 *
 * Add Binding flow: pick CSS property from COMMON_CSS_PROPERTIES menu →
 * default to first kind-compatible token → row appears with that defaulted
 * binding. User can re-pick via the row's Edit affordance immediately.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PresetBinding } from "../../types";
import { BindingRow } from "./BindingRow";
import { cssPropertyKinds, COMMON_CSS_PROPERTIES } from "../../utils/cssPropertyKinds";
import { useTokensByKinds } from "../../state/useTokensByKinds";
import { Button } from "@/editor/shared/vibcoder/Button";
import { Select } from "@/editor/shared/vibcoder/Select";

interface BindingEditorProps {
  bindings: Record<string, PresetBinding>;
  onChange: (next: Record<string, PresetBinding>) => void;
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: "8px 0 4px",
};

const addRowStyle: React.CSSProperties = {
  marginTop: 8,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const selectStyle: React.CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  padding: "4px 8px",
  background: "var(--bd-bg-canvas, #0e0e10)",
  color: "var(--bd-fg-primary)",
  border: "1px solid var(--bd-border)",
  borderRadius: 4,
  fontSize: 11,
  fontFamily: "var(--bd-font-mono, monospace)",
};

const addBtnStyle: React.CSSProperties = {
  padding: "4px 12px",
  background: "var(--bd-accent)",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  fontSize: 11,
  cursor: "pointer",
};

const emptyStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--bd-fg-muted)",
  padding: "4px 0",
};

// Per-row token list — small wrapper hook so BindingRow gets its kind-filtered
// tokens without each row redoing the full fan-out work. Memoized inside
// useTokensByKinds against per-kind registry refs.
const BindingRowConnected: React.FC<{
  cssProperty: string;
  currentTokenId: string;
  onChange: (newTokenId: string) => void;
  onDelete: () => void;
}> = ({ cssProperty, currentTokenId, onChange, onDelete }) => {
  const kinds = React.useMemo(() => cssPropertyKinds(cssProperty), [cssProperty]);
  const tokens = useTokensByKinds(kinds);
  return (
    <BindingRow
      cssProperty={cssProperty}
      currentTokenId={currentTokenId}
      availableTokens={tokens}
      onChange={onChange}
      onDelete={onDelete}
    />
  );
};

export const BindingEditor: React.FC<BindingEditorProps> = ({ bindings, onChange }) => {
  const [draftProperty, setDraftProperty] = React.useState<string>("");

  const entries = React.useMemo(() => Object.entries(bindings), [bindings]);

  // Properties that aren't already bound — used to gate the Add menu.
  const availableProps = React.useMemo(
    () => COMMON_CSS_PROPERTIES.filter((p) => !(p in bindings)),
    [bindings],
  );

  const handleRowChange = (cssProperty: string, newTokenId: string) => {
    onChange({ ...bindings, [cssProperty]: { tokenId: newTokenId } });
  };

  const handleRowDelete = (cssProperty: string) => {
    const { [cssProperty]: _removed, ...rest } = bindings;
    onChange(rest);
  };

  // Resolve a default token id for a freshly-added binding. Pulls the first
  // token of any compatible kind from the live registries via a tiny helper
  // component (can't call useTokensByKinds at the top of this component for
  // a dynamic kinds list — call it inside a child keyed by property).
  const AddBindingResolver: React.FC<{
    cssProperty: string;
    onResolved: (tokenId: string | null) => void;
  }> = ({ cssProperty, onResolved }) => {
    const kinds = React.useMemo(() => cssPropertyKinds(cssProperty), [cssProperty]);
    const tokens = useTokensByKinds(kinds);
    React.useEffect(() => {
      onResolved(tokens.length > 0 ? tokens[0].id : null);
    }, [tokens, onResolved]);
    return null;
  };

  const [resolveTarget, setResolveTarget] = React.useState<string | null>(null);

  return (
    <div style={containerStyle}>
      {entries.length === 0 && <div style={emptyStyle}>No bindings yet — add one below.</div>}

      {entries.map(([cssProperty, b]) => (
        <BindingRowConnected
          key={cssProperty}
          cssProperty={cssProperty}
          currentTokenId={b.tokenId}
          onChange={(newId) => handleRowChange(cssProperty, newId)}
          onDelete={() => handleRowDelete(cssProperty)}
        />
      ))}

      <div style={addRowStyle}>
        <Select
          aria-label="Select CSS property to bind"
          value={draftProperty}
          onChange={(e) => setDraftProperty(e.target.value)}
          style={selectStyle}
        >
          <option value="">Add binding…</option>
          {availableProps.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </Select>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!draftProperty}
          onClick={() => setResolveTarget(draftProperty)}
          style={addBtnStyle}
        >
          Add
        </Button>
      </div>

      {resolveTarget && (
        <AddBindingResolver
          cssProperty={resolveTarget}
          onResolved={(tokenId) => {
            if (tokenId) {
              onChange({ ...bindings, [resolveTarget]: { tokenId } });
            }
            setResolveTarget(null);
            setDraftProperty("");
          }}
        />
      )}
    </div>
  );
};
