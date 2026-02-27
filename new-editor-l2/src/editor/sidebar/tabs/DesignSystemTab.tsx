/**
 * DesignSystemTab v10 — Colors / Type / Spacing
 * 3-tab shell + state controller. The only component that reads/writes Composer.
 *
 * Data flow:
 *   Composer load → reset*Tokens hooks → child lists render
 *   Child change  → hook updates local state + live preview on :root
 *   Apply         → Composer.setProjectSettings → markSaved in hooks
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine/Composer";
import { EVENTS } from "../../../shared/constants/events";
import { useToast } from "../../../shared/ui/Toast";
import { PanelErrorState } from "../shared/PanelErrorState";
import { DEFAULT_TOKENS, containerStyles, tokenListStyles } from "./design";
import { ColorTokenList } from "./design/ColorTokenList";
import { TypeTokenList } from "./design/TypeTokenList";
import { SpacingTokenList } from "./design/SpacingTokenList";
import { useColorTokens } from "./design/useColorTokens";
import { useTypeTokens } from "./design/useTypeTokens";
import { useSpacingTokens } from "./design/useSpacingTokens";
import type { DesignToken } from "./design";
import type { DesignTokenRecord } from "../../../shared/types/project";
import {
  DraftChip,
  ExportDropdown,
  TabGuardModal,
  AddTokenModal,
  ReviewModal,
  DesignTabFooter,
  buildExport,
  downloadFile,
} from "./DesignSystemTabParts";
import type { ExportFormat } from "./DesignSystemTabParts";

// ─── Tab types ────────────────────────────────────────────────────────────────

type DesignTab = "colors" | "type" | "spacing";

const TABS: Array<{ id: DesignTab; label: string }> = [
  { id: "colors",  label: "Colors" },
  { id: "type",    label: "Type" },
  { id: "spacing", label: "Spacing" },
];

const SAVEABLE_CATEGORIES: DesignTokenRecord["category"][] = [
  "colors", "typography", "spacing", "effects", "layout", "icons", "buttons", "forms",
];

// ─── DesignSystemTab ──────────────────────────────────────────────────────────

interface DesignSystemTabProps {
  composer: Composer | null;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
}

export const DesignSystemTab: React.FC<DesignSystemTabProps> = ({
  composer,
  isPinned: _isPinned,
  onPinToggle: _onPinToggle,
  onHelpClick,
  onClose,
}) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = React.useState<DesignTab>("colors");
  const [pendingTab, setPendingTab] = React.useState<DesignTab | null>(null);
  const [showTabGuard, setShowTabGuard] = React.useState(false);
  const [showReview, setShowReview] = React.useState(false);
  const [showAddToken, setShowAddToken] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const hasLoadedRef = React.useRef(false);

  // ─ Per-tab state hooks ─
  const colorState = useColorTokens(DEFAULT_TOKENS);
  const typeState = useTypeTokens(DEFAULT_TOKENS);
  const spacingState = useSpacingTokens(DEFAULT_TOKENS);

  const totalDirty =
    Object.keys(colorState.pendingDiff).length +
    (typeState.isDirty ? 1 : 0) +
    (spacingState.isDirty ? 1 : 0);
  const isDirty = totalDirty > 0;

  // ─ Load from Composer ─
  const loadFromComposer = React.useCallback(() => {
    if (!composer) return;
    try {
      const settings = composer.getProjectSettings();
      if (settings.designTokens && settings.designTokens.length > 0) {
        const merged = DEFAULT_TOKENS.map((def) => {
          const saved = settings.designTokens?.find((t) => t.name === def.name);
          return saved ? { ...def, value: saved.value } : def;
        });
        colorState.resetFromSaved(merged);
        typeState.resetFromSaved(merged);
        spacingState.resetFromSaved(merged);
        hasLoadedRef.current = true;
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load design tokens");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composer]);

  React.useEffect(() => {
    if (!composer) return;
    loadFromComposer();

    const handleProjectLoaded = () => {
      if (!hasLoadedRef.current) loadFromComposer();
    };

    composer.on(EVENTS.PROJECT_LOADED, handleProjectLoaded);
    composer.on(EVENTS.SETTINGS_CHANGE, loadFromComposer);
    return () => {
      composer.off(EVENTS.PROJECT_LOADED, handleProjectLoaded);
      composer.off(EVENTS.SETTINGS_CHANGE, loadFromComposer);
    };
  }, [composer, loadFromComposer]);

  // ─ Tab switching with guard ─
  const handleTabClick = (tab: DesignTab) => {
    if (tab === activeTab) return;
    if (isDirty) {
      setPendingTab(tab);
      setShowTabGuard(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleTabGuardDiscard = () => {
    colorState.discardAll();
    typeState.discardAll();
    spacingState.discardAll();
    setShowTabGuard(false);
    if (pendingTab) { setActiveTab(pendingTab); setPendingTab(null); }
  };

  const handleTabGuardKeep = () => {
    setShowTabGuard(false);
    setPendingTab(null);
  };

  // ─ Apply / Discard ─
  const handleApply = () => {
    if (!composer) return;
    const allTokens: DesignToken[] = [
      ...colorState.tokens,
      ...typeState.tokens,
      ...spacingState.tokens,
    ];
    const tokenRecords: DesignTokenRecord[] = allTokens
      .filter((t): t is DesignToken & { category: DesignTokenRecord["category"] } =>
        (SAVEABLE_CATEGORIES as string[]).includes(t.category)
      )
      .map((t) => ({ name: t.name, value: t.value, category: t.category }));

    try {
      const current = composer.getProjectSettings();
      composer.setProjectSettings({ ...current, designTokens: tokenRecords });
      colorState.markSaved();
      typeState.markSaved();
      spacingState.markSaved();
      composer.emit("tokens:applied", { tokens: tokenRecords });
      addToast({ message: "Design tokens applied", variant: "success" });
    } catch {
      addToast({ message: "Failed to apply tokens. Try again.", variant: "error" });
    }
    setShowReview(false);
  };

  const handleDiscard = () => {
    colorState.discardAll();
    typeState.discardAll();
    spacingState.discardAll();
    addToast({ message: "Changes discarded", variant: "info" });
  };

  // ─ Export ─
  const handleExport = (format: ExportFormat) => {
    const allTokens: DesignToken[] = [
      ...colorState.tokens,
      ...typeState.tokens,
      ...spacingState.tokens,
    ];
    const { content, filename } = buildExport(allTokens, format);
    downloadFile(content, filename);
    addToast({ message: `Exported ${filename}`, variant: "success" });
  };

  // ─ Add token ─
  const handleAddToken = (name: string, hex: string) => {
    const newToken: DesignToken = {
      id: `color-${name.toLowerCase().replace(/\s+/g, "-")}`,
      name,
      value: hex,
      category: "colors",
      cssVar: `--aqb-color-${name.toLowerCase().replace(/\s+/g, "-")}`,
      type: "color",
      group: "brand",
    };
    colorState.updateToken(newToken.id, hex);
    setShowAddToken(false);
    addToast({ message: `Token "${name}" added`, variant: "success" });
  };

  // ─ Emit on color change ─
  const handleColorChange = (id: string, hex: string) => {
    const token = colorState.tokens.find((t) => t.id === id);
    colorState.updateToken(id, hex);
    if (token) {
      composer?.emit("token:changed", { tokenId: id, previousValue: token.value, newValue: hex });
    }
  };

  const tabTitle =
    activeTab === "colors" ? "Design · Colors"
    : activeTab === "type" ? "Design · Type"
    : "Design · Spacing";

  return (
    <div style={{ ...containerStyles, position: "relative" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 48,
          minHeight: 48,
          padding: "0 10px 0 12px",
          borderBottom: "1px solid var(--aqb-border)",
          background: "var(--aqb-surface-2)",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <h2 style={{ margin: 0, fontSize: "var(--aqb-text-md)", fontWeight: 600, color: "var(--aqb-text-primary)", whiteSpace: "nowrap" }}>
          {tabTitle}
        </h2>
        <DraftChip state={isDirty ? "dirty" : "saved"} count={totalDirty} />
        <div style={{ flex: 1 }} />
        <ExportDropdown onExport={handleExport} />
        {onHelpClick && (
          <button onClick={onHelpClick} className="aqb-icon-btn" title="Help" aria-label="Help">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="7" />
              <path d="M6 6a2 2 0 1 1 3.5 1.3c-.5.5-1.5 1-1.5 2" strokeLinecap="round" />
              <circle cx="8" cy="12" r="0.5" fill="currentColor" stroke="none" />
            </svg>
          </button>
        )}
        {onClose && (
          <button onClick={onClose} className="aqb-icon-btn" title="Close" aria-label="Close panel">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </header>

      {/* Tab switcher */}
      <div
        style={{
          display: "flex",
          padding: "8px 12px 0",
          gap: 2,
          borderBottom: "1px solid var(--aqb-border)",
          background: "var(--aqb-surface-2)",
          flexShrink: 0,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            style={{
              padding: "6px 14px",
              borderRadius: "6px 6px 0 0",
              border: "none",
              background: activeTab === tab.id ? "var(--aqb-surface-3)" : "transparent",
              color: activeTab === tab.id ? "var(--aqb-text-primary)" : "var(--aqb-text-muted)",
              fontSize: 12,
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: "pointer",
              borderBottom: activeTab === tab.id ? "2px solid var(--aqb-primary)" : "2px solid transparent",
              transition: "color 0.15s, background 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {error ? (
        <PanelErrorState
          message={error}
          onRetry={() => { setError(null); loadFromComposer(); }}
        />
      ) : (
        <div style={{ ...tokenListStyles, flex: 1, overflowY: "auto" }}>
          {activeTab === "colors" && (
            <ColorTokenList
              tokens={colorState.tokens}
              pendingDiff={colorState.pendingDiff}
              onColorChange={handleColorChange}
              onUndo={colorState.undoToken}
              onRedo={colorState.redoToken}
              canUndo={colorState.canUndo}
              canRedo={colorState.canRedo}
              onAddToken={() => setShowAddToken(true)}
            />
          )}
          {activeTab === "type" && (
            <TypeTokenList
              tokens={typeState.tokens}
              responsiveMode={typeState.responsiveMode}
              onTokenChange={typeState.updateToken}
              onResponsiveModeChange={typeState.setResponsiveMode}
            />
          )}
          {activeTab === "spacing" && (
            <SpacingTokenList
              tokens={spacingState.tokens}
              activePreset={spacingState.activePreset}
              onTokenChange={spacingState.updateToken}
              onPresetApply={spacingState.applyPreset}
            />
          )}
        </div>
      )}

      {/* Footer */}
      <DesignTabFooter
        isDirty={isDirty}
        dirtyCount={totalDirty}
        onDiscard={handleDiscard}
        onReview={() => setShowReview(true)}
      />

      {/* Modals */}
      {showTabGuard && (
        <TabGuardModal onDiscard={handleTabGuardDiscard} onKeep={handleTabGuardKeep} />
      )}
      {showReview && (
        <ReviewModal
          colorTokens={colorState.tokens}
          colorDiff={colorState.pendingDiff}
          onConfirm={handleApply}
          onClose={() => setShowReview(false)}
        />
      )}
      {showAddToken && (
        <AddTokenModal
          existingIds={colorState.tokens.map((t) => t.id)}
          onAdd={handleAddToken}
          onClose={() => setShowAddToken(false)}
        />
      )}
    </div>
  );
};

export default DesignSystemTab;
