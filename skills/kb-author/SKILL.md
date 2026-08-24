---
name: kb-author
description: Add or amend an entry in the engineering knowledge base — a principle, pattern, practice, RFC or decision — with correct frontmatter, the right template, and the validation and index scripts run. Use when the user wants to write something down in the KB, capture a lesson learned, record a decision, or fix an existing entry.
argument-hint: "[what to capture]"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Author a KB entry

Capture something in the knowledge base without breaking the schema — and without putting
words in the author's mouth.

## Where you are

This skill edits the KB repository checkout. If the current working directory is that repo
(it has `kb/` and `scripts/validate.mjs`), work in place. If not — you're running from an
installed plugin against some other project — draft the entry, show it, and tell the user
which file to create in their KB checkout. Do not write into the plugin's own directory.

## Steps

1. **Choose the type.** See `docs/taxonomy.md`. Ask *what question does this answer?*
   why → `principle` · what shape → `pattern` · how we work → `practice` ·
   should we? (open) → `rfc` · what we chose → `decision`.
   If it's genuinely two ideas, it's two entries. Confirm the type with the user when it
   could reasonably go either way.

2. **Check for an existing entry.** Read `index/INDEX.md` first. Amending beats adding.
   If it supersedes something, plan the `supersedes` link and the old entry's status change.

3. **Copy the template**: `kb/<type>s/_TEMPLATE.md` → `kb/<type>s/<kebab-slug>.md`.
   RFCs and decisions get the next free `NNNN-` number.

4. **Fill the frontmatter** per `docs/frontmatter.md`:
   - `id` must be exactly `<type>.<filename-without-.md>`
   - `summary` ≤ 200 chars, and must make sense read on its own in a list — this is the
     field retrieval depends on, so spend real effort on it
   - `domains` and `status` from the controlled vocabularies only. If you need a new
     domain, stop and ask; adding one means editing `scripts/validate.mjs` and
     `docs/frontmatter.md` in the same commit.
   - `applies_when` for patterns: the trigger condition, one line, concrete
   - `created` and `updated` as today's date (`date +%F`)

5. **Write the body.** Keep the template's headings, delete the guidance comments. The
   *when it doesn't apply* / *failure modes* / *anti-patterns* section is required and must
   be real — an entry with no boundary is not finished.

6. **Validate and index:**
   ```bash
   npm run validate && npm run index
   ```
   Fix anything it reports. Commit the entry and the regenerated `index/` together.

## Rules

- **Never assert an opinion the user hasn't expressed.** Draft from what they told you. For
  anything you inferred, either ask or mark it clearly and set `status: draft`.
- **New entries default to `status: draft`** unless the user says it's battle-tested.
- **Never hand-edit `index/`.** Run `npm run index`.
- **`kb/decisions/` is append-only.** To change a decision, write a new ADR with
  `supersedes: [decision.NNNN-old]` and set the old one to `status: superseded`.
- **Concrete over abstract.** Name the technology, quote the number, describe the failure
  you actually saw. If the entry could have been written by someone who hadn't done the
  work, it isn't worth adding.
