/**
 * TemplatesTabModals — Replace check + Pro intercept modals
 *
 * Both modals are pure presentational: receive props, render markup.
 * All state lives in TemplatesTab.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { TemplateItem } from "./templatesData";

// ============================================================================
// Replace Modal
// ============================================================================

export interface ReplaceModalProps {
  template: TemplateItem;
  resetGlobalStyles: boolean;
  onResetChange: (v: boolean) => void;
  onCancel: () => void;
  onApply: () => void;
}

export const ReplaceModal: React.FC<ReplaceModalProps> = ({
  template,
  resetGlobalStyles,
  onResetChange,
  onCancel,
  onApply,
}) => (
  <div className="tpl-modal-overlay" onClick={onCancel}>
    <div className="tpl-modal" onClick={(e) => e.stopPropagation()}>
      <div className="tpl-modal-icon">⚠️</div>
      <div className="tpl-modal-title">Replace current canvas?</div>
      <div className="tpl-modal-desc">
        Applying {template.name} will replace the current canvas content.
      </div>
      <div className="tpl-modal-info">
        <div className="tpl-modal-info-text">
          ✓ Auto-saved — your current version is saved before applying
        </div>
      </div>
      <label className="tpl-modal-checkbox-row">
        <input
          type="checkbox"
          checked={resetGlobalStyles}
          onChange={(e) => onResetChange(e.target.checked)}
        />
        <span className="tpl-modal-checkbox-label">Also reset global styles (colors, fonts)</span>
      </label>
      <div className="tpl-modal-hint">
        {resetGlobalStyles
          ? "Both layout and styles will be replaced"
          : "Layout only — your custom colors and fonts are preserved"}
      </div>
      <div className="tpl-modal-btns">
        <button className="tpl-modal-btn tpl-modal-btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="tpl-modal-btn tpl-modal-btn--primary" onClick={onApply}>
          Apply →
        </button>
      </div>
    </div>
  </div>
);

// ============================================================================
// Pro Intercept Modal
// ============================================================================

export interface ProModalProps {
  templateName: string;
  onCancel: () => void;
  onUpgrade: () => void;
}

export const ProModal: React.FC<ProModalProps> = ({ templateName, onCancel, onUpgrade }) => (
  <div className="tpl-modal-overlay" onClick={onCancel}>
    <div className="tpl-modal" onClick={(e) => e.stopPropagation()}>
      <div className="tpl-modal-icon">🔒</div>
      <div className="tpl-modal-title">This is a Pro template</div>
      <div className="tpl-modal-desc">
        {templateName} is available on the Aquibra Pro plan. Upgrade to unlock 40+ premium templates.
      </div>
      <div className="tpl-pro-details">
        <div className="tpl-pro-details-title">Pro Plan includes:</div>
        <div className="tpl-pro-details-list">
          ✓ 40+ premium templates
          <br />
          ✓ Custom domain
          <br />
          ✓ Remove Aquibra branding
          <br />✓ Priority support
        </div>
      </div>
      <div className="tpl-modal-btns">
        <button className="tpl-modal-btn tpl-modal-btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="tpl-modal-btn tpl-modal-btn--upgrade" onClick={onUpgrade}>
          Upgrade to Pro →
        </button>
      </div>
    </div>
  </div>
);
