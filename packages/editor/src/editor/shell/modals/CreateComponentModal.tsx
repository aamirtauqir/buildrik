/**
 * CreateComponentModal — board 4418:142143 (C5 G1-098; owner rule: the board
 * wins on anything visual).
 *
 *   Create component
 *   Selected: <Page> › <Name> (<type>). Creating a master converts this
 *   <Name> into its first instance. Nothing else changes unless you opt in below.
 *   Name   [ … ]
 *   Scope  [ This site ▾ ]
 *   ☐ Also convert N other matching <Name> groups on this page
 *                                        Cancel · Create component
 *
 * The board's three fields are the whole form. Description, category, tags,
 * variant presets and the "Pre-fill from DS styles" toggle are gone (the
 * pre-fill keeps its default, ON). Scope has one option because components
 * are stored per site. "Matching" is an identical copy of the selection on
 * this page (engine/components/matchingGroups) — the only kind that becomes
 * an instance with nothing on screen changing; the registry holds the active
 * page only, which is why the sentence says page, not site.
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
  Select,
  TextInput,
  useToast,
} from "@/editor/chrome-ui";
import type { Composer } from "../../../engine";
import { findMatchingElements } from "../../../engine/components/matchingGroups";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";

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
  const pageName = composer?.elements.getActivePage()?.name ?? "";

  const [name, setName] = React.useState("");
  const [convertMatching, setConvertMatching] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);

  const matches = React.useMemo(
    () => (isOpen && composer && elementId ? findMatchingElements(composer, elementId) : []),
    [isOpen, composer, elementId],
  );

  React.useEffect(() => {
    if (isOpen) setName(defaultName);
    else {
      setName("");
      setConvertMatching(false);
    }
  }, [isOpen, defaultName]);

  const handleSubmit = async () => {
    if (!composer || !elementId || !name.trim()) return;
    setIsCreating(true);
    try {
      const component = await composer.components.createComponent(name.trim(), elementId, { prefillFromDs: true });
      if (!component) {
        addToast({ description: "Couldn't create the component", tone: "error" });
        return;
      }
      const converted = composer.components.adoptInstances(component.id, [
        elementId,
        ...(convertMatching ? matches : []),
      ]);
      const others = converted - 1;
      addToast({
        tone: "success",
        description:
          others > 0
            ? `“${component.name}” created — ${others} matching group${others === 1 ? "" : "s"} converted too.`
            : `“${component.name}” created.`,
      });
      onClose();
    } catch (error) {
      addToast({ description: error instanceof Error ? error.message : "Couldn't create the component", tone: "error" });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ModalRoot open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <ModalContent size="confirm" data-testid="create-component-modal">
        <ModalTitle className="tw:text-[length:var(--bk-text-16)]" data-testid="create-component-title">
          Create component
        </ModalTitle>
        <ModalBody>
          <p className={LEAD} data-testid="create-component-lead">
            Selected: {pageName ? `${pageName} › ` : ""}
            {defaultName} ({type}). Creating a master converts this {defaultName} into its first instance.
            Nothing else changes unless you opt in below.
          </p>
          <div className={ROW}>
            <label htmlFor="create-component-name" className={LABEL}>
              Name
            </label>
            <TextInput
              id="create-component-name"
              sizing="sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) void handleSubmit();
              }}
              autoFocus
              data-testid="create-component-name"
              className="tw:w-[240px]"
            />
          </div>
          <div className={ROW}>
            <label htmlFor="create-component-scope" className={LABEL}>
              Scope
            </label>
            <Select id="create-component-scope" sizing="sm" value="site" onChange={() => {}} className="tw:w-[240px]">
              <option value="site">This site</option>
            </Select>
          </div>
          {matches.length > 0 ? (
            <label className={CHECK_ROW} data-testid="create-component-convert">
              <Checkbox checked={convertMatching} onChange={(e) => setConvertMatching(e.target.checked)} />
              Also convert {matches.length} other matching {defaultName} group{matches.length === 1 ? "" : "s"} on this page
            </label>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button color="light" size="xs" className="tw:border-transparent tw:bg-transparent" data-testid="create-component-cancel" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button size="xs" data-testid="create-component-submit" onClick={() => void handleSubmit()} disabled={!name.trim() || isCreating}>
            {isCreating ? "Creating…" : "Create component"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalRoot>
  );
};

/* Board 4418:142143: 12/18 muted lead; a 152px label column at 13/20 soft,
   240px controls; 12px between rows; no ✕ (Esc and Cancel close); Cancel is
   borderless. */
const LEAD = "tw:m-0 tw:mb-3 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]";
const ROW = "tw:flex tw:items-center tw:gap-3 tw:mb-3";
const LABEL = "tw:w-[152px] tw:flex-none tw:text-[13px] tw:text-[var(--bk-ink-soft)]";
const CHECK_ROW = "tw:flex tw:items-center tw:gap-2 tw:text-[13px] tw:text-[var(--bk-ink-soft)] tw:cursor-pointer";

export default CreateComponentModal;
