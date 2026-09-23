# Defects the audit did not report, found while checking the ones it did

Each measured on the same fresh reads used to verify the audit's claims.

| where | defect | measurement |
|---|---|---|
| `156:2` Review panel · open | **"Revoke link" renders nowhere** — the control sits below a clipping board | text `1753:8438` is 25px past the bottom of a board with `clipsContent=true` |
| `1707:8433` Popover · Canvas · AI · prompt | a prototype label escapes the specimen | `1720:17491` "AI · streaming" sits 16px below the 248×96 popover |
| `1170:4713` Content · collection-setup | the delete glyph sits on the type-select chevron, on **all four** field rows | `🗑` × `⌄` overlap 6×12px at `1753:8421/8413/8405/8397` |
| `2865:22206` Inspector · MOTION | the arc's own new board carries an overprint | `2865:22216` "Slide In Up · Entrances" over `2865:22215` "When it scrolls into view", 150×14px |
| `2429:21281` Content · dynamic-pages · no-template | the board contradicts itself | "Generates 4 pages from published records." (`2429:21289`) sits directly above "No template page is bound, so publishing emits none of these yet." (`2987:21970`) |
| `140:2` and its two clones | the Pages defect is clone-propagated | the same 7×6px "⚂ Structure" × "3" collision on `2898:12617` and `2898:21981`, both named "(of 140:2)" |
| `199:205` Shell state 3 · Element selected | the canvas selection badge collides with the project name | `199:296` "Section · Hero" over `199:288` "Bella Cucina", 50×4px |
| `1776:*` sections | **11 more** section titles carry stale counts than F22 names | `BOARD-BASELINE.json`: Brand 51/52, Content 46/47, Publish 24/25, Insert 28/29, Compare 16/17, Review 38/39, Settings 48/49, Canvas 14/16, Ecommerce 5/6, Media and Layers correct |

Two from the code side, from `CODE-TRUTH.md`:

- `LayoutShell.Footer` (`LayoutShell.tsx:332`) has **zero consumers** — that dead
  slot is the mechanical cause of F15.
- `component-library/ComponentRow.tsx` is exported and tested but never renders;
  `ComponentsTab.tsx:250-275` inlines its own rows. Anyone auditing the Components
  row from that file is reading a component that does not ship.
