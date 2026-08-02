/**
 * ProjectSettingsModal - Modal for managing project-wide configurations
 * Allows users to update project name, canvas defaults, and SEO settings.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Checkbox, ModalBody, ModalClose, ModalContent, ModalFooter, ModalRoot, ModalTitle, TextInput, useToast } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine";
import { devError } from "../../../shared/utils/devLogger";

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
    <ModalRoot open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <ModalContent size="lg">
        <ModalTitle>Project settings</ModalTitle>
        <ModalClose aria-label="Close modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </ModalClose>
        <ModalBody>
    <div className="tw:flex tw:flex-col tw:min-h-75">
      {/* Tabs */}
      <div className="tw:flex tw:gap-5 tw:mb-5 tw:border-b tw:border-gray-200">
        {(["general", "canvas", "seo"] as const).map((tab) => (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${TAB_BTN} ${
              activeTab === tab
                ? "tw:border-b-blue-700 tw:text-gray-900"
                : "tw:border-b-transparent tw:text-gray-500 tw:hover:text-gray-900"
            }`}
          >
            {TAB_LABELS[tab]}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tw:flex-1">
        {activeTab === "general" && (
          <div className="tw:flex tw:flex-col tw:gap-3">
            <label className={FIELD_LABEL}>Project name</label>
            <TextInput
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Awesome Project"
            />

            <label className={FIELD_LABEL}>Author / description</label>
            <TextInput
              type="text"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="John Doe"
            />
          </div>
        )}

        {activeTab === "canvas" && (
          <div className="tw:flex tw:flex-col tw:gap-3">
            <label className={FIELD_LABEL}>Grid size (px)</label>
            <div className="tw:flex tw:items-center tw:gap-2">
              <TextInput
                type="number"
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="tw:w-20"
                min={1}
                max={100}
              />
              <span className="tw:text-xs tw:text-gray-500">
                Width / height in pixels
              </span>
            </div>

            <div className="tw:mt-4">
              <label className="tw:flex tw:items-center tw:gap-2 tw:text-[13px] tw:cursor-pointer">
                <Checkbox
                  color="blue"
                  className="tw:bg-white tw:size-4"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                />
                <span>Snap to grid</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === "seo" && (
          <div className="tw:flex tw:flex-col tw:gap-3">
            <label className={FIELD_LABEL}>Site name (SEO default)</label>
            <TextInput
              type="text"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              placeholder="The formal name of your website"
            />
            <small className={HINT}>
              This will be used as the default title for your site if not overridden on individual
              pages.
            </small>
          </div>
        )}
      </div>
    </div>
        </ModalBody>
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
  );
};

// ============================================================================
// CLASSES
// ============================================================================

const TAB_BTN =
  "tw:px-0 tw:py-2 tw:rounded-none tw:border-0 tw:border-b-2 tw:bg-transparent " +
  "tw:text-[13px] tw:font-semibold";
const FIELD_LABEL = "tw:mb-1 tw:text-xs tw:font-semibold tw:text-[var(--bk-ink-soft)]";
const HINT = "tw:mt-1 tw:text-xs tw:text-gray-500";

export default ProjectSettingsModal;
