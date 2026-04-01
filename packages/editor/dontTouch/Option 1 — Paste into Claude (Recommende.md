  Option 1 — Paste into Claude (Recommended)

  1. Open plans/04-final-prompt.md
  2. Copy the entire contents
  3. Paste it into a new Claude conversation (this one or claude.ai)
  4. Add at the end: "Build this as a single React component / as separate component files / as a full Vite project" — whichever you prefer
  5. Claude will generate the full code

  ---
  Option 2 — Use with a Code Gen Tool

  Same process — paste 04-final-prompt.md into:
  - Cursor (as a prompt in Composer/Agent mode)
  - GitHub Copilot Workspace
  - Bolt.new or v0.dev (paste as the initial prompt)
  - Lovable or any AI site builder

  ---
  Option 3 — Build it Yourself

  The prompt is also a complete spec document. A developer can read it top-to-bottom and implement it manually — every measurement, animation timing, color, and behavior is fully specified without
  ambiguity.

  ---
  Tips for Best Results

  Be specific about output format. After pasting the prompt, add one of:
  - "Generate all 12 components as separate files with a single App.tsx entry point"
  - "Build this as one self-contained index.html with Tailwind CDN and GSAP CDN"
  - "Start with the Hero and Nav only, then we'll do the rest section by section"

  If a section comes out wrong, use the iterator skill:
  /ui-cloner-iterator
  It runs 5 targeted correction passes comparing the output against the spec.

  The plans folder is your source of truth — if you ever want to regenerate or adjust, edit 04-final-prompt.md and re-run.