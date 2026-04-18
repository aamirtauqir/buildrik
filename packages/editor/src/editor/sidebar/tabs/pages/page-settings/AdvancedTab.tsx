/**
 * AdvancedTab — Visibility, schedule, password, indexing, head code.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { UsePageSettingsReturn } from "./usePageSettings";

interface Props {
  s: UsePageSettingsReturn;
}

export const AdvancedTab: React.FC<Props> = ({ s }) => {
  return (
    <div className="pg-adv">
      {/* Visibility */}
      <div className="pg-adv__section">
        <div className="pg-adv__section-label">Visibility</div>
        <div className="pg-adv__seg" role="radiogroup" aria-label="Page visibility">
          <button
            type="button"
            role="radio"
            aria-checked={s.visibility === "live"}
            className={`pg-adv__seg-btn${s.visibility === "live" ? " pg-adv__seg-btn--on" : ""}`}
            onClick={() => s.setVisibility("live")}
          >Live</button>
          <button
            type="button"
            role="radio"
            aria-checked={s.visibility === "hidden"}
            className={`pg-adv__seg-btn${s.visibility === "hidden" ? " pg-adv__seg-btn--on" : ""}`}
            onClick={() => s.setVisibility("hidden")}
          >Hidden</button>
          <button
            type="button"
            role="radio"
            aria-checked={s.visibility === "password"}
            className={`pg-adv__seg-btn${s.visibility === "password" ? " pg-adv__seg-btn--on" : ""}`}
            onClick={() => s.setVisibility("password")}
          >Password</button>
        </div>
        <div className="pg-adv__hint">
          {s.visibility === "live" && "Page is publicly accessible."}
          {s.visibility === "hidden" && "Page is not linked in menus but reachable via direct URL."}
          {s.visibility === "password" && "Visitors must enter a password to view this page."}
        </div>
      </div>

      {/* Password input — only when visibility=password */}
      {s.visibility === "password" && (
        <div className="pg-adv__password">
          <div className="pg-adv__password-row">
            <input
              className="pg-adv__password-input"
              type={s.showPassword ? "text" : "password"}
              value={s.password}
              onChange={(e) => s.setPassword(e.target.value)}
              placeholder="Enter password"
              aria-label="Page access password"
            />
            <button
              className="pg-adv__password-btn"
              onClick={() => s.setShowPassword(!s.showPassword)}
              type="button"
              aria-label={s.showPassword ? "Hide password" : "Show password"}
            >{s.showPassword ? "Hide" : "Show"}</button>
            <button
              className="pg-adv__password-btn"
              onClick={() => s.copyPassword()}
              type="button"
              aria-label="Copy password"
              disabled={!s.password}
            >Copy</button>
          </div>
          <div className="pg-seo__hint">Share this password with visitors who need access.</div>
        </div>
      )}

      {/* Indexing */}
      <div className="pg-adv__section">
        <div className="pg-adv__section-label">Search Engine Indexing</div>
        <div className="pg-adv__toggle-row">
          <div className="pg-adv__toggle-info">
            <div className="pg-adv__toggle-label">Allow indexing</div>
            <div className="pg-adv__toggle-hint">Let search engines list this page in results.</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={s.allowIndex}
            className={`pg-adv__toggle${s.allowIndex ? " pg-adv__toggle--on" : ""}`}
            onClick={() => s.setAllowIndex(!s.allowIndex)}
            aria-label="Allow indexing"
          />
        </div>
        <div className="pg-adv__toggle-row">
          <div className="pg-adv__toggle-info">
            <div className="pg-adv__toggle-label">Follow links</div>
            <div className="pg-adv__toggle-hint">Let search engines follow outbound links on this page.</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={s.allowFollow}
            className={`pg-adv__toggle${s.allowFollow ? " pg-adv__toggle--on" : ""}`}
            onClick={() => s.setAllowFollow(!s.allowFollow)}
            aria-label="Follow links"
          />
        </div>
      </div>

      {/* Head code */}
      <div className="pg-adv__section">
        <div className="pg-adv__section-label">Custom &lt;head&gt; code</div>
        <textarea
          className="pg-seo__textarea pg-adv__head"
          value={s.customHead}
          onChange={(e) => s.setCustomHead(e.target.value)}
          placeholder="<!-- analytics, meta tags, fonts -->"
          rows={6}
          spellCheck={false}
          aria-label="Custom head code"
        />
        {s.headCodeError && <div className="pg-seo__error">{s.headCodeError}</div>}
        <div className="pg-seo__hint">Injected into the &lt;head&gt; of this page only. Sanitized before save.</div>
      </div>
    </div>
  );
};

AdvancedTab.displayName = "AdvancedTab";
