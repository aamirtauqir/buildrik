# BD-25 — independent compact Pages-width review

Date: 2026-10-18. Mode: DESIGN ONLY, read-only Figma review. File `2L9OTGzBrL6kYmU18yA1c7`.

## Result

**No blocking visual or geometry defect found in the sampled compact-width correction. PARTIALLY VERIFIED.** The 284px normal manager matches the authorized left-panel width without removing the sampled actions. Detailed Listings remains the explicit wider exception. This is a bounded design review, not full B3 acceptance or runtime verification.

## Evidence

| Sample | Independently inspected result |
|---|---|
| Main manager `63:6393` | At x56/y56, width284, ending at x340. Pages active rail remains visible; search, Pages/Listings/Structure/More, six created-page tabs and separate status fit. Screenshot `/tmp/bd25-main.png`. |
| Rename `63:14567` | Inline card `63:15243` is260×198; value input236×28. URL consequence fits; Keep URL, Update URL and Cancel remain visible. Controls are stacked without reducing readable text. Body `63:15090` is284×705, clips content and declares VERTICAL scrolling. Lower collection actions below the fold remain in that scroll region. Screenshot `/tmp/bd25-rename.png`. |
| Recovery `63:20001` | Metadata visibly wraps to two lines, with expiry alongside and Restore below. Actual recovery row `64:19112` is260×80, not48; identity173×48 includes173×32 metadata. Restore, Back to Pages, retention guidance and footer explanation fit. Screenshot `/tmp/bd25-recovery.png`. |
| Structure `63:21939` | Tree indentation remains legible, including nested Blog post and its path; 20 pages label fits. Explanatory copy wraps to two lines. Screenshot `/tmp/bd25-structure.png`. |
| Empty result `63:22616` | Search value, no-results message and Clear search fit; manager navigation and footer retained. Screenshot `/tmp/bd25-empty.png`. |
| Menus | Page actions `63:14496`: x340/y250,280×330. More `65:17824`: x56/y188,280×170. Both fit desktop bounds; 32px menu items retained. Native geometry inspected; menu playback not run. |
| Footer | Example `63:15228`:284×48, Add page94×32, From template115×32, folder action32×32. No action overlaps panel edge or bottom tabs. |
| Short manager `78:19785` | 1440×600 shell, panel `78:19992` x56/y56,284×512. Body405px high, VERTICAL/clipped; content reaches581px. Footer48px fixed above bottom bar. Help, footer and tabs/status visibly fit. Screenshot `/tmp/bd25-short.png`. |
| Narrow manager `78:20392` | 1024×768 shell, panel `78:20509` x56/y56,284×680. Body573px high, VERTICAL/clipped; footer48px fixed. Rail Help, footer, toolbar and bottom tabs/status fit. Screenshot `/tmp/bd25-narrow.png`. |

Native route readback also preserves main rail `74:12713`→`63:6393`, changed-URL rail `74:13434`→`64:10927`, deleted rail `74:13454`→`63:19334`, and kept-URL rail `74:13474`→`63:23182`. These are structural destinations, not executed journeys.

## Handoff and remaining limits

- BD-25 is recorded in the canonical brief and P11, superseding560px normal width while retaining720px expanded Listings. The author was asked to document the measured80px recovery-row exception: wrapping preserved metadata at284px requires more height than the earlier48px recovery specimen. Final readback of `pages-compact-width.md` confirms the80px exception, retained48px footer and separate normal40px rows. Documentation closure passes.
- Normal resource rows remain260×40 with ending truncation. Long-label tooltip/accessible-name behavior is a runtime acceptance requirement. The short fixture does not prove arbitrary page-name or URL fit.
- The current rename consequence is a short URL. Long URL wrapping/expansion, focused-input horizontal scrolling, long metadata and translated text still need stress validation; consequential old/new URL text must remain accessible.
- Scroll-region structure is verified, but scrolling and keyboard access were **NOT RUN**. Footer visibility must not be interpreted as proof that all off-screen actions were reached interactively.
- Short/narrow examples cover the default manager. Open menus, expanded rename and recovery at those viewports still require clamp/focus/playback checks. Desktop menu fit does not establish those cases.
- Prototype traversal, P/Escape focus restoration, draft guards, page switching, undo/restore/persistence, assistive technology and browser implementation: **NOT RUN**. Previously unwired B3 destinations remain pending.
- The author's13 resized manager states were sampled rather than exhaustively re-audited. No application code or Figma nodes were changed by this reviewer.

**Closure:** sampled desktop, narrow and short compact panels pass the bounded visual/geometry review. Preserve PARTIALLY VERIFIED status and the existing incomplete B3 scope.

Final documentation closure: `pages-compact-width.md` read after save; it records13 resized normal states plus two viewport specimens (15 compact specimens), retains expanded Listings720px, and explicitly limits verification to design/structural evidence. No outstanding documentation blocker for this bounded correction.
