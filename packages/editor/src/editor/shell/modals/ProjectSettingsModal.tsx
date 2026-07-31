/**
 * ProjectSettingsModal - Modal for managing project-wide configurations
 * Allows users to update project name, canvas defaults, and SEO settings.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ModalClose, ModalContent, ModalFooter, ModalRoot, ModalTitle, Portal } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine";
import { useToast } from "@/editor/chrome-ui";
import { devError } from "../../../shared/utils/devLogger";
import { Button, Checkbox, TextInput } from "@/editor/chrome-ui";

export interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  composer: Composer | null;
}

type TabId = "general" | "canvas" | "seo";

// Capitalising the id gave "Seo". SEO is an initialism everywhere else in the
// product (Settings › SEO), so the label is explicit (Figma board B9.6).
const TAB_LABELS: Record<TabId, string> = {
  general: "General",
  canvas: "Canvas",
  seo: "SEO",
};

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  composer,
}) => {
  const [activeTab, setActiveTab] = React.useState<TabId>("general");
  const { addToast } = useToast();

  // Form State
  const [projectName, setProjectName] = React.useState("");
  const [projectDescription, setProjectDescription] = React.useState("");
  const [gridSize, setGridSize] = React.useState(10);
  const [snapToGrid, setSnapToGrid] = React.useState(false);
  const [siteTitle, setSiteTitle] = React.useState("");

  // Initialize form when opening
  React.useEffect(() => {
    if (isOpen && composer) {
      const metadata = composer.getProjectMetadata();
      const settings = composer.getProjectSettings?.() || {};
      const state = composer.getState();

      setProjectName(metadata.name || "Untitled Project");
      setProjectDescription(metadata.author || "");
      setGridSize(state.gridSize || 10);
      setSnapToGrid(state.snapToGrid || false);
      setSiteTitle(settings.seo?.siteName || "");
    }
  }, [isOpen, composer]);

  const handleSave = () => {
    if (!composer) return;

    try {
      // Update metadata
      composer.updateProjectMetadata?.({
        name: projectName.trim(),
        author: projectDescription.trim(),
      });

      // Update canvas settings
      composer.setGridSize?.(gridSize);
      composer.setSnapToGrid?.(snapToGrid);

      // Update project settings (SEO)
      const settings = composer.getProjectSettings?.() || {};
      composer.setProjectSettings?.({
        ...settings,
        seo: {
          ...settings.seo,
          siteName: siteTitle.trim(),
        },
      });

      addToast({ description: "Project settings updated successfully", tone: "success" });
      onClose();
    } catch (error) {
      addToast({ description: "Failed to update project settings", tone: "error" });
      devError("ProjectSettingsModal", "Failed to update settings", error);
    }
  };

  return (
    <Portal>
      <ModalRoot open={isOpen} onOpenChange={(next) => !next && onClose()}>
        <ModalContent size="lg">
          <ModalTitle>Project settings</ModalTitle>
          <ModalClose aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </ModalClose>
          <div className="bd-modal__body">
      <div style={containerStyles}>
        {/* Tabs */}
        <div style={tabBarStyles}>
          {(["general", "canvas", "seo"] as const).map((tab) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...tabButtonStyles,
                borderBottomColor: activeTab === tab ? "var(--bk-accent)" : "transparent",
                color: activeTab === tab ? "var(--bk-ink)" : "var(--bk-ink-muted)",
              }}
            >
              {TAB_LABELS[tab]}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={contentStyles}>
          {activeTab === "general" && (
            <div className="tw:flex tw:flex-col tw:gap-3">
              <label style={labelStyles}>Project name</label>
              <TextInput
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                style={inputStyles}
                placeholder="My Awesome Project"
              />

              <label style={labelStyles}>Author / description</label>
              <TextInput
                type="text"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                style={inputStyles}
                placeholder="John Doe"
              />
            </div>
          )}

          {activeTab === "canvas" && (
            <div className="tw:flex tw:flex-col tw:gap-3">
              <label style={labelStyles}>Grid size (px)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TextInput
                  type="number"
                  value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
                  style={{ ...inputStyles, width: 80 }}
                  min={1}
                  max={100}
                />
                <span style={{ fontSize: 12, color: "var(--bk-ink-muted)" }}>
                  Width / height in pixels
                </span>
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={checkboxLabelStyles}>
                  <Checkbox
                    color="blue"
                    className="tw:bg-white"
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                    style={checkboxStyles} />
                  <span>Snap to grid</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === "seo" && (
            <div className="tw:flex tw:flex-col tw:gap-3">
              <label style={labelStyles}>Site name (SEO default)</label>
              <TextInput
                type="text"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                style={inputStyles}
                placeholder="The formal name of your website"
              />
              <small style={hintStyles}>
                This will be used as the default title for your site if not overridden on individual
                pages.
              </small>
            </div>
          )}
        </div>
      </div>
          </div>
          <ModalFooter>
            <Button color="light" onClick={onClose} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalRoot>
    </Portal>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const containerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minHeight: 300,
};

const tabBarStyles: React.CSSProperties = {
  display: "flex",
  gap: 20,
  borderBottom: "1px solid var(--bk-border)",
  marginBottom: 20,
};

const tabButtonStyles: React.CSSProperties = {
  background: "none",
  border: "none",
  borderBottom: "2px solid transparent",
  padding: "8px 0",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const contentStyles: React.CSSProperties = {
  flex: 1,
};

const labelStyles: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--bk-ink-soft)",
  marginBottom: 4,
};

const inputStyles: React.CSSProperties = {
  padding: "8px 12px",
  // was --buildrick-surface-3, which is defined nowhere — the field rendered
  // with no background at all on the light theme (Figma board B9.6).
  background: "var(--bk-bg-card)",
  border: "1px solid var(--bk-border)",
  borderRadius: "var(--bk-radius-sm)",
  color: "var(--bk-ink)",
  fontSize: 13,
};

const checkboxLabelStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  cursor: "pointer",
};

const checkboxStyles: React.CSSProperties = {
  width: 16,
  height: 16,
};

const hintStyles: React.CSSProperties = {
  fontSize: 12,
  color: "var(--bk-ink-muted)",
  marginTop: 4,
};

export default ProjectSettingsModal;
