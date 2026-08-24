# CLAUDE.md

See **[AGENTS.md](AGENTS.md)** — it is the canonical instruction file for this repository
and applies equally to Claude Code.

Quick reminders:

- `index/` is generated. Run `npm run index`, never edit it by hand.
- Run `npm run validate` before finishing any change under `kb/`.
- Don't write opinions into entries that the author hasn't expressed. Mark inferred content
  `status: draft` and say what you assumed.
- To assemble context for a task, read `index/INDEX.md` first and load only matching
  entries — not the whole tree.
