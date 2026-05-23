export * from "./schemas";
// api-client moved to packages/editor/src/services/api-client.ts on
// 2026-05-23 (Codex shared audit P1). Editor was the only consumer
// and the AppRouter type-import coupled shared/ to server/. Now
// shared/ is a pure contract package — schemas only.
