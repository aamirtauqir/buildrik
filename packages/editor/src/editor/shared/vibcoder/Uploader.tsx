/**
 * Vibcoder Uploader wrapper — dashed dropzone with thumb + meta + actions slot.
 * Renders the bd-uploader composite from
 * src/themes/components/molecules/uploader.css.
 *
 * Slot composition (Contract A from Phase 2 design):
 *   prompt     required structural slot → flat string (renders __name —
 *              the primary CTA text, e.g. "Drop image here or click to browse")
 *   hint       optional supportive slot → flat string (renders __hint —
 *              e.g. "PNG, JPG up to 5MB")
 *   thumb      optional decorative slot → ReactNode (renders __thumb —
 *              caller passes <Thumb /> or <img>; omit for empty dropzone)
 *   children   optional content slot → renders __actions (caller passes
 *              <Button>browse</Button> or other action affordances)
 *
 * Drag-drop event semantics (FIRST molecule with non-trivial event handling):
 *
 *   onFiles      REQUIRED — fires on drop OR on file picker change. Receives
 *                the FileList (NOT a single File) so callers handle multi
 *                upload uniformly.
 *
 *   CRITICAL: e.preventDefault() is called on BOTH dragover AND drop.
 *   Without preventDefault on dragover, the drop event NEVER fires (the
 *   browser navigates to the dropped file instead). This is the most
 *   common drag-drop foot-gun — documented here per Phase 2 spec.
 *
 *   Dragover state: tracked via the `is-dragover` class toggled directly
 *   on `e.currentTarget` (NOT via React useState). The CSS hook is
 *   `.bd-uploader.is-dragover` from the vendored CSS. This keeps the
 *   wrapper free of internal useState (per Phase 2 Contract B mandate
 *   that wrappers stay clean of internal state — `useState` for surface
 *   markers like dragover would invite the same coordination problems
 *   that motivated Contract B for value state).
 *
 * Hidden file input:
 *   The root <div> is clickable; clicking opens the file picker by
 *   triggering the hidden <input type="file" /> via inputRef.click().
 *   useRef is allowed here — it's a DOM reference (Phase 1 Switch /
 *   Checkbox precedent), not React state.
 *
 * Disabled handling:
 *   - Disables the file input (so click + browse fire no-ops)
 *   - Skips onFiles in the drop handler
 *   - Adds `bd-uploader--disabled` class for visual cue
 *   - Does NOT prevent dragover preventDefault (the prevent-navigate
 *     behavior is needed regardless of disabled — without it, dropping a
 *     file onto a disabled zone would still navigate the page away)
 *
 * Variants from `vibcoder-variants.mjs molecules/uploader`:
 *   variants: centered, error, has-file
 *   sizes:    sm, lg
 *   states:   disabled
 *
 * forwardRef targets the root <div> — measurement consumers (popover anchor
 * for upload progress, sticky-position dropzone) need it.
 *
 * @license BSD-3-Clause
 */
import {
  type HTMLAttributes,
  type ReactNode,
  type DragEvent,
  type ChangeEvent,
  type MouseEvent,
  type KeyboardEvent,
  forwardRef,
  useRef,
} from "react";

export type UploaderSize = "sm" | "lg";
export type UploaderVariant = "centered" | "error" | "has-file";

export interface UploaderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onDrop"> {
  /** Required CTA text (renders inside __name). */
  prompt: string;
  /** Optional supportive hint text (renders inside __hint). */
  hint?: string;
  /** Optional leading thumb slot (caller passes <Thumb /> or <img>). */
  thumb?: ReactNode;
  /**
   * REQUIRED — fires on drop OR on file picker selection. Receives the
   * FileList. Caller is responsible for actually uploading the files.
   */
  onFiles: (files: FileList) => void;
  /** Forwarded to <input type="file" accept="…">. */
  accept?: string;
  /** Forwarded to <input type="file" multiple>. */
  multiple?: boolean;
  /** Disables click + drop. Adds visual disabled cue. */
  disabled?: boolean;
  /** Optional action slot (renders __actions — typically a <Button>). */
  children?: ReactNode;
  size?: UploaderSize;
  variant?: UploaderVariant;
}

export const Uploader = forwardRef<HTMLDivElement, UploaderProps>(
  (
    {
      prompt,
      hint,
      thumb,
      onFiles,
      accept,
      multiple,
      disabled,
      children,
      size,
      variant,
      className,
      onClick,
      onDragOver,
      onDragLeave,
      ...rest
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const classes = [
      "bd-uploader",
      size && `bd-uploader--${size}`,
      variant && `bd-uploader--${variant}`,
      disabled && "bd-uploader--disabled",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const handleClick = (e: MouseEvent<HTMLDivElement>) => {
      onClick?.(e);
      if (e.defaultPrevented) return;
      if (disabled) return;
      inputRef.current?.click();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      // Enter + Space activate the dropzone like a native button.
      // preventDefault on Space stops the page from scrolling.
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        inputRef.current?.click();
      }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
      // CRITICAL: preventDefault REQUIRED on dragover or browser navigates
      // to the dropped file and the drop event never fires.
      e.preventDefault();
      onDragOver?.(e);
      e.currentTarget.classList.add("is-dragover");
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
      onDragLeave?.(e);
      e.currentTarget.classList.remove("is-dragover");
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.classList.remove("is-dragover");
      if (disabled) return;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFiles(e.dataTransfer.files);
      }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFiles(e.target.files);
      }
    };

    return (
      <div
        ref={ref}
        className={classes}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-label={prompt}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        {...rest}
      >
        {thumb !== undefined && (
          <div className="bd-uploader__thumb">{thumb}</div>
        )}
        <div className="bd-uploader__meta">
          <span className="bd-uploader__name">{prompt}</span>
          {hint && <span className="bd-uploader__hint">{hint}</span>}
        </div>
        {children !== undefined && (
          <div className="bd-uploader__actions">{children}</div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleChange}
          onClick={(e) => {
            // Programmatic input.click() dispatches a click event that would
            // bubble back to the root and re-fire handleClick (infinite loop).
            // Stopping propagation breaks the cycle. User-driven clicks on
            // the input are impossible because display:none hides it.
            e.stopPropagation();
          }}
          style={{ display: "none" }}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
    );
  },
);
Uploader.displayName = "Uploader";
