import { Input } from "@/editor/shared/vibcoder/Input";
/**
 * Media Tab — Upload Zone
 * Dashed drop area matching .pen Screen 8 design.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Upload } from "lucide-react";
import type { UploadZoneProps } from "../data/mediaTypes";

export function UploadZone({ storage, onUpload, disabled = false }: UploadZoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const isFull = storage.used >= storage.total;

  const handleFiles = (files: FileList | null) => {
    if (!files?.length || disabled || isFull) return;
    onUpload(Array.from(files));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!isFull) handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={`med-upload-zone${disabled || isFull ? " med-upload-zone--disabled" : ""}${isDragOver ? " med-upload-zone--drag-active" : ""}`}
      onClick={() => !isFull && !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      aria-label={isFull ? "Storage full" : "Drop files or click to browse"}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
    >
      <Upload size={20} className="med-upload-zone-icon" />
      <span className="med-upload-zone__label">
        {isFull ? "Storage full" : "Drag files or click to browse"}
      </span>
      <Input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,.ttf,.otf,.woff,.woff2,.svg"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
