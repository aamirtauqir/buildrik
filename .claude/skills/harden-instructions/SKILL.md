---
name: harden-instructions
description: Restructure this project's standing instructions so they survive long sessions, compaction and subagent delegation — CLAUDE.md diet, .claude/rules/always.md, path-scoped rules, procedures to skills, invariants to hooks, re-injection hooks, verification. Manual only; run /harden-instructions.
disable-model-invocation: true
---

# Harden project instructions

Goal: make this project's standing instructions reliable across long sessions, context
compaction and subagent delegation, by moving every instruction to the place where it
actually works: facts in CLAUDE.md, always-on rules in a short rules file that hooks
re-inject, area rules in path-scoped rules, procedures in skills, and must-always-hold
rules in hooks that run regardless of what the model decides.

Work in three phases. STOP after Phase 1 and wait for my "go" before changing anything.

## Ground rules

- Project files only. Do not edit anything under `~/.claude/` unless I say so; report what
  is there.
- Never delete the meaning of an existing instruction. Everything moves somewhere, or is
  listed as "proposed removal" with the reason, and I decide.
- Never guess facts about the code. Mark unverifiable instructions as UNVERIFIED.
- JSON you write: no trailing commas, no comments. Hook scripts: executable, referenced
  by `${CLAUDE_PROJECT_DIR}` absolute paths.
- Commit nothing. Leave the changes for my review.

## Phase 1 — Inventory (read-only)

1. List every instruction file that loads in this project: `CLAUDE.md`, `.claude/CLAUDE.md`,
   `CLAUDE.local.md`, `AGENTS.md`, every `.claude/rules/**/*.md`, nested `CLAUDE.md` files
   in subdirectories, `@path` imports, and the user-level `~/.claude/CLAUDE.md` (report
   only). Give line counts. Flag any file over 200 lines.
2. Extract EVERY individual instruction into a table:

   `ID | instruction (verbatim) | source file:line | type | scope | enforceable by hook?`

   Types:
   - FACT — stack, commands, where things live. Stays in CLAUDE.md if not derivable from
     the code; otherwise proposed removal.
   - CONVENTION — style or structure choice. CLAUDE.md or a path-scoped rule.
   - INVARIANT — must hold every single time (never edit X, always run tests before
     commit, never force-push, never touch `.env`). Goes to a hook.
   - PROCEDURE — multi-step how-to. Goes to a skill.
   - PREFERENCE — my recommendation about approach or taste. Goes to
     `.claude/rules/always.md` if global, or a path-scoped rule.
   - STALE / CONFLICTING — references a file or command that does not exist, or
     contradicts another instruction (quote both).

   Scope: `global` or a glob like `src/editor/**`. Enforceable: `PreToolUse <matcher>`,
   `PostToolUse <matcher>`, `Stop`, `TaskCompleted`, or `no`.
3. Also list every `.claude/agents/*.md` and `.claude/skills/*/SKILL.md` with one line
   each, and whether `.claude/settings.json` already has hooks (list them).
4. Present the table, the conflicts, and the proposed new layout (which instruction goes
   to which file). Then STOP and wait for "go".

## Phase 2 — Restructure (after "go")

1. `CLAUDE.md` (root): rewrite to under 200 lines. Keep FACT and CONVENTION items that
   the model cannot derive from the codebase; keep pitfalls and rationale; remove
   directory listings, dependency lists and anything the code already shows. Group under
   headers. Write each instruction so it can be verified ("run `npm test` before
   committing", not "test your changes").
2. `.claude/rules/always.md` (no `paths:` frontmatter, so it loads at launch like
   CLAUDE.md): at most 15 lines, the global PREFERENCE and INVARIANT items in imperative,
   verifiable form, numbered. This file is what the hooks in Phase 3 re-inject, so keep it
   short; every line costs tokens on every prompt.
3. `.claude/rules/<topic>.md` for each area-specific group, with frontmatter:
   ```
   ---
   paths:
     - "src/editor/**/*.{ts,tsx}"
   ---
   ```
   One topic per file; descriptive filenames.
4. Each PROCEDURE becomes `.claude/skills/<kebab-name>/SKILL.md` with a `description`
   that says when it applies. Keep the body concise; put the most important steps first.
5. Create `.claude/skills/save-rule/SKILL.md`:
   ```
   ---
   name: save-rule
   description: Append a standing rule I give in chat to the project rules so it survives compaction and reaches subagents.
   disable-model-invocation: true
   argument-hint: [rule text]
   ---
   Append this rule to `.claude/rules/always.md` as the next numbered line, unless it is
   specific to a path — then ask me which `.claude/rules/<topic>.md` it belongs in.
   Rule: $ARGUMENTS
   Keep always.md at or under 15 lines; if it would exceed that, show me the file and
   ask which line to merge or move.
   ```
6. Produce a mapping table: `old file:line → new location` for every instruction.

## Phase 3 — Enforcement and re-injection

Merge into `.claude/settings.json` (do not overwrite other keys). Scripts go in
`.claude/hooks/`, executable.

1. Re-inject the always-rules after every compaction and on every prompt. Plain stdout
   from these two events is added to the model's context, so a `cat` is enough:
   ```json
   {
     "hooks": {
       "SessionStart": [
         { "matcher": "compact",
           "hooks": [ { "type": "command",
             "command": "cat \"$CLAUDE_PROJECT_DIR/.claude/rules/always.md\"" } ] }
       ],
       "UserPromptSubmit": [
         { "hooks": [ { "type": "command",
             "command": "cat \"$CLAUDE_PROJECT_DIR/.claude/rules/always.md\"" } ] }
       ]
     }
   }
   ```
   If you prefer the JSON form for UserPromptSubmit, the text must be inside
   `hookSpecificOutput.additionalContext` with `hookEventName` set; at the top level it is
   silently ignored. Build it with `jq` so escaping is correct.
2. For each INVARIANT marked enforceable, add a hook:
   - Block edits to protected paths: `PreToolUse` with matcher `Edit|Write`, script reads
     `tool_input.file_path` from stdin JSON, exits 2 with a one-line reason on stderr.
   - Block dangerous commands: `PreToolUse` with matcher `Bash`, same pattern on
     `tool_input.command` (force-push, `rm -rf`, deploy/publish scripts, migrations).
   - Format after edits: `PostToolUse` with matcher `Edit|Write`.
   - Tests before the turn ends: `Stop` hook that runs the existing test command only
     when source files changed since last run; it must read `stop_hook_active` from stdin
     and exit 0 when it is `true`, otherwise it loops. Exit 2 with the failure summary on
     stderr so Claude fixes it. If no test command exists, do not invent one — report it.
   Write each script, `chmod +x` it, and test it by piping sample JSON
   (`echo '{"tool_name":"Bash","tool_input":{"command":"git push --force"}}' | script`)
   and showing the exit code.
3. Subagents: for every `.claude/agents/*.md`, add to the body: "Before starting, read
   `.claude/rules/always.md` and follow it." Note in the report that settings.json hooks
   already fire inside subagents, that subagents never see the conversation, and that the
   built-in Explore and Plan agents skip CLAUDE.md entirely — so any rule a delegated task
   needs must be restated in the delegation prompt.
4. Optional debug aid: an `InstructionsLoaded` hook that appends its stdin JSON to
   `.claude/instructions-loaded.log` (add the log to `.gitignore`), so we can see which
   instruction files loaded and when.

## Phase 4 — Verify (actually run these)

1. `/hooks` — confirm every hook appears under the right event. If one is missing, the
   settings file did not parse; fix it before continuing.
2. Each hook script tested with piped JSON as above; show exit codes.
3. Trigger `/compact` is mine to run; tell me when, then confirm (Ctrl+O transcript) that
   `always.md` was re-injected.
4. Spawn one subagent with a trivial read-only task and ask it to quote rule 1 from
   `always.md`; report whether it could.
5. Check `/context` lists the expected memory files and that no instruction file is over
   200 lines.

## Report

Mapping table (old → new), hooks added with what each enforces, verification results,
anything NOT RUN with the exact step to run it, and the list of proposed removals
awaiting my decision. No praise, no filler.
