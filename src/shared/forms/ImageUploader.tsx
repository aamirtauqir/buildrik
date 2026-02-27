/**
 * Aquibra Image Uploader Component
 * Image upload with drag-drop, preview, and file info
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface ImageUploaderProps {
  label?: string;
  value?: string; // base64 or URL for initial preview
  onChange?: (file: File | null) => void;
  onUpload?: (data: { file: File; base64: string }) => void;
  disabled?: boolean;
  maxSize?: number; // in bytes, default 5MB
  error?: string;
  previewSize?: "sm" | "md" | "lg";
  showFileName?: boolean;
  id?: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.gif,.webp,.svg";
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB

const previewSizes = {
  sm: 80,
  md: 120,
  lg: 180,
};

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  value,
  onChange,
  onUpload,
  disabled = false,
  maxSize = DEFAULT_MAX_SIZE,
  error: externalError,
  previewSize = "md",
  showFileName = true,
  id,
}) => {
  const generatedId = React.useId();
  const fieldId = id || generatedId;
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(value || null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [fileSize, setFileSize] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Sync external value
  React.useEffect(() => {
    if (value !== undefined) {
      setPreview(value || null);
    }
  }, [value]);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Invalid file type. Accepted: JPG, PNG, GIF, WebP, SVG";
    }
    if (file.size > maxSize) {
      return `File too large. Maximum size: ${formatSize(maxSize)}`;
    }
    return null;
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsLoading(true);
    setFileName(file.name);
    setFileSize(file.size);

    try {
      const base64 = await readFileAsBase64(file);
      setPreview(base64);
      onChange?.(file);
      onUpload?.({ file, base64 });
    } catch {
      setError("Failed to process image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    processFile(fileList[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && !disabled) {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setFileName(null);
    setFileSize(null);
    setError(null);
    onChange?.(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const displayError = externalError || error;
  const size = previewSizes[previewSize];

  return (
    <div className="aqb-field aqb-image-uploader">
      {label && (
        <label htmlFor={fieldId} className="aqb-field-label">
          {label}
        </label>
      )}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-label={label || "Upload image"}
        aria-disabled={disabled}
        style={{
          position: "relative",
          padding: preview ? 12 : 24,
          border: `2px dashed ${
            isDragging
              ? "var(--aqb-primary)"
              : displayError
                ? "var(--aqb-error, #ef4444)"
                : "var(--aqb-border)"
          }`,
          borderRadius: 8,
          background: isDragging ? "rgba(0, 212, 170, 0.05)" : "var(--aqb-bg-dark)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          transition: "all 0.15s ease",
          textAlign: "center",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          id={fieldId}
          accept={ACCEPTED_EXTENSIONS}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
          style={{ display: "none" }}
          aria-hidden="true"
        />

        {isLoading ? (
          <div style={{ padding: 20 }}>
            <div
              style={{
                width: 24,
                height: 24,
                margin: "0 auto 8px",
                border: "2px solid var(--aqb-border)",
                borderTopColor: "var(--aqb-primary)",
                borderRadius: "50%",
                animation: "aqb-spin 0.8s linear infinite",
              }}
            />
            <span style={{ color: "var(--aqb-text-muted)", fontSize: 13 }}>Processing...</span>
          </div>
        ) : preview ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: size,
                height: size,
                borderRadius: 6,
                overflow: "hidden",
                flexShrink: 0,
                background:
                  "repeating-conic-gradient(rgba(128,128,128,0.2) 0% 25%, transparent 0% 50%) 50% / 8px 8px",
              }}
            >
              <img
                src={preview}
                alt="Preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
            <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
              {showFileName && fileName && (
                <div
                  style={{
                    color: "var(--aqb-text-primary)",
                    fontSize: 13,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginBottom: 4,
                  }}
                >
                  {fileName}
                </div>
              )}
              {fileSize !== null && (
                <div
                  style={{
                    color: "var(--aqb-text-muted)",
                    fontSize: 12,
                    marginBottom: 8,
                  }}
                >
                  {formatSize(fileSize)}
                </div>
              )}
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled}
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--aqb-text-primary)",
                  background: "var(--aqb-bg-panel)",
                  border: "1px solid var(--aqb-border)",
                  borderRadius: 4,
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--aqb-border)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--aqb-bg-panel)";
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                width: 48,
                height: 48,
                margin: "0 auto 12px",
                borderRadius: 8,
                background: "var(--aqb-bg-panel)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--aqb-text-muted)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
            </div>
            <div
              style={{
                color: "var(--aqb-text-primary)",
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              Drop image here or click to upload
            </div>
            <div
              style={{
                color: "var(--aqb-text-muted)",
                fontSize: 12,
              }}
            >
              JPG, PNG, GIF, WebP, SVG up to {formatSize(maxSize)}
            </div>
          </>
        )}
      </div>

      {displayError && (
        <span
          role="alert"
          style={{
            display: "block",
            marginTop: 6,
            fontSize: 12,
            color: "var(--aqb-error, #ef4444)",
          }}
        >
          {displayError}
        </span>
      )}

      <style>{`
        @keyframes aqb-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ImageUploader;
