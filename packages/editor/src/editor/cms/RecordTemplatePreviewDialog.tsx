/**
 * RecordTemplatePreviewDialog — "Preview saved record" (design-2l9
 * 183:20974): the saved record's card. The collection's template page
 * rendered read-only with this record's data opens from "Open page preview"
 * (a sandboxed iframe in a blank tab; 7116:76427).
 * No template page chosen yet → a clear message that links to the
 * Dynamic pages template picker instead of a dead preview.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";
import { Button, Modal } from "@/editor/chrome-ui";
import { RecordCard } from "./RecordPreview";
import { recordTitle } from "./RecordsTable";
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
    /* 183:20974 — the SAVED record (never the form's draft) as its card:
       "{record} · Last saved version", the card, Close. The collection page
       rendered with it stays one click away ("Open page preview", a new tab). */
    <Modal
      open
      onClose={onClose}
      title="Preview saved record"
      kind="form"
      width="xl"
      testId="cms-record-template-preview"
      footer={
        <>
          {state.kind === "html" ? (
            <Button variant="secondary" onClick={openInNewTab} data-testid="cms-record-template-preview-open">
              Open page preview
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose} data-testid="cms-record-template-preview-close">
            Close
          </Button>
        </>
      }
    >
      <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]" data-testid="cms-record-template-preview-subtitle">
        {`${recordTitle(collection, record)} · Last saved version`}
      </p>
      <div className="tw:mt-5">
        <RecordCard collection={collection} values={record.data} title={recordTitle(collection, record)} meta={false} />
      </div>
      {state.kind === "error" && state.fixable ? (
        <p className="tw:m-0 tw:mt-4 tw:flex tw:items-center tw:gap-2 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]" data-testid="cms-record-template-preview-error">
          {state.message}
          <Button size="xs" variant="link" className="tw:h-auto tw:min-h-0 tw:p-0 tw:text-[12px]" onClick={onChooseTemplate} data-testid="cms-record-template-preview-choose">
            Choose a template page
          </Button>
        </p>
      ) : null}
    </Modal>
  );
}
