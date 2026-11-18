# 04 — AI audit (CMS scope)

## Run metadata
- **Date:** 2026-10-08 → 2026-10-09 (PKT)
- **Mode:** `audit`
- **Arguments:** `cms deeply`
- **Commit:** `main @ 7a50e34e1`
- **Run flags:** none

## Finding: CMS has no AI integration, and none is planned
- **Code search:**
  - Files searched: `packages/editor/src/editor/cms/`, `packages/editor/src/engine/cms/`, `CmsBindingSection.tsx`, `CMSCollectionSetupModal.tsx`, `server/services/ai*.ts`, the AI panel (`editor/panels/version-history/AIPanel.tsx`, `useAISummary.ts`).
  - Terms: `ai`, `openai`, `ollama`, `streamPrompt`, `generate`, `cms`, `collection`.
  - Result: no AI entry point, prompt, or model call touches collections, records, fields or bindings.
  - The only hit is a comment in `recordTemplatePreview.ts:7`, which mentions the AI publish-gate call that shares `exportPublishPages.ts`.
- **Plans:** the 2026-09-28 CMS architecture proposal (C0–C5) and the 2026-09-27 CMS module audit contain no AI scope for CMS. The single mention is CMS-11, about the floating help/AI button overlapping "Save record".
- **Classification:** **absent**, not broken. There is no PRD, design or owner requirement, so per the audit protocol this is not an `EXPECTED_BUT_ABSENT` issue, and **no EDT ID is assigned**.

## Indirect AI touchpoints worth knowing
- **Publish gate:** the AI publish-gate path uses the same export (`exportPublishPages.ts`). CMS publish defects (EDT-003, EDT-004, EDT-012) would affect any AI-triggered publish in the same way. This is inferred from the shared code path, not tested.
- **AI in development is dead:** the full editor audit (2026-10-08) found AI unusable in dev while Ollama is down. This run does not re-test that.

## If AI for CMS is wanted later
These are not requirements. They are candidate ideas only, and each needs an owner decision:
- AI-drafted records from a prompt, or a field-aware fill for empty fields.
- AI suggestions for CSV column-to-field mapping and type inference. This would also address EDT-009's coercion gap.
- AI-generated SEO title and description patterns for dynamic pages.

Any of these must follow the protocol chain: trigger → selected collection/record context → prompt → provider → structured response validated against the shared `cms.ts` schema → preview → apply as one undoable transaction → mirror → reload.
