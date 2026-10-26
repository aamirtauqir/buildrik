/**
 * Editor stopped — the last-resort screen when the shell throws (2L9 B7-G26
 * `227:11649`).
 *
 * It replaced "Something went wrong" + the raw error message + Reload, which
 * put a stack-trace sentence in front of the user and offered only the action
 * that destroys unsaved work. The board's order is download first:
 *   "Something stopped the editor"
 *   "You have unsaved changes — download a copy before reloading."  (only when true)
 *   "Error code 7F3A-21 ⧉"  — a short code support can match to the report
 *   Download a copy · Reload editor · Back to sites
 *
 * The code is a hash of the error's name, message and first frame: the same
 * defect gives the same code, and the message itself never reaches the
 * screen. The error is reported with the code attached so the two meet.
 *
 * The work comes from `workSnapshot` — the shell that held the composer is
 * the thing that stopped, so the registered provider (or the kept copy) is
 * the only way back to it. With no work there is no download and Reload
 * becomes the one action.
 *
 * Mounting is AquibraStudio's (REQUESTS #17): this replaces its
 * `StudioErrorBoundary`.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, CopyButton } from "@/editor/chrome-ui";
import { captureError } from "@/shared/utils/errorTracking";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { currentWork, downloadProject, hasUnsavedWork } from "./workSnapshot";

/** "7F3A-21": six hex digits of an FNV-1a hash over what identifies the defect. */
export function editorErrorCode(error: Error): string {
  const frame = error.stack?.split("\n").find((line) => line.trim().startsWith("at ")) ?? "";
  const text = `${error.name}:${error.message}:${frame.trim()}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const hex = (hash >>> 8).toString(16).toUpperCase().padStart(6, "0");
  return `${hex.slice(0, 4)}-${hex.slice(4)}`;
}

const EditorStoppedScreen: React.FC<{ code: string }> = ({ code }) => {
  const siteId = getSiteIdFromUrl();
  const work = currentWork(siteId);
  const unsaved = work !== null && hasUnsavedWork(siteId);
  const reload = () => window.location.reload();
  return (
    <div
      role="alert"
      aria-labelledby="editor-stopped-title"
      data-testid="editor-stopped"
      className="tw:flex tw:h-screen tw:flex-col tw:items-center tw:justify-center tw:gap-3 tw:bg-[var(--bk-bg-panel)] tw:px-6 tw:text-center tw:text-[var(--bk-ink)] tw:[font-family:var(--bk-font-ui)]"
    >
      <h2 id="editor-stopped-title" className="tw:m-0 tw:text-[18px] tw:font-semibold tw:leading-7">
        Something stopped the editor
      </h2>
      {unsaved ? (
        <p className="tw:m-0 tw:text-[14px] tw:leading-5 tw:text-[var(--bk-ink-soft)]">
          You have unsaved changes — download a copy before reloading.
        </p>
      ) : null}
      <div className="tw:flex tw:items-center tw:gap-1 tw:text-[13px] tw:text-[var(--bk-ink-soft)]">
        <span className="tw:[font-family:var(--bk-font-mono)] tw:tabular-nums" data-testid="editor-stopped-code">
          Error code {code}
        </span>
        <CopyButton content={`Error code ${code}`} label="Copy" variant="ghost" size="sm" />
      </div>
      <div className="tw:mt-2 tw:flex tw:items-center tw:gap-2">
        {work ? (
          <Button size="sm" onClick={() => downloadProject(work, "recovered")} data-testid="editor-stopped-download">
            Download a copy
          </Button>
        ) : null}
        <Button size="sm" color={work ? "light" : undefined} onClick={reload}>
          Reload editor
        </Button>
        <Button
          size="sm"
          color="light"
          onClick={() => window.location.assign(`${DASHBOARD_URL}/dashboard`)}
          className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-accent-text)] tw:hover:underline"
        >
          Back to sites
        </Button>
      </div>
    </div>
  );
};

/** The boundary that shows it. */
export class EditorStoppedBoundary extends React.Component<{ children: React.ReactNode }, { code: string | null }> {
  state: { code: string | null } = { code: null };

  static getDerivedStateFromError(error: unknown): { code: string } {
    return { code: editorErrorCode(error instanceof Error ? error : new Error(String(error))) };
  }

  componentDidCatch(error: unknown): void {
    const err = error instanceof Error ? error : new Error(String(error));
    captureError(err, { surface: "editor-stopped", code: editorErrorCode(err) });
  }

  render(): React.ReactNode {
    return this.state.code ? <EditorStoppedScreen code={this.state.code} /> : this.props.children;
  }
}
