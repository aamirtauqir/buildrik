/**
 * CreateComponentModal — 2L9 271:125321 (G05) / 271:125668 (G06):
 *
 *   Create component
 *   <Name> on <Page> becomes the first instance.
 *   Name
 *   [ Hero heading                              ]
 *   Where it can be used
 *   [ ● Component library ]  Reusable on every site in this workspace.
 *   [ ○ This page         ]  Only on <Page>.
 *   No matching groups on <Page>.      (or: ☐ Also convert N other matching …)
 *   84 of 100 components
 *                         Cancel · Create and share component | Create component
 *
 * "Component library" is the site-wide master: the server mirrors every
 * site's masters into the workspace library (`siteComponents.library`), so
 * it is offered to the other sites of the workspace. "This page" stores the
 * active page's id and is offered only there
 * (ComponentManager.getComponentsForPage). "Matching" is an identical copy of
 * the selection on this page (engine/components/matchingGroups). The usage
 * line is the masters this site holds against the manager's limit
 * (DEFAULT_COMPONENT_CONFIG.maxComponents, the drawer's isAtComponentLimit).
 *
 * States (G07–G12, 271:126015…271:127754): an empty or over-long name keeps
 * the dialog a draft ("Enter a name between 1 and 200 characters."); at the
 * limit the usage line says what to do and Create is shut; while the create
 * runs, "Creating component…" (the button keeps its label); a refusal or a
 * throw keeps the name and scope, says the element is unchanged, and the
 * primary becomes "Try again".
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  Button,
  Checkbox,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalRoot,
  ModalTitle,
  TextInput,
  useToast,
} from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { findMatchingElements } from "@/engine/components/matchingGroups";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { EVENTS } from "@/shared/constants";
import { DEFAULT_COMPONENT_CONFIG } from "@/shared/types/components";

export interface CreateComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  composer: Composer | null;
  elementId: string | null;
}

function titleCase(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export const CreateComponentModal: React.FC<CreateComponentModalProps> = ({ isOpen, onClose, composer, elementId }) => {
  const { addToast } = useToast();
  const element = isOpen && composer && elementId ? composer.elements.getElement(elementId) : null;
  const type = element?.getType() ?? "element";
  const defaultName = (element && getLayerName(element)) || titleCase(type);
  const activePage = composer?.elements.getActivePage();
  const pageName = activePage?.name ?? "";

  const [name, setName] = React.useState("");
  const [convertMatching, setConvertMatching] = React.useState(false);
  const [scope, setScope] = React.useState<"site" | "page">("site");
  const [isCreating, setIsCreating] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const used = isOpen && composer ? composer.components.getAllComponents().length : 0;
  const max = DEFAULT_COMPONENT_CONFIG.maxComponents;
  const atLimit = used >= max;
  const trimmed = name.trim();
  const nameValid = trimmed.length >= 1 && trimmed.length <= NAME_MAX;
  const matches = React.useMemo(
    () => (isOpen && composer && elementId ? findMatchingElements(composer, elementId) : []),
    [isOpen, composer, elementId],
  );

  React.useEffect(() => {
    if (isOpen) setName(defaultName);
    else {
      setName("");
      setConvertMatching(false);
      setScope("site");
      setFailed(false);
    }
  }, [isOpen, defaultName]);

  const handleSubmit = async () => {
    if (!composer || !elementId || !nameValid || atLimit || isCreating) return;
    setIsCreating(true);
    setFailed(false);
    try {
      const component = await composer.components.createComponent(name.trim(), elementId, {
        prefillFromDs: true,
        pageId: scope === "page" ? activePage?.id ?? null : null,
      });
      if (!component) {
        setFailed(true);
        return;
      }
      const converted = composer.components.adoptInstances(component.id, [
        elementId,
        ...(convertMatching ? matches : []),
      ]);
      const others = converted - 1;
      // 2L9 G13 / G14: "Hero heading component created.", then Components.
      addToast({
        description:
          others > 0
            ? `${component.name} component created · ${others} matching group${others === 1 ? "" : "s"} converted.`
            : `${component.name} component created.`,
      });
      composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "components" });
      onClose();
    } catch {
      setFailed(true);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ModalRoot open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <ModalContent size="confirm" data-testid="create-component-modal">
        <ModalTitle data-testid="create-component-title">
          Create component
        </ModalTitle>
        <ModalBody>
          <p className={LEAD} data-testid="create-component-lead">
            {defaultName}
            {pageName ? ` on ${pageName}` : ""} becomes the first instance.
          </p>
          <label htmlFor="create-component-name" className={LABEL}>
            Name
          </label>
          <TextInput
            id="create-component-name"
            sizing="sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSubmit();
            }}
            autoFocus
            maxLength={NAME_MAX}
            aria-invalid={nameValid ? undefined : true}
            aria-describedby={nameValid ? undefined : "create-component-name-error"}
            data-testid="create-component-name"
            className={nameValid ? "tw:mb-4 tw:w-full" : "tw:w-full tw:[&_input]:border-[var(--bk-error)]!"}
          />
          {nameValid ? null : (
            <p id="create-component-name-error" className={`${NOTE} tw:mb-2`} data-testid="create-component-name-error">
              Enter a name between 1 and {NAME_MAX} characters.
            </p>
          )}
          <div className={LABEL} id="create-component-scope-label">
            Where it can be used
          </div>
          <div role="radiogroup" aria-labelledby="create-component-scope-label" className="tw:flex tw:flex-col" data-testid="create-component-scope">
            <ScopeOption checked={scope === "site"} onPick={() => setScope("site")} label="Component library" caption="Reusable on every site in this workspace." />
            {activePage ? (
              <ScopeOption checked={scope === "page"} onPick={() => setScope("page")} label="This page" caption={`Only on ${pageName}.`} />
            ) : null}
          </div>
          {matches.length > 0 ? (
            <label className={CHECK_ROW} data-testid="create-component-convert">
              <Checkbox checked={convertMatching} onChange={(e) => setConvertMatching(e.target.checked)} />
              Also convert {matches.length} other matching {defaultName} group{matches.length === 1 ? "" : "s"} on {pageName || "this page"}
            </label>
          ) : (
            <p className={NOTE} data-testid="create-component-no-matches">
              No matching groups on {pageName || "this page"}.
            </p>
          )}
          <p className={NOTE} data-testid="create-component-usage">
            {atLimit ? `${used} of ${max} components. Delete one before creating another.` : `${used} of ${max} components`}
          </p>
          {isCreating ? (
            <p role="status" className={NOTE} data-testid="create-component-pending">
              Creating component…
            </p>
          ) : failed ? (
            <p role="alert" className={NOTE} data-testid="create-component-failed">
              Couldn’t create the component. The name and scope are kept; {defaultName} is unchanged.
            </p>
          ) : null}
        </ModalBody>
        <ModalFooter divided>
          <Button color="light" size="xs" className="tw:w-[72px]" data-testid="create-component-cancel" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button size="xs" className="tw:min-w-[184px]" data-testid="create-component-submit" onClick={() => void handleSubmit()} disabled={!nameValid || atLimit || isCreating}>
            {failed ? "Try again" : scope === "site" ? "Create and share component" : "Create component"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalRoot>
  );
};

/** One scope as the board draws it: a full-width bordered option, its
 *  radio dot and name centred, its caption under it (G05 / G06). */
function ScopeOption({ checked, onPick, label, caption }: { checked: boolean; onPick: () => void; label: string; caption: string }) {
  return (
    <>
      <Button
        color="light"
        size="xs"
        role="radio"
        aria-checked={checked}
        onClick={onPick}
        className="tw:h-8 tw:w-full tw:justify-center tw:gap-1.5 tw:text-[13px] tw:font-normal tw:text-[var(--bk-ink)] tw:focus:ring-0"
      >
        <span
          aria-hidden="true"
          className={`tw:inline-block tw:size-2 tw:rounded-full tw:border tw:border-[var(--bk-ink)] ${checked ? "tw:bg-[var(--bk-ink)]" : ""}`}
        />
        {label}
      </Button>
      <p className={NOTE}>{caption}</p>
    </>
  );
}

/** The longest component name the dialog takes (G07). */
const NAME_MAX = 200;

/* 2L9 G05: a 13 / ink lead, labels above their fields, 12 / muted notes. */
const LEAD = "tw:m-0 tw:mb-4 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
const LABEL = "tw:mb-2 tw:block tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink)]";
const NOTE = "tw:m-0 tw:py-2 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const CHECK_ROW = "tw:flex tw:items-center tw:gap-2 tw:py-2 tw:text-[13px] tw:text-[var(--bk-ink-soft)] tw:cursor-pointer";

export default CreateComponentModal;
