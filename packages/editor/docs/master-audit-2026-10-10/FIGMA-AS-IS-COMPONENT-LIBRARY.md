# CURRENT AS-IS reusable control library

10 October 2026. Created the authorized new page **01A — AS-IS / REUSABLE CONTROLS** in the existing Buildrick Figma file. [Open library page](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8286-1818) · [Open component board](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8287-2).

This is a CURRENT library for AS-IS reconstruction, not TO-BE work or a newly proposed design system. Controls reproduce states in the root-owned browser geometry captures. The three-column presentation board is documentation, not an application screen. Existing Figma pages and root-owned AS-IS page `8280:2` were not edited by this task. Application and test files were unchanged.

## Created and verified

Final native-node readback: **11 component sets, 29 component masters, 85 text nodes, 28 vector nodes, 6 instances, zero image fills**. Every master uses an Auto Layout wrapper and has source/capture provenance in its description. Board size is 1504×1312. Readback confirms five property-row compositions have label at x12/y6, size108×16 and reusable input instance at x128/y2, size160×24, inside a 299×28 row.

| Family | Component set | Captured variants / dimensions |
|---|---|---|
| Buttons | [8287:30](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8287-30) | Publish 77.58×32; Preview 76×32; AI chip40×24 |
| Inputs | [8287:67](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8287-67) | Text style, number/unit and colour160×24; Search pages247×32 |
| Tabs | [8287:84](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8287-84) | Style selected99.66×32; Behaviour and Effects rest99.67×32 |
| Segments | [8287:113](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8287-113) | Heading level with H2 selected204×24; Align with no selected value160×24 |
| Section headings | [8287:133](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8287-133) | Heading, Typography, Size open headers299×33 |
| Property rows | [8287:186](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8287-186) | Text style, Font size, Line height, Weight, Colour299×28; actual Auto Layout label/control columns |
| Menu rows | [8287:215](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8287-215) | Duplicate294×32; unavailable Paste style with reason294×44; destructive Delete294×32 |
| Navigation | [8287:233](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8287-233) | Selected Heading layer278×28; selected Brand Colours239×32 |
| Panel headers | [8287:244](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8287-244) | Pages279×44 with observed action glyphs |
| Context | [8287:255](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8287-255) | State Base94×24 |
| Icon buttons | [8288:18](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8288-18) | More rest and Hide inspector rest24×24 |

Full master IDs, exact floating-point dimensions, source references, capture rectangles, descriptions and instance structure are in the [node ledger](evidence/figma-current-controls-node-ledger.json). [Retained measured inputs](evidence/figma-current-controls-measured-inputs.json) contain the selected raw text/box/SVG records for all29 variants, including capture timestamps. They remain usable even if `/tmp` captures are removed.

## Reuse and source grounding

The existing Button set `9:102` was inspected directly because registered search had returned no results. Its primary/md/rest component **9:18** matches measured current Publish geometry: 32px height, 8px radius, Inter Medium13, white text, blue#1A56DB and16px horizontal padding. Publish master **8287:12** contains an instance of that existing master, with Label set to Publish. The original master was not changed; its variable bindings remain inherited.

The existing IconButton set **7196:78877** was also inspected. The new icon-button variants use the actual captured header SVGs; no claim is made that the old default glyph is the observed glyph. Preview's observed text colour differs from the inspected generic secondary Button, so it was reconstructed from capture rather than passed off as an exact generic instance.

The five property rows reuse the new native input masters. Their actual Auto Layout geometry is 12px left padding +108px label +8px gap +160px input +11px right padding =299px. Font size/line-height share the number/unit master with text overrides; Text style/Weight share the select master; Colour uses the colour master. The rest of the controls preserve captured fixed geometry inside Auto Layout masters; they are editable and reusable, but their interiors are not all fluid Auto Layout.

Current source anchors:

- [Button](../../src/editor/chrome-ui/Button.tsx), [PanelHeader](../../src/editor/chrome-ui/PanelHeader.tsx), [current tokens](../../src/themes/tokens.generated.css).
- [InputControls — SelectRow/InputWithUnit](../../src/editor/inspector/shared/controls/InputControls.tsx), [ColorInput](../../src/editor/inspector/shared/controls/ColorInput.tsx), [Section](../../src/editor/inspector/shared/controls/Section.tsx).
- [Inspector header](../../src/editor/inspector/components/InspectorHeader.tsx), [tabs](../../src/editor/inspector/ProInspector.tsx), [context](../../src/editor/inspector/components/ContextRow.tsx), [element menu](../../src/editor/inspector/components/InspectorElementMenu.tsx).
- [heading type controls](../../src/editor/inspector/sections/typeBlock/bodies/textBodies.tsx), [alignment controls](../../src/editor/inspector/sections/typography/FontControls.tsx), [Layers](../../src/editor/panels/layers), [Brand](../../src/editor/design-system/ui/BrandWorkspace.tsx).

Measurements came from `/tmp/buildrick-heading-layout.json`, `heading-menu`, `pages`, `layers` and `brand` captures, all10October2026. Inter Regular/Medium/Semi Bold and Geist Mono Regular loaded successfully. Number/unit and hex-value text retain the observed monospaced face. Captured colours were used directly outside the inherited Button bindings; this task did not create, replace or migrate global variables/styles.

The heading fixture here shows H2 selected, Text style Heading1, Font size36px, Line height1.2×, Weight700 and colour1a1a1a. These current fixture values must not be replaced with the earlier SaaS fixture's UX-10 values. Align intentionally has no selected segment. The unavailable menu row retains `Copy a style first`, and the destructive row retains its red label.

## Render review and limits

A screenshot was exported and inspected after node creation. It revealed unrelated underlying Inspector text included in the flat DOM geometry extraction beneath the menu overlay. Those extraneous layers were removed only from the new menu components; the retained measured-input artifact uses the corrected menu-item subset. Library presentation frames were also corrected to hug their children. A second export was inspected after these corrections and after property-row instance composition.

[Final rendered sample](evidence/figma-current-controls.png) is1504×1312. Text, section headings, segment selection, disabled reason, native glyphs and row alignment are readable in the reviewed sample. This is visual review, not a pixel-difference certification. CSS shadow details, native form text baselines and fractional raster rounding are not exhaustively certified. Font/SVG export behavior may differ slightly from browser rendering.

Coverage is deliberately bounded to the29 observed states. There are no invented hover/focus/loading variants, interactive menu prototypes, complete resize behavior, or fabricated unlocked/locked input states. The disabled Paste style row is an observed state, not proof every disabled chrome control has identical styling. Section collapse/empty variants, full tree indentation depths, every primitive size, CMS/form details and unobserved responsive permutations remain outside this control sample. Existing application bugs are not fixed by reproducing their controls.

The local figma-use guidance was unavailable and the parent had already received Unknown resource for `skill://figma/figma-use/SKILL.md`; the documented native tool API was used. All page changes used `await figma.setCurrentPageAsync`. No loadAllPages, pluginData, image-creation API, Code Connect publication or library publishing action was performed. Verification comprised successful writes, subsequent readback and the inspected rendered sample; no broad application test rerun was appropriate for this Figma/documentation-only task.
