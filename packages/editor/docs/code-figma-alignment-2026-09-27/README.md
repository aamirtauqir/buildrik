# Editor v3 · IA — current-code alignment, 2026-09-27

This is the first scoped alignment pass for Inspector, Brand and CMS. Existing application source and the editor's overall design were preserved. Figma changes describe current code, with sample values where prototypes require concrete data.

## Review links

- [Inspector field inventory — 16 element/default panels](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=7980-198046)
- [Inspector Image Settings](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=6883-75963)
- [Inspector Form Settings](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=4428-141878)
- [Brand Spacing](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=7576-197036)
- [CMS Add field](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=4418-164208)
- [CMS Reference configuration](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=4418-164254)

## Applied changes

### Inspector

Source: src/editor/inspector/ProInspector.tsx; config/elementProfiles.ts; sections/registry; sections/elementProperties/config.ts and index.tsx; sections/FormAfterSubmitSection.tsx.

- Extracted the actual property schema, including field types and select options, into inspector-fields.json.
- Created 16 reference panels: input, textarea, select, form, image, video, button, link, heading, text, paragraph, label, iframe, columns, icon, default.
- Applied missing element-specific Advanced rows to existing Text, Image and Button Settings screens.
- Added Form Advanced fields: Action URL, Method, Encoding, Disable Validation, Autocomplete.
- Added the missing Message field under Form → After submit → Show message.
- Preserved Style / Settings / Effects. An old source comment claiming these tabs had been removed contradicts the current renderer.
- Kept ID & class separate. Title and Tab Index belong under Custom attributes even when repeated in a type's schema.
- Added Custom attributes reveal actions to Text, Image, Button, Form and the generic expanded Advanced screen, with Title, Tab Index and data-attribute controls.
- Source supports data-* and aria-* attribute keys. Prototype controls are sample representations; arbitrary text entry and attribute persistence are not implemented by these Figma rows.

### Brand

Source: src/editor/design-system/ui/BrandWorkspace.tsx; KindTokenList; TokenDetailView; TokenAddDialog; constants.ts; state/useSpacingTokens.ts.

- Replaced the Spacing screen's mixed colour data with the nine current normal spacing tokens: space-1/2/3/4/5/6/8/10/12 = 4/8/12/16/20/24/32/40/48px.
- Corrected PRESET to Normal, usage to an unused example, and detail fields to Value and Used by elements.
- Removed the colour-only dark-value row and contrast text from non-colour token details.
- Added 11 actual token-kind views using all 18 defaults extracted from constants.ts: radius, shadow, motion, border, opacity, zindex, breakpoint, grid, sizing, icon, imagery. Values are in brand-tokens.json.
- Connected all 12 kind-menu items, including returning to Spacing from another kind.
- Connected visible token rows to name, friendly-name and value variables in the detail panel.
- Corrected sidebar labels to Fonts & type styles, Styles, Component styles, Classes, Presets, and fixed the duplicate selected Spacing/Colours entry.

Code flow to preserve in subsequent changes: select kind → select token → change draft → Save/review → Apply. Add token uses Name and Properties; generic kinds do not acquire colour-only fields. Do not invent Duplicate where the current overflow only supplies Rename/Delete.

### CMS

Source: src/editor/cms/fieldTypes.ts; AddFieldDialog; FieldInspector; RecordSheet; CmsWorkspace.tsx.

- Add field now includes all nine current types: Text, Number, Rich text, Image, Boolean, Reference, Slug, Long text, Date.
- Replaced configuration prose with separate Name, Key and Required controls in all nine forms; Reference also has Collection.
- Kept Back to field types, Cancel and Save field actions.
- Corrected the Text form's normal footer, which previously included a contrived Use existing key action.
- Save field now sets the added row's displayed name/type to the selected configuration instead of always showing Preparation note / Text.
- Existing validation/error screens were retained.

Code rules recorded for subsequent design changes: generated key until manually edited; key pattern starts with a lowercase letter and allows lowercase letters/digits/underscore/hyphen; duplicate keys rejected; reference needs a collection. Bound fields restrict key/type/collection changes and deletion. Number validation has min/max; text-like fields have min/max length. Current record rich text uses a textarea; do not infer a toolbar or a rich reference picker from the model type alone.

## Evidence and limits

- Live authenticated local editor inspected on an existing scratch project at localhost:3000. Brand and Spacing rendered without page errors. Runtime screenshots are saved beside this report.
- 25 schema/configuration checks passed: 16 Inspector type panels and 9 CMS field forms/save bindings.
- Final 32 structural checks passed: kind-menu destinations, visible token-row selection, Custom attributes reveal actions, nine CMS picker types, inventory panel count and caption containment.
- Final screenshots reviewed for Inspector reference panel, Image Settings, Form Settings, CMS Reference configuration, Brand Shadow and Spacing. Reused text-control sizing and sidebar selection defects found during review were corrected.
- These are schema, structural and visual checks, not a full click-through playback or backend persistence test.
- This pass does not certify every existing Style/Effects interaction, Brand token add/edit/apply/import/preset flow, CMS record validation/publish/import/dynamic-page flow, or every error/empty/loading state. Those need a separate coverage pass before calling the entire prototype complete.
- No application source was changed or deployed. Build/tests were not run because this pass changes Figma and audit artifacts only.

## Next design/implementation boundary

Use these field names, conditional rules and current-code flow contracts as constraints for the next design changes. Record a deliberate functionality change explicitly before implementing it; do not silently omit code-supported fields to fit a visual layout.

manifest.json stores affected screen IDs, extracted field coverage and verification results. Existing unrelated untracked workspace artifacts were left untouched.

