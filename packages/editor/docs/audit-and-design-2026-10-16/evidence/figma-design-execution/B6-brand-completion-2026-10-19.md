# B6 Brand completion — 2026-10-19

DESIGN ONLY · Figma file `2L9OTGzBrL6kYmU18yA1c7`, page `05 · Resources` (`3:6`). No application code, tokens, data or deployment changed.

User instruction (2026-10-19): continue the whole plan in this file — “is ma implment karna hai sara plan ka hisab sae new design okay lets start”.

## Starting point

Frames B6-B01–B20 and the board “B6 Brand / checkpoint and interaction handoff” (`203:40929`) already existed on canvas, but no authoring script or ledger for them was in this folder. They were probably made in an earlier Codex session (not confirmed). Their board listed these as open: flush/failed-return companions, generated-dark and preview-discard variants, import count agreement and commit receipt, Connect pending/error. P09 also needed every token-kind page, From logo or URL, Restore points, Review changes, the loading/offline/held/empty states, Export and the layout below 1280.

## Delivered (33 frames + board `213:39075`)

| Frames | Contract | Script / ledger |
|---|---|---|
| B21 `207:38460` Typography · B22 `207:38727` Spacing · B23 `207:38995` Other kinds · B24 `207:39217` Radius · B25 `207:39439` Radius invalid draft · B26 `207:39789` Type styles · Presets · B27 `207:40046` Classes | P09 §4.1, §6; T-BR-01, T-BR-06 pattern for other kinds | `b6-brand-tokens-styles.js` (+ `-fixes`, `-fixes-2`, `-fixes-3`) |
| B28 `207:40289` replace before delete · B29 `207:40532` delete blocked, usage unknown · B30 `207:40771` reach note (>20 uses) · B31 `207:40997` Inspector door, ‹ Back to Heading | P09 §6, §9 last bullet; T-BR-07 | same |
| B32–B38 `210:36861`…`210:38222` From logo or URL: entry, reading, refused, timed out, preview (Light/Dark locked), applied + restore point + Undo, offline | P09 §7 From logo or URL, §8 preview ownership; T-BR-14, T-BR-17 | `b6-brand-sources-history.js` (+ `-fixes`) |
| B39 `210:38443` Restore points · B40 `210:38670` restored receipt · B41 `210:38897` Review changes with Revert | P09 §5 header | same |
| B42 `212:37895` loading · B43 `212:38135` offline · B44 `212:38369` save failed · B45 `212:38600` leave guard after failed save · B46 `212:38857` update held · B47 `212:39093` No brand set | P09 §9 leave guard, §10; T-BR-08, T-BR-17, T-BR-19 | `b6-brand-states-export.js` (+ `-fixes`) |
| B48 `212:39331` Export CSS/JSON/Tailwind · B49 `212:39590` import receipt (counts equal B16 dry-run) | P09 §7 Import/export; T-BR-04 | same |
| B50 `212:39840` discard current preview before another | P09 §8; T-BR-13 | same |
| B51 `212:40091` 1280×640 · B52 `212:40324` nav overlay · B53 `212:40564` preview toggle | P09 §8, §11; T-BR-16 | same |

The Brand navigation in all 20 earlier frames and the new ones now links between pages. Nav labels were centre-aligned in the earlier frames and are now left-aligned with 12px inset.

## Corrections made during the pass

- The active “Colors” nav item rendered solid black in four clones. Its fill binding was identical to working items, so this looks like a Figma override-render quirk. Fixed by replacing the instance with a fresh copy (`fixes-3`).
- The origin note on B31 overlapped the fixed 104px header. It now sits at the top of the body.
- The starter frames B32–35 and B38 duplicated the old “From logo or URL ›” link under the new card. Link removed; starter rows left-aligned.
- B36/B37 website preview now shows the previewed green primary, not the current blue.
- Compact topbar and bottom bar now fill exactly 1280px.

## Limits

- The Inspector door (B31) return is annotated only. Figma prototype links can’t cross pages.
- From logo or URL needs the engineering flag decoupling (`dsAi` → own flag, `theme.ts:219`) before it can ship.
- Not verified: keyboard/focus, screen reader, prototype playback, real extraction, persistence.
- Starter names are still placeholder copy (N8).

## Independent review and second pass

A read-only `design-qa-critic` agent reviewed B21–B53. It screenshotted 14 frames and read the structure of all 33. Its scripts and screenshots are in the session scratchpad `qa/`. It found 7 failing frames, including four P1s:

- B43: the Undo label was overwritten.
- B38 and B46: Restore points (and Review changes on B46) stayed enabled while offline or held.
- B49: the receipt did not match the B16 dry-run.

Fixed in `b6-brand-review-fixes.js` and `b6-brand-review-additions.js`:

- **P1s:** Undo restored. Restore points and Review changes are disabled with a reason. B49 was rebuilt from B16's own vocabulary: studio-tokens.json, Added 3, Modified 5, Skipped 0, Unsupported 2, 2 aliases became literals, 8 of 10 applied.
- **P2s:**
  - B47 Undo is disabled with a tooltip, Checks has no count and the preview is neutral.
  - The B31 reach note is gone before any edit, and the cross-page return is annotated.
  - Colors headers read “Colors · 4” (15 frames). All 60 swatches have a 1px border.
  - 294 empty prototype hotspots were removed. B28 Replace and B41 Revert are linked.
  - In the compact frames the title comes first, the toggle reads “Show website preview”, and the back link hugs its label.
- **P3s:** status strings follow SC-4, the starter name in B39 is from the starter list, B53 card is centred, B49 toast is centred over the body.
- **States the review found missing**, now drawn:
  - B54 Radius row menu and B55 inline rename
  - B56 server load error and B57 offline first load
  - B58 offline leave guard (no Save and leave)
  - B59 usage unknown on cards with Retry
  - B60 Generate scale preview → Add 10 tokens / Cancel
  - B61 Dark preview off with reason
  - B62 Undo tooltip naming the last action

Fresh screenshots of B43, B49, B54, B60 and B51 after the fixes show the corrections.

Still open:

- Pages for the other 10 kinds are represented by Radius only. The spec gives all 11 one generic editor.
- The header still mixes button styles (ghost Undo, outlined Restore points). It was left as built in B01–B20 and needs a shared header component in B10.
- Viewer access belongs to Panel 02.
- No re-review of the second pass has run yet.
