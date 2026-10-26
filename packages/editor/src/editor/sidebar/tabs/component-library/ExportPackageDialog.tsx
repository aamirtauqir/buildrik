/**
 * ExportPackageDialog — "Export <component>" (2L9 B6-K29 220:42920): what the
 * package includes, its file name and size, then Download package with the
 * receipt "Download started: <file>. Your site was not changed." (K30).
 *
 * Images and fonts travel as the URLs and family names the masters use; the
 * dialog says so instead of drawing a media bundle the file does not hold.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { ComponentDefinition } from "@/shared/types/components";
import { Button, Modal, useToast } from "@/editor/chrome-ui";
import { downloadFile } from "@/editor/export/ExportUtils";
import { buildPackage, packageFileName, summarize } from "./componentPackage";

const ROW = "tw:grid tw:grid-cols-[120px_1fr] tw:gap-2 tw:text-[12px] tw:leading-[18px]";
const KEY = "tw:text-[var(--bk-ink-muted)]";

function size(bytes: number): string {
  return bytes < 1024 * 1024 ? `about ${Math.max(1, Math.round(bytes / 1024))} KB` : `about ${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ExportPackageDialog({
  component,
  all,
  onClose,
}: {
  component: ComponentDefinition;
  /** Every master on the site — the nested ones travel with it. */
  all: readonly ComponentDefinition[];
  onClose: () => void;
}) {
  const { addToast } = useToast();
  const pkg = React.useMemo(() => buildPackage(component.id, all), [component.id, all]);
  const text = React.useMemo(() => (pkg ? JSON.stringify(pkg) : ""), [pkg]);
  if (!pkg) return null;
  const s = summarize(pkg);
  const file = packageFileName(component.name);
  const media =
    s.images.length + s.fonts.length === 0
      ? "None"
      : `${s.images.length} image${s.images.length === 1 ? "" : "s"}, ${s.fonts.length} font${s.fonts.length === 1 ? "" : "s"}` +
        `${s.fonts.length ? ` (${s.fonts.join(", ")})` : ""} · referenced by address, not copied into the file`;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Export ${component.name}`}
      kind="form"
      testId="comp-export"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            data-testid="comp-export-download"
            onClick={() => {
              downloadFile(text, file, "application/json");
              addToast({ tone: "success", description: `Download started: ${file}. Your site was not changed.` });
              onClose();
            }}
          >
            Download package
          </Button>
        </>
      }
    >
      <p className="tw:m-0 tw:mb-3">
        Exporting main component {component.name}. Exporting never changes, saves or publishes your site.
      </p>
      <p className="tw:m-0 tw:mb-1 tw:text-[11px] tw:leading-4 tw:font-semibold tw:text-[var(--bk-ink)]">Included</p>
      <div className="tw:flex tw:flex-col tw:gap-1" data-testid="comp-export-included">
        <div className={ROW}>
          <span className={KEY}>Styles</span>
          <span>{s.classes ? `${s.classes} class${s.classes === 1 ? "" : "es"}` : "Inline styles only"}</span>
        </div>
        <div className={ROW}>
          <span className={KEY}>Media and fonts</span>
          <span>{media}</span>
        </div>
        <div className={ROW}>
          <span className={KEY}>Nested components</span>
          <span>{s.nested.length ? s.nested.join(", ") : "None"}</span>
        </div>
        <div className={ROW}>
          <span className={KEY}>File</span>
          <span data-testid="comp-export-file">
            {file} · {size(new Blob([text]).size)}
          </span>
        </div>
      </div>
    </Modal>
  );
}
