/**
 * AdvancedTab — Visibility, password, robots, custom code.
 *
 * Key fixes:
 * - Password protect: inline password field appears when toggle ON
 * - Section labels: Title Case (not ALL-CAPS)
 * - Robots meta: descriptive hints explaining when to use
 * - Custom head code: error display
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { UsePageSettingsReturn } from "./usePageSettings";

interface Props {
  s: UsePageSettingsReturn;
}

export const AdvancedTab: React.FC<Props> = ({ s }) => (
  <div className="pg-advanced">
    {/* ── Visibility Settings ───────────────────────────────────────────── */}
    <div className="pg-advanced__section">
      <div className="pg-advanced__section-title">Visibility Settings</div>

      <div className="pg-advanced__toggle-row">
        <div className="pg-advanced__toggle-info">
          <div className="pg-advanced__toggle-label">Hide from Navigation</div>
          <div className="pg-advanced__toggle-hint">
            Removes this page from auto-generated nav menus. Custom navigation components are not
            affected.
          </div>
        </div>
        <button
          className={`pg-toggle${s.visibility === "hidden" ? " pg-toggle--on" : ""}`}
          role="switch"
          aria-checked={s.visibility === "hidden"}
          onClick={() => s.setVisibility(s.visibility === "hidden" ? "live" : "hidden")}
        />
      </div>

      <div className="pg-advanced__toggle-row">
        <div className="pg-advanced__toggle-info">
          <div className="pg-advanced__toggle-label">Password Protect</div>
          <div className="pg-advanced__toggle-hint">
            Visitors need a password to access this page.
          </div>
        </div>
        <button
          className={`pg-toggle${s.visibility === "password" ? " pg-toggle--on" : ""}`}
          role="switch"
          aria-checked={s.visibility === "password"}
          aria-expanded={s.visibility === "password"}
          aria-controls="pg-password-field"
          onClick={() => s.setVisibility(s.visibility === "password" ? "live" : "password")}
        />
      </div>

      {s.visibility === "password" && (
        <div id="pg-password-field" className="pg-advanced__password-wrap">
          <label className="pg-advanced__password-label" htmlFor="page-password">
            Access Password <span className="pg-advanced__required">Required</span>
          </label>
          <div className="pg-advanced__password-row">
            <input
              id="page-password"
              type={s.showPassword ? "text" : "password"}
              className="pg-advanced__password-input"
              value={s.password}
              onChange={(e) => s.setPassword(e.target.value)}
              placeholder="Set access password..."
              autoFocus
            />
            <button
              className="pg-advanced__password-show"
              onClick={() => s.setShowPassword(!s.showPassword)}
              aria-label={s.showPassword ? "Hide password" : "Show password"}
            >
              {s.showPassword ? "Hide" : "Show"}
            </button>
            {s.password && (
              <button
                className="pg-advanced__password-copy"
                onClick={() => navigator.clipboard.writeText(s.password)}
                aria-label="Copy password"
              >
                Copy
              </button>
            )}
          </div>
          {!s.password.trim() && (
            <div className="pg-advanced__error" role="alert">
              Password is required before saving.
            </div>
          )}
          {/* Info banner — always shown when password protect is ON */}
          <div className="pg-advanced__info-banner" role="note">
            ℹ️ Password protection requires server-side enforcement. Verify your hosting
            configuration supports this feature before relying on it to protect sensitive content.
          </div>
        </div>
      )}
    </div>

    <div className="pg-advanced__divider" />

    {/* ── Search Engine Settings ────────────────────────────────────────── */}
    <div className="pg-advanced__section">
      <div className="pg-advanced__section-title">Search Engine Settings</div>

      <div className="pg-advanced__toggle-row">
        <div className="pg-advanced__toggle-info">
          <div className="pg-advanced__toggle-label">Allow Indexing</div>
          <div className="pg-advanced__toggle-hint">
            Let search engines index this page. Turn OFF for confirmation pages, admin pages, or
            private content.
          </div>
        </div>
        <button
          className={`pg-toggle${s.allowIndex ? " pg-toggle--on" : ""}`}
          role="switch"
          aria-checked={s.allowIndex}
          onClick={() => s.setAllowIndex(!s.allowIndex)}
        />
      </div>

      <div className="pg-advanced__toggle-row">
        <div className="pg-advanced__toggle-info">
          <div className="pg-advanced__toggle-label">Allow Following Links</div>
          <div className="pg-advanced__toggle-hint">
            Search engines follow outbound links on this page.
          </div>
        </div>
        <button
          className={`pg-toggle${s.allowFollow ? " pg-toggle--on" : ""}`}
          role="switch"
          aria-checked={s.allowFollow}
          onClick={() => s.setAllowFollow(!s.allowFollow)}
        />
      </div>
    </div>

    <div className="pg-advanced__divider" />

    {/* ── Custom Head Code ─────────────────────────────────────────────── */}
    <div className="pg-advanced__section">
      <div className="pg-advanced__section-title">Custom Head Code</div>
      {/* Warning banner — always visible */}
      <div className="pg-advanced__warn-banner" role="note">
        ⚠️ Custom code runs on every page load. Incorrect HTML can break your page layout. Only add
        code from trusted sources.
      </div>
      <textarea
        className={`pg-advanced__code${s.headCodeError ? " pg-advanced__code--error" : ""}`}
        rows={4}
        value={s.customHead}
        onChange={(e) => s.setCustomHead(e.target.value)}
        placeholder="<meta>, <link>, or <script> tags…"
        aria-label="Custom head code"
        aria-describedby="head-code-hint"
        spellCheck={false}
      />
      {s.headCodeError ? (
        <div className="pg-advanced__error" role="alert">
          {s.headCodeError}
        </div>
      ) : (
        <div id="head-code-hint" className="pg-advanced__hint">
          Code injected into this page&apos;s &lt;head&gt;. Example: analytics tags, fonts, custom
          meta.
        </div>
      )}
    </div>
  </div>
);
