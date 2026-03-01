/**
 * DesignSystemTab v11 — Colors / Type / Spacing
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
import { PanelErrorState } from "../../../editor/sidebar/shared/PanelErrorState";
import type { Composer } from "../../../engine/Composer";
import { EVENTS } from "../../../shared/constants/events";
import type { DesignTokenRecord } from "../../../shared/types/project";
import { useToast } from "../../../shared/ui/Toast";
import { DEFAULT_TOKENS } from "../constants";
import { useColorTokens } from "../state/useColorTokens";
import { useSpacingTokens } from "../state/useSpacingTokens";
import { useTypeTokens } from "../state/useTypeTokens";
import type { DesignToken } from "../types";
import {
  buildExport,
  downloadFile,
  generateColorTokenId,
  generateColorCssVar,
} from "../utils/exportUtils";
import type { ExportFormat } from "../utils/exportUtils";
import { ColorTokenList } from "./colors/ColorTokenList";
import { DesignTabFooter } from "./DesignTabFooter";
import { DraftChip } from "./DraftChip";
import { ExportDropdown } from "./ExportDropdown";
import { AddTokenModal } from "./modals/AddTokenModal";
import { ReviewModal } from "./modals/ReviewModal";
import { TabGuardModal } from "./modals/TabGuardModal";
import { SpacingTokenList } from "./spacing/SpacingTokenList";
import { TypeTokenList } from "./type/TypeTokenList";

// ─── Layout styles ────────────────────────────────────────────────────────────

const containerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "var(--aqb-surface-2)",
};

const tokenListStyles: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
  padding: 12,
};

// ─── Tab types ────────────────────────────────────────────────────────────────

type DesignTab = "colors" | "type" | "spacing";

const TABS: Array<{ id: DesignTab; label: string }> = [
  { id: "colors", label: "Colors" },
  { id: "type", label: "Type" },
  { id: "spacing", label: "Spacing" },
];

const SAVEABLE_CATEGORIES: DesignTokenRecord["category"][] = ["colors", "typography", "spacing"];

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
  const [isFirstLoad, setIsFirstLoad] = React.useState(false);

  const hasLoadedRef = React.useRef(false);

  // ─ Per-tab state hooks ─
  const colorState = useColorTokens(DEFAULT_TOKENS);
  const typeState = useTypeTokens(DEFAULT_TOKENS);
  const spacingState = useSpacingTokens(DEFAULT_TOKENS);

  // Accurate per-token dirty counts (not "1 per dirty hook")
  const colorDirtyCount = Object.keys(colorState.pendingDiff).length;
  const typeDirtyCount = typeState.tokens.filter((t) => {
    const saved = typeState.savedTokens.find((s) => s.id === t.id);
    return saved !== undefined && t.value !== saved.value;
  }).length;
  const spacingDirtyCount = spacingState.tokens.filter((t) => {
    const saved = spacingState.savedTokens.find((s) => s.id === t.id);
    return saved !== undefined && t.value !== saved.value;
  }).length;
  const totalDirty = colorDirtyCount + typeDirtyCount + spacingDirtyCount;
  const isDirty = totalDirty > 0;

  // Track isDirty in a ref so event handlers don't capture stale closures
  const isDirtyRef = React.useRef(isDirty);
  React.useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // Which tabs have unsaved changes
  const changedTabs = [
    colorDirtyCount > 0 ? "Colors" : null,
    typeDirtyCount > 0 ? "Type" : null,
    spacingDirtyCount > 0 ? "Spacing" : null,
  ].filter(Boolean) as string[];

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
        setIsFirstLoad(false);
      } else {
        setIsFirstLoad(true);
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

    // Multi-tab conflict: warn if dirty, reload if clean
    const handleSettingsChange = () => {
      if (isDirtyRef.current) {
        addToast({
          message: "Design tokens changed from another window. Your edits may conflict.",
          variant: "warning",
        });
      } else {
        loadFromComposer();
      }
    };

    // Resync after undo/redo operations
    const handleUndoRedo = () => loadFromComposer();

    composer.on(EVENTS.PROJECT_LOADED, handleProjectLoaded);
    composer.on(EVENTS.SETTINGS_CHANGE, handleSettingsChange);
    composer.on("undo:applied", handleUndoRedo);
    composer.on("redo:applied", handleUndoRedo);
    return () => {
      composer.off(EVENTS.PROJECT_LOADED, handleProjectLoaded);
      composer.off(EVENTS.SETTINGS_CHANGE, handleSettingsChange);
      composer.off("undo:applied", handleUndoRedo);
      composer.off("redo:applied", handleUndoRedo);
    };
  }, [composer, loadFromComposer, addToast]);

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
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const handleTabGuardKeep = () => {
    setShowTabGuard(false);
    setPendingTab(null);
  };

  const handleTabGuardSaveAndSwitch = () => {
    handleApply();
    setShowTabGuard(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  // ─ Apply ─
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
      setShowReview(false); // close modal on success
      setIsFirstLoad(false);
      addToast({ message: "Design tokens applied — changes live on canvas", variant: "success" });
    } catch {
      addToast({ message: "Failed to apply tokens. Try again.", variant: "error" });
    }
  };

  // ─ Discard with undo-able toast ─
  const handleDiscard = () => {
    // Capture unsaved values before discard so they can be restored
    const unsavedColors = colorState.tokens.filter((t) => colorState.pendingDiff[t.id]);
    const unsavedType = typeState.tokens.filter((t) => {
      const saved = typeState.savedTokens.find((s) => s.id === t.id);
      return saved !== undefined && t.value !== saved.value;
    });
    const unsavedSpacing = spacingState.tokens.filter((t) => {
      const saved = spacingState.savedTokens.find((s) => s.id === t.id);
      return saved !== undefined && t.value !== saved.value;
    });
    const count = totalDirty;

    colorState.discardAll();
    typeState.discardAll();
    spacingState.discardAll();

    addToast({
      message: `${count} change${count !== 1 ? "s" : ""} discarded`,
      variant: "info",
      action: {
        label: "Undo",
        onClick: () => {
          // Restore tokens only — savedTokens remain unchanged
          unsavedColors.forEach((t) => colorState.updateToken(t.id, t.value));
          unsavedType.forEach((t) => typeState.updateToken(t.id, t.value));
          unsavedSpacing.forEach((t) => spacingState.updateToken(t.id, t.value));
        },
      },
    });
  };

  // ─ Reset spacing to factory defaults ─
  const handleResetSpacingToDefaults = () => {
    spacingState.stageDefaults(DEFAULT_TOKENS);
    addToast({ message: "Spacing reset to defaults — review and Apply to save.", variant: "info" });
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
      id: generateColorTokenId(name),
      name,
      value: hex,
      category: "colors",
      cssVar: generateColorCssVar(name),
      type: "color",
      group: "brand",
    };
    colorState.addToken(newToken);
    setShowAddToken(false);
    addToast({ message: `Token "${name}" added`, variant: "success" });
  };

  const handleColorChange = (id: string, hex: string) => {
    colorState.updateToken(id, hex);
  };

  const tabTitle =
    activeTab === "colors"
      ? "Design · Colors"
      : activeTab === "type"
        ? "Design · Type"
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
        <h2
          style={{
            margin: 0,
            fontSize: "var(--aqb-text-md)",
            fontWeight: 600,
            color: "var(--aqb-text-primary)",
            whiteSpace: "nowrap",
          }}
        >
          {tabTitle}
        </h2>
        <div aria-live="polite" aria-atomic="true">
          <DraftChip state={isDirty ? "dirty" : "saved"} count={totalDirty} />
        </div>
        <div style={{ flex: 1 }} />
        <ExportDropdown
          onExport={handleExport}
          isDirty={isDirty}
          onSaveFirst={() => setShowReview(true)}
        />
        {onHelpClick && (
          <button onClick={onHelpClick} className="aqb-icon-btn" title="Help" aria-label="Help">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="8" cy="8" r="7" />
              <path d="M6 6a2 2 0 1 1 3.5 1.3c-.5.5-1.5 1-1.5 2" strokeLinecap="round" />
              <circle cx="8" cy="12" r="0.5" fill="currentColor" stroke="none" />
            </svg>
          </button>
        )}
        {onClose && (
          <button onClick={onClose} className="aqb-icon-btn" title="Close" aria-label="Close panel">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
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
        {TABS.map((tab) => {
          const isDirtyTab = changedTabs.includes(tab.label);
          return (
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
                borderBottom:
                  activeTab === tab.id ? "2px solid var(--aqb-primary)" : "2px solid transparent",
                transition: "color 0.15s, background 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {tab.label}
              {isDirtyTab && (
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "var(--aqb-accent-amber)",
                    flexShrink: 0,
                  }}
                  aria-label="unsaved changes"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Global scope reminder */}
      <div
        style={{
          padding: "5px 12px",
          fontSize: 10,
          color: "var(--aqb-text-muted)",
          background: "var(--aqb-surface-2)",
          borderBottom: "1px solid var(--aqb-border)",
          flexShrink: 0,
        }}
      >
        Changes here apply to every page on your site
      </div>

      {/* Content */}
      {error ? (
        <PanelErrorState
          message={error}
          onRetry={() => {
            setError(null);
            loadFromComposer();
          }}
        />
      ) : (
        <div style={{ ...tokenListStyles, flex: 1, overflowY: "auto" }}>
          {/* First-load onboarding banner */}
          {isFirstLoad && activeTab === "colors" && (
            <div
              style={{
                margin: "10px 10px 0",
                padding: "8px 12px",
                background: "rgba(124,109,250,0.07)",
                border: "1px solid rgba(124,109,250,0.2)",
                borderRadius: 8,
              }}
            >
              <span style={{ fontSize: 10, color: "rgba(124,109,250,0.9)", lineHeight: 1.6 }}>
                These are your site's default design tokens. Customize them and click{" "}
                <strong>Review &amp; Apply</strong> to go live.
              </span>
            </div>
          )}

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
              onUndo={typeState.undoToken}
              canUndo={typeState.canUndo}
              onRedo={typeState.redoToken}
              canRedo={typeState.canRedo}
            />
          )}
          {activeTab === "spacing" && (
            <SpacingTokenList
              tokens={spacingState.tokens}
              activePreset={spacingState.activePreset}
              savedPreset={spacingState.savedPreset}
              isDirty={spacingState.isDirty}
              onTokenChange={spacingState.updateToken}
              onPresetApply={spacingState.applyPreset}
              onResetToDefaults={handleResetSpacingToDefaults}
              onUndo={spacingState.undoToken}
              canUndo={spacingState.canUndo}
              onRedo={spacingState.redoToken}
              canRedo={spacingState.canRedo}
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
        <TabGuardModal
          changedTabs={changedTabs}
          onDiscard={handleTabGuardDiscard}
          onKeep={handleTabGuardKeep}
          onSaveAndSwitch={handleTabGuardSaveAndSwitch}
        />
      )}
      {showReview && (
        <ReviewModal
          colorTokens={colorState.tokens}
          colorDiff={colorState.pendingDiff}
          typeTokens={typeState.tokens}
          typeSavedTokens={typeState.savedTokens}
          spacingTokens={spacingState.tokens}
          spacingSavedTokens={spacingState.savedTokens}
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
