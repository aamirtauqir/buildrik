/**
 * TabGuardModal — warns about unsaved changes when switching tabs
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "flowbite-react";

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
          background: "var(--bk-bg-subtle)",
          border: "1px solid var(--bk-border)",
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
            color: "var(--bk-ink)",
            marginBottom: 8,
          }}
        >
          Unsaved changes
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--bk-ink-muted)",
            marginBottom: 16,
            lineHeight: 1.6,
          }}
        >
          Your <strong style={{ color: "var(--bk-ink)" }}>{tabList}</strong> tab
          {changedTabs.length > 1 ? "s have" : " has"} unsaved changes. Switching tabs will discard{" "}
          {changedTabs.length > 1 ? "all of them" : "them"}.
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button
            ref={firstButtonRef}
            color="light"
            size="xs"
            onClick={onKeep} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
          >
            Stay
          </Button>
          <Button
            size="xs"
            onClick={onSaveAndSwitch}
          >
            Save and switch
          </Button>
          <Button
            size="xs"
            onClick={onDiscard}
            style={{ background: "var(--bk-error)", border: "none" }}
          >
            Discard {tabList}
          </Button>
        </div>
      </div>
    </div>
  );
};
