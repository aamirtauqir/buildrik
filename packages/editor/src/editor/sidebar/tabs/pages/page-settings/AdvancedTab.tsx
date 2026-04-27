import { Button } from "@/shared/ui/Button";
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
    <div className="bd-pg-adv">
      {/* Visibility */}
      <div className="bd-pg-adv-section">
        <div className="bd-pg-adv-section-label">Visibility</div>
        <div className="bd-pg-adv-seg" role="radiogroup" aria-label="Page visibility">
          <Button
            type="button"
            role="radio"
            aria-checked={s.visibility === "live"}
            className={`bd-pg-adv-seg-btn${s.visibility === "live" ? " bd-pg-adv-seg-btn--on" : ""}`}
            onClick={() => s.setVisibility("live")}
          >Live</Button>
          <Button
            type="button"
            role="radio"
            aria-checked={s.visibility === "hidden"}
            className={`bd-pg-adv-seg-btn${s.visibility === "hidden" ? " bd-pg-adv-seg-btn--on" : ""}`}
            onClick={() => s.setVisibility("hidden")}
          >Hidden</Button>
          <Button
            type="button"
            role="radio"
            aria-checked={s.visibility === "password"}
            className={`bd-pg-adv-seg-btn${s.visibility === "password" ? " bd-pg-adv-seg-btn--on" : ""}`}
            onClick={() => s.setVisibility("password")}
          >Password</Button>
        </div>
        <div className="bd-pg-adv-hint">
          {s.visibility === "live" && "Page is publicly accessible."}
          {s.visibility === "hidden" && "Page is not linked in menus but reachable via direct URL."}
          {s.visibility === "password" && "Visitors must enter a password to view this page."}
        </div>
      </div>
      {/* Password input — only when visibility=password */}
      {s.visibility === "password" && (
        <div className="bd-pg-adv-password">
          <div className="bd-pg-adv-password-row">
            <input
              className="bd-pg-adv-password-input"
              type={s.showPassword ? "text" : "password"}
              value={s.password}
              onChange={(e) => s.setPassword(e.target.value)}
              placeholder="Enter password"
              aria-label="Page access password"
            />
            <Button
              className="bd-pg-adv-password-btn"
              onClick={() => s.setShowPassword(!s.showPassword)}
              type="button"
              aria-label={s.showPassword ? "Hide password" : "Show password"}
            >{s.showPassword ? "Hide" : "Show"}</Button>
            <Button
              className="bd-pg-adv-password-btn"
              onClick={() => s.copyPassword()}
              type="button"
              aria-label="Copy password"
              disabled={!s.password}
            >Copy</Button>
          </div>
          <div className="bd-pg-seo-hint">Share this password with visitors who need access.</div>
        </div>
      )}
      {/* Indexing */}
      <div className="bd-pg-adv-section">
        <div className="bd-pg-adv-section-label">Search Engine Indexing</div>
        <div className="bd-pg-adv-toggle-row">
          <div className="bd-pg-adv-toggle-info">
            <div className="bd-pg-adv-toggle-label">Allow indexing</div>
            <div className="bd-pg-adv-toggle-hint">Let search engines list this page in results.</div>
          </div>
          <Button
            type="button"
            role="switch"
            aria-checked={s.allowIndex}
            className={`bd-pg-adv-toggle${s.allowIndex ? " bd-pg-adv-toggle--on" : ""}`}
            onClick={() => s.setAllowIndex(!s.allowIndex)}
            aria-label="Allow indexing"
          />
        </div>
        <div className="bd-pg-adv-toggle-row">
          <div className="bd-pg-adv-toggle-info">
            <div className="bd-pg-adv-toggle-label">Follow links</div>
            <div className="bd-pg-adv-toggle-hint">Let search engines follow outbound links on this page.</div>
          </div>
          <Button
            type="button"
            role="switch"
            aria-checked={s.allowFollow}
            className={`bd-pg-adv-toggle${s.allowFollow ? " bd-pg-adv-toggle--on" : ""}`}
            onClick={() => s.setAllowFollow(!s.allowFollow)}
            aria-label="Follow links"
          />
        </div>
      </div>
      {/* Head code */}
      <div className="bd-pg-adv-section">
        <div className="bd-pg-adv-section-label">Custom &lt;head&gt; code</div>
        <textarea
          className="bd-pg-seo-textarea bd-pg-adv-head"
          value={s.customHead}
          onChange={(e) => s.setCustomHead(e.target.value)}
          placeholder="<!-- analytics, meta tags, fonts -->"
          rows={6}
          spellCheck={false}
          aria-label="Custom head code"
        />
        {s.headCodeError && <div className="bd-pg-seo-error">{s.headCodeError}</div>}
        <div className="bd-pg-seo-hint">Injected into the &lt;head&gt; of this page only. Sanitized before save.</div>
      </div>
    </div>
  );
};

AdvancedTab.displayName = "AdvancedTab";
