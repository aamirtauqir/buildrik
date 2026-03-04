/**
 * Aquibra File Field Component
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface FileFieldProps {
  label?: string;
  accept?: string;
  multiple?: boolean;
  onChange?: (files: File[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  disabled?: boolean;
  maxSize?: number; // in bytes
  error?: string;
}

export const FileField: React.FC<FileFieldProps> = ({
  label,
  accept,
  multiple = false,
  onChange,
  onUpload,
  disabled = false,
  maxSize,
  error,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles = Array.from(fileList).filter((file) => {
      if (maxSize && file.size > maxSize) {
        return false;
      }
      return true;
    });

    setFiles(newFiles);
    onChange?.(newFiles);

    if (onUpload && newFiles.length > 0) {
      setUploading(true);
      try {
        await onUpload(newFiles);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="aqb-file-field">
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: 6,
            fontSize: 12,
            color: "var(--aqb-text-secondary)",
          }}
        >
          {label}
        </label>
      )}
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          padding: 24,
          border: `2px dashed ${
            isDragging ? "var(--aqb-primary)" : error ? "var(--aqb-error)" : "var(--aqb-border)"
          }`,
          borderRadius: 8,
          background: isDragging ? "var(--aqb-primary-light)" : "var(--aqb-bg-dark)",
          textAlign: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          transition: "all 0.15s ease",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
          style={{ display: "none" }}
        />
        <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
        <div style={{ color: "var(--aqb-text-primary)", marginBottom: 4 }}>
          {uploading ? "Uploading..." : "Drop files here or click to upload"}
        </div>
        <div style={{ fontSize: 12, color: "var(--aqb-text-muted)" }}>
          {accept ? `Accepted: ${accept}` : "All file types accepted"}
          {maxSize && ` • Max: ${formatSize(maxSize)}`}
        </div>
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {files.map((file, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: "var(--aqb-bg-panel-secondary)",
                borderRadius: 6,
                marginTop: 4,
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {file.name}
              </span>
              <span style={{ fontSize: 12, color: "var(--aqb-text-muted)" }}>
                {formatSize(file.size)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newFiles = files.filter((_, idx) => idx !== i);
                  setFiles(newFiles);
                  onChange?.(newFiles);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--aqb-text-muted)",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <span
          style={{
            display: "block",
            marginTop: 4,
            fontSize: 12,
            color: "var(--aqb-error)",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
};

export default FileField;
