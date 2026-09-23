# Module D · Publish · History · Review · Settings · AI — visual/pattern/IA pass

_Reconstructed after the reboot: agent summary + §6._

Report written to `/private/tmp/claude-501/-Users-shahg/b0605a7a-7551-4483-8ad1-16b86d46874d/scratchpad/interaction-audit/D-v.md`.

**Summary (module D · visual/pattern/IA pass)**

Scope: all 14 sections read (≈250 boards), plus the loose Settings/Review/Export/History dialogs and the Integrations family. Family majorities derived from the file's own reference dialogs (New page `4428:151059`, Replace Menu `4428:149521`, Button set sm=28/md=32).

Fixed (≈190 writes, all read back):
- **Critical:** `165478` Unsaved settings — both buttons had an empty `fills` override (white-on-white, no visible action on the guard every Settings "Back to canvas" routes to). Fills re-bound to the component variables.
- **40 dialogs** (Settings/Notification/Issues/Export/History/Review/Publish) restructured to the v3 footer anatomy: `foot` row, right-aligned, ghost → secondary → destructive → primary, 44-px height overrides reset to 28. `98036` reordered, `145168` footer right-aligned, `173587` dual primary → secondary, `166001` search result demoted from primary CTA, Add-a-domain / Edit-social-profile values wrapped in input frames.
- **Publish footers:** reactions moved from the `Panel footer` container to the button on 5 boards; cleared on Publishing…/No new changes/disabled load-error and the two hidden-button states; `98463` now shows "Reconnect Vercel" → OVERLAY `98009`, `99386` shows "Back to editor" → `123573` (spacer aligned so the note no longer collides).
- Preview `Done` ×3 → NAVIGATE Home `81300`; AI Draft "Plan changes" moved after the Prompt; Compare side-by-side 284→776 and count 2→5; ⌘K "GO TO" → "NAVIGATE".
- Review `118896` aligned to `115784`: OPEN · HOME/CONTACT/MENU headers (new Contact header), Contact comment regrouped, 3 Resolve buttons cloned with their CONDITIONALs, "EARLIER RESOLVED", reply row Author=internal.
- Drawer headers: raw 48-px headers on Issues ×3 and History ×2 replaced by the `Panel header` instance; ✕ wired → `123573` on 35 module-D drawers.
- Settings · Headers (rest) got the Save bar its dirty state already uses (Save keeps the `saveSucceeds` CONDITIONAL).

Handed off / reported (not changed): Exit cards `124664/125151` are being rebuilt concurrently by the editor-shell agent (new `4762:*` nodes appeared mid-session) — my interleaved edits were reverted to their structure and a recommendation (foot row + Button, Back → `123152`) is in the report. AI boards use a 280/820 shell (file is 300/800); no overlay on the page has a scrim (365/365); off-scale text sizes (SYSTEMS); Settings save pattern split three ways (owner); `Settings dirty` guard majority-unguarded; `119819` hard-coded counts; `118896` "4 open" after a reply is an owner ambiguity; Client review "Add note" is a raw frame acting as a second primary.

Consistent already: Settings shell/nav highlight on all 78 boards, Publish drawer rows, Review row anatomy, Client review 1280 surfaces, ⌘K disabled-row explanations, Integrations/Issues/Activity rows.

Verification: read-back on every write plus 0.5 screenshots of changed boards; all 40 dialogs are CENTER overlays so the shorter cards stay centred. No playback run — wiring changes are UNVERIFIED in playback. Nothing blocked.

## 6. Requests / blocked / ambiguities

# Module D · Publish · History · Review · Settings · AI — visual/pattern/IA pass (reconstructed: agent summary + §6)





**Cross-module / SYSTEMS**
1. AI section boards use canvas 820 / inspector 280 (file shell 800/300) — 15 boards `104313…107268`.
2. No overlay-opened frame on the page has a scrim (`overlayBackground NONE`, 365/365) — decide once, apply page-wide (`#111827` @ 0.5, `overlayBackgroundInteraction CLOSE`).
3. Text scale: dialog titles 22/18, settings pane title 28, Activity title 22, Save-bar links 12 — bind to `ui/16 · heading` / `ui/13 · row label` etc. (SYSTEMS).
4. Editor-shell agent: Exit cards `124664/125151` — put the Back into a `foot` row as a `Button/secondary`; on `124664` the Back currently opens the 1440 Settings page as an OVERLAY over the card — make it NAVIGATE.
5. Client review `121999/122170`: "Add note" (raw frame) should be a secondary button; convert to a `Button` instance.
6. Panel header ✕ still unwired on ~440 instances outside module D.

**Ambiguities for the owner**
- `118896` open count after a designer reply (4 vs 3).
- Settings save pattern: header button vs bottom Save bar — pick one for the 12 pages.
- Commerce PROPOSED drawers `145182/145403/145614` use a raw 52-px "Ecommerce" header; left as PROPOSED.

**Blocked** — nothing. (The Exit cards were yielded to the concurrent editor-shell rebuild rather than fought over.)
Shell cwd was reset to /Users/shahg