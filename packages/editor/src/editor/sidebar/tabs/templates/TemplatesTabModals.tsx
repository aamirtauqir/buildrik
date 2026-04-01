/**
 * TemplatesTabModals — Replace check + Pro intercept modals
 *
 * Both modals are pure presentational: receive props, render markup.
 * All state lives in TemplatesTab.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createPortal } from "react-dom";
import type { TemplateItem } from "./templatesData";

// ============================================================================
// Replace Modal
// ============================================================================

export interface ReplaceModalProps {
  template: TemplateItem;
  currentPageCount: number;
  resetGlobalStyles: boolean;
  onResetChange: (v: boolean) => void;
  onCancel: () => void;
  onApply: () => void;
}

export const ReplaceModal: React.FC<ReplaceModalProps> = ({
  template,
  currentPageCount,
  resetGlobalStyles,
  onResetChange,
  onCancel,
  onApply,
}) =>
  createPortal(
    <div className="tpl-modal-overlay" onClick={onCancel}>
      <div className="tpl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tpl-modal-icon">⚠️</div>
        <div className="tpl-modal-title">Replace current canvas?</div>
        <p className="tpl-modal-desc">
          This will replace your current canvas with <strong>{template.name}</strong>:
        </p>
        <ul className="tpl-modal-scope-list">
          <li>
            📄 {currentPageCount} page{currentPageCount !== 1 ? "s" : ""} →{" "}
            {template.pageCount ?? 1} new page{(template.pageCount ?? 1) !== 1 ? "s" : ""}
          </li>
          <li>🏗 All sections and layout</li>
          <li>✍️ Placeholder content (your text stays if styles-only)</li>
        </ul>
        <div className="tpl-modal-info">
          <div className="tpl-modal-info-text">↩ You can undo this immediately after applying</div>
        </div>
        <label className="tpl-modal-checkbox-row">
          <input
            type="radio"
            name="tpl-style-mode"
            checked={!resetGlobalStyles}
            onChange={() => onResetChange(false)}
          />
          <span className="tpl-modal-checkbox-label">Keep my colors &amp; fonts</span>
        </label>
        <label className="tpl-modal-checkbox-row">
          <input
            type="radio"
            name="tpl-style-mode"
            checked={resetGlobalStyles}
            onChange={() => onResetChange(true)}
          />
          <span className="tpl-modal-checkbox-label">
            Also reset brand colors &amp; fonts to template defaults
          </span>
        </label>
        <div className="tpl-modal-hint">
          {resetGlobalStyles
            ? "Both layout and styles will be replaced"
            : "Unchecked = only layout changes. Your brand colors & fonts stay."}
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
    </div>,
    document.body
  );

// ============================================================================
// Pro Intercept Modal
// ============================================================================

export interface ProModalProps {
  templateName: string;
  onCancel: () => void;
  onUpgrade: () => void;
}

export const ProModal: React.FC<ProModalProps> = ({ templateName, onCancel, onUpgrade }) =>
  createPortal(
    <div className="tpl-modal-overlay" onClick={onCancel}>
      <div className="tpl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tpl-modal-icon">🔒</div>
        <div className="tpl-modal-title">This is a Pro template</div>
        <div className="tpl-modal-desc">
          {templateName} is available on the Aquibra Pro plan. Upgrade to unlock 40+ premium
          templates.
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
    </div>,
    document.body
  );
