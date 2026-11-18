# Phase 6 final library index

12 October 2026. The TO-BE system has 18 component families and 73 native variants. Existing Foundations, Components and AS-IS pages remain separate. Exact variant IDs and descriptions are in [native library readback](evidence/phase6-final-library.json).

| Family | Native set | Valid axes |
|---|---|---|
| Button / TO-BE | [8326:260](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8326-260) | Primary / Secondary / Ghost / Danger × Default / Hover / Focus / Pressed / Loading; Secondary Disabled |
| Input / TO-BE | [8328:57](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8328-57) | State=Default; State=Focus; State=Error; State=Disabled; State=Inherited; State=Mixed |
| Select / TO-BE | [8328:116](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8328-116) | State=Default; State=Open; State=Focus; State=Disabled |
| Tab / TO-BE | [8328:151](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8328-151) | State=Default; State=Selected; State=Focus; State=Disabled |
| Menu item / TO-BE | [8328:176](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8328-176) | State=Default; State=Hover; State=Focus; State=Disabled; State=Destructive |
| Tree item / TO-BE | [8328:202](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8328-202) | State=Default; State=Selected; State=Expanded; State=Locked |
| Navigation item / TO-BE | [8328:223](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8328-223) | State=Default; State=Selected; State=Focus |
| Tooltip / TO-BE | [8328:239](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8328-239) | State=Default; State=Shortcut |
| Notification / TO-BE | [8328:260](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8328-260) | State=Info; State=Success; State=Warning; State=Error |
| Inspector property / TO-BE | [8339:154](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8339-154) | State=Default; State=Inherited; State=Mixed; State=Disabled |
| Panel header / TO-BE | [8343:115](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8343-115) | Context=Workspace; Context=Selection |
| Panel section / TO-BE | [8343:150](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8343-150) | State=Expanded; State=Collapsed |
| Context menu / TO-BE | [8343:205](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8343-205) | Context=Text; Context=Container |
| Dialog / TO-BE | [8343:259](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8343-259) | Intent=Confirm; Intent=Destructive |
| Dropdown / TO-BE | [8347:206](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8347-206) | State=Closed; State=Open |
| Popover / TO-BE | [8347:250](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8347-250) | State=Default; State=Validation |
| Canvas toolbar / TO-BE | [8347:310](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8347-310) | Viewport=Desktop; Viewport=Mobile |
| Color picker / TO-BE | [8347:370](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8347-370) | Mode=Solid; Mode=Token |

## Foundations and composition

- 16 TO-BE primitive variables and 62 semantic aliases preserve editor-chrome versus site-Brand scope. Existing CSS/Tailwind/Flowbite relationships are design mappings, not evidence of implemented code changes. See the original foundation evidence and Phase 5 contracts.
- The existing 18 ui/data text styles remain unchanged. Twenty-one shared `TO-BE chrome` styles preserve the authored Inter size/weight combinations and 145% line height. This avoids changing AS-IS typography or silently discarding style bindings when preserving geometry.
- Shared modal/popover elevation is applied to 20 composed dialogs and menus. Other flat workspace surfaces intentionally have no shadow. Existing subtle/raised/drag/overlay/focus effects remain available; no new elevation framework was introduced.
- Buttons, property rows, picker and composed controls retain native master references. Final application-scene readback includes 1,341 instances and 3,951 variable-bound nodes across 116 frames. Counts are adoption evidence, not independent component families or interaction passes.

## Meaningful state boundaries

Disabled is a refusal state, distinct from destructive styling and a proposed permission gate. Loading is only a visual variant, never proof of a completed provider call. Notifications include success as a specimen; actual prototype outcomes remain explicitly simulated. Inherited/mixed properties communicate origin and selection state without fabricating a single editable value.

Empty/error/dirty workspace states are composed screens, not a mechanical variant cross-product. Dropdown open/closed, nonempty-name popover validation, Desktop/Mobile toolbar and solid/token picker have native specimens. Gradient remains a static specimen; arbitrary gradient-stop manipulation is not represented. Existing PHASE6-COMPONENT-STATE-REVIEW.md supplies the corrected visual checks.

## Verified typography adoption and exceptions

The first adoption pass preserved geometry but its line-height overrides cleared many style links. Those receipts are historical attempts, not successful adoption totals. The corrected pass created matching shared styles and independently read them back: **4,286 additional retained bindings; 5,379 of 6,318 text layers styled**. Every corrected text kept its measured width and height (zero differences greater than 0.1 px). See [exact adoption validation](evidence/phase6-exact-adoption-validation.json) and `phase6-exact-adoption-*.json`.

Intentional exceptions: website/template content retains site typography; nested master-owned content retains its component conventions; two fixed breakpoint-caption annotations (`8351:1612`, `8351:1832`) retain their AUTO line height. No arbitrary screen-specific chrome ramp was created per workspace. The independent census found no other unbound free-standing editor-chrome text.

The final E01 and About us template render were inspected after the corrected bindings. Focused 720×450 scope placement and the template badge were corrected and visually rechecked. Native imagery is limited to discrete asset thumbnails; no whole-UI screenshot was used as a deliverable.
