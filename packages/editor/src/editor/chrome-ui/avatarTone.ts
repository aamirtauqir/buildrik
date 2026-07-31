/**
 * Avatar tone → flowbite-react theme override, plus initials derivation.
 *
 * Extracted here rather than inlined at each of Avatar's 2 consumers
 * (CommentRow.tsx, Presence.tsx) because both the initials algorithm and the
 * 5-tone color table are genuine shared logic (CLAUDE.md rule 3, no
 * duplicate logic), not a literal prop value — this is a plain data/function
 * module, not a React component middle-man, so it doesn't reintroduce the
 * pass-through-wrapper anti-pattern Task 5 is draining.
 *
 * flowbite's `Avatar` `color` prop only recolors the `bordered` ring, never
 * the initials background/text (`theme.root.img.off` / `theme.root.initials.text`
 * are fixed `bg-gray-100`/`text-gray-600` regardless of `color` — verified
 * against `Avatar.js`/`theme.js`). The only way to recolor per tone is the
 * per-instance `theme` prop, which flowbite-react string-merges via its own
 * `twMerge` (`resolve-theme.js`), so a `tw:bg-*`/`tw:text-*` override here
 * correctly replaces the default rather than concatenating alongside it.
 *
 * @license BSD-3-Clause
 */
import type { CustomFlowbiteTheme } from "flowbite-react/types";

export type AvatarTone = "neutral" | "blue" | "green" | "purple" | "amber";

export function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0] ?? "").join("").toUpperCase();
}

/** Hex-exact to the old --bk-{tone}-100/-800 pairs — see
 *  docs/plans/flowbite-bigbang-inventory.md "Task 5" Avatar section. */
export const AVATAR_TONE_THEME: Record<AvatarTone, NonNullable<CustomFlowbiteTheme["avatar"]>> = {
  neutral: { root: { img: { off: "tw:bg-gray-200" }, initials: { text: "tw:text-gray-700" } } },
  blue: { root: { img: { off: "tw:bg-blue-100" }, initials: { text: "tw:text-blue-800" } } },
  green: { root: { img: { off: "tw:bg-green-100" }, initials: { text: "tw:text-green-800" } } },
  purple: { root: { img: { off: "tw:bg-purple-100" }, initials: { text: "tw:text-purple-800" } } },
  amber: { root: { img: { off: "tw:bg-yellow-100" }, initials: { text: "tw:text-yellow-800" } } },
};
