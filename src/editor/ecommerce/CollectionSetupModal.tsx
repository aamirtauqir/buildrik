/**
 * Collection Setup Modal
 * Prompts user to create Products collection when dropping e-commerce blocks
 * @license BSD-3-Clause
 */

import { ShoppingBag, Package, Check } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { Button } from "../../shared/ui/Button";
import { Modal } from "../../shared/ui/Modal";

export interface CollectionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (includeSampleData: boolean) => void;
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
  onSkip,
}) => {
  const [includeSample, setIncludeSample] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const handleConfirm = async () => {
    setIsCreating(true);
    try {
      await onConfirm(includeSample);
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  const handleSkip = () => {
    onSkip?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set Up Products Collection" size="sm">
      <div style={containerStyles}>
        <div style={iconContainerStyles}>
          <ShoppingBag size={48} style={{ color: "#3b82f6" }} />
        </div>

        <p style={descriptionStyles}>
          E-commerce blocks require a Products collection in your CMS. Would you like to create one
          now?
        </p>

        <div style={checkboxContainerStyles}>
          <label style={checkboxLabelStyles}>
            <input
              type="checkbox"
              checked={includeSample}
              onChange={(e) => setIncludeSample(e.target.checked)}
              style={checkboxStyles}
            />
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
            <Check size={16} style={{ color: "#10b981" }} />
            <span>8 product fields (name, price, image, etc.)</span>
          </div>
          <div style={featureItemStyles}>
            <Check size={16} style={{ color: "#10b981" }} />
            <span>Validation rules included</span>
          </div>
          <div style={featureItemStyles}>
            <Check size={16} style={{ color: "#10b981" }} />
            <span>Ready for CMS data binding</span>
          </div>
        </div>
      </div>

      <div style={footerStyles}>
        <Button variant="ghost" onClick={handleSkip} disabled={isCreating}>
          Skip for now
        </Button>
        <Button variant="primary" onClick={handleConfirm} disabled={isCreating}>
          {isCreating ? "Creating..." : "Create Collection"}
        </Button>
      </div>
    </Modal>
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
  color: "var(--aqb-text-secondary)",
  textAlign: "center",
  lineHeight: 1.5,
};

const checkboxContainerStyles: React.CSSProperties = {
  background: "var(--aqb-bg-elevated)",
  borderRadius: "8px",
  padding: "12px",
  border: "1px solid var(--aqb-border)",
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
  accentColor: "#3b82f6",
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
  color: "var(--aqb-text-secondary)",
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
  color: "var(--aqb-text-secondary)",
};

const footerStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
  marginTop: "16px",
  paddingTop: "16px",
  borderTop: "1px solid var(--aqb-border)",
};

export default CollectionSetupModal;
