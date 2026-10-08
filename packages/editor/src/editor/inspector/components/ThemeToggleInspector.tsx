/**
 * ThemeToggleInspector — the inspector for a selected theme-toggle block,
 * board BRP1-M12 (canvas-light 8228:233132 · canvas-dark 8228:233404 ·
 * off-hidden-on-publish 8228:233827). The toggle has no settings of its own:
 * its values are the site's Brand colours and its behaviour is the site's Dark
 * mode, so the panel says which, and opens Brand › Colour mode to change it.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { DarkModeSchema } from "@buildrik/shared/schemas/design-tokens";
import { requestBrandPage } from "@/editor/design-system/ui/brandOpenRequest";

const SMALL = "tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-[18px]";

export const ThemeToggleInspector: React.FC<{ composer: Composer }> = ({ composer }) => {
  const read = React.useCallback(
    () => DarkModeSchema.catch("off").parse(composer.getProjectSettings?.()?.darkMode),
    [composer],
  );
  const [darkMode, setDarkMode] = React.useState(read);
  React.useEffect(() => {
    const sync = () => setDarkMode(read());
    composer.on(EVENTS.SETTINGS_CHANGE, sync);
    return () => {
      composer.off(EVENTS.SETTINGS_CHANGE, sync);
    };
  }, [composer, read]);

  return (
    <div className="bdi-panel" data-testid="inspector-panel">
      <div className="tw:flex tw:flex-col tw:items-start tw:gap-4 tw:p-4" data-testid="theme-toggle-inspector">
        <h2 className="tw:m-0 tw:text-[length:var(--bk-text-20)] tw:font-semibold tw:leading-[30px] tw:tracking-[-0.24px] tw:text-[var(--bk-ink)]">
          Theme toggle
        </h2>
        <p className={`${SMALL} tw:text-[var(--bk-ink-soft)]`}>Site preference</p>
        <p className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]" data-testid="theme-toggle-dark-mode">
          {`Dark mode · ${darkMode === "auto" ? "Auto" : "Off"}`}
        </p>
        <p className={`${SMALL} tw:text-[var(--bk-ink-soft)]`}>
          Light and dark values come from Brand. The toggle changes the visitor’s theme.
        </p>
        <Button type="button" variant="secondary" size="xs" onClick={() => requestBrandPage(composer, "colour-mode")}>
          Open Brand → Colour mode
        </Button>
        {darkMode === "off" && (
          <div
            role="status"
            data-testid="theme-toggle-hidden-note"
            className={`${SMALL} tw:w-full tw:bg-[var(--bk-warning-tint)] tw:p-3 tw:text-[var(--bk-ink)]`}
          >
            Dark mode is Off · Theme toggle is hidden on publish.
          </div>
        )}
      </div>
    </div>
  );
};
