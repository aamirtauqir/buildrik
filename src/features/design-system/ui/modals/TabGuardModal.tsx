/**
 * TabGuardModal — warns about unsaved changes when switching tabs
 * @license BSD-3-Clause
 */

import * as React from "react";

export const TabGuardModal: React.FC<{
  changedTabs: string[];
  onDiscard: () => void;
  onKeep: () => void;
  onSaveAndSwitch: () => void;
}> = ({ changedTabs, onDiscard, onKeep, onSaveAndSwitch }) => {
  const tabList = changedTabs.join(" and ");
  const firstButtonRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    firstButtonRef.current?.focus();
  }, []);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
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
          width: 260,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--aqb-text-primary)",
            marginBottom: 8,
          }}
        >
          Unsaved changes
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--aqb-text-muted)",
            marginBottom: 16,
            lineHeight: 1.6,
          }}
        >
          Your <strong style={{ color: "var(--aqb-text-primary)" }}>{tabList}</strong> tab
          {changedTabs.length > 1 ? "s have" : " has"} unsaved changes. Switching tabs will discard{" "}
          {changedTabs.length > 1 ? "all of them" : "them"}.
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            ref={firstButtonRef}
            onClick={onKeep}
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
            Stay
          </button>
          <button
            onClick={onSaveAndSwitch}
            style={{
              padding: "7px 14px",
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save and switch
          </button>
          <button
            onClick={onDiscard}
            style={{
              padding: "7px 14px",
              background: "#ef4444",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Discard {tabList}
          </button>
        </div>
      </div>
    </div>
  );
};
