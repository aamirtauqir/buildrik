/**
 * FolderBreadcrumb — SSOT folder navigation breadcrumb (prototype-v3 §13).
 *
 * Renders "All Media" root + the parentId chain up to the current folder,
 * with each segment a clickable navigation button. Consumed by both:
 *  - Expanded media panel (560px, ExpandedMediaPanel.tsx).
 *  - Fullpage library manager (LibraryManager.tsx, replaces inline mgr-* path).
 *
 * Walks `folder.parentId` upward from `currentFolderId` to build the trail,
 * so nested folders render the full lineage (All Media › Brand › Logos).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ChevronRight } from "lucide-react";
import type { MediaFolder } from "@shared/types/media";
import { Button } from "@/editor/shared/vibcoder/Button";

export interface FolderBreadcrumbProps {
  folders: MediaFolder[];
  currentFolderId: string | null;
  onNavigate(folderId: string | null): void;
}

export function FolderBreadcrumb({
  folders,
  currentFolderId,
  onNavigate,
}: FolderBreadcrumbProps) {
  const path = React.useMemo(
    () => buildPath(folders, currentFolderId),
    [folders, currentFolderId],
  );
  return (
    <nav
      data-testid="folder-breadcrumb"
      className="med-folder-breadcrumb"
      aria-label="Folder breadcrumb"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={
          "med-folder-breadcrumb__seg" +
          (currentFolderId === null ? " med-folder-breadcrumb__seg--current" : "")
        }
        onClick={() => onNavigate(null)}
      >
        All Media
      </Button>
      {path.map((folder, idx) => {
        const isCurrent = idx === path.length - 1;
        return (
          <React.Fragment key={folder.id}>
            <ChevronRight
              size={14}
              className="med-folder-breadcrumb__sep"
              aria-hidden
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={
                "med-folder-breadcrumb__seg" +
                (isCurrent ? " med-folder-breadcrumb__seg--current" : "")
              }
              onClick={() => onNavigate(folder.id)}
            >
              {folder.name}
            </Button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

function buildPath(
  folders: MediaFolder[],
  currentId: string | null,
): MediaFolder[] {
  if (!currentId) return [];
  const byId = new Map(folders.map((f) => [f.id, f]));
  const out: MediaFolder[] = [];
  let cur = byId.get(currentId);
  // Guard against cycles — bail if we revisit a node.
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    out.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return out;
}
