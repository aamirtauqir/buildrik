/**
 * Aquibra Icon Picker Modal
 * Browse and select icons from Lucide library (300+ icons)
 *
 * @module components/Media/IconPickerModal
 * @license BSD-3-Clause
 */

import * as React from "react";
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
import { Modal, Button } from "../../shared/ui";

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

const RECENT_ICONS_KEY = "aqb-recent-icons";
const MAX_RECENT_ICONS = 12;

// ============================================
// Styles
// ============================================

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
    minHeight: 500,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconCount: {
    fontSize: 12,
    color: "var(--aqb-text-muted)",
  },
  toolbar: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
  },
  categories: {
    display: "flex",
    gap: 4,
    flexWrap: "wrap" as const,
    paddingBottom: 12,
    borderBottom: "1px solid var(--aqb-border)",
  },
  categoryBtn: {
    padding: "4px 10px",
    fontSize: 11,
    border: "1px solid var(--aqb-border)",
    borderRadius: 16,
    background: "transparent",
    color: "var(--aqb-text-secondary)",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  categoryBtnActive: {
    background: "var(--aqb-primary)",
    borderColor: "var(--aqb-primary)",
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--aqb-text-secondary)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    marginBottom: 8,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(48px, 1fr))",
    gap: 6,
    maxHeight: 280,
    overflow: "auto",
    padding: 4,
  },
  iconBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    border: "1px solid var(--aqb-border)",
    borderRadius: 8,
    background: "var(--aqb-bg-panel)",
    cursor: "pointer",
    transition: "all 0.15s ease",
    color: "var(--aqb-text)",
  },
  iconBtnHover: {
    background: "rgba(99, 102, 241, 0.1)",
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  iconBtnSelected: {
    border: "2px solid var(--aqb-primary)",
    background: "rgba(99, 102, 241, 0.15)",
  },
  preview: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: 16,
    background: "var(--aqb-bg-panel-secondary)",
    borderRadius: 8,
  },
  previewIcon: {
    width: 64,
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--aqb-bg-panel)",
    borderRadius: 8,
    border: "1px solid var(--aqb-border)",
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontWeight: 600,
    fontSize: 14,
    marginBottom: 4,
  },
  previewTags: {
    fontSize: 11,
    color: "var(--aqb-text-muted)",
  },
  controls: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  controlGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },
  controlLabel: {
    fontSize: 10,
    color: "var(--aqb-text-muted)",
    textTransform: "uppercase" as const,
  },
  sizeInput: {
    width: 60,
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid var(--aqb-border)",
    background: "var(--aqb-bg-panel)",
    color: "var(--aqb-text)",
    fontSize: 12,
    textAlign: "center" as const,
  },
  colorInput: {
    width: 40,
    height: 32,
    borderRadius: 6,
    border: "1px solid var(--aqb-border)",
    cursor: "pointer",
    padding: 2,
  },
  strokeInput: {
    width: 60,
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid var(--aqb-border)",
    background: "var(--aqb-bg-panel)",
    color: "var(--aqb-text)",
    fontSize: 12,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTop: "1px solid var(--aqb-border)",
  },
  noResults: {
    padding: 40,
    textAlign: "center" as const,
    color: "var(--aqb-text-muted)",
  },
};

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
  const [iconColor, setIconColor] = React.useState(currentIcon?.color || "#ffffff");
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
          setIconColor(currentIcon.color || "#ffffff");
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
    <Modal isOpen={isOpen} onClose={onClose} title="Select Icon" size="lg">
      <div style={styles.container}>
        {/* Header with icon count */}
        <div style={styles.header}>
          <span style={styles.iconCount}>{getIconCount()} icons available</span>
        </div>

        {/* Search */}
        <div style={styles.toolbar}>
          <div style={styles.searchInput}>
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
        <div style={styles.categories}>
          <button
            style={{
              ...styles.categoryBtn,
              ...(selectedCategory === "all" ? styles.categoryBtnActive : {}),
            }}
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
            }}
          >
            All
          </button>
          {ICON_CATEGORY_IDS.map((catId) => (
            <button
              key={catId}
              style={{
                ...styles.categoryBtn,
                ...(selectedCategory === catId ? styles.categoryBtnActive : {}),
              }}
              onClick={() => {
                setSelectedCategory(catId);
                setSearchQuery("");
              }}
            >
              {categoryLabels[catId] || catId}
            </button>
          ))}
        </div>

        {/* Recent Icons */}
        {!searchQuery && selectedCategory === "all" && recentIconDefs.length > 0 && (
          <div>
            <div style={styles.sectionTitle}>Recently Used</div>
            <div style={{ ...styles.grid, maxHeight: "none" }}>
              {recentIconDefs.map((icon) => (
                <button
                  key={`recent-${icon.name}`}
                  style={{
                    ...styles.iconBtn,
                    ...(selectedIcon?.name === icon.name ? styles.iconBtnSelected : {}),
                  }}
                  onClick={() => setSelectedIcon(icon)}
                  title={icon.name}
                >
                  {renderIcon(icon)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Icon Grid */}
        <div>
          {!searchQuery && selectedCategory === "all" && (
            <div style={styles.sectionTitle}>All Icons</div>
          )}
          {searchQuery && (
            <div style={styles.sectionTitle}>
              {filteredIcons.length} results for &quot;{searchQuery}&quot;
            </div>
          )}
          {filteredIcons.length > 0 ? (
            <div style={styles.grid}>
              {filteredIcons.map((icon) => (
                <button
                  key={icon.name}
                  style={{
                    ...styles.iconBtn,
                    ...(selectedIcon?.name === icon.name ? styles.iconBtnSelected : {}),
                  }}
                  onClick={() => setSelectedIcon(icon)}
                  title={icon.name}
                >
                  {renderIcon(icon)}
                </button>
              ))}
            </div>
          ) : (
            <div style={styles.noResults}>No icons found for &quot;{searchQuery}&quot;</div>
          )}
        </div>

        {/* Preview & Controls */}
        {selectedIcon && (
          <div style={styles.preview}>
            <div style={{ ...styles.previewIcon, color: iconColor }}>
              {renderIcon(selectedIcon, iconSize)}
            </div>
            <div style={styles.previewInfo}>
              <div style={styles.previewName}>{selectedIcon.name}</div>
              <div style={styles.previewTags}>{selectedIcon.tags.join(", ")}</div>
            </div>
            <div style={styles.controls}>
              <div style={styles.controlGroup}>
                <span style={styles.controlLabel}>Size</span>
                <input
                  type="number"
                  value={iconSize}
                  onChange={(e) => setIconSize(Math.max(12, Math.min(96, Number(e.target.value))))}
                  style={styles.sizeInput}
                  min={12}
                  max={96}
                />
              </div>
              <div style={styles.controlGroup}>
                <span style={styles.controlLabel}>Stroke</span>
                <input
                  type="number"
                  value={strokeWidth}
                  onChange={(e) =>
                    setStrokeWidth(Math.max(0.5, Math.min(4, Number(e.target.value))))
                  }
                  style={styles.strokeInput}
                  min={0.5}
                  max={4}
                  step={0.5}
                />
              </div>
              <div style={styles.controlGroup}>
                <span style={styles.controlLabel}>Color</span>
                <input
                  type="color"
                  value={iconColor}
                  onChange={(e) => setIconColor(e.target.value)}
                  style={styles.colorInput}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <span style={{ fontSize: 11, color: "var(--aqb-text-muted)" }}>
            Powered by Lucide Icons
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSelect} disabled={!selectedIcon}>
              Select Icon
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default IconPickerModal;
