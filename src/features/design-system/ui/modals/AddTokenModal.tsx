/**
 * AddTokenModal — dialog for adding a new color token
 * @license BSD-3-Clause
 */

import * as React from "react";
import { generateColorTokenId } from "../../utils/exportUtils";

export interface AddTokenModalProps {
  existingIds: string[];
  onAdd: (name: string, hex: string) => void;
  onClose: () => void;
}

export const AddTokenModal: React.FC<AddTokenModalProps> = ({ existingIds, onAdd, onClose }) => {
  const [name, setName] = React.useState("");
  const [hex, setHex] = React.useState("#3B82F6");
  const [nameError, setNameError] = React.useState("");
  const [hexError, setHexError] = React.useState("");

  const validate = () => {
    let valid = true;
    const tokenId = generateColorTokenId(name);
    if (!name.trim()) {
      setNameError("Name is required");
      valid = false;
    } else if (existingIds.includes(tokenId)) {
      setNameError("A token with this name already exists");
      valid = false;
    } else setNameError("");

    if (!/^#([0-9A-Fa-f]{6})$/.test(hex)) {
      setHexError("Enter a valid 6-digit hex color");
      valid = false;
    } else setHexError("");

    return valid;
  };

  const handleAdd = () => {
    if (validate()) onAdd(name.trim(), hex.toUpperCase());
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "var(--aqb-surface-3)",
          border: "1px solid var(--aqb-border)",
          borderRadius: 12,
          padding: 20,
          width: 280,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--aqb-text-primary)",
            marginBottom: 16,
          }}
        >
          Add color token
        </div>

        <label
          style={{
            fontSize: 11,
            color: "var(--aqb-text-muted)",
            display: "block",
            marginBottom: 4,
          }}
        >
          Token name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Purple"
          style={{
            width: "100%",
            padding: "8px 10px",
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${nameError ? "#ef4444" : "var(--aqb-border)"}`,
            borderRadius: 6,
            color: "var(--aqb-text-primary)",
            fontSize: 12,
            boxSizing: "border-box",
            marginBottom: 4,
          }}
        />
        {nameError && (
          <div style={{ fontSize: 10, color: "#ef4444", marginBottom: 8 }}>{nameError}</div>
        )}

        <label
          style={{
            fontSize: 11,
            color: "var(--aqb-text-muted)",
            display: "block",
            marginBottom: 4,
            marginTop: 8,
          }}
        >
          Hex value
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#333",
              border: "1px solid var(--aqb-border)",
              flexShrink: 0,
            }}
          />
          <input
            type="text"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            placeholder="#3B82F6"
            style={{
              flex: 1,
              padding: "8px 10px",
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${hexError ? "#ef4444" : "var(--aqb-border)"}`,
              borderRadius: 6,
              color: "var(--aqb-text-primary)",
              fontSize: 12,
              fontFamily: "monospace",
            }}
          />
        </div>
        {hexError && (
          <div style={{ fontSize: 10, color: "#ef4444", marginBottom: 8 }}>{hexError}</div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{
              padding: "7px 14px",
              background: "transparent",
              border: "1px solid var(--aqb-border)",
              borderRadius: 6,
              color: "var(--aqb-text-secondary)",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            style={{
              padding: "7px 14px",
              background: "var(--aqb-primary)",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Add token
          </button>
        </div>
      </div>
    </div>
  );
};
