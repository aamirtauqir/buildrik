/**
 * LeftRail — v16 thin icon navigation bar
 *
 * 3-ZONE STRUCTURE (v16 IA Redesign 2026):
 * Width: 60px | rtab: 44px height, 17px icons | rfbtn: 38px height, 15px icons
 *
 * Structure:
 * - LOGO: Gem mark with indigo gradient glow
 * - TOP: Templates | Pages | Build | Media (content creation)
 * - SEPARATOR: solid line
 * - BOTTOM: Global | Config (configuration, pushed to bottom via flex)
 * - FOOTER: Layers | History (utility, teal active, border-top)
 *
 * v16 changes:
 * - Indigo #7c6dfa active + 3px left bar
 * - CSS-driven tooltips with keyboard shortcuts (no React state)
 * - Badge dots (warn/info/ok) + progress ring API
 * - Footer zone with teal active state (#00d4aa)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import "./LeftRail.css";
import type { GroupedTabId } from "../../shared/constants/tabs";
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

interface FooterBtnProps {
  slot: RailSlot;
  icon: React.FC<{ className?: string }>;
  isActive: boolean;
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
// FooterBtn — utility button (rfbtn variant)
// ============================================

const FooterBtn: React.FC<FooterBtnProps> = ({ slot, icon: Icon, isActive, onClick }) => {
  const btnClass = ["left-rail__footer-btn", isActive ? "left-rail__footer-btn--active" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={btnClass}
      onClick={onClick}
      id={`rail-tab-${slot.tabId}`}
      data-tab={slot.tabId}
      aria-label={slot.ariaLabel}
      tabIndex={0}
    >
      <Icon className="left-rail__footer-icon" />
      <span className="left-rail__footer-label">{slot.label}</span>
    </button>
  );
};

// ============================================
// LeftRail Component — v16 3-zone structure
// ============================================

export const LeftRail: React.FC<LeftRailProps> = ({
  activeTab,
  onTabChange,
  drawerOpen = true,
  onDrawerToggle,
  className = "",
}) => {
  // Derive zone slots from config
  const topSlots = React.useMemo(() => getSlotsByZone("top"), []);
  const bottomSlots = React.useMemo(() => getSlotsByZone("bottom"), []);
  const footerSlots = React.useMemo(() => getSlotsByZone("footer"), []);

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

  // History toggle: clicking toggles on/off independently
  const handleFooterClick = React.useCallback(
    (slot: RailSlot) => {
      if (slot.toggleMode && slot.tabId === activeTab) {
        // Toggle off — switch back to previous non-footer tab
        if (onDrawerToggle) onDrawerToggle();
      } else {
        onTabChange(slot.tabId);
      }
    },
    [activeTab, onTabChange, onDrawerToggle]
  );

  // Arrow key navigation across all visible slots
  const allVisibleSlots = React.useMemo(
    () => [...topSlots, ...bottomSlots, ...footerSlots],
    [topSlots, bottomSlots, footerSlots]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = allVisibleSlots.findIndex((s) => s.tabId === activeTab);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % allVisibleSlots.length;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + allVisibleSlots.length) % allVisibleSlots.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = allVisibleSlots.length - 1;
      }

      if (nextIndex !== currentIndex) {
        const nextSlot = allVisibleSlots[nextIndex];
        onTabChange(nextSlot.tabId);
        const button = document.getElementById(`rail-tab-${nextSlot.tabId}`);
        button?.focus();
      }
    },
    [activeTab, allVisibleSlots, onTabChange]
  );

  const railClass = ["left-rail", className].filter(Boolean).join(" ");

  return (
    <nav
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
      </div>

      {/* FOOTER — Utility buttons (Layers, History) */}
      <div className="left-rail__footer">
        {footerSlots.map((slot) => {
          const Icon = ICON_MAP[slot.iconName] ?? SvgShapes;
          return (
            <FooterBtn
              key={slot.tabId}
              slot={slot}
              icon={Icon}
              isActive={slot.tabId === activeTab && drawerOpen}
              onClick={() => handleFooterClick(slot)}
            />
          );
        })}
      </div>
    </nav>
  );
};

export default LeftRail;
