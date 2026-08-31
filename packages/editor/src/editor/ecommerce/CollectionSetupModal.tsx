/**
 * Collection Setup Modal
 * Prompts user to create Products collection when dropping e-commerce blocks
 * @license BSD-3-Clause
 */

import { ShoppingBag, Package, Check } from "lucide-react";
import * as React from "react";
import { Button, Checkbox, ModalBody, ModalClose, ModalContent, ModalRoot, ModalTitle } from "@/editor/chrome-ui";
import { useState } from "react";

const FEATURE = "tw:flex tw:items-center tw:gap-2 tw:text-[13px] tw:text-[var(--bk-ink-soft)]";

export interface CollectionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Confirm handler. May be sync or async. If it rejects, the error
   * surfaces via `onError` (or console.error in dev) and the modal stays
   * open so the user can retry.
   */
  onConfirm: (includeSampleData: boolean) => void | Promise<void>;
  /** Surface async rejections from `onConfirm` (e.g., wire to toast). */
  onError?: (err: unknown) => void;
  onSkip?: () => void;
}

/**
 * Modal dialog for setting up the Products CMS collection
 * Shows when user first drops an e-commerce block
 */
export const CollectionSetupModal: React.FC<CollectionSetupModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onError,
  onSkip,
}) => {
  const [includeSample, setIncludeSample] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const handleConfirm = async () => {
    setIsCreating(true);
    try {
      await onConfirm(includeSample);
      onClose();
    } catch (err) {
      if (onError) onError(err);
      // eslint-disable-next-line no-console
      else console.error("[CollectionSetupModal] confirm failed (no onError handler)", err);
      // Modal stays open so user can retry.
    } finally {
      setIsCreating(false);
    }
  };

  const handleSkip = () => {
    onSkip?.();
    onClose();
  };

  return (
    <ModalRoot open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <ModalContent size="lg">
        <ModalTitle>Set Up Products Collection</ModalTitle>
        <ModalClose aria-label="Close modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </ModalClose>
        <ModalBody>
    <div className="tw:flex tw:flex-col tw:gap-4">
      <div className="tw:flex tw:justify-center tw:py-2">
        <ShoppingBag size={48} className="tw:text-[var(--bk-accent-text)]" />
      </div>

      <p className="tw:m-0 tw:text-center tw:leading-normal tw:text-[var(--bk-ink-soft)]">
        E-commerce blocks require a Products collection in your CMS. Would you like to create one
        now?
      </p>

      <div className="tw:p-3 tw:rounded-lg tw:border tw:border-[var(--bk-gray-200)] tw:bg-white">
        <label className="tw:flex tw:items-start tw:gap-3 tw:cursor-pointer">
          <Checkbox
            color="blue"
            checked={includeSample}
            onChange={(e) => setIncludeSample(e.target.checked)}
            className="tw:bg-white tw:mt-0.5 tw:size-4.5"
          />
          <div className="tw:flex tw:flex-col tw:gap-1">
            <div className="tw:flex tw:items-center tw:gap-2 tw:font-medium">
              <Package size={16} />
              Include sample products
            </div>
            <div className="tw:text-[13px] tw:text-[var(--bk-ink-soft)]">
              Add 3 example products to get started quickly
            </div>
          </div>
        </label>
      </div>

      <div className="tw:flex tw:flex-col tw:gap-2 tw:py-2">
        <div className={FEATURE}>
          <Check size={16} className="tw:text-[var(--bk-success)]" />
          <span>8 product fields (name, price, image, etc.)</span>
        </div>
        <div className={FEATURE}>
          <Check size={16} className="tw:text-[var(--bk-success)]" />
          <span>Validation rules included</span>
        </div>
        <div className={FEATURE}>
          <Check size={16} className="tw:text-[var(--bk-success)]" />
          <span>Ready for CMS data binding</span>
        </div>
      </div>
    </div>
    <div className="tw:flex tw:justify-end tw:gap-2 tw:mt-4 tw:pt-4 tw:border-t tw:border-[var(--bk-gray-200)]">
      <Button color="light" onClick={handleSkip} disabled={isCreating} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]">
        Skip for now
      </Button>
      <Button onClick={handleConfirm} disabled={isCreating}>
        {isCreating ? "Creating..." : "Create Collection"}
      </Button>
    </div>
        </ModalBody>
      </ModalContent>
    </ModalRoot>
  );
};

export default CollectionSetupModal;
