/**
 * Deep-merges a caller-supplied flowbite-react theme fragment on top of a
 * wrapper's default theme object — caller keys win per-leaf; any default key
 * the caller doesn't touch survives untouched. `TextInput.tsx` and
 * `Select.tsx` both use this to compose `BK_TEXT_INPUT_THEME` /
 * `BK_SELECT_BASE_THEME` with whatever `theme` prop a call site passes.
 *
 * This is necessary because flowbite-react's own `theme` prop is a single
 * slot: `TextInput`/`Select` resolve their final theme via
 * `useResolveTheme([builtInTheme, providerTheme, props.theme])`
 * (`resolve-theme.js`) — there is no second array slot for a wrapper's own
 * default to sit between flowbite's built-in theme and the caller's prop.
 * Passing the caller's `theme` straight through — the naive approach — would
 * silently drop every `BK_*` default key the caller didn't happen to repeat
 * (e.g. a caller overriding only `field.input.base` would lose
 * `field.input.colors.gray` entirely, un-styling the input). Merging here
 * first, then handing flowbite ONE fully-composed object, avoids that.
 *
 * Leaf conflicts (both sides define the same string key) resolve to the
 * caller's value outright — no tailwind-merge string concatenation at this
 * layer. That's intentional: flowbite's own `resolveTheme` still runs
 * `twMerge` between our composed theme and its built-in defaults afterward,
 * so tailwind-class conflict resolution already happens one layer down: the
 * wrapper only needs to decide *which object* (default vs. caller) supplies
 * a given leaf, not how to blend two class strings together.
 *
 * @license BSD-3-Clause
 */

function isThemeObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeTheme<T>(base: T, override: T | undefined): T {
  if (override === undefined) return base;
  if (!isThemeObject(base) || !isThemeObject(override)) return override;

  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    result[key] = mergeTheme(base[key], override[key]);
  }
  return result as T;
}
