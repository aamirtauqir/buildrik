/**
 * InspectorTabs — D6 Stage 2 extraction (audit-remediation 2026-05-08).
 *
 * Lifted out of ProInspector.tsx (was inline at lines 367-408). The
 * Style / Element / Effects tab list with full keyboard navigation
 * (ArrowLeft / ArrowRight). Stateless — driven by `activeTab` +
 * `onChange` props from the orchestrator's useInspectorState hook.
 *
 * The tabId list and labels are defined here (not the orchestrator)
 * because they're a property of "what tabs exist," not "what's
 * selected." If a future tab gets added, this is the only file that
 * needs the new entry.
 *
 * @license BSD-3-Clause
 */

import { Button } from "@/editor/shared/vibcoder/Button";
import * as React from "react";
import type { TabName } from "../hooks/useInspectorState";

const TAB_IDS = ["style", "element", "effects"] as const;
const TAB_LABELS: Record<TabName, string> = {
  style: "Style",
  element: "Element",
  effects: "Effects",
};

export interface InspectorTabsProps {
  activeTab: TabName;
  onChange: (tab: TabName) => void;
}

export function InspectorTabs({ activeTab, onChange }: InspectorTabsProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const tabButtons = e.currentTarget.querySelectorAll('[role="tab"]');
    const focusedIndex = Array.from(tabButtons).indexOf(e.target as HTMLButtonElement);
    if (focusedIndex === -1) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (focusedIndex + 1) % TAB_IDS.length;
      onChange(TAB_IDS[nextIndex]);
      (tabButtons[nextIndex] as HTMLButtonElement)?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (focusedIndex - 1 + TAB_IDS.length) % TAB_IDS.length;
      onChange(TAB_IDS[prevIndex]);
      (tabButtons[prevIndex] as HTMLButtonElement)?.focus();
    }
  };

  return (
    <div
      className="bdi-tabs"
      role="tablist"
      aria-label="Inspector sections"
      onKeyDown={handleKeyDown}
    >
      {TAB_IDS.map((tab) => (
        <Button
          key={tab}
          role="tab"
          id={`inspector-tab-${tab}`}
          aria-selected={activeTab === tab}
          aria-controls={`inspector-tabpanel-${tab}`}
          tabIndex={activeTab === tab ? 0 : -1}
          className={`bdi-tab${activeTab === tab ? " on" : ""}`}
          onClick={() => onChange(tab)}
          type="button"
        >
          {TAB_LABELS[tab]}
        </Button>
      ))}
    </div>
  );
}
