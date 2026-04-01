/**
 * LeftRail — v16 thin icon navigation bar
 *
 * 2-ZONE STRUCTURE (RF-6 Section C IA Redesign 2026):
 * Width: 60px | rtab: 44px height, 17px icons
 *
 * Structure:
 * - LOGO: Gem mark with indigo gradient glow
 * - TOP: Add | Media | Layers | Templates | Pages (content creation + structure)
 * - SEPARATOR: solid line
 * - BOTTOM: Design | Settings | History (configuration, pushed to bottom via flex)
 *
 * v16 changes:
 * - Indigo #7c6dfa active + 3px left bar
 * - CSS-driven tooltips with keyboard shortcuts (no React state)
 * - Badge dots (warn/info/ok) + progress ring API
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import "./LeftRail.css";
import type { GroupedTabId } from "./tabsConfig";
import {
  SvgShapes,
  SvgLayers,
  SvgPages,
  SvgClock,
  SvgSettings,
  SvgPlusCircle,
  SvgImage,
  SvgGlobe,
  SvgTemplates,
  SvgRocket,
  SvgPalette,
} from "../../shared/ui/Icons";
import { getSlotsByZone, GROUPED_TABS_CONFIG } from "./tabsConfig";
import type { RailSlot } from "./tabsConfig";

// Shortcut lookup — GROUPED_TABS_CONFIG is the SSOT for keyboard shortcuts.
// Rail button tooltips read from here instead of duplicating values in RAIL_SLOTS.
const TAB_SHORTCUTS: Partial<Record<string, string>> = Object.fromEntries(
  GROUPED_TABS_CONFIG.flatMap((t) => (t.shortcut ? [[t.id, t.shortcut]] : []))
);

// ============================================
// Icon Mapping — v16 names → React components
// ============================================

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  SvgPlus: SvgPlusCircle,
  SvgPlusCircle: SvgPlusCircle,
  SvgLayers: SvgLayers,
  SvgPages: SvgPages,
  SvgImage: SvgImage,
  SvgClock: SvgClock,
  SvgSettings: SvgSettings,
  SvgShapes: SvgShapes,
  SvgGlobe: SvgGlobe,
  SvgTemplates: SvgTemplates,
  SvgRocket: SvgRocket,
  SvgPalette: SvgPalette,
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
  /** Kept for backward compat — no longer rendered in rail */
  onOpenCommandPalette?: () => void;
}

type BadgeType = "warn" | "info" | "ok";

interface RailTabProps {
  slot: RailSlot;
  icon: React.FC<{ className?: string }>;
  isActive: boolean;
  badge?: BadgeType | null;
  onClick: () => void;
}

// ============================================
// RailTab — main nav button (rtab variant)
// ============================================

const RailTab: React.FC<RailTabProps> = ({ slot, icon: Icon, isActive, badge, onClick }) => {
  const itemClass = ["left-rail__item", isActive ? "left-rail__item--active" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={itemClass}
      onClick={onClick}
      role="tab"
      id={`rail-tab-${slot.tabId}`}
      data-tab={slot.tabId}
      aria-selected={isActive}
      aria-controls={`rail-panel-${slot.tabId}`}
      aria-label={slot.ariaLabel}
      tabIndex={isActive ? 0 : -1}
    >
      <Icon className="left-rail__icon" />
      <span className="left-rail__label">{slot.label}</span>

      {/* CSS-driven tooltip — always in DOM, shown via :hover opacity */}
      <span className="left-rail__tooltip" role="tooltip">
        <span className="left-rail__tooltip-name">
          {slot.ariaLabel}
          {TAB_SHORTCUTS[slot.tabId] && (
            <span className="left-rail__tooltip-kbd">{TAB_SHORTCUTS[slot.tabId]}</span>
          )}
        </span>
        {slot.subtitle && (
          <span className="left-rail__tooltip-sub">{slot.subtitle}</span>
        )}
      </span>

      {/* Badge dot */}
      {badge && (
        <div className={`left-rail__badge left-rail__badge--${badge}`} aria-hidden="true" />
      )}
    </button>
  );
};

// ============================================
// LeftRail Component — v16 2-zone structure
// ============================================

export const LeftRail: React.FC<LeftRailProps> = ({
  activeTab,
  onTabChange,
  drawerOpen = true,
  onDrawerToggle,
  className = "",
}) => {
  const navRef = React.useRef<HTMLElement>(null);

  // Derive zone slots from config
  const topSlots = React.useMemo(() => getSlotsByZone("top"), []);
  const bottomSlots = React.useMemo(() => getSlotsByZone("bottom"), []);

  const handleSlotClick = React.useCallback(
    (slot: RailSlot) => {
      if (slot.tabId === activeTab && onDrawerToggle) {
        // Clicking already-active tab toggles drawer
        onDrawerToggle();
      } else {
        onTabChange(slot.tabId);
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
        <div className="left-rail__logo-mark" title="Aquibra Studio" />
      </div>

      {/* TOP — Content Creation (flex: 0) */}
      <div className="left-rail__nav">
        {topSlots.map((slot) => {
          const Icon = ICON_MAP[slot.iconName] ?? SvgShapes;
          return (
            <RailTab
              key={slot.tabId}
              slot={slot}
              icon={Icon}
              isActive={slot.tabId === activeTab && drawerOpen}
              onClick={() => handleSlotClick(slot)}
            />
          );
        })}

        {/* Separator */}
        <div className="left-rail__divider" role="separator" aria-hidden="true" />

        {/* BOTTOM — Configuration (pushed down via spacer) */}
        <div className="left-rail__spacer" />
        {bottomSlots.map((slot) => {
          const Icon = ICON_MAP[slot.iconName] ?? SvgShapes;
          return (
            <RailTab
              key={slot.tabId}
              slot={slot}
              icon={Icon}
              isActive={slot.tabId === activeTab && drawerOpen}
              onClick={() => handleSlotClick(slot)}
            />
          );
        })}

        {/* Help — static footer button (not a sidebar tab) */}
        <a
          href="https://docs.buildrik.com"
          target="_blank"
          rel="noopener noreferrer"
          className="left-rail__item left-rail__item--help"
          aria-label="Help and documentation"
        >
          <svg className="left-rail__icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M6 6.5a2 2 0 1 1 2.5 1.94V9.5" />
            <circle cx="8" cy="11.5" r="0.75" fill="currentColor" stroke="none" />
          </svg>
          <span className="left-rail__label">Help</span>
          <span className="left-rail__tooltip" role="tooltip">
            <span className="left-rail__tooltip-name">Help &amp; Docs</span>
          </span>
        </a>
      </div>
    </nav>
  );
};

export default LeftRail;
