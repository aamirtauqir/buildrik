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
import { PanelHeader } from "@/shared/extensions/PanelHeader";
import { PanelErrorState } from "../../../editor/sidebar/shared/PanelErrorState";
import type { Composer } from "../../../engine/Composer";
import { EVENTS } from "../../../shared/constants/events";
import type { DesignTokenRecord } from "../../../shared/types/project";
import { useToast } from "@/editor/shared/vibcoder";
import { DEFAULT_TOKENS } from "../constants";
import { useColorRegistry, useSpacingRegistry, useTypeRegistry, useRegistryConfig } from "../state/TokenRegistryContext";
import { useTokenUsageMap } from "../state/useTokenUsageMap";
import type { DesignToken } from "../types";
import { CURRENT_SCHEMA_VERSION, migrateDesignTokens } from "../migrations";
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
import { DSLintMount } from "./DSLintMount";
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
  background: "var(--bd-bg-subtle)",
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
  isPinned,
  onPinToggle,
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

  // ─ Token usage scan — bumps on element/style mutations, recomputes Map<tokenId, Set<elementId>> ─
  const [usageVersion, setUsageVersion] = React.useState(0);
  const usageMap = useTokenUsageMap(composer, usageVersion);
  const totalUsageCount = React.useMemo(() => {
    let n = 0;
    for (const set of usageMap.values()) n += set.size;
    return n;
  }, [usageMap]);

  // ─ Per-tab state hooks — from shared registry (not isolated instances) ─
  const colorState = useColorRegistry();
  const typeState = useTypeRegistry();
  const spacingState = useSpacingRegistry();
  const { persistAll } = useRegistryConfig();

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
      const storedVersion = settings.designTokensSchemaVersion ?? 1;

      if (storedVersion > CURRENT_SCHEMA_VERSION) {
        console.warn(
          `project was saved with designTokensSchemaVersion=${storedVersion} ` +
          `(editor supports up to ${CURRENT_SCHEMA_VERSION}); loading tokens as-is`
        );
      }

      if (settings.designTokens && settings.designTokens.length > 0) {
        let incoming = settings.designTokens;
        if (storedVersion < CURRENT_SCHEMA_VERSION) {
          incoming = migrateDesignTokens(incoming, storedVersion, CURRENT_SCHEMA_VERSION);
        }
        const merged = DEFAULT_TOKENS.map((def) => {
          // Look up by id first (new format), fall back to name (legacy records)
          const saved = incoming.find((t) =>
            t.id ? t.id === def.id : t.name === def.name
          );
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
          description: "Design tokens changed from another window. Your edits may conflict.",
          tone: "warning",
        });
      } else {
        loadFromComposer();
      }
    };

    // Resync after undo/redo operations
    const handleUndoRedo = () => loadFromComposer();

    // Bump usageVersion when elements or styles change so useTokenUsageMap rescans
    const bumpUsage = () => setUsageVersion((v) => v + 1);

    composer.on(EVENTS.PROJECT_LOADED, handleProjectLoaded);
    composer.on(EVENTS.SETTINGS_CHANGE, handleSettingsChange);
    composer.on("undo:applied", handleUndoRedo);
    composer.on("redo:applied", handleUndoRedo);
    composer.on(EVENTS.ELEMENT_CREATED, bumpUsage);
    composer.on(EVENTS.ELEMENT_UPDATED, bumpUsage);
    composer.on(EVENTS.ELEMENT_DELETED, bumpUsage);
    composer.on(EVENTS.STYLE_CHANGED, bumpUsage);
    composer.on(EVENTS.STYLE_APPLIED, bumpUsage);
    return () => {
      composer.off(EVENTS.PROJECT_LOADED, handleProjectLoaded);
      composer.off(EVENTS.SETTINGS_CHANGE, handleSettingsChange);
      composer.off("undo:applied", handleUndoRedo);
      composer.off("redo:applied", handleUndoRedo);
      composer.off(EVENTS.ELEMENT_CREATED, bumpUsage);
      composer.off(EVENTS.ELEMENT_UPDATED, bumpUsage);
      composer.off(EVENTS.ELEMENT_DELETED, bumpUsage);
      composer.off(EVENTS.STYLE_CHANGED, bumpUsage);
      composer.off(EVENTS.STYLE_APPLIED, bumpUsage);
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
      .map((t) => ({
        id: t.id,
        name: t.name,
        value: t.value,
        cssVar: t.cssVar,
        category: t.category,
        type: t.type,
        group: t.group,
      }));

    try {
      const current = composer.getProjectSettings();
      composer.setProjectSettings({
        ...current,
        designTokens: tokenRecords,
        designTokensSchemaVersion: CURRENT_SCHEMA_VERSION,
      });
      // CP2: persist to localStorage so tokens survive page reload
      persistAll();
      colorState.markSaved();
      typeState.markSaved();
      spacingState.markSaved();
      setShowReview(false); // close modal on success
      setIsFirstLoad(false);
      addToast({ description: "Design tokens applied successfully", tone: "success" });
    } catch {
      addToast({ description: "Failed to apply tokens. Try again.", tone: "error" });
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
      description: `${count} change${count !== 1 ? "s" : ""} discarded`,
      tone: "info",
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
    addToast({ description: "Spacing reset to defaults — review and Apply to save.", tone: "info" });
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
    addToast({ description: `Exported ${filename}`, tone: "success" });
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
    addToast({ description: `Token "${name}" added`, tone: "success" });
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
      <PanelHeader
        title={tabTitle}
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      >
        <div aria-live="polite" aria-atomic="true" style={{ marginRight: 4 }}>
          <DraftChip state={isDirty ? "dirty" : "saved"} count={totalDirty} />
        </div>
        <ExportDropdown
          onExport={handleExport}
          isDirty={isDirty}
          onSaveFirst={() => setShowReview(true)}
        />
      </PanelHeader>

      {/* Lint banner — surfaces DS rule violations across all token registries.
          Hidden when no issues; debounced 500ms per spec D21. */}
      <DSLintMount composer={composer} />

      {/* Tab switcher */}
      <div
        style={{
          display: "flex",
          padding: "8px 12px 0",
          gap: 2,
          borderBottom: "1px solid var(--bd-border)",
          background: "var(--bd-bg-subtle)",
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
                height: 36,
                padding: "0 12px",
                borderRadius: "6px 6px 0 0",
                border: "none",
                background: "transparent",
                color: activeTab === tab.id ? "var(--bd-fg-primary)" : "var(--bd-fg-muted)",
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 500 : 400,
                cursor: "pointer",
                borderBottom:
                  activeTab === tab.id ? "2px solid var(--bd-accent)" : "2px solid transparent",
                transition: "color 0.15s",
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
                    background: "var(--bd-warning)",
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
          fontSize: 12,
          color: "var(--bd-fg-muted)",
          background: "var(--bd-bg-subtle)",
          borderBottom: "1px solid var(--bd-border)",
          flexShrink: 0,
        }}
      >
        Changes here apply to every page on your site
        {totalUsageCount > 0 && (
          <span style={{ marginLeft: 6, color: "var(--bd-fg-muted, var(--bd-fg-muted))" }}>
            · {totalUsageCount} token binding{totalUsageCount === 1 ? "" : "s"} in use
          </span>
        )}
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
              <span style={{ fontSize: 12, color: "rgba(124,109,250,0.9)", lineHeight: 1.6 }}>
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
