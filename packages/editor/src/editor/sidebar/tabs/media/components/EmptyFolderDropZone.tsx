import * as React from "react";
import { Upload } from "lucide-react";

interface Props {
  folderName: string;
  onFiles(files: File[]): void;
}

const ACCEPT_TYPES = "image/*,video/*,.ttf,.otf,.woff,.woff2,.svg";

export function EmptyFolderDropZone({ folderName, onFiles }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length) onFiles(files);
  };

  return (
    <div
      className={`med-empty-folder-zone${isDragOver ? " is-drag-over" : ""}`}
      role="button"
      tabIndex={0}
      data-testid="empty-folder-drop-zone"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
      }}
      onDrop={handleDrop}
    >
      <Upload size={32} aria-hidden />
      <div className="med-empty-folder-zone__title">
        Drop files into &lsquo;{folderName}&rsquo;
      </div>
      <div className="med-empty-folder-zone__sub">or click to upload</div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_TYPES}
        style={{ display: "none" }}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
