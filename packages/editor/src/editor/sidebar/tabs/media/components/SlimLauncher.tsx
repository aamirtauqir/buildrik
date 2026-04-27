import { Kbd } from "@/shared/ui/Kbd";
import { TextInput } from "@/shared/ui/TextInput";
import { Button } from "@/shared/ui/Button";
/**
 * SlimLauncher — 280px panel launcher for the Media tab.
 *
 * Wires the 5 canvas-insert paths documented in the wireframe:
 *   1. Click tile         → onInsert(item)            — insert at cursor
 *   2. Drag tile          → setMediaDragData          — spatial drop
 *   3. Type in search     → onOpenLibrary({ searchQuery, scope: 'global' })
 *   4. Click maximize     → onOpenLibrary({})         — last-used folder
 *   5. Drop files / click upload → onUpload(files[])  — to last-used folder
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Upload, Search, Maximize2, X } from "lucide-react";
import type { Composer } from "../../../../../engine/Composer";
import type { LibraryItem } from "../data/mediaTypes";
import { setMediaDragData } from "../data/dragPayload";

const RECENT_LIMIT = 12;

interface SlimLauncherProps {
  composer: Composer;
  libraryItems: LibraryItem[];
  /** Called with the LibraryItem's `key` — matches useMediaState.insertToCanvas signature. */
  onInsert(key: string): void;
  onOpenLibrary(opts?: { searchQuery?: string; folderId?: string | null }): void;
  onUpload(files: File[]): void;
  onClose?(): void;
}

export function SlimLauncher({
  composer,
  libraryItems,
  onInsert,
  onOpenLibrary,
  onUpload,
  onClose,
}: SlimLauncherProps) {
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Surface 1 default: "Recent uploads (last 12)" per DSN2 design decision.
  // Items are sorted newest-first by useLibraryState upstream.
  const recent = libraryItems.slice(0, RECENT_LIMIT);

  // Path 3: typing in search opens the full manager with the query prefilled.
  const handleSearchFocus = React.useCallback(() => {
    onOpenLibrary({ searchQuery: "" });
  }, [onOpenLibrary]);

  // Path 5a: file input (hidden) triggered by quick-upload button.
  const handleUploadClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const handleFileInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) onUpload(files);
      // Reset the input so the same file can be picked again later.
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [onUpload],
  );

  // Path 5b: drop files onto the launcher itself.
  const handleDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files ?? []).filter(
        (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
      );
      if (files.length > 0) onUpload(files);
    },
    [onUpload],
  );
  const handleDragOver = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // Only flip dragOver for file drags — not tile drags originating inside the launcher.
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setDragOver(true);
    }
  }, []);
  const handleDragLeave = React.useCallback(() => setDragOver(false), []);

  // Telemetry: library opened from this source.
  React.useEffect(() => {
    composer.media.emitEvent("media:library:opened", { source: "slim_launcher" });
  }, [composer]);

  return (
    <div
      className={`sl-launcher${dragOver ? " sl-launcher--drag-over" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <header className="sl-header">
        <h3 className="sl-title">Media</h3>
        <div className="sl-header-actions">
          <Button
            type="button"
            className="sl-icon-btn"
            onClick={handleUploadClick}
            title="Quick upload"
            aria-label="Upload files"
          >
            <Upload size={16} />
          </Button>
          <Button
            type="button"
            className="sl-icon-btn"
            onClick={() => onOpenLibrary()}
            title="Open full library (⌘⇧M)"
            aria-label="Open full library"
          >
            <Maximize2 size={16} />
          </Button>
          {onClose ? (
            <Button
              type="button"
              className="sl-icon-btn"
              onClick={onClose}
              title="Close"
              aria-label="Close panel"
            >
              <X size={16} />
            </Button>
          ) : null}
        </div>
      </header>
      {/* Path 3: search opens full manager with prefill. */}
      <div
        className="sl-search"
        onClick={handleSearchFocus}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleSearchFocus();
        }}
      >
        <Search size={14} className="sl-search__icon" />
        <span className="sl-search__ghost">Search media…</span>
        <Kbd className="sl-search__kbd">⌘K</Kbd>
      </div>
      {recent.length > 0 ? (
        <section className="sl-strip" aria-label="Recent uploads">
          <div className="sl-strip__header">
            <span className="sl-strip__label">Recent</span>
            <Button
              type="button"
              className="sl-strip__more"
              onClick={() => onOpenLibrary()}
            >
              View all
            </Button>
          </div>
          <div className="sl-tiles">
            {recent.map((item) => (
              <Button
                key={item.key}
                type="button"
                className="sl-tile"
                title={item.name}
                onClick={() => onInsert(item.key)}
                draggable
                onDragStart={(e) => setMediaDragData(e.dataTransfer, item)}
              >
                {item.thumb || item.src ? (
                  <img
                    src={item.thumb || item.src}
                    alt=""
                    className="sl-tile__img"
                    draggable={false}
                  />
                ) : (
                  <div className="sl-tile__placeholder" aria-hidden="true" />
                )}
              </Button>
            ))}
          </div>
        </section>
      ) : (
        <section className="sl-empty">
          <p className="sl-empty__title">Your library is empty</p>
          <p className="sl-empty__body">
            Upload your brand assets or browse free stock. Everything you add lives here.
          </p>
          <Button type="button" className="sl-empty__cta" onClick={() => onOpenLibrary()}>
            Open library
          </Button>
        </section>
      )}
      {recent.length > 0 ? (
        <Button
          type="button"
          className="sl-open-library"
          onClick={() => onOpenLibrary()}
        >
          Open library
        </Button>
      ) : null}
      <TextInput
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.svg,.woff,.woff2,.ttf,.otf"
        style={{ display: "none" }}
        onChange={handleFileInputChange}
        aria-hidden="true"
      />
      {dragOver ? (
        <div className="sl-drag-overlay" role="status" aria-live="polite">
          <Upload size={24} />
          <div className="sl-drag-overlay__label">Drop files to upload</div>
        </div>
      ) : null}
    </div>
  );
}
