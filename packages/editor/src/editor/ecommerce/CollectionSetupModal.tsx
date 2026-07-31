/**
 * Collection Setup Modal
 * Prompts user to create Products collection when dropping e-commerce blocks
 * @license BSD-3-Clause
 */

import { ShoppingBag, Package, Check } from "lucide-react";
import * as React from "react";
import { ModalClose, ModalContent, ModalRoot, ModalTitle, Portal } from "@/editor/chrome-ui";
import { useState } from "react";
import { Button, Checkbox } from "flowbite-react";

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
    <Portal>
      <ModalRoot open={isOpen} onOpenChange={(next) => !next && onClose()}>
        <ModalContent size="lg">
          <ModalTitle>Set Up Products Collection</ModalTitle>
          <ModalClose aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </ModalClose>
          <div className="bd-modal__body">
      <div style={containerStyles}>
        <div style={iconContainerStyles}>
          <ShoppingBag size={48} style={{ color: "var(--bk-accent)" }} />
        </div>

        <p style={descriptionStyles}>
          E-commerce blocks require a Products collection in your CMS. Would you like to create one
          now?
        </p>

        <div style={checkboxContainerStyles}>
          <label style={checkboxLabelStyles}>
            <Checkbox
              color="blue"
              className="tw:bg-white"
              checked={includeSample}
              onChange={(e) => setIncludeSample(e.target.checked)}
              style={checkboxStyles} />
            <div style={checkboxContentStyles}>
              <div style={checkboxTitleStyles}>
                <Package size={16} />
                Include sample products
              </div>
              <div style={checkboxDescStyles}>Add 3 example products to get started quickly</div>
            </div>
          </label>
        </div>

        <div style={featuresListStyles}>
          <div style={featureItemStyles}>
            <Check size={16} style={{ color: "var(--bk-success)" }} />
            <span>8 product fields (name, price, image, etc.)</span>
          </div>
          <div style={featureItemStyles}>
            <Check size={16} style={{ color: "var(--bk-success)" }} />
            <span>Validation rules included</span>
          </div>
          <div style={featureItemStyles}>
            <Check size={16} style={{ color: "var(--bk-success)" }} />
            <span>Ready for CMS data binding</span>
          </div>
        </div>
      </div>
      <div style={footerStyles}>
        <Button color="light" onClick={handleSkip} disabled={isCreating} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
          Skip for now
        </Button>
        <Button onClick={handleConfirm} disabled={isCreating}>
          {isCreating ? "Creating..." : "Create Collection"}
        </Button>
      </div>
          </div>
        </ModalContent>
      </ModalRoot>
    </Portal>
  );
};

const containerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const iconContainerStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  padding: "8px 0",
};

const descriptionStyles: React.CSSProperties = {
  margin: 0,
  color: "var(--bk-ink-soft)",
  textAlign: "center",
  lineHeight: 1.5,
};

const checkboxContainerStyles: React.CSSProperties = {
  background: "var(--bk-bg-card)",
  borderRadius: "var(--bk-radius-lg)",
  padding: "12px",
  border: "1px solid var(--bk-border)",
};

const checkboxLabelStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  cursor: "pointer",
};

const checkboxStyles: React.CSSProperties = {
  width: "18px",
  height: "18px",
  marginTop: "2px",
  accentColor: "var(--bk-accent)",
};

const checkboxContentStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const checkboxTitleStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: 500,
};

const checkboxDescStyles: React.CSSProperties = {
  fontSize: "13px",
  color: "var(--bk-ink-soft)",
};

const featuresListStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "8px 0",
};

const featureItemStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "13px",
  color: "var(--bk-ink-soft)",
};

const footerStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
  marginTop: "16px",
  paddingTop: "16px",
  borderTop: "1px solid var(--bk-border)",
};

export default CollectionSetupModal;
