# <Feature or change name>

<!--
Copy to docs/specs/YYYY-MM-DD-<slug>.md. One spec per work item. Every section
is required; write "none" rather than deleting one. The done-condition is what
an agent or reviewer checks before calling the work done (CLAUDE.md §Work
against a stated goal).
-->

- **Status:** draft | approved | in progress | done
- **Owner:**
- **Date:**
- **Figma / board:** <node id or link, or "none">

## Problem

What is wrong or missing, for whom, and how we know (issue, audit row, walk
finding, user report). Link the evidence.

## Scope

**In:**
-

**Out:** (explicitly not done here)
-

## Behaviour

What the user sees and can do once this ships. States: empty, loading, error,
permission-denied, success. Copy on screen, quoted exactly.

## Data and contracts

Schemas (`packages/shared/schemas/`), tRPC procedures, Prisma changes,
migrations. "none" if UI only.

## Done-condition (observable)

Each line is checked in the running app, or by a named command with its
expected output. A claim about code ("handler implemented") is not a
done-condition.

- [ ] In the running app: <route / panel> → <action> → <what is measured or seen>
- [ ] Command: `<command>` → <expected result>
- [ ] Old behaviour preserved: <capability that must still work>

## Risks and guarded areas

Touches migrations, auth, billing, publish, tokens or gate baselines? Name
them; the guard hook will ask before edits there.

## Not verified

Filled in at the end: anything the done-condition did not cover, and why.
