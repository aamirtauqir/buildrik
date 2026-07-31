/**
 * Select — the single pre-themed flowbite-react `Select` wrapper
 * (chrome-ui-single-surface spec §2(b)). Applies `BK_SELECT_BASE_THEME` by
 * default and deep-merges (`mergeTheme.ts`) any caller-supplied `theme` on
 * top — caller key wins, default keys survive — rather than a caller theme
 * silently replacing the default outright. 13 call sites currently pass
 * `theme={BK_SELECT_BASE_THEME}` by hand (spec §1); this wrapper makes that
 * the default so forgetting it stops being possible.
 *
 * The two bare-chrome variants (`BK_SELECT_BARE_UNIT_THEME`,
 * `BK_SELECT_BARE_VALUE_THEME` — `selectTheme.ts`) stay as caller-supplied
 * `theme` props through this same wrapper: passing one merges it on top of
 * `BK_SELECT_BASE_THEME`, and because both themes touch the exact same leaf
 * (`field.select.colors.gray`), the bare theme's value fully replaces the
 * base default's at that leaf — no residual base styling leaks through.
 *
 * `forwardRef` is load-bearing, not decorative: flowbite-react's own
 * `Select` spreads `ref` directly onto the real `<select>` element
 * (`Select.js`), and real call sites depend on that reaching the DOM node —
 * rename/search focus (`PageFolder.tsx:146`, `PageList.tsx:155`,
 * `LibraryManager.tsx:267`) and hidden file-input clicks
 * (`EmptyFolderDropZone.tsx:60`, `UploadZone.tsx:128`). A wrapper that drops
 * or narrows ref forwarding breaks those immediately.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Select as FlowbiteSelect, type SelectProps as FlowbiteSelectProps } from "flowbite-react";
import { BK_SELECT_BASE_THEME } from "./selectTheme";
import { mergeTheme } from "./mergeTheme";

export type SelectProps = FlowbiteSelectProps;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select({ theme, ...props }, ref) {
  return <FlowbiteSelect ref={ref} theme={mergeTheme(BK_SELECT_BASE_THEME, theme)} {...props} />;
});
