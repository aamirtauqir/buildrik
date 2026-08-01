/**
 * TextInput — the single pre-themed flowbite-react `TextInput` wrapper
 * (chrome-ui-single-surface spec §2(b)). Applies `BK_TEXT_INPUT_THEME` by
 * default and deep-merges (`mergeTheme.ts`) any caller-supplied `theme` on
 * top — caller key wins, default keys survive — rather than a caller theme
 * silently replacing the default outright. 60 call sites currently pass
 * `theme={BK_TEXT_INPUT_THEME}` by hand (spec §1); this wrapper makes that
 * the default so forgetting it stops being possible.
 *
 * `forwardRef` is load-bearing, not decorative: flowbite-react's own
 * `TextInput` spreads `ref` directly onto the real `<input>` element
 * (`TextInput.js`), and real call sites depend on that reaching the DOM
 * node — rename/search focus (`PageFolder.tsx:146`, `PageList.tsx:155`,
 * `LibraryManager.tsx:267`) and hidden file-input clicks
 * (`EmptyFolderDropZone.tsx:60`, `UploadZone.tsx:128`). A wrapper that drops
 * or narrows ref forwarding breaks those immediately.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { TextInput as FlowbiteTextInput, type TextInputProps as FlowbiteTextInputProps } from "flowbite-react";
import { BK_TEXT_INPUT_THEME } from "./textInputTheme";
import { mergeTheme } from "./mergeTheme";

export type TextInputProps = FlowbiteTextInputProps;

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { theme, ...props },
  ref,
) {
  return <FlowbiteTextInput ref={ref} theme={mergeTheme(BK_TEXT_INPUT_THEME, theme)} {...props} />;
});
