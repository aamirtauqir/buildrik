/**
 * LeftRail — 3-zone icon navigation bar
 *
 * 3-ZONE STRUCTURE (2026-04-07 redesign):
 * Width: 60px | rtab: 40px height, 20px lucide icons
 *
 * Structure:
 * - LOGO: Layers mark with accent glow
 * - CREATION: Add | Templates | Media
 * - ── divider ──
 * - STRUCTURE: Layers | Pages | Components
 * - ── divider ──
 * - CONFIG: Settings | History
 * - [spacer]
 * - HELP: static footer link
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import "./LeftRail.css";
import type { GroupedTabId, GroupedTabConfig } from "./tabsConfig";
import { getTabsByZone, GROUPED_TABS_CONFIG } from "./tabsConfig";
import {
  Plus,
  LayoutGrid,
  Image,
  Layers,
  File,
  Diamond,
  Settings,
  Timer,
  Info,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Shortcut lookup — GROUPED_TABS_CONFIG is the SSOT for keyboard shortcuts.
const TAB_SHORTCUTS: Partial<Record<string, string>> = Object.fromEntries(
  GROUPED_TABS_CONFIG.flatMap((t) => (t.shortcut ? [[t.id, t.shortcut]] : []))
);

// ============================================
// Icon Mapping — lucide icon name → component
// ============================================

const ICON_MAP: Record<string, LucideIcon> = {
  Plus,
  LayoutGrid,
  Image,
  Layers,
  File,
  Diamond,
  Settings,
  Timer,
  Info,
};

// ============================================
// Types
// ============================================

export interface LeftRailProps {
  activeTab: GroupedTabId;
  onTabChange: (tab: GroupedTabId) => void;
  drawerOpen?: boolean;
  onDrawerToggle?: () => void;
  className?: string;
}

type BadgeType = "warn" | "info" | "ok";

interface RailTabProps {
  slot: GroupedTabConfig;
  isActive: boolean;
  badge?: BadgeType | null;
  onClick: () => void;
}

// ============================================
// RailTab — main nav button (rtab variant)
// ============================================

const RailTab: React.FC<RailTabProps> = ({ slot, isActive, badge, onClick }) => {
  const Icon = ICON_MAP[slot.iconName];
  if (!Icon) return null;

  const itemClass = ["left-rail__item", isActive ? "left-rail__item--active" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={itemClass}
      onClick={onClick}
      role="tab"
      id={`rail-tab-${slot.id}`}
      data-tab={slot.id}
      aria-selected={isActive}
      aria-controls={`rail-panel-${slot.id}`}
      aria-label={slot.ariaLabel}
      tabIndex={isActive ? 0 : -1}
    >
      <Icon className="left-rail__icon" size={20} />

      {/* CSS-driven tooltip — always in DOM, shown via :hover opacity */}
      <span className="left-rail__tooltip" role="tooltip">
        <span className="left-rail__tooltip-name">
          {slot.ariaLabel}
          {TAB_SHORTCUTS[slot.id] && (
            <span className="left-rail__tooltip-kbd">{TAB_SHORTCUTS[slot.id]}</span>
          )}
        </span>
      </span>

      {/* Badge dot */}
      {badge && (
        <div className={`left-rail__badge left-rail__badge--${badge}`} aria-hidden="true" />
      )}
    </button>
  );
};

// ============================================
// Zone rendering helper
// ============================================

function renderZone(
  slots: GroupedTabConfig[],
  activeTab: GroupedTabId,
  drawerOpen: boolean,
  onSlotClick: (slot: GroupedTabConfig) => void
) {
  return slots.map((slot) => (
    <RailTab
      key={slot.id}
      slot={slot}
      isActive={slot.id === activeTab && drawerOpen}
      onClick={() => onSlotClick(slot)}
    />
  ));
}

// ============================================
// LeftRail Component — 3-zone structure
// ============================================

export const LeftRail: React.FC<LeftRailProps> = ({
  activeTab,
  onTabChange,
  drawerOpen = true,
  onDrawerToggle,
  className = "",
}) => {
  const navRef = React.useRef<HTMLElement>(null);

  // Derive zone tabs from config
  const creationSlots = React.useMemo(() => getTabsByZone("creation"), []);
  const structureSlots = React.useMemo(() => getTabsByZone("structure"), []);
  const configSlots = React.useMemo(() => getTabsByZone("config"), []);

  const handleSlotClick = React.useCallback(
    (slot: GroupedTabConfig) => {
      if (slot.id === activeTab && onDrawerToggle) {
        onDrawerToggle();
      } else {
        onTabChange(slot.id);
      }
    },
    [activeTab, onTabChange, onDrawerToggle]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const buttons = navRef.current?.querySelectorAll<HTMLElement>('[role="tab"]');
      if (!buttons || buttons.length === 0) return;
      const arr = Array.from(buttons);
      const idx = arr.indexOf(document.activeElement as HTMLElement);
      if (idx === -1) return;

      let nextIdx = idx;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        nextIdx = (idx + 1) % arr.length;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        nextIdx = (idx - 1 + arr.length) % arr.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIdx = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIdx = arr.length - 1;
      }

      if (nextIdx !== idx) {
        const nextButton = arr[nextIdx];
        const tabId = nextButton.dataset.tab as GroupedTabId | undefined;
        if (tabId) onTabChange(tabId);
        nextButton.focus();
      }
    },
    [onTabChange]
  );

  const railClass = ["left-rail", className].filter(Boolean).join(" ");

  return (
    <nav
      ref={navRef}
      className={railClass}
      role="tablist"
      aria-label="Editor navigation"
      aria-orientation="vertical"
      onKeyDown={handleKeyDown}
    >
      {/* Logo Mark */}
      <div className="left-rail__logo">
        <Layers className="left-rail__logo-icon" size={28} />
      </div>

      <div className="left-rail__divider" role="separator" aria-hidden="true" />

      {/* CREATION — Add, Templates, Media */}
      <div className="left-rail__zone" data-zone="creation">
        {renderZone(creationSlots, activeTab, drawerOpen, handleSlotClick)}
      </div>

      <div className="left-rail__divider" role="separator" aria-hidden="true" />

      {/* STRUCTURE — Layers, Pages, Components */}
      <div className="left-rail__zone" data-zone="structure">
        {renderZone(structureSlots, activeTab, drawerOpen, handleSlotClick)}
      </div>

      <div className="left-rail__divider" role="separator" aria-hidden="true" />

      {/* CONFIG — Settings, History */}
      <div className="left-rail__zone" data-zone="config">
        {renderZone(configSlots, activeTab, drawerOpen, handleSlotClick)}
      </div>

      {/* Spacer pushes Help to bottom */}
      <div className="left-rail__spacer" />

      {/* Help — static footer button (not a sidebar tab) */}
      <a
        href="https://docs.buildrik.com"
        target="_blank"
        rel="noopener noreferrer"
        className="left-rail__item left-rail__item--help"
        aria-label="Help and documentation"
      >
        <Info className="left-rail__icon" size={20} />
        <span className="left-rail__tooltip" role="tooltip">
          <span className="left-rail__tooltip-name">Help &amp; Docs</span>
        </span>
      </a>
    </nav>
  );
};

export default LeftRail;
