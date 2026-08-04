# Resources

Ranked by trust. Repo evidence outranks vendor docs: the docs describe what a
component promises, the parity suite records what it actually rendered here.

## Tier 1 — evidence from this repo

| Resource | What it settles |
|---|---|
| `src/editor/chrome-ui/__tests__/flowbite-parity.test.tsx` | Which flowbite components were adopted vs rejected, and the DOM evidence for each verdict. Read this before adopting anything. |
| `packages/editor/CLAUDE.md` § DESIGN SYSTEM — SSOT CONTRACT | The canonical home table. One concept, one home. |
| `packages/editor/scripts/check-styling-ratchet.mjs` | What counts as in-scope chrome CSS and what is excluded, with a reason per row. |
| `packages/editor/scripts/check-chrome-ui-surface.mjs` | Why `chrome-ui/index.ts` is the only import surface, and the two bypasses that were closed. |
| `docs/plans/2026-08-01-one-component-system.md` | The arc itself, plus the /autoplan review report appended 2026-08-02. |
| `docs/superpowers/specs/2026-05-21-parallel-claude-sessions-design.md` | Locked decisions for running two sessions here: lane split, port map, single-writer rules, merge cadence. Written 2026-05-21, never run. |
| `docs/superpowers/runbooks/parallel-session-prompts.md` | Copy/paste launch prompt per lane, plus the nightly squash and rollback commands. |

## Tier 2 — vendor documentation

| Resource | Use for |
|---|---|
| [flowbite-react docs](https://flowbite-react.com/docs/getting-started/introduction) | Component APIs and theme shapes. Treat behaviour claims as unverified until the parity suite says otherwise. |
| [flowbite-react theming](https://flowbite-react.com/docs/customize/theme) | How the `theme` prop deep-merges — the mechanism `chrome-ui/mergeTheme.ts` is built on. |
| [Tailwind v4 docs](https://tailwindcss.com/docs) | Utility names, arbitrary values, and the `@source` scanning model that makes the `tw:` prefix pipeline work. |
| [MDN — CSS cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/Cascade) | Why two utilities of equal specificity have no reliable order, which is why `chrome-ui` variants never share a property. |
| [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/) | The keyboard contracts (`aria-pressed`, radio groups, menus) that `all: "unset"` was silently breaking. |
| [Claude Code — common workflows](https://docs.claude.com/en/docs/claude-code/common-workflows) | Subagents and the git-worktree parallel-session pattern. Generic; the repo's own 05-21 spec is tuned and outranks it. |
| [git-worktree(1)](https://git-scm.com/docs/git-worktree) | `add` / `list` / `remove` / `prune` semantics, and what a linked worktree does and does not share. |

## Tier 3 — communities

| Where | Good for |
|---|---|
| [flowbite-react GitHub Discussions](https://github.com/themesberg/flowbite-react/discussions) | Whether a behaviour gap is a bug or by design, answered by maintainers. |
| [r/webdev](https://reddit.com/r/webdev) · [Tailwind Discord](https://tailwindcss.com/discord) | Design-system migration war stories from people who have done a big-bang and lived with it. |

Not yet explored: a community specifically for visual-builder authors, which is
closer to the real problem than either of the above.
