/**
 * ImportPackageDialog — "Import components" from a `.brcomponent` package
 * (2L9 B6-K31 220:43545 file step; progress 220:45240; receipt 220:45883).
 *
 * Three steps of the board's six are built: Choose file, Check, Import. The
 * Check lists every master in the package as new or already on this site —
 * one already here is kept as it is, never overwritten. Choose roots and Map
 * (picking a subset, mapping CMS fields and tokens) are not built: the
 * package carries no CMS or token links to map. Nothing is added until the
 * last step, as the board promises.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { Button, Modal, TextInput, useToast } from "@/editor/chrome-ui";
import { PACKAGE_EXTENSION, parsePackage, type ComponentPackage } from "./componentPackage";

const STEPS = ["Choose file", "Check", "Import"] as const;
const NOTE = "tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]";

function mb(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ImportPackageDialog({ composer, onClose }: { composer: Composer | null; onClose: () => void }) {
  const { addToast } = useToast();
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const [step, setStep] = React.useState(0);
  const [chosen, setChosen] = React.useState<{ name: string; bytes: number; pkg: ComponentPackage } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [failed, setFailed] = React.useState<string | null>(null);

  const existing = new Set((composer?.components?.getAllComponents() ?? []).map((c) => c.id));
  const fresh = chosen ? chosen.pkg.components.filter((c) => !existing.has(c.id)) : [];

  const read = async (file: File) => {
    setError(null);
    const parsed = parsePackage(await file.text(), file.size);
    if ("error" in parsed) {
      setChosen(null);
      setError(parsed.error);
    } else {
      setChosen({ name: file.name, bytes: file.size, pkg: parsed.pkg });
    }
  };

  const run = async () => {
    if (!composer?.components || !chosen) return;
    setStep(2);
    setFailed(null);
    let done = 0;
    setProgress({ done, total: fresh.length });
    for (const c of fresh) {
      try {
        await composer.components.adoptLibraryComponent(c);
      } catch {
        /* 220:46207 — what landed stays; the rest can be tried again. */
        setFailed(`${c.name} couldn’t be added. ${done} of ${fresh.length} were imported; Retry adds the rest.`);
        setProgress(null);
        return;
      }
      done++;
      setProgress({ done, total: fresh.length });
    }
    addToast({
      tone: "success",
      description: `Imported ${done} component${done === 1 ? "" : "s"} from ${chosen.name}. ${chosen.pkg.components.length - fresh.length} already on this site were kept as they are.`,
    });
    onClose();
  };

  const footer =
    step === 0 ? (
      <>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!chosen} onClick={() => setStep(1)} data-testid="comp-import-continue">
          Continue
        </Button>
      </>
    ) : step === 1 ? (
      <>
        <Button variant="secondary" onClick={() => setStep(0)}>
          Back
        </Button>
        <Button disabled={fresh.length === 0} onClick={() => void run()} data-testid="comp-import-run">
          Import {fresh.length} component{fresh.length === 1 ? "" : "s"}
        </Button>
      </>
    ) : failed ? (
      <>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button onClick={() => void run()} data-testid="comp-import-retry">
          Retry
        </Button>
      </>
    ) : null;

  return (
    <Modal open onClose={progress ? () => undefined : onClose} title="Import components" kind="form" testId="comp-import" footer={footer}>
      <ol className="tw:m-0 tw:mb-3 tw:flex tw:list-none tw:gap-2 tw:p-0 tw:text-[12px] tw:leading-[18px]" aria-label="Steps">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? "step" : undefined}
            className={i === step ? "tw:font-medium tw:text-[var(--bk-ink)]" : "tw:text-[var(--bk-ink-muted)]"}
          >
            {i + 1} {label}
            {i < STEPS.length - 1 ? " ›" : ""}
          </li>
        ))}
      </ol>
      {step === 0 ? (
        <div className="tw:flex tw:flex-col tw:gap-2">
          <p className="tw:m-0">Add components from a {PACKAGE_EXTENSION} package. Nothing is added until the last step.</p>
          <Button variant="secondary" className="tw:self-start" onClick={() => fileRef.current?.click()} data-testid="comp-import-choose">
            Choose file
          </Button>
          <TextInput
            ref={fileRef}
            type="file"
            accept={`${PACKAGE_EXTENSION},application/json`}
            className="tw:hidden"
            data-testid="comp-import-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void read(file);
            }}
          />
          {chosen ? (
            <p className="tw:m-0 tw:text-[13px] tw:leading-5" data-testid="comp-import-selected">
              Selected · {chosen.name} · {mb(chosen.bytes)} · {chosen.pkg.components.length} main component
              {chosen.pkg.components.length === 1 ? "" : "s"}
            </p>
          ) : null}
          {error ? (
            <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-error-text)]" role="alert" data-testid="comp-import-error">
              {error}
            </p>
          ) : null}
          <p className={NOTE}>Limits: up to 50 MB, 100 main components and 10,000 layers per package.</p>
        </div>
      ) : step === 1 && chosen ? (
        <div className="tw:flex tw:flex-col tw:gap-1" data-testid="comp-import-check">
          {chosen.pkg.components.map((c) => (
            <div key={c.id} className="tw:flex tw:justify-between tw:gap-3 tw:text-[13px] tw:leading-5">
              <span className="tw:truncate">{c.name}</span>
              <span className="tw:text-[var(--bk-ink-muted)]">{existing.has(c.id) ? "Already on this site · kept as is" : "New"}</span>
            </div>
          ))}
          <p className={`${NOTE} tw:mt-2`}>Images and fonts stay where the package points; nothing on this site is overwritten.</p>
        </div>
      ) : (
        <div data-testid="comp-import-progress">
          {progress ? (
            <p className="tw:m-0">
              Importing {progress.done} of {progress.total}… Keep this window open.
            </p>
          ) : null}
          {failed ? (
            <p className="tw:m-0 tw:text-[var(--bk-error-text)]" role="alert" data-testid="comp-import-failed">
              {failed}
            </p>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
