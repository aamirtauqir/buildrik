/**
 * Aquibra Icon Picker Modal
 * Browse and select icons from Lucide library (300+ icons)
 *
 * @module components/Media/IconPickerModal
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalBody, ModalClose, ModalContent, ModalRoot, ModalTitle, Slider, TextInput } from "@/editor/chrome-ui";
import {
  ICON_CATEGORIES,
  getAllIcons,
  searchIcons,
  getIconByName,
  getIconCount,
  getIconsByCategory,
  ICON_CATEGORY_IDS,
  type IconDefinition,
} from "../../shared/constants/icons";
import { InputField } from "../../shared/forms";
import type { IconConfig, IconLibrary } from "../../shared/types/media";
import { STORAGE_KEYS } from "../../shared/constants/storageKeys";
// ============================================
// Types
// ============================================

export interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (icon: IconConfig) => void;
  currentIcon?: IconConfig;
}

// ============================================
// Constants
// ============================================

const RECENT_ICONS_KEY = STORAGE_KEYS.RECENT_ICONS;
const MAX_RECENT_ICONS = 12;

// ============================================
// Styles
// ============================================

/* Classes. The one genuinely computed value in this file is the preview icon's
   colour, which the user picks — that stays inline. */
const CONTAINER = "tw:flex tw:flex-col tw:gap-4 tw:min-h-[500px]";
const SECTION_TITLE = "tw:text-xs tw:font-semibold tw:text-[var(--bk-ink-soft)] tw:uppercase tw:tracking-[0.5px] tw:mb-2";
const GRID = "tw:grid tw:[grid-template-columns:repeat(auto-fill,minmax(48px,1fr))] tw:gap-1.5 tw:overflow-auto tw:p-1";
const ICON_BTN =
  "tw:flex tw:items-center tw:justify-center tw:size-12 tw:rounded-lg tw:bg-white tw:cursor-pointer " +
  "tw:text-[var(--bk-ink)] tw:[transition:var(--bk-transition-fast)] tw:hover:bg-[var(--bk-accent-tint)] " +
  "tw:aria-pressed:border-2 tw:aria-pressed:border-blue-700 tw:aria-pressed:bg-[var(--bk-alpha-accent-15)]";
const CONTROL_GROUP = "tw:flex tw:flex-col tw:gap-1";
const CONTROL_LABEL = "tw:text-xs tw:text-[var(--bk-ink-muted)] tw:uppercase";
const GHOST = "tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]";

// ============================================
// Component
// ============================================

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentIcon,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedIcon, setSelectedIcon] = React.useState<IconDefinition | null>(null);
  const [iconSize, setIconSize] = React.useState(currentIcon?.size || 24);
  const [iconColor, setIconColor] = React.useState(currentIcon?.color || "var(--bk-bg-card)");
  const [strokeWidth, setStrokeWidth] = React.useState(currentIcon?.strokeWidth || 2);
  const [recentIcons, setRecentIcons] = React.useState<string[]>([]);
  const categoryLabels = React.useMemo(
    () => Object.fromEntries(ICON_CATEGORIES.map((cat) => [cat.id, cat.label])),
    []
  );

  // Load recent icons from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_ICONS_KEY);
      if (saved) {
        setRecentIcons(JSON.parse(saved));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Reset when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedIcon(null);
      setSearchQuery("");
      setSelectedCategory("all");

      // If there's a current icon, select it
      if (currentIcon?.name) {
        const existing = getIconByName(currentIcon.name);
        if (existing) {
          setSelectedIcon(existing);
          setIconSize(currentIcon.size || 24);
          setIconColor(currentIcon.color || "var(--bk-bg-card)");
          setStrokeWidth(currentIcon.strokeWidth || 2);
        }
      }
    }
  }, [isOpen, currentIcon]);

  // Get filtered icons
  const filteredIcons = React.useMemo(() => {
    if (searchQuery) {
      return searchIcons(searchQuery);
    }
    if (selectedCategory === "all") {
      return getAllIcons();
    }
    return getIconsByCategory(selectedCategory);
  }, [searchQuery, selectedCategory]);

  // Get recent icons as IconDefinitions
  const recentIconDefs = React.useMemo(() => {
    return recentIcons
      .map((name) => getIconByName(name))
      .filter((icon): icon is IconDefinition => icon !== undefined);
  }, [recentIcons]);

  // Save to recent icons
  const saveToRecent = (iconName: string) => {
    const updated = [iconName, ...recentIcons.filter((n) => n !== iconName)].slice(
      0,
      MAX_RECENT_ICONS
    );
    setRecentIcons(updated);
    try {
      localStorage.setItem(RECENT_ICONS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const handleSelect = () => {
    if (!selectedIcon) return;

    saveToRecent(selectedIcon.name);

    const iconConfig: IconConfig = {
      library: "lucide" as IconLibrary,
      name: selectedIcon.name,
      size: iconSize,
      color: iconColor,
      strokeWidth: strokeWidth,
    };

    onSelect(iconConfig);
    onClose();
  };

  const renderIcon = (icon: IconDefinition, size: number = 20) => {
    const IconComponent = icon.component;
    return <IconComponent size={size} color="currentColor" strokeWidth={strokeWidth} />;
  };

  return (
    <ModalRoot open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <ModalContent size="lg">
        <ModalTitle>Select Icon</ModalTitle>
        <ModalClose aria-label="Close modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </ModalClose>
        <ModalBody>
    <div className={CONTAINER}>
      {/* Header with icon count */}
      <div className="tw:flex tw:justify-between tw:items-center">
        <span className="tw:text-xs tw:text-[var(--bk-ink-muted)]">{getIconCount()} icons available</span>
      </div>

      {/* Search */}
      <div className="tw:flex tw:gap-3 tw:items-center">
        <div className="tw:flex-1">
          <InputField
            placeholder="Search icons by name or keyword..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedCategory("all");
            }}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="tw:flex tw:gap-1 tw:flex-wrap tw:pb-3 tw:border-b tw:border-gray-200">
        <Button
          size="xs"
          color={selectedCategory === "all" ? undefined : "light"}
          aria-pressed={selectedCategory === "all"}
          className="tw:rounded-full"
          onClick={() => {
            setSelectedCategory("all");
            setSearchQuery("");
          }}
        >
          All
        </Button>
        {ICON_CATEGORY_IDS.map((catId) => (
          <Button
            key={catId}
            size="xs"
            color={selectedCategory === catId ? undefined : "light"}
            aria-pressed={selectedCategory === catId}
            className="tw:rounded-full"
            onClick={() => {
              setSelectedCategory(catId);
              setSearchQuery("");
            }}
          >
            {categoryLabels[catId] || catId}
          </Button>
        ))}
      </div>

      {/* Recent Icons */}
      {!searchQuery && selectedCategory === "all" && recentIconDefs.length > 0 && (
        <div>
          <div className={SECTION_TITLE}>Recently Used</div>
          <div className={GRID}>
            {recentIconDefs.map((icon) => (
              <Button
                key={`recent-${icon.name}`}
                color="light"
                className={ICON_BTN}
                aria-pressed={selectedIcon?.name === icon.name}
                onClick={() => setSelectedIcon(icon)}
                title={icon.name}
              >
                {renderIcon(icon)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Icon Grid */}
      <div>
        {!searchQuery && selectedCategory === "all" && (
          <div className={SECTION_TITLE}>All Icons</div>
        )}
        {searchQuery && (
          <div className={SECTION_TITLE}>
            {filteredIcons.length} results for &quot;{searchQuery}&quot;
          </div>
        )}
        {filteredIcons.length > 0 ? (
          <div className={`${GRID} tw:max-h-70`}>
            {filteredIcons.map((icon) => (
              <Button
                key={icon.name}
                color="light"
                className={ICON_BTN}
                aria-pressed={selectedIcon?.name === icon.name}
                onClick={() => setSelectedIcon(icon)}
                title={icon.name}
              >
                {renderIcon(icon)}
              </Button>
            ))}
          </div>
        ) : (
          <div className="tw:text-center tw:text-xs tw:text-[var(--bk-ink-muted)] tw:py-6">No icons found for &quot;{searchQuery}&quot;</div>
        )}
      </div>

      {/* Preview & Controls */}
      {selectedIcon && (
        <div className="tw:flex tw:items-center tw:gap-4 tw:p-4 tw:bg-gray-50 tw:rounded-lg">
          {/* The picked colour is the user's live choice — the one value here
              that genuinely cannot be a class. */}
          <div
            className="tw:size-16 tw:flex tw:items-center tw:justify-center tw:bg-white tw:rounded-lg tw:border tw:border-gray-200"
            style={{ color: iconColor }}
          >
            {renderIcon(selectedIcon, iconSize)}
          </div>
          <div className="tw:flex-1">
            <div className="tw:font-semibold tw:text-sm tw:mb-1">{selectedIcon.name}</div>
            <div className="tw:text-xs tw:text-[var(--bk-ink-muted)]">{selectedIcon.tags.join(", ")}</div>
          </div>
          <div className="tw:flex tw:gap-3 tw:items-center">
            <div className={CONTROL_GROUP}>
              <span className={CONTROL_LABEL}>Size</span>
              <TextInput
                type="number"
                value={iconSize}
                onChange={(e) => setIconSize(Math.max(12, Math.min(96, Number(e.target.value))))}
                className="tw:w-15 tw:text-center"
                min={12}
                max={96}
              />
            </div>
            <div className={CONTROL_GROUP}>
              <span className={CONTROL_LABEL}>Stroke</span>
              {/* Phase D: range slider replaces numeric input — matches v3
                  prototype § 20. Live value shown to right of track. */}
              <div className="tw:flex tw:items-center tw:gap-1.5 tw:flex-1">
                <div className="tw:flex-1 tw:min-w-20">
                  {/* chrome-ui Slider, not a restyled range input — same swap
                      as OptimizationPanel. Its own field is off because the
                      readout beside it is formatted to one decimal. */}
                  <Slider
                    value={strokeWidth}
                    onChange={(v) => setStrokeWidth(Math.max(0.5, Math.min(4, v)))}
                    min={0.5}
                    max={4}
                    step={0.5}
                    label="Stroke width"
                    withField={false}
                  />
                </div>
                <span className="tw:text-[11px] tw:[font-family:var(--bk-font-mono)] tw:text-[var(--bk-ink-muted)] tw:min-w-6 tw:text-right">
                  {strokeWidth.toFixed(1)}
                </span>
              </div>
            </div>
            <div className={CONTROL_GROUP}>
              <span className={CONTROL_LABEL}>Color</span>
              <TextInput
                type="color"
                value={iconColor}
                onChange={(e) => setIconColor(e.target.value)}
                className="tw:w-10 tw:h-8 tw:p-0.5 tw:cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="tw:flex tw:justify-between tw:items-center tw:pt-4 tw:border-t tw:border-gray-200">
        <span className="tw:text-xs tw:text-[var(--bk-ink-muted)]">Powered by Lucide Icons</span>
        <div className="tw:flex tw:gap-2">
          <Button color="light" onClick={onClose} className={GHOST}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedIcon}>
            Select Icon
          </Button>
        </div>
      </div>
    </div>
        </ModalBody>
      </ModalContent>
    </ModalRoot>
  );
};

export default IconPickerModal;
