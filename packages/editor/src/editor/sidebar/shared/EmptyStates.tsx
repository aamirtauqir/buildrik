import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * EmptyStates — Per-tab empty state components
 * Each empty state has: icon, title, message, primary action.
 * Styles: EmptyStates.css (ls-* light theme tokens)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Plus, Image, Layers, FileText, Diamond, Clock, LayoutGrid } from "lucide-react";
import "./EmptyStates.css";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, actionLabel, onAction }) => (
  <div className="empty-container">
    <div className="empty-icon">{icon}</div>
    <h3 className="empty-title">{title}</h3>
    <p className="empty-message">{message}</p>
    {actionLabel && onAction && (
      <Button className="empty-action" onClick={onAction}>{actionLabel}</Button>
    )}
  </div>
);

/** Add tab: no blocks on canvas */
export const AddEmpty: React.FC<{ onBrowseBlocks?: () => void }> = ({ onBrowseBlocks }) => (
  <EmptyState
    icon={<Plus size={24} />}
    title="Start building"
    message="Drag blocks from the catalog to your canvas, or use AI to generate a section."
    actionLabel="Browse blocks"
    onAction={onBrowseBlocks}
  />
);

/** Layers tab: empty canvas */
export const LayersEmpty: React.FC<{ onAddBlock?: () => void }> = ({ onAddBlock }) => (
  <EmptyState
    icon={<Layers size={24} />}
    title="No layers yet"
    message="Add elements to your page and they'll appear here as a visual tree."
    actionLabel="Add elements"
    onAction={onAddBlock}
  />
);

/** Pages tab: single page (no additional pages) */
export const PagesEmpty: React.FC<{ onAddPage?: () => void }> = ({ onAddPage }) => (
  <EmptyState
    icon={<FileText size={24} />}
    title="Just one page"
    message="Your site has a single page. Add more pages to build a multi-page site."
    actionLabel="Add page"
    onAction={onAddPage}
  />
);

/** Media tab: no uploads */
export const MediaEmpty: React.FC<{ onUpload?: () => void }> = ({ onUpload }) => (
  <EmptyState
    icon={<Image size={24} />}
    title="No media yet"
    message="Upload images, videos, icons, and fonts to use in your designs."
    actionLabel="Upload files"
    onAction={onUpload}
  />
);

/** Components tab: no saved components */
export const ComponentsEmpty: React.FC<{ onCreateComponent?: () => void }> = ({ onCreateComponent }) => (
  <EmptyState
    icon={<Diamond size={24} />}
    title="No components yet"
    message="Save reusable element groups as components. Select elements on canvas and click 'Create Component'."
    actionLabel="Create component"
    onAction={onCreateComponent}
  />
);

/** Templates tab: no templates available */
export const TemplatesEmpty: React.FC = () => (
  <EmptyState
    icon={<LayoutGrid size={24} />}
    title="No templates found"
    message="No templates match your search. Try a different keyword or browse all categories."
  />
);

/** History tab: no history entries */
export const HistoryEmpty: React.FC = () => (
  <EmptyState
    icon={<Clock size={24} />}
    title="No history yet"
    message="Edit your page and version history will appear here. You can view changes, compare versions, and restore previous states."
  />
);
