# Engine model · element conditions (B-11)

Owner-approved 2026-10-30. Boards: B4-D04…D10 (`255:94411` … `258:35104`), B5-D54 `182:18493`, B5-D59 `182:20512`.

## What it is

An element is **shown or hidden by its record**: on a collection's template page the record is the page's own; inside a Collection list it is the list copy's record. A condition never applies where there is no record (a plain page) — the Inspector does not offer it there (no placeholder rows, LD-6).

Conditions control visibility only. Device visibility stays in Behavior › Visibility; an element must pass both.

## Data shape (SSOT: `packages/shared/schemas/cmsConditions.ts`)

```ts
type CmsConditionOp =
  | "set" | "empty"                       // every type
  | "is" | "isNot" | "contains"           // text-like, select
  | "eq" | "neq" | "gt" | "lt" | "gte" | "lte"   // number
  | "before" | "after"                    // date, datetime (ISO compare)
  | "on" | "off"                          // boolean
  | "includes" | "excludes";              // multiselect

interface CmsConditionRule { field: string; op: CmsConditionOp; value?: string }
//   field: a field slug, or a dotted path into a JSON-ish value ("opening_hours.sunday")
interface CmsCondition { match: "all" | "any"; rules: CmsConditionRule[] }   // 1..10 rules
```

Stored in the project beside the other bindings: `project.cmsBindings.conditions[elementId] = CmsCondition` — the same id-keyed, per-entry-filtered map as `field` / `collection`, so the save schema (`filterCmsBindings`) keeps it, a malformed entry drops on its own, and an element delete / duplicate follows the binding manager's existing paths (`forgetElement`, `copyElement`).

**Operators per field type** (`opsForFieldType`):

| Field type | Operators |
|---|---|
| text, textarea, richtext, url, email, slug, color | is set · is empty · is · is not · contains |
| select | is set · is empty · is · is not |
| multiselect | is set · is empty · includes · excludes |
| number | is set · is empty · = · ≠ · > · < · ≥ · ≤ |
| date, datetime | is set · is empty · before · after |
| boolean | is on · is off |
| image, file, reference | is set · is empty |

`is set` = not null/undefined, not "", not an empty array. A dotted path whose head is not a field reads as unset (a false `is set`, a true `is empty`).

## Evaluation — one pure function

`evaluateCmsCondition(condition, recordData) → boolean` in the shared schema module, used by:

1. **Canvas.** `CMSBindingManager.applyConditions()` evaluates each element's condition against its preview record — the list copy's record, else the template page's preview record (the same record `resolveBinding` previews) — and sets `data-bk-condition="hidden"` on a failing node. The canvas draws it as a ghost ("Hidden by condition", 40% + dashed outline, editor CSS only). A condition with no record to read (wrong page) is left unevaluated (shown).
2. **Export / publish, list copies.** `RepeaterRenderer.expandCollectionLists` evaluates each copy's descendants' conditions against that copy's record and **removes** the failing elements from the output — a hidden element is absent from the published HTML, not `display:none`.
3. **Export / publish, template page.** The page's own record is per generated page, filled on the server (`generateDynamicPages`, `cms.service.ts`). The export writes the condition onto the element as `data-bk-if="<url-encoded JSON>"`; the server must evaluate it per record with the same shared function, drop failing elements and strip the attribute. **That is the dashboard boundary — REQUESTS B-26.** Until it lands, a template-page condition publishes as "shown" (today's behaviour) and the attribute is stripped by nothing; the Inspector's note "Hidden content stays in the page source…" is true either way.
4. **Static export / preview of a template page with no server** (`renderPreviewHtml`, standalone demo): evaluated against the preview record and removed, like a list copy.

Publish is server-first: the scratch composer that renders publish pages is loaded with `cms.publishSnapshot` (`exportPublishPages.ts`), so list copies and the preview record come from the server's published rows, never from this browser's IndexedDB.

## Legacy "old Conditions"

The pre-CMS `DataManager.bindCondition` stored `element.setDataBinding("condition", …)` (`ConditionExpression | LogicGroup` over data sources). It is **preserved and inactive**: the Inspector says "Not active — from old Conditions" with its first rule read as a field path + operator, and offers **Activate condition** (converts `exists`→set, `empty`→empty, `==`→is, `!=`→is not, `contains`→contains, `>`/`<`/`>=`/`<=`→numeric; drops the legacy binding and writes the new condition in one history step) or **Keep inactive**. A legacy expression that does not convert (a data-source binding, a nested group) stays inactive and says so.

## Commands / history

`composer.cms.bindings.setCondition(elementId, condition | null, label)` — one recorded history step ("Add visibility condition", "Edit visibility condition", "Remove visibility condition", "Activate legacy condition"); refused while write-locked or when the element is locked (P-1 via `canWrite`). Receipts: "Visibility condition added · Undo", "Visibility condition removed · Undo", "Legacy condition activated · Undo".

## Editor UI (Content tab)

- Summary row **Conditions · {n} · Hidden | Shown | Inactive** (Hidden/Shown = the preview record's result) → opens the conditions subview.
- Subview "‹ Back to Content · Conditions": Match All/Any, one row per rule (field — via the record's fields, with a dotted sub-path for JSON-ish values; operator by type; value when the operator takes one), "Remove rule", "+ Add rule"; under it the preview result ("{Field} is empty. This condition is false." / "Hidden on this record — showing as ghost."), the privacy note "Hidden content stays in the page source. Do not use conditions to protect private information.", and "Open source ›" (the record in CMS).
- Empty: "Show this element on every record." + "+ Add rule" + "Conditions control visibility. Device visibility stays in Behavior."

## Existing projects

No `conditions` map → every element shows exactly as today. Old editor builds drop the unknown key on their own saves (the save schema is per-key), which only loses conditions made by a newer build.
