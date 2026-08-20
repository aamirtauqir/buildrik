/**
 * ProjectSettingsModal - Modal for managing project-wide configurations
 * Allows users to update project name, canvas defaults, and SEO settings.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Checkbox, ModalBody, ModalClose, ModalContent, ModalFooter, ModalRoot, ModalTitle, Tabs, TextInput, useToast } from "@/editor/chrome-ui";
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
const TABS: { id: TabId; label: string }[] = [
  { id: "general", label: "General" },
  { id: "canvas", label: "Canvas" },
  { id: "seo", label: "SEO" },
];

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
      {/* The tab row was three `Button`s in a flex div — no `role="tablist"`,
          no `role="tab"`, no arrow keys, so a screen reader read it as three
          unrelated buttons and could not say which was current. `Tabs` is the
          primitive that owns that contract (and the board's tinted pill). */}
      <Tabs
        label="Project settings sections"
        tabs={TABS}
        value={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
        className="tw:mb-5 tw:px-0"
      />

      {/* Tab Content */}
      <div className="tw:flex-1">
        {activeTab === "general" && (
          <div className="tw:flex tw:flex-col tw:gap-3">
            <label className={FIELD_LABEL} htmlFor="ps-name">Project name</label>
            <TextInput
              id="ps-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Awesome Project"
            />

            <label className={FIELD_LABEL} htmlFor="ps-author">Author / description</label>
            <TextInput
              id="ps-author"
              type="text"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="John Doe"
            />
          </div>
        )}

        {activeTab === "canvas" && (
          <div className="tw:flex tw:flex-col tw:gap-3">
            <label className={FIELD_LABEL} htmlFor="ps-grid">Grid size (px)</label>
            <div className="tw:flex tw:items-center tw:gap-2">
              <TextInput
                id="ps-grid"
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
            <label className={FIELD_LABEL} htmlFor="ps-seo-name">Site name (social sharing)</label>
            <TextInput
              id="ps-seo-name"
              type="text"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              placeholder="The formal name of your website"
            />
            {/* Said this was "the default title for your site if not overridden
                on individual pages". It never is: a page's title resolves as
                meta title → page settings title → page name (SEOInjector's
                resolvePageTitle), and every page has a name, so the fallback
                this promised cannot be reached. Read off a real export: the
                site name was set to "Bella Cucina" and the document came back
                <title>Home</title> with og:site_name="Bella Cucina". */}
            <small className={HINT}>
              The name of the site itself, sent as <code>og:site_name</code>{" "}
              when a page is shared. Page titles come from each page&apos;s own SEO settings.
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
          <Button onClick={handleSave}>Save</Button>
        </ModalFooter>
      </ModalContent>
    </ModalRoot>
  );
};

// ============================================================================
// CLASSES
// ============================================================================

// The board sets field labels in the DS's micro-label type — 11px, medium,
// .08em caps, gray-500 — the same style `SectionHeader` carries. They were
// 12px semibold sentence-case in `--bk-ink-soft`, which read as a second
// heading rank instead of a label.
const FIELD_LABEL =
  "tw:mb-1 tw:text-[11px] tw:font-medium tw:tracking-[0.08em] tw:uppercase tw:text-gray-500";
const HINT = "tw:mt-1 tw:text-xs tw:text-gray-500";

export default ProjectSettingsModal;
