# Taxonomy

Five entry types, one folder each. Domain, stack and maturity live in frontmatter rather
than in the folder tree, so a cross-cutting entry has exactly one home and can still be
found from several directions.

## Choosing a type

Ask **what question does this answer?**

| Question | Type | Folder |
|---|---|---|
| Why do we lean this way? | `principle` | `kb/principles/` |
| What shape solves this recurring problem? | `pattern` | `kb/patterns/` |
| How does the work get done? | `practice` | `kb/practices/` |
| Should we do this? (open) | `rfc` | `kb/rfcs/` |
| What did we choose, and why? (closed) | `decision` | `kb/decisions/` |

### principle

A durable belief that shapes many decisions. Stable, few, non-obvious. If it's universally
agreed ("write tests") it isn't a principle, it's background. A good principle has a real
cost — it tells you what you're giving up.

Body: statement, why, what it looks like in practice, when it doesn't apply.

### pattern

A reusable solution shape for a recurring problem: architecture, data, integration,
delivery. This is where the bulk of the KB lives.

Body: problem, context, solution, implementation notes, trade-offs, failure modes,
alternatives.

### practice

How work gets done rather than how a system is built — review, branching, incident
handling, how to write for agents. Process, not structure.

Body: what, why, how (concrete steps), signals it's working, anti-patterns.

### rfc

A proposal being thought through in public. Numbered, sequential, mutable while open.
An RFC that gets accepted usually spawns a `decision` and one or more `pattern` entries;
the RFC then moves to `status: superseded` and points at them.

### decision

An ADR. Immutable once `stable`. Records what was chosen, the context at the time, and the
consequences accepted. Never rewrite one to change its meaning — write a new one that
supersedes it.

## Folders vs tags

The tree is by type. Everything else is a tag:

- `domains` — subject areas (`backend`, `data`, `ai`, `agentic`, …)
- `stack` — concrete technology (`postgres`, `typescript`, `otel`)
- `status` — maturity (`draft`, `stable`, `deprecated`, `superseded`)

This means a pattern that touches backend *and* data *and* messaging is one file with three
domain tags, not three files or an arbitrary parent folder. `scripts/build-index.mjs`
rolls the tags up into `index/by-domain.md` and `index/by-stack.md`, so browsing by subject
still works — it's just a generated view rather than a duplicated tree.

Controlled vocabularies for `domains` and `status` live in
[frontmatter.md](frontmatter.md) and are enforced by `npm run validate`. Adding a new
domain is a deliberate act: update the vocabulary, then use it.

## Naming

- Files are kebab-case: `transactional-outbox.md`.
- RFCs and decisions are zero-padded and numbered: `0001-ai-observability.md`.
- `id` is `<type>.<filename-without-extension>` — e.g. `pattern.transactional-outbox`,
  `decision.0002-kb-structure`. Validation enforces this, so ids never drift from paths.
- Files beginning with `_` (e.g. `_TEMPLATE.md`) are ignored by validation and indexing.
