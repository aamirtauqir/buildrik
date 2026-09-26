/**
 * RecordTemplatePreviewDialog — "Preview saved record" (7116:76427). Opens
 * the collection's template page rendered read-only with this record's
 * data, in an overlay (with "Open in new tab" for the full-width look —
 * the same sandboxed iframe, in a blank tab).
 * No template page chosen yet → a clear message that links to the
 * Dynamic pages template picker instead of a dead preview.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";
import { Button, Modal, Spinner } from "@/editor/chrome-ui";
import { renderRecordTemplatePreview } from "./recordTemplatePreview";

type State = { kind: "loading" } | { kind: "html"; html: string } | { kind: "error"; message: string; fixable: boolean };

const NO_TEMPLATE_MESSAGE = "This collection has no template page set yet — choose one to preview records against it.";

export function RecordTemplatePreviewDialog({
  composer,
  collection,
  record,
  onClose,
  onChooseTemplate,
}: {
  composer: Composer | null;
  collection: CMSCollection;
  record: CMSContentItem;
  onClose: () => void;
  /** No template page set — jump to the collection's Dynamic pages tab. */
  onChooseTemplate: () => void;
}) {
  const [state, setState] = React.useState<State>({ kind: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    if (!composer) {
      setState({ kind: "error", message: "The editor isn't ready yet — try again in a moment.", fixable: false });
      return;
    }
    renderRecordTemplatePreview(composer, collection, record)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setState({ kind: "html", html: result.html });
        } else if (result.reason === "no-template") {
          setState({ kind: "error", message: NO_TEMPLATE_MESSAGE, fixable: true });
        } else if (result.reason === "template-missing") {
          setState({
            kind: "error",
            message: "This record's template page couldn't be found — it may have been deleted or renamed. Choose another.",
            fixable: true,
          });
        } else {
          setState({ kind: "error", message: "Couldn't render this preview. Try again.", fixable: false });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error", message: "Couldn't render this preview. Try again.", fixable: false });
      });
    return () => {
      cancelled = true;
    };
  }, [composer, collection, record]);

  /* I-1a: a blob: URL page runs with the app's origin (and its CSP allows
     'unsafe-inline'), while the preview keeps the exported <head> unsanitized.
     The new tab is an about:blank shell holding the page in the same
     `sandbox=""` iframe the dialog uses — scripts never run and the frame's
     origin is opaque. `noopener` would make window.open return null (nothing
     to write into), so the opener link is cut by hand instead. */
  const openInNewTab = () => {
    if (state.kind !== "html") return;
    const tab = window.open("about:blank", "_blank");
    if (!tab) return;
    tab.opener = null;
    const doc = tab.document;
    doc.title = `${collection.name} preview`;
    const style = doc.createElement("style");
    style.textContent = "html,body{margin:0;height:100%}iframe{display:block;border:0;width:100%;height:100%}";
    doc.head.appendChild(style);
    const frame = doc.createElement("iframe");
    frame.setAttribute("sandbox", "");
    frame.setAttribute("srcdoc", state.html);
    frame.title = doc.title;
    doc.body.appendChild(frame);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Preview saved record"
      subtitle={`Read-only — ${collection.name}'s template page rendered with this record's data.`}
      kind="form"
      width="wide"
      testId="cms-record-template-preview"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} data-testid="cms-record-template-preview-close">
            Close
          </Button>
          <Button disabled={state.kind !== "html"} onClick={openInNewTab} data-testid="cms-record-template-preview-open">
            Open in new tab
          </Button>
        </>
      }
    >
      {state.kind === "loading" ? (
        <div className="tw:flex tw:h-[420px] tw:items-center tw:justify-center">
          <Spinner size="md" label="Rendering preview" />
        </div>
      ) : state.kind === "error" ? (
        <div className="tw:flex tw:h-[420px] tw:flex-col tw:items-center tw:justify-center tw:gap-3 tw:px-8 tw:text-center">
          <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]" data-testid="cms-record-template-preview-error">
            {state.message}
          </p>
          {state.fixable ? (
            <Button size="xs" onClick={onChooseTemplate} data-testid="cms-record-template-preview-choose">
              Choose a template page
            </Button>
          ) : null}
        </div>
      ) : (
        <iframe
          title={`${collection.name} preview`}
          srcDoc={state.html}
          sandbox=""
          className="tw:h-[420px] tw:w-full tw:rounded-[6px] tw:border tw:border-[var(--bk-border)] tw:bg-white"
          data-testid="cms-record-template-preview-frame"
        />
      )}
    </Modal>
  );
}
