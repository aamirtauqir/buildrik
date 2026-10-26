/**
 * A panel whose code was replaced by a newer deploy (2L9 B7-G27 `227:12184`).
 *
 * After a deploy the old build's lazy panel chunks are gone, so opening a
 * panel not loaded yet fails with a chunk-load error and used to land in the
 * generic "Something went wrong" panel. This boundary catches only that
 * error and says what happened — "This part of the editor was updated.
 * Reload to use it." · Reload · "Everything else keeps working." — and hands
 * every other error on to the boundary above it.
 *
 * Reload is a page reload: React.lazy keeps the failed import, and the old
 * chunk is not coming back. The editor's unload guard still asks first when
 * there is unsaved work.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/chrome-ui";

const CHUNK_ERROR =
  /ChunkLoadError|Loading chunk [\w-]+ failed|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;

export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === "ChunkLoadError" || CHUNK_ERROR.test(error.message);
}

export class PanelChunkBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: unknown): { error: Error } {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    /* Not ours: the boundary above shows its own fallback. */
    if (!isChunkLoadError(error)) throw error;
    return (
      <div role="alert" data-testid="panel-updated" className="tw:flex tw:flex-col tw:items-start tw:gap-2 tw:p-4">
        <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
          This part of the editor was updated. Reload to use it.
        </p>
        <Button size="xs" onClick={() => window.location.reload()}>
          Reload
        </Button>
        <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">Everything else keeps working.</p>
      </div>
    );
  }
}
