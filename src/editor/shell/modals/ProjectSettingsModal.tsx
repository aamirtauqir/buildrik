/**
 * ProjectSettingsModal - Modal for managing project-wide configurations
 * Allows users to update project name, canvas defaults, and SEO settings.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { Button } from "../../../shared/ui/Button";
import { Modal } from "../../../shared/ui/Modal";
import { useToast } from "../../../shared/ui/Toast";
import { devError } from "../../../shared/utils/devLogger";

export interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  composer: Composer | null;
}

type TabId = "general" | "canvas" | "seo";

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

      addToast({ message: "Project settings updated successfully", variant: "success" });
      onClose();
    } catch (error) {
      addToast({ message: "Failed to update project settings", variant: "error" });
      devError("ProjectSettingsModal", "Failed to update settings", error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Project Settings"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </>
      }
    >
      <div style={containerStyles}>
        {/* Tabs */}
        <div style={tabBarStyles}>
          {(["general", "canvas", "seo"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...tabButtonStyles,
                borderBottomColor: activeTab === tab ? "var(--aqb-primary)" : "transparent",
                color: activeTab === tab ? "var(--aqb-text-primary)" : "var(--aqb-text-muted)",
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={contentStyles}>
          {activeTab === "general" && (
            <div style={formGroupStyles}>
              <label style={labelStyles}>Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                style={inputStyles}
                placeholder="My Awesome Project"
              />

              <label style={labelStyles}>Author / Description</label>
              <input
                type="text"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                style={inputStyles}
                placeholder="John Doe"
              />
            </div>
          )}

          {activeTab === "canvas" && (
            <div style={formGroupStyles}>
              <label style={labelStyles}>Grid Size (px)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="number"
                  value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
                  style={{ ...inputStyles, width: 80 }}
                  min={1}
                  max={100}
                />
                <span style={{ fontSize: 12, color: "var(--aqb-text-muted)" }}>
                  Width/Height in pixels
                </span>
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={checkboxLabelStyles}>
                  <input
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                    style={checkboxStyles}
                  />
                  <span>Snap to Grid</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === "seo" && (
            <div style={formGroupStyles}>
              <label style={labelStyles}>Site Name (SEO Default)</label>
              <input
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
    </Modal>
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
  borderBottom: "1px solid var(--aqb-border-subtle)",
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

const formGroupStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const labelStyles: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--aqb-text-secondary)",
  marginBottom: 4,
};

const inputStyles: React.CSSProperties = {
  padding: "8px 12px",
  background: "var(--aqb-surface-3)",
  border: "1px solid var(--aqb-border)",
  borderRadius: 6,
  color: "var(--aqb-text-primary)",
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
  fontSize: 11,
  color: "var(--aqb-text-muted)",
  marginTop: 4,
};

export default ProjectSettingsModal;
