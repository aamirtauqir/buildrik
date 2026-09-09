# Board hex drift — what the boards carry that the palette does not

Recorded 2026-09-09, when `check-hex-drift.mjs` first ran over the full V1
capture set (342 boards, up from the 8 it shipped against). Every row is a
colour a Figma board specifies that resolves to no token and is not
allowlisted. The gate now holds these as a **ratchet** — they print on every
run, cannot grow, and shrink as boards are corrected.

They are recorded here rather than added to `hex-allowlist.txt` because the
allowlist means "this colour is correct and simply absent from the token set".
Most of these are not correct.

## The one that matters most

`#406ed6` is the **retired accent**. The code migrated to `#1A56DB` on
2026-07-30 (DESIGN.md §Color, "One blue everywhere"); 23 boards were never
updated and still draw the old one. Any surface built faithfully from those
boards ships the wrong blue, and the conformance diff will call the correct
code a failure against the stale board. `#4270d9`, `#4063f2`, `#668ce5` and
`#1a57db` are near-misses of the same family — `#1a57db` is one digit from the
current accent, which is the shape of a hand-typed hex rather than a token.

`#7c3aed` is violet, which DESIGN.md bans outright. `#ff00ff` is magenta in
four places on one board — a debug fill nobody removed.

## Everything the ratchet holds

| Hex | Boards | Sample captures |
|---|---|---|
| `#406ed6` | 23 | brand-export-error, brand-export-exported, brand-export-imported … |
| `#d9d9d9` | 6 | ai-idle, canvas-toolbar-states, components-detail … |
| `#fde68a` | 6 | s7-settings-domains, s7-settings-forms, s7-settings-headers … |
| `#fffbeb` | 6 | s7-settings-domains, s7-settings-forms, s7-settings-headers … |
| `#ef4444` | 5 | brand-dirty, brand-lint-suppressed, brand-lint-warnings … |
| `#8e4b10` | 5 | brand-import-export, brand-root, layers-component-instance … |
| `#4270d9` | 4 | insert-blocks-expanded, insert-components-expanded, insert-elements-expanded … |
| `#111928` | 4 | s1-flows-session-expired-unsaved-warning, s1-flows-view-mode-stripped-chrome, s7-0-navigation-model-drill-in-new-2026-08-2 … |
| `#6b7380` | 3 | canvas-toolbar-states, history-saves, inspector-profile-container-fallback |
| `#ccccd1` | 3 | layers-scroll-overflow, s3-11-smart-guides-snap-indicators, s3-flows-preview-responsive-mobile-device-fr |
| `#fff7eb` | 3 | publish-confirm, publish-pre-checks, publish-pre-checks-blocked |
| `#4063f2` | 3 | s1-1b-first-run-browse-templates-templates-d, s1-flows-conflict-review-both, s1-flows-s1-1d-template-applied-first-conten |
| `#1a1a1a` | 2 | inspector-profile-text, s1-3b-new-page-template-picker |
| `#e8edff` | 2 | layers-context-menu, layers-expanded |
| `#cccccc` | 2 | pages-bulk-select, s1-flows-conflict-review-both |
| `#fafafa` | 2 | s1-3b-new-page-template-picker, s1-flows-conflict-review-both |
| `#fef3c7` | 1 | client-sign-off-e-post-approval-edited |
| `#166534` | 1 | history-published-tab |
| `#f0f9f4` | 1 | history-published-tab |
| `#334155` | 1 | inspector-multi-select |
| `#e2e5f8` | 1 | inspector-profile-input |
| `#1a57db` | 1 | layers-renaming |
| `#9da3af` | 1 | media-import-url-invalid |
| `#7c3aed` | 1 | publish-issues-confirm |
| `#334066` | 1 | s1-1e-template-preview-full-page |
| `#d9deeb` | 1 | s1-1e-template-preview-full-page |
| `#ebedf5` | 1 | s1-1e-template-preview-full-page |
| `#268c40` | 1 | s1-2f-save-indicator-5-states |
| `#998026` | 1 | s1-2f-save-indicator-5-states |
| `#b2661a` | 1 | s1-2f-save-indicator-5-states |
| `#bf2626` | 1 | s1-2f-save-indicator-5-states |
| `#e0e0e0` | 1 | s1-3b-new-page-template-picker |
| `#4d4d4d` | 1 | s1-flows-conflict-review-both |
| `#808080` | 1 | s1-flows-conflict-review-both |
| `#e6e6e6` | 1 | s1-flows-conflict-review-both |
| `#267333` | 1 | s1-flows-s1-2e-offline-connection-restored-s |
| `#d9f2de` | 1 | s1-flows-s1-2e-offline-connection-restored-s |
| `#f2f2f5` | 1 | s3-10-keyboard-shortcuts-overlay |
| `#668ce5` | 1 | s3-11-smart-guides-snap-indicators |
| `#ff00ff` | 1 | s3-11-smart-guides-snap-indicators |
| `#ff4444` | 1 | s3-11-smart-guides-snap-indicators |
| `#4d4d66` | 1 | s3-2-drop-target-insertion-indicators |
| `#ccccd9` | 1 | s3-2-drop-target-insertion-indicators |
| `#808099` | 1 | s3-4-responsive-viewport-breakpoint-bar |
| `#d9e5ff` | 1 | s3-4-responsive-viewport-breakpoint-bar |
| `#80b2ff` | 1 | s3-9-undo-redo-toast-6-variants |
| `#d93333` | 1 | s3-flows-context-menu-right-click |
| `#bfbfcc` | 1 | s3-flows-preview-responsive-mobile-device-fr |
| `#4d8ce5` | 1 | s5-10-activity-log |
| `#ffbf33` | 1 | s5-flows-reviewer-view-external-reviewer |
| `#fff2d9` | 1 | s5-flows-reviewer-view-external-reviewer |
| `#73738c` | 1 | s6-2-custom-domain-dns-verification |
| `#cc991a` | 1 | s6-2-custom-domain-dns-verification |

## How to clear a row

Fix the fill in Figma, re-run `pnpm run conformance:extract <board>` so the
capture changes, then `node scripts/conformance/check-hex-drift.mjs
--update-baseline` and commit the shrunken baseline. The diff is the review
trail.
