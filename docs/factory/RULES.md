# Factory rules (re-injected after every compaction — keep under 15 lines)

1. The task lives on disk, not in chat: `docs/factory/tasks/<ID>/task.md`. Re-read it before any next step.
2. One task at a time. Work outside the task's spec is a new task, not a detour.
3. Every claim carries evidence: `file:line`, or the exact command and its output. Unchecked = `UNKNOWN`.
4. Done = the spec's done-condition observed in the running app or by its named command. Code passing is not done.
5. Whoever builds does not approve. Developer → QA → Code review (+ Security / Design review when the spec says so).
6. Developers work in their own worktree on `factory/<ID>`, open a PR, never push or merge `main`.
7. Never invent a founder decision. Unanswerable question → write it under "Open questions" and mark the stage BLOCKED.
8. One writer per file. Roles write only their own output; only the PM (main session) edits `task.md`.
9. Guarded areas (migrations, auth, billing, publish, tokens, baselines, CI) need Security review and founder sign-off.
10. A null or blank result is the harness until shown otherwise — re-check before reporting a product bug.
